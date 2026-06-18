const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { body, validationResult } = require('express-validator');
const { query } = require('../db');
const { authenticate, requireSuperAdmin } = require('../middleware/auth');

const router = express.Router();

// POST /api/auth/login
router.post('/login', [
  body('email').isEmail().normalizeEmail(),
  body('password').notEmpty(),
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { email, password } = req.body;

  try {
    const result = await query(
      'SELECT id, name, email, password_hash, role, department, badge_number FROM officers WHERE email = $1 AND is_active = TRUE',
      [email]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const officer = result.rows[0];
    const valid = await bcrypt.compare(password, officer.password_hash);

    if (!valid) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const token = jwt.sign(
      { id: officer.id, role: officer.role },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '8h' }
    );

    res.json({
      token,
      officer: {
        id: officer.id,
        name: officer.name,
        email: officer.email,
        role: officer.role,
        department: officer.department,
        badge_number: officer.badge_number,
      },
    });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/auth/me
router.get('/me', authenticate, (req, res) => {
  res.json({ officer: req.officer });
});

// POST /api/auth/officers — create officer (super admin only)
router.post('/officers', authenticate, requireSuperAdmin, [
  body('name').notEmpty().trim(),
  body('email').isEmail().normalizeEmail(),
  body('password').isLength({ min: 8 }),
  body('role').isIn(['super_admin', 'officer']),
  body('department').optional().trim(),
  body('badge_number').optional().trim(),
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { name, email, password, role, department, badge_number } = req.body;

  try {
    const hash = await bcrypt.hash(password, 12);
    const result = await query(
      `INSERT INTO officers (name, email, password_hash, role, department, badge_number)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING id, name, email, role, department, badge_number`,
      [name, email, hash, role, department, badge_number]
    );
    res.status(201).json({ officer: result.rows[0] });
  } catch (err) {
    if (err.code === '23505') {
      return res.status(409).json({ error: 'Email already exists' });
    }
    console.error('Create officer error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/auth/officers — list all officers (super admin only)
router.get('/officers', authenticate, requireSuperAdmin, async (req, res) => {
  try {
    const result = await query(
      'SELECT id, name, email, role, department, badge_number, is_active, created_at FROM officers ORDER BY created_at DESC'
    );
    res.json({ officers: result.rows });
  } catch (err) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;

const express = require('express');
const { query } = require('../db');
const { authenticate, requireSuperAdmin } = require('../middleware/auth');
const { body, validationResult, query: queryParam } = require('express-validator');

const router = express.Router();

// GET /api/complaints — list with filters
router.get('/', authenticate, async (req, res) => {
  try {
    const { status, category, from, to, search, page = 1, limit = 20 } = req.query;
    const offset = (parseInt(page) - 1) * parseInt(limit);

    let conditions = [];
    let params = [];
    let idx = 1;

    if (status)   { conditions.push(`c.status = $${idx++}`);    params.push(status); }
    if (category) { conditions.push(`c.category = $${idx++}`);  params.push(category); }
    if (from)     { conditions.push(`c.created_at >= $${idx++}`); params.push(from); }
    if (to)       { conditions.push(`c.created_at <= $${idx++}`); params.push(to + 'T23:59:59'); }
    if (search) {
      conditions.push(`(c.complaint_id ILIKE $${idx} OR c.complainant_name ILIKE $${idx} OR c.description ILIKE $${idx})`);
      params.push(`%${search}%`); idx++;
    }

    const where = conditions.length > 0 ? 'WHERE ' + conditions.join(' AND ') : '';

    const countResult = await query(
      `SELECT COUNT(*) FROM complaints c ${where}`,
      params
    );
    const total = parseInt(countResult.rows[0].count);

    const result = await query(
      `SELECT c.id, c.complaint_id, c.category, c.status, c.complainant_name,
              c.complainant_phone, c.location_text, c.created_at, c.updated_at,
              o.name AS assigned_officer_name
       FROM complaints c
       LEFT JOIN officers o ON c.assigned_officer_id = o.id
       ${where}
       ORDER BY c.created_at DESC
       LIMIT $${idx++} OFFSET $${idx++}`,
      [...params, parseInt(limit), offset]
    );

    res.json({
      complaints: result.rows,
      pagination: { total, page: parseInt(page), limit: parseInt(limit), pages: Math.ceil(total / parseInt(limit)) },
    });
  } catch (err) {
    console.error('List complaints error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/complaints/stats — dashboard stats
router.get('/stats', authenticate, async (req, res) => {
  try {
    const statusCounts = await query(
      `SELECT status, COUNT(*) as count FROM complaints GROUP BY status`
    );
    const categoryCounts = await query(
      `SELECT category, COUNT(*) as count FROM complaints GROUP BY category ORDER BY count DESC LIMIT 7`
    );
    const recentWeek = await query(
      `SELECT DATE(created_at) as date, COUNT(*) as count
       FROM complaints
       WHERE created_at >= NOW() - INTERVAL '7 days'
       GROUP BY DATE(created_at)
       ORDER BY date`
    );

    const stats = { pending: 0, in_progress: 0, resolved: 0, rejected: 0, total: 0 };
    statusCounts.rows.forEach(r => {
      stats[r.status] = parseInt(r.count);
      stats.total += parseInt(r.count);
    });

    res.json({ stats, byCategory: categoryCounts.rows, lastWeek: recentWeek.rows });
  } catch (err) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/complaints/:id — detail view
router.get('/:id', authenticate, async (req, res) => {
  try {
    const result = await query(
      `SELECT c.*, o.name AS assigned_officer_name, o.email AS assigned_officer_email
       FROM complaints c
       LEFT JOIN officers o ON c.assigned_officer_id = o.id
       WHERE c.complaint_id = $1 OR c.id::text = $1`,
      [req.params.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Complaint not found' });
    }

    const complaint = result.rows[0];

    const notes = await query(
      `SELECT n.*, o.name AS officer_name
       FROM complaint_notes n
       JOIN officers o ON n.officer_id = o.id
       WHERE n.complaint_id = $1
       ORDER BY n.created_at DESC`,
      [complaint.id]
    );

    res.json({ complaint, notes: notes.rows });
  } catch (err) {
    console.error('Get complaint error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// PATCH /api/complaints/:id/status — update status
router.patch('/:id/status', authenticate, [
  body('status').isIn(['pending', 'in_progress', 'resolved', 'rejected']),
  body('rejection_reason').optional().trim(),
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

  const { status, rejection_reason } = req.body;

  try {
    const result = await query(
      `UPDATE complaints SET status = $1, rejection_reason = $2
       WHERE complaint_id = $3 OR id::text = $3
       RETURNING id, complaint_id, status`,
      [status, rejection_reason || null, req.params.id]
    );

    if (result.rows.length === 0) return res.status(404).json({ error: 'Not found' });
    res.json({ complaint: result.rows[0] });
  } catch (err) {
    console.error('Update status error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// PATCH /api/complaints/:id/assign — assign to officer
router.patch('/:id/assign', authenticate, [
  body('officer_id').isInt(),
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

  try {
    const result = await query(
      `UPDATE complaints
       SET assigned_officer_id = $1,
           status = CASE WHEN status = 'pending' THEN 'in_progress' ELSE status END
       WHERE complaint_id = $2 OR id::text = $2
       RETURNING id, complaint_id, status, assigned_officer_id`,
      [req.body.officer_id, req.params.id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Not found' });
    res.json({ complaint: result.rows[0] });
  } catch (err) {
    console.error('Assign officer error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/complaints/:id/notes — add internal note
router.post('/:id/notes', authenticate, [
  body('note').notEmpty().trim(),
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

  try {
    const comp = await query(
      'SELECT id FROM complaints WHERE complaint_id = $1 OR id::text = $1',
      [req.params.id]
    );
    if (comp.rows.length === 0) return res.status(404).json({ error: 'Not found' });

    const result = await query(
      `INSERT INTO complaint_notes (complaint_id, officer_id, note)
       VALUES ($1, $2, $3)
       RETURNING id, note, created_at`,
      [comp.rows[0].id, req.officer.id, req.body.note]
    );

    res.status(201).json({ note: { ...result.rows[0], officer_name: req.officer.name } });
  } catch (err) {
    console.error('Add note error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
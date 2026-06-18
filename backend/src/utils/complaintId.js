const { query } = require('../db');

/**
 * Generates a human-readable complaint ID like KA-2026-00421
 */
async function generateComplaintId() {
  const stateCode = process.env.STATE_CODE || 'KA';
  const year = new Date().getFullYear();

  // Atomically increment the counter for this year
  const result = await query(
    `INSERT INTO complaint_counters (year, last_count)
     VALUES ($1, 1)
     ON CONFLICT (year) DO UPDATE
     SET last_count = complaint_counters.last_count + 1
     RETURNING last_count`,
    [year]
  );

  const count = result.rows[0].last_count;
  const padded = String(count).padStart(5, '0');
  return `${stateCode}-${year}-${padded}`;
}

module.exports = { generateComplaintId };

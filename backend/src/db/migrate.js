const { pool } = require('./index');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../../.env') });

async function runMigrations() {
  const migrationsDir = path.join(__dirname, '../../migrations');
  const files = fs.readdirSync(migrationsDir).filter(f => f.endsWith('.sql')).sort();

  console.log(`Running ${files.length} migration(s)...`);

  for (const file of files) {
    const sql = fs.readFileSync(path.join(migrationsDir, file), 'utf-8');
    console.log(`  ✓ Applying: ${file}`);
    await pool.query(sql);
  }

  console.log('✅ All migrations applied successfully.');
  await pool.end();
}

runMigrations().catch(err => {
  console.error('Migration failed:', err.message);
  process.exit(1);
});

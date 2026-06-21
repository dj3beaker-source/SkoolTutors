// Demo-request CRM storage. MySQL when DATABASE_URL is set (persistent — recommended for
// production), with a transparent in-memory fallback for local dev. You can point
// DATABASE_URL at a fresh MySQL or reuse HomeSkool's for one centralized CRM.
import mysql from 'mysql2/promise';

const { DATABASE_URL } = process.env;
let pool = null;
const mem = []; // in-memory fallback (not persistent across restarts)

export async function initDb() {
  if (!DATABASE_URL) {
    console.log('  • CRM:     no DATABASE_URL — demo requests kept in memory only (not persistent)');
    return;
  }
  pool = mysql.createPool(DATABASE_URL);
  await pool.query(`CREATE TABLE IF NOT EXISTS demo_requests (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(160),
    email VARCHAR(190),
    org VARCHAR(190),
    role VARCHAR(120),
    phone VARCHAR(60),
    students VARCHAR(60),
    grades VARCHAR(120),
    message TEXT,
    code_sent VARCHAR(80),
    source VARCHAR(60) DEFAULT 'skooltutors-demo',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  )`);
  console.log('  • CRM:     MySQL connected — demo_requests table ready');
}

export async function saveDemoRequest(r) {
  const row = {
    name: r.name || '', email: r.email || '', org: r.org || '',
    role: r.role || '', phone: r.phone || '', students: r.students || '',
    grades: r.grades || '', message: r.message || '', code_sent: r.code_sent || '',
  };
  if (pool) {
    await pool.query(
      'INSERT INTO demo_requests (name,email,org,role,phone,students,grades,message,code_sent) VALUES (?,?,?,?,?,?,?,?,?)',
      [row.name, row.email, row.org, row.role, row.phone, row.students, row.grades, row.message, row.code_sent]
    );
  } else {
    mem.push({ ...row, created_at: new Date().toISOString() });
  }
}

'use strict';

const { query } = require('./pool');

async function countUsers() {
  const { rows } = await query('SELECT COUNT(*)::int AS n FROM admin_users');
  return rows[0].n;
}

async function findByEmail(email) {
  const { rows } = await query('SELECT * FROM admin_users WHERE email = $1', [email]);
  return rows[0] || null;
}

async function findById(id) {
  const { rows } = await query('SELECT * FROM admin_users WHERE id = $1', [id]);
  return rows[0] || null;
}

async function createUser({ email, passwordHash, role = 'admin' }) {
  const { rows } = await query(
    `INSERT INTO admin_users (email, password_hash, role)
     VALUES ($1, $2, $3)
     ON CONFLICT (email) DO UPDATE SET password_hash = EXCLUDED.password_hash
     RETURNING id, email, role, created_at`,
    [email, passwordHash, role]
  );
  return rows[0];
}

async function updateLastLogin(id) {
  await query('UPDATE admin_users SET last_login_at = now() WHERE id = $1', [id]);
}

module.exports = { countUsers, findByEmail, findById, createUser, updateLastLogin };

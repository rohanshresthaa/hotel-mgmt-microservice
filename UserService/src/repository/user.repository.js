const { pool } = require("../config/db");

async function createUser(email, passwordHash) {
  const query = `
    INSERT INTO users (email, password_hash)
    VALUES ($1, $2)
    RETURNING id, email
  `;
  const values = [email, passwordHash];
  const res = await pool.query(query, values);
  return res.rows[0];
}

async function getUserByEmail(email) {
  const query = `
    SELECT id, email, password_hash
    FROM users
    WHERE email = $1
  `;
  const res = await pool.query(query, [email]);
  return res.rows[0];
}

async function getUserById(id) {
  const query = `
    SELECT id, email
    FROM users
    WHERE id = $1
  `;
  const res = await pool.query(query, [id]);
  return res.rows[0];
}

module.exports = {
  createUser,
  getUserByEmail,
  getUserById,
};

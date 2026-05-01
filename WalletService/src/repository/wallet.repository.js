const { pool } = require("../config/db");

const getWalletByUserId = async (userId) => {
  const result = await pool.query(`SELECT * FROM wallets WHERE user_id = $1`, [
    userId,
  ]);
  return result.rows[0] || null;
};

const createWallet = async (userId) => {
  const result = await pool.query(
    `INSERT INTO wallets(user_id) VALUES($1) RETURNING *`,
    [userId],
  );
  return result.rows[0];
};

const updateBalance = async (userId, balance) => {
  await pool.query(`UPDATE wallets SET balance = $1 WHERE user_id = $2`, [
    balance,
    userId,
  ]);
};

const createTransaction = async ({
  fromUser,
  toUser,
  amount,
  type,
  status,
}) => {
  const result = await pool.query(
    `INSERT INTO transactions(from_user, to_user, amount, type, status)
     VALUES($1,$2,$3,$4,$5) RETURNING *`,
    [fromUser, toUser, amount, type, status],
  );
  return result.rows[0];
};

const getTransactionsByUserId = async (userId) => {
  const result = await pool.query(
    `SELECT * FROM transactions
     WHERE from_user = $1 OR to_user = $1
     ORDER BY created_at DESC`,
    [userId],
  );
  return result.rows;
};

module.exports = {
  getWalletByUserId,
  createWallet,
  updateBalance,
  createTransaction,
  getTransactionsByUserId,
};

const redis = require("../config/redis");

// Cache TTL in seconds
const CACHE_TTL = 60;

// Cache functions for wallet balance and transactions
const getBalanceCache = async (userId) => {
  try {
    const data = await redis.get(`wallet:${userId}`);
    return data ? JSON.parse(data) : null;
  } catch (err) {
    console.error("Cache get error:", err.message);
    return null;
  }
};

// Cache the balance with an expiration time
const setBalanceCache = async (userId, balance) => {
  try {
    await redis.set(
      `wallet:${userId}`,
      JSON.stringify({ balance }),
      "EX",
      CACHE_TTL,
    );
  } catch (err) {
    console.error("Cache set error:", err.message);
  }
};

// Clear the cached balance (e.g. after a transaction)
const clearBalanceCache = async (userId) => {
  try {
    await redis.del(`wallet:${userId}`);
  } catch (err) {
    console.error("Cache clear error:", err.message);
  }
};

// Similar functions for transactions cache
const getTransactionsCache = async (userId) => {
  try {
    const data = await redis.get(`transactions:${userId}`);
    return data ? JSON.parse(data) : null;
  } catch (err) {
    console.error("Cache get transactions error:", err.message);
    return null;
  }
};

// Cache the transactions with an expiration time
const setTransactionsCache = async (userId, transactions) => {
  try {
    await redis.set(
      `transactions:${userId}`,
      JSON.stringify(transactions),
      "EX",
      CACHE_TTL,
    );
  } catch (err) {
    console.error("Cache set transactions error:", err.message);
  }
};

// Clear the cached transactions (e.g. after a new transaction is added)
const clearTransactionsCache = async (userId) => {
  try {
    await redis.del(`transactions:${userId}`);
  } catch (err) {
    console.error("Cache clear transactions error:", err.message);
  }
};

module.exports = {
  getBalanceCache,
  setBalanceCache,
  clearBalanceCache,
  getTransactionsCache,
  setTransactionsCache,
  clearTransactionsCache,
};

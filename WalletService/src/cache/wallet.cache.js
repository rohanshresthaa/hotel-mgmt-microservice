const redis = require("../config/redis");

const CACHE_TTL = 60;

const getBalanceCache = async (userId) => {
  try {
    const data = await redis.get(`wallet:${userId}`);
    return data ? JSON.parse(data) : null;
  } catch (err) {
    console.error("Cache get error:", err.message);
    return null;
  }
};

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

const clearBalanceCache = async (userId) => {
  try {
    await redis.del(`wallet:${userId}`);
  } catch (err) {
    console.error("Cache clear error:", err.message);
  }
};

const getTransactionsCache = async (userId) => {
  try {
    const data = await redis.get(`transactions:${userId}`);
    return data ? JSON.parse(data) : null;
  } catch (err) {
    console.error("Cache get transactions error:", err.message);
    return null;
  }
};

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

const redis = require("../config/redis");

const HOTEL_KEY = "hotels";
const TTL = 60; // seconds

const getHotelsCache = async () => {
  try {
    const data = await redis.get(HOTEL_KEY);
    return data ? JSON.parse(data) : null;
  } catch (err) {
    console.error("Cache get hotels error:", err.message);
    return null; // fallback to DB
  }
};

const setHotelsCache = async (hotels) => {
  try {
    await redis.set(HOTEL_KEY, JSON.stringify(hotels), "EX", TTL);
  } catch (err) {
    console.error("Cache set hotels error:", err.message);
  }
};

const clearHotelsCache = async () => {
  try {
    await redis.del(HOTEL_KEY);
  } catch (err) {
    console.error("Cache clear hotels error:", err.message);
  }
};

const getRoomsCache = async (hotelId) => {
  try {
    const data = await redis.get(`rooms:${hotelId}`);
    return data ? JSON.parse(data) : null;
  } catch (err) {
    console.error("Cache get rooms error:", err.message);
    return null;
  }
};

const setRoomsCache = async (hotelId, rooms) => {
  try {
    await redis.set(`rooms:${hotelId}`, JSON.stringify(rooms), "EX", TTL);
  } catch (err) {
    console.error("Cache set rooms error:", err.message);
  }
};

const clearRoomsCache = async (hotelId) => {
  try {
    await redis.del(`rooms:${hotelId}`);
  } catch (err) {
    console.error("Cache clear rooms error:", err.message);
  }
};

module.exports = {
  getHotelsCache,
  setHotelsCache,
  clearHotelsCache,
  getRoomsCache,
  setRoomsCache,
  clearRoomsCache,
};

const { pool } = require("../database/db.js");

const getHotels = async () => {
  const result = await pool.query(`SELECT * FROM hotels`);
  return result.rows;
};

const getHotelById = async (hotelId) => {
  const result = await pool.query(`SELECT * FROM hotels WHERE id = $1`, [
    hotelId,
  ]);
  return result.rows[0] || null;
};

const getRoomsByHotelId = async (hotelId) => {
  const result = await pool.query(`SELECT * FROM rooms WHERE hotel_id = $1`, [
    hotelId,
  ]);
  return result.rows;
};

const getRoomById = async (hotelId, roomId) => {
  const result = await pool.query(
    `SELECT * FROM rooms WHERE id = $1 AND hotel_id = $2`,
    [roomId, hotelId],
  );
  return result.rows[0] || null;
};

const createHotel = async (hotelData) => {
  const { name, location } = hotelData;
  const result = await pool.query(
    `INSERT INTO hotels (name, location) VALUES ($1, $2) RETURNING *`,
    [name, location],
  );
  return result.rows[0];
};

const createRoom = async (roomData) => {
  const { hotelId, roomNumber, price } = roomData;
  const result = await pool.query(
    `INSERT INTO rooms (hotel_id, room_number, price) VALUES ($1, $2, $3) RETURNING *`,
    [hotelId, roomNumber, price],
  );
  return result.rows[0];
};

const deleteHotel = async (hotelId) => {
  await pool.query(`DELETE FROM hotels WHERE id = $1`, [hotelId]);
};

const deleteRoom = async (hotelId, roomId) => {
  await pool.query(`DELETE FROM rooms WHERE id = $1 AND hotel_id = $2`, [
    roomId,
    hotelId,
  ]);
};

module.exports = {
  getHotels,
  getHotelById,
  getRoomsByHotelId,
  getRoomById,
  createHotel,
  createRoom,
  deleteHotel,
  deleteRoom,
};

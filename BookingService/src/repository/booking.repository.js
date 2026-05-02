const { pool } = require("../config/db");

const createBooking = async ({ userId, hotelId, roomId, amount }) => {
  const result = await pool.query(
    `INSERT INTO bookings(user_id, hotel_id, room_id, amount, status)
     VALUES($1,$2,$3,$4,'PENDING') RETURNING *`,
    [userId, hotelId, roomId, amount],
  );
  return result.rows[0];
};

const getRoomBooking = async (roomId) => {
  const result = await pool.query(
    `SELECT * FROM bookings WHERE room_id = $1 AND status = 'CONFIRMED'`,
    [roomId],
  );
  return result.rows[0] || null;
};

const updateBookingStatus = async (bookingId, status) => {
  await pool.query(`UPDATE bookings SET status = $1 WHERE id = $2`, [
    status,
    bookingId,
  ]);
};

const getBookingsByUserId = async (userId) => {
  const result = await pool.query(
    `SELECT * FROM bookings WHERE user_id = $1 ORDER BY created_at DESC`,
    [userId],
  );
  return result.rows;
};

const getBookingById = async (bookingId) => {
  const result = await pool.query(`SELECT * FROM bookings WHERE id = $1`, [
    bookingId,
  ]);
  return result.rows[0] || null;
};

const deleteBooking = async (bookingId) => {
  await pool.query(`DELETE FROM bookings WHERE id = $1`, [bookingId]);
};

module.exports = {
  createBooking,
  getRoomBooking,
  updateBookingStatus,
  getBookingsByUserId,
  getBookingById,
  deleteBooking,
};

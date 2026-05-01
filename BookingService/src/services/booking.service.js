const bookingRepository = require("../repository/booking.repository");
const bookingPublisher = require("../events/publishers/booking.publisher");

const createBooking = async ({ userId, hotelId, roomId, amount }) => {
  if (!hotelId || !roomId || !amount) {
    throw new Error("hotelId, roomId and amount are required");
  }

  if (amount <= 0) {
    throw new Error("Amount must be greater than 0");
  }

  // prevent double booking
  const existingBooking = await bookingRepository.getRoomBooking(roomId);
  if (existingBooking) {
    throw new Error("Room already booked");
  }

  // create pending booking
  const booking = await bookingRepository.createBooking({
    userId,
    hotelId,
    roomId,
    amount,
  });

  // publish event to wallet service
  await bookingPublisher.publishBookingCreated({
    bookingId: booking.id,
    userId,
    roomId,
    amount,
  });

  return booking;
};

const getBookings = async (userId) => {
  return await bookingRepository.getBookingsByUserId(userId);
};

const getBookingById = async (bookingId) => {
  const booking = await bookingRepository.getBookingById(bookingId);
  if (!booking) throw new Error("Booking not found");
  return booking;
};

module.exports = { createBooking, getBookings, getBookingById };

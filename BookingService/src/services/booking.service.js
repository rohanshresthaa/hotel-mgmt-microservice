const bookingRepository = require("../repository/booking.repository");
const bookingPublisher = require("../events/publishers/booking.publisher");

const DEFAULT_STATUS_WAIT_MS = 3000;
const STATUS_POLL_INTERVAL_MS = 250;

const waitForFinalStatus = async (bookingId, maxWaitMs) => {
  const deadline = Date.now() + maxWaitMs;

  while (Date.now() < deadline) {
    const latest = await bookingRepository.getBookingById(bookingId);
    if (latest && latest.status !== "PENDING") {
      return latest;
    }
    await new Promise((resolve) => setTimeout(resolve, STATUS_POLL_INTERVAL_MS));
  }

  return await bookingRepository.getBookingById(bookingId);
};

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

  // wait briefly for payment status update so response reflects balance outcome
  const updatedBooking = await waitForFinalStatus(
    booking.id,
    DEFAULT_STATUS_WAIT_MS,
  );

  return updatedBooking || booking;
};

const getBookings = async (userId) => {
  return await bookingRepository.getBookingsByUserId(userId);
};

const getBookingById = async (bookingId) => {
  const booking = await bookingRepository.getBookingById(bookingId);
  if (!booking) throw new Error("Booking not found");
  return booking;
};

const deleteBooking = async (bookingId) => {
  await bookingRepository.deleteBooking(bookingId);
};

const updateBookingStatus = async (bookingId, status) => {
  await bookingRepository.updateBookingStatus(bookingId, status);
};

module.exports = {
  createBooking,
  getBookings,
  getBookingById,
  deleteBooking,
  updateBookingStatus,
};

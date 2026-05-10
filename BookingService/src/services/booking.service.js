const bookingRepository = require("../repository/booking.repository");
const bookingPublisher = require("../events/publishers/booking.publisher");
const axios = require("axios");

const DEFAULT_STATUS_WAIT_MS = 3000;
const STATUS_POLL_INTERVAL_MS = 250;

const checkWalletBalance = async (userId, amount) => {
  const walletServiceUrl =
    process.env.WALLET_SERVICE_URL || "http://localhost:3003";
  const internalSecret = process.env.INTERNAL_SECRET;

  const url = `${walletServiceUrl}/api/internal/balance/${userId}`;

  let response;
  try {
    response = await fetch(url, {
      headers: { "x-internal-secret": internalSecret },
    });
  } catch (networkErr) {
    console.error(
      `[checkWalletBalance] Network error reaching ${url}:`,
      networkErr.message,
    );
    throw new Error(`Wallet service unreachable: ${networkErr.message}`);
  }

  if (response.status === 403) {
    console.error(
      "[checkWalletBalance] 403 Forbidden — check INTERNAL_SECRET env var on both services",
    );
    throw new Error(
      "Wallet service authorization failed — check INTERNAL_SECRET",
    );
  }

  if (response.status === 404) {
    console.error(
      `[checkWalletBalance] 404 — internal route not found at ${url}. Has wallet_route.js been deployed?`,
    );
    throw new Error(
      "Wallet balance endpoint not found — ensure wallet service is up to date",
    );
  }

  if (!response.ok) {
    const body = await response.text().catch(() => "(unreadable)");
    console.error(
      `[checkWalletBalance] Unexpected ${response.status} from wallet service:`,
      body,
    );
    throw new Error(`Wallet service error (HTTP ${response.status})`);
  }

  const data = await response.json();
  const balance = parseFloat(data.data?.balance ?? 0);

  console.log(
    `[checkWalletBalance] userId=${userId} balance=${balance} required=${amount}`,
  );

  if (balance < parseFloat(amount)) {
    throw new Error("Insufficient balance");
  }
};

const waitForFinalStatus = async (bookingId, maxWaitMs) => {
  const deadline = Date.now() + maxWaitMs;

  while (Date.now() < deadline) {
    const latest = await bookingRepository.getBookingById(bookingId);
    if (latest && latest.status !== "PENDING") {
      return latest;
    }
    await new Promise((resolve) =>
      setTimeout(resolve, STATUS_POLL_INTERVAL_MS),
    );
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

  // Check wallet balance BEFORE creating any record
  await checkWalletBalance(userId, amount);

  // Prevent double booking
  const existingBooking = await bookingRepository.getRoomBooking(roomId);
  if (existingBooking) {
    throw new Error("Room already booked");
  }

  // Create pending booking
  const booking = await bookingRepository.createBooking({
    userId,
    hotelId,
    roomId,
    amount,
  });

  console.log(
    `Booking created with ID: ${booking.id}, hotelId: ${hotelId}, roomId: ${roomId}`,
  );

  // Publish event to wallet service to deduct balance
  await bookingPublisher.publishBookingCreated({
    bookingId: booking.id,
    userId,
    roomId: roomId,
    hotelId: hotelId,
    amount,
  });

  // Wait briefly for the wallet service to confirm/fail the payment
  const updatedBooking = await waitForFinalStatus(
    booking.id,
    DEFAULT_STATUS_WAIT_MS,
  );

  const finalBooking = updatedBooking || booking;
  console.log(
    `Final booking status for ${finalBooking.id}: ${finalBooking.status}`,
  );

  // Publish events to hotel service based on payment result
  if (finalBooking.status === "CONFIRMED") {
    console.log(`Publishing PAYMENT_SUCCESS for booking ${finalBooking.id}`);
    await bookingPublisher.publishPaymentSuccess({
      bookingId: finalBooking.id,
      hotelId: finalBooking.hotel_id,
      roomId: finalBooking.room_id,
    });
  } else if (finalBooking.status === "FAILED") {
    console.log(`Publishing PAYMENT_FAILED for booking ${finalBooking.id}`);
    await bookingPublisher.publishPaymentFailed({
      bookingId: finalBooking.id,
      hotelId: finalBooking.hotel_id,
      roomId: finalBooking.room_id,
      reason: "Payment processing failed",
    });
  }

  return finalBooking;
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
  // Fetch before deleting so we have roomId to publish with
  const booking = await bookingRepository.getBookingById(bookingId);
  if (!booking) throw new Error("Booking not found");

  await bookingRepository.deleteBooking(bookingId);

  // Free the room in hotel service if booking was confirmed
  if (booking.status === "CONFIRMED") {
    console.log(`Publishing BOOKING_DELETED for booking ${bookingId}`);
    await bookingPublisher.publishBookingDeleted({
      bookingId: booking.id,
      hotelId: booking.hotel_id,
      roomId: booking.room_id,
    });
  }
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

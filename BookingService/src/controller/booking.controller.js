const bookingService = require("../services/booking.service");
const ApiResponse = require("../utils/api_response");

const createBooking = async (req, res) => {
  try {
    const booking = await bookingService.createBooking({
      userId: req.user.id,
      ...req.body,
    });
    let message = "Booking initiated successfully";
    let status = 201;

    if (booking?.status === "CONFIRMED") {
      message = "Booking confirmed successfully";
      return res.status(status).json(ApiResponse.success(message, { booking }));
    } else if (booking?.status === "FAILED") {
      // Reached only in edge cases where balance was deducted between
      // the pre-check and the actual wallet deduction (race condition).
      const reason = booking.failure_reason ?? "Payment failed";
      return res
        .status(402)
        .json(ApiResponse.failure(`Booking failed: ${reason}`));
    }

    console.log("Booking created:", booking);
    return res.status(status).json(ApiResponse.success(message, { booking }));
  } catch (error) {
    let status = 500;
    if (error.message.includes("Insufficient balance")) {
      status = 402;
    } else if (error.message.includes("already booked")) {
      status = 409;
    } else if (error.message.includes("required")) {
      status = 400;
    } else if (error.message.includes("greater than")) {
      status = 400;
    } else if (
      error.message.includes("unreachable") ||
      error.message.includes("authorization failed") ||
      error.message.includes("not found — ensure") ||
      error.message.includes("Wallet service error")
    ) {
      status = 503;
    }
    return res.status(status).json(ApiResponse.failure(error.message));
  }
};

const getBookings = async (req, res) => {
  try {
    const bookings = await bookingService.getBookings(req.user.id);
    return res
      .status(200)
      .json(ApiResponse.success("Bookings fetched successfully", { bookings }));
  } catch (error) {
    return res.status(500).json(ApiResponse.failure(error.message));
  }
};

const getBookingById = async (req, res) => {
  try {
    const booking = await bookingService.getBookingById(req.params.bookingId);
    return res
      .status(200)
      .json(ApiResponse.success("Booking fetched successfully", { booking }));
  } catch (error) {
    const status = error.message.includes("not found") ? 404 : 500;
    return res.status(status).json(ApiResponse.failure(error.message));
  }
};

const deleteBooking = async (req, res) => {
  try {
    await bookingService.deleteBooking(req.params.bookingId);
    return res
      .status(200)
      .json(ApiResponse.success("Booking deleted successfully"));
  } catch (error) {
    const status = error.message.includes("not found") ? 404 : 500;
    return res.status(status).json(ApiResponse.failure(error.message));
  }
};

const updateBookingStatus = async (req, res) => {
  try {
    const { status } = req.body;
    if (!status) {
      return res.status(400).json(ApiResponse.failure("Status is required"));
    }
    await bookingService.updateBookingStatus(req.params.bookingId, status);
    return res
      .status(200)
      .json(ApiResponse.success("Booking status updated successfully"));
  } catch (error) {
    const status = error.message.includes("not found") ? 404 : 500;
    return res.status(status).json(ApiResponse.failure(error.message));
  }
};

module.exports = {
  createBooking,
  getBookings,
  getBookingById,
  deleteBooking,
  updateBookingStatus,
};

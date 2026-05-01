const bookingService = require("../services/booking.service");
const ApiResponse = require("../utils/api_response");

const createBooking = async (req, res) => {
  try {
    const booking = await bookingService.createBooking({
      userId: req.user.id, // fix: .id not .userId
      ...req.body,
    });
    return res
      .status(201)
      .json(ApiResponse.success("Booking initiated successfully", { booking }));
  } catch (error) {
    const status = error.message.includes("already booked")
      ? 409
      : error.message.includes("required")
        ? 400
        : error.message.includes("greater than")
          ? 400
          : 500;
    return res.status(status).json(ApiResponse.failure(error.message));
  }
};

const getBookings = async (req, res) => {
  try {
    const bookings = await bookingService.getBookings(req.user.id); // fix: .id
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

module.exports = { createBooking, getBookings, getBookingById };

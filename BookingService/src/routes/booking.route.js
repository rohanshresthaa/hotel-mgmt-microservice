const express = require("express");
const router = express.Router();
const bookingController = require("../controller/booking.controller");
const { authenticateToken } = require("../middleware/auth.middleware");

router.post("/", authenticateToken, bookingController.createBooking);
router.get("/", authenticateToken, bookingController.getBookings);
router.get("/:bookingId", authenticateToken, bookingController.getBookingById);
router.delete(
  "/:bookingId",
  authenticateToken,
  bookingController.deleteBooking,
);
router.put(
  "/:bookingId/status",
  authenticateToken,
  bookingController.updateBookingStatus,
);

module.exports = router;

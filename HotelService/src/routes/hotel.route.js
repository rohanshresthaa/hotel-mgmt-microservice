const express = require("express");
const router = express.Router();
const hotelController = require("../controllers/hotel.controller.js");
const { authenticateToken } = require("../middleware/auth.middleware.js");
const {
  authenticateInternal,
} = require("../middleware/internal.middleware.js");

// User-facing routes
router.get("/", authenticateToken, hotelController.getHotels);
router.get("/:hotelId/rooms", authenticateToken, hotelController.getRooms);
router.post("/", authenticateToken, hotelController.createHotel);
router.post("/rooms", authenticateToken, hotelController.createRoom);
router.delete("/:hotelId", authenticateToken, hotelController.deleteHotel);
router.delete(
  "/:hotelId/rooms/:roomId",
  authenticateToken,
  hotelController.deleteRoom,
);

// Internal route — called by booking service to update room availability
router.patch(
  "hotels/:hotelId/rooms/:roomId/availability",
  authenticateInternal,
  hotelController.updateRoomAvailability,
);

module.exports = router;

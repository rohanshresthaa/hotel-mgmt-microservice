const express = require("express");
const router = express.Router();
const hotelController = require("../controllers/hotel.controller.js");
const { authenticateToken } = require("../middleware/auth.middleware.js");

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

module.exports = router;

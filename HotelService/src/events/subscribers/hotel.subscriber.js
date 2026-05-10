const Redis = require("ioredis");

const subscriber = new Redis({
  host: process.env.REDIS_HOST || "localhost",
  port: process.env.REDIS_PORT || 6379,
  retryStrategy: (times) => {
    if (times > 3) return null;
    return Math.min(times * 200, 1000);
  },
});

const EVENTS = require("../event.constants");
const hotelRepository = require("../../repository/hotel.repository");
const hotelCache = require("../../cache/hotel.cache");

const startHotelSubscriber = async () => {
  await subscriber.subscribe(
    EVENTS.PAYMENT_SUCCESS,
    EVENTS.PAYMENT_FAILED,
    EVENTS.BOOKING_DELETED,
  );
  console.log("Hotel service listening for booking/payment events...");

  subscriber.on("message", async (channel, message) => {
    try {
      const data = JSON.parse(message);
      console.log(`Received event ${channel} with data:`, data);

      const { roomId, hotelId, bookingId } = data;

      // Validate required fields
      if (!roomId) {
        console.error(`Missing roomId in event ${channel}:`, data);
        return; // Don't try to process without roomId
      }

      // Look up hotelId if not provided in the event
      let finalHotelId = hotelId;
      if (!finalHotelId) {
        const room = await hotelRepository.getRoomByIdOnly(roomId);
        finalHotelId = room?.hotel_id;
        if (!finalHotelId) {
          console.error(`Could not find hotelId for room ${roomId}`);
          return;
        }
      }

      if (channel === EVENTS.PAYMENT_SUCCESS) {
        await hotelRepository.updateRoomAvailability(
          finalHotelId,
          roomId,
          false,
        );
        if (finalHotelId) await hotelCache.clearRoomsCache(finalHotelId);
        console.log(
          `Room ${roomId} marked unavailable after successful booking`,
        );
      } else if (channel === EVENTS.PAYMENT_FAILED) {
        await hotelRepository.updateRoomAvailability(
          finalHotelId,
          roomId,
          true,
        );
        if (finalHotelId) await hotelCache.clearRoomsCache(finalHotelId);
        console.log(`Room ${roomId} kept available after failed payment`);
      } else if (channel === EVENTS.BOOKING_DELETED) {
        await hotelRepository.updateRoomAvailability(
          finalHotelId,
          roomId,
          true,
        );
        if (finalHotelId) await hotelCache.clearRoomsCache(finalHotelId);
        console.log(`Room ${roomId} marked available after booking deletion`);
      }
    } catch (error) {
      console.error("Hotel subscriber error:", error.message);
      console.error("Full error:", error);
    }
  });

  subscriber.on("error", (err) => {
    console.error("Hotel subscriber Redis error:", err.message);
  });
};

module.exports = { startHotelSubscriber };

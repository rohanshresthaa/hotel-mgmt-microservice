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
const bookingRepository = require("../../repository/booking.repository");

const startPaymentSubscriber = async () => {
  await subscriber.subscribe(EVENTS.PAYMENT_SUCCESS, EVENTS.PAYMENT_FAILED);
  console.log("Listening for payment events...");

  subscriber.on("message", async (channel, message) => {
    try {
      const data = JSON.parse(message);

      if (channel === EVENTS.PAYMENT_SUCCESS) {
        await bookingRepository.updateBookingStatus(
          data.bookingId,
          "CONFIRMED",
        );
        console.log(`Booking ${data.bookingId} confirmed`);
      }

      if (channel === EVENTS.PAYMENT_FAILED) {
        await bookingRepository.updateBookingStatus(data.bookingId, "FAILED");
        console.log(`Booking ${data.bookingId} failed: ${data.reason}`);
      }
    } catch (error) {
      console.error("Payment subscriber error:", error.message);
    }
  });

  subscriber.on("error", (err) => {
    console.error("Subscriber Redis error:", err.message);
  });
};

module.exports = { startPaymentSubscriber };

const Redis = require("ioredis");

const subscriber = new Redis({
  host: process.env.REDIS_HOST || "localhost",
  port: process.env.REDIS_PORT || 6382,
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
      const { bookingId, reason } = data;

      if (channel === EVENTS.PAYMENT_SUCCESS) {
        await bookingRepository.updateBookingStatus(bookingId, "CONFIRMED");
        console.log(`Booking ${bookingId} confirmed`);
      } else if (channel === EVENTS.PAYMENT_FAILED) {
        // Persist the failure reason so the controller can return it
        await bookingRepository.updateBookingStatusWithReason(
          bookingId,
          "FAILED",
          reason ?? "Payment failed",
        );
        console.log(`Booking ${bookingId} failed: ${reason}`);
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

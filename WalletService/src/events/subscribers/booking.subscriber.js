const Redis = require("ioredis");

const subscriber = new Redis({
  host: process.env.REDIS_HOST || "localhost",
  port: process.env.REDIS_PORT || 6380,
  retryStrategy: (times) => {
    if (times > 3) return null;
    return Math.min(times * 200, 1000);
  },
});

const EVENTS = require("../event.constants");
const walletRepository = require("../../repository/wallet.repository");
const walletCache = require("../../cache/wallet.cache");
const paymentPublisher = require("../publishers/payment.publisher");

const OWNER_ID = "11111111-1111-1111-1111-111111111111";

const startBookingSubscriber = async () => {
  await subscriber.subscribe(EVENTS.BOOKING_CREATED);
  console.log("Listening for booking events...");

  subscriber.on("message", async (channel, message) => {
    if (channel !== EVENTS.BOOKING_CREATED) return;

    try {
      const booking = JSON.parse(message);
      const { bookingId, userId, roomId, amount } = booking;

      console.log(`Processing payment for booking ${bookingId}...`);

      const wallet = await walletRepository.getWalletByUserId(userId);

      // insufficient balance or no wallet
      if (!wallet || Number(wallet.balance) < Number(amount)) {
        await walletRepository.createTransaction({
          fromUser: userId,
          toUser: OWNER_ID,
          amount,
          type: "PAYMENT",
          status: "FAILED",
        });

        await paymentPublisher.publishPaymentFailed({
          bookingId,
          userId,
          roomId,
          reason: "Insufficient balance",
        });

        console.log(`Payment failed for booking ${bookingId}`);
        return;
      }

      // deduct user balance
      const updatedUserBalance = Number(wallet.balance) - Number(amount);
      await walletRepository.updateBalance(userId, updatedUserBalance);

      // credit owner wallet
      let ownerWallet = await walletRepository.getWalletByUserId(OWNER_ID);
      if (!ownerWallet) {
        ownerWallet = await walletRepository.createWallet(OWNER_ID);
      }

      const updatedOwnerBalance = Number(ownerWallet.balance) + Number(amount);
      await walletRepository.updateBalance(OWNER_ID, updatedOwnerBalance);

      // save transaction
      await walletRepository.createTransaction({
        fromUser: userId,
        toUser: OWNER_ID,
        amount,
        type: "PAYMENT",
        status: "SUCCESS",
      });

      // clear cache for both user and owner
      await walletCache.clearBalanceCache(userId);
      await walletCache.clearBalanceCache(OWNER_ID);
      await walletCache.clearTransactionsCache(userId);

      // publish success
      await paymentPublisher.publishPaymentSuccess({
        bookingId,
        userId,
        roomId,
      });

      console.log(`Payment successful for booking ${bookingId}`);
    } catch (error) {
      console.error("Subscriber error:", error.message);
    }
  });

  subscriber.on("error", (err) => {
    console.error("Subscriber Redis error:", err.message);
  });
};

module.exports = { startBookingSubscriber };

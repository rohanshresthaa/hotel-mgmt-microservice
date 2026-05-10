// Wallet service — events this service subscribes to and publishes
module.exports = {
  BOOKING_CREATED: "BOOKING_CREATED",  // subscribes
  PAYMENT_SUCCESS: "PAYMENT_SUCCESS",  // publishes
  PAYMENT_FAILED: "PAYMENT_FAILED",    // publishes
  BOOKING_DELETED: "BOOKING_DELETED",  // subscribes
};
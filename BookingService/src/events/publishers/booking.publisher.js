const redis = require("../../config/redis");
const EVENTS = require("../event.constants");

const publishBookingCreated = async (data) => {
  await redis.publish(EVENTS.BOOKING_CREATED, JSON.stringify(data));
};

const publishBookingDeleted = async (data) => {
  await redis.publish(EVENTS.BOOKING_DELETED, JSON.stringify(data));
};

const publishPaymentSuccess = async (data) => {
  console.log(`Publishing PAYMENT_SUCCESS with data:`, data);
  await redis.publish(EVENTS.PAYMENT_SUCCESS, JSON.stringify(data));
};
const publishPaymentFailed = async (data) => {
  await redis.publish(EVENTS.PAYMENT_FAILED, JSON.stringify(data));
};

module.exports = {
  publishBookingCreated,
  publishBookingDeleted,
  publishPaymentSuccess,
  publishPaymentFailed,
};

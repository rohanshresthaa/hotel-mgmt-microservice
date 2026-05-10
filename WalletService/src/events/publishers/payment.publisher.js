const redis = require("../../config/redis");

const EVENTS = require("../event.constants");

// Functions to publish events to Redis channels
const publishPaymentSuccess = async (data) => {
  await redis.publish(EVENTS.PAYMENT_SUCCESS, JSON.stringify(data));
};

// Publish payment failed event with reason
const publishPaymentFailed = async (data) => {
  await redis.publish(EVENTS.PAYMENT_FAILED, JSON.stringify(data));
};

module.exports = {
  publishPaymentSuccess,
  publishPaymentFailed,
};

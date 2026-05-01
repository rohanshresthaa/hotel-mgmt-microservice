const redis = require("../../config/redis");

const EVENTS = require("../event.constants");

const publishPaymentSuccess = async (data) => {
  await redis.publish(EVENTS.PAYMENT_SUCCESS, JSON.stringify(data));
};

const publishPaymentFailed = async (data) => {
  await redis.publish(EVENTS.PAYMENT_FAILED, JSON.stringify(data));
};

module.exports = {
  publishPaymentSuccess,
  publishPaymentFailed,
};

const redis = require("../../config/redis");

const EVENTS = require("../event.constants");

const publishBookingCreated = async (data) => {
  await redis.publish(EVENTS.BOOKING_CREATED, JSON.stringify(data));
};

module.exports = {
  publishBookingCreated,
};

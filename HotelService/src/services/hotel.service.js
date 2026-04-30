const hotelRepository = require("../repository/hotel.repository");

const getHotels = async () => {
  return await hotelRepository.getHotels();
};

const getRoomsByHotelId = async (hotelId) => {
  return await hotelRepository.getRoomsByHotelId(hotelId);
};

const createHotel = async (hotelData) => {
  return await hotelRepository.createHotel(hotelData);
};

const createRoom = async (roomData) => {
  return await hotelRepository.createRoom(roomData);
};

const deleteHotel = async (hotelId) => {
  await hotelRepository.deleteHotel(hotelId);
};

const deleteRoom = async (hotelId, roomId) => {
  await hotelRepository.deleteRoom(hotelId, roomId);
};

module.exports = {
  getHotels,
  getRoomsByHotelId,
  createHotel,
  createRoom,
  deleteHotel,
  deleteRoom,
};

module.exports = {
  getHotels,
  getRoomsByHotelId,
  createHotel,
  createRoom,
};

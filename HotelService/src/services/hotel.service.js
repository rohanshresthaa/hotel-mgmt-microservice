const hotelRepository = require("../repository/hotel.repository");

const hotelCache = require("../cache/hotel.cache");

const getHotels = async () => {
  // check cache first
  const cachedHotels = await hotelCache.getHotelsCache();

  if (cachedHotels) {
    console.log("Hotels from cache");
    return cachedHotels;
  }

  const hotels = await hotelRepository.getHotels();

  // save cache
  await hotelCache.setHotelsCache(hotels);

  return hotels;
};

const getRoomsByHotelId = async (hotelId) => {
  const hotel = await hotelRepository.getHotelById(hotelId);

  if (!hotel) {
    throw new Error("Hotel not found");
  }

  // room cache
  const cachedRooms = await hotelCache.getRoomsCache(hotelId);

  if (cachedRooms) {
    console.log("Rooms from cache");
    return cachedRooms;
  }

  const rooms = await hotelRepository.getRoomsByHotelId(hotelId);

  await hotelCache.setRoomsCache(hotelId, rooms);

  return rooms;
};

const createHotel = async (hotelData) => {
  if (!hotelData.name) {
    throw new Error("Hotel name is required");
  }

  const hotel = await hotelRepository.createHotel(hotelData);

  // clear cache
  await hotelCache.clearHotelsCache();

  return hotel;
};

const createRoom = async (roomData) => {
  const hotel = await hotelRepository.getHotelById(roomData.hotelId);

  if (!hotel) {
    throw new Error("Hotel not found");
  }

  if (!roomData.roomNumber || !roomData.price) {
    throw new Error("Room number and price required");
  }

  const room = await hotelRepository.createRoom(roomData);

  // clear room cache
  await hotelCache.clearRoomsCache(roomData.hotelId);

  return room;
};

const deleteHotel = async (hotelId) => {
  const hotel = await hotelRepository.getHotelById(hotelId);

  if (!hotel) {
    throw new Error("Hotel not found");
  }

  await hotelRepository.deleteHotel(hotelId);

  await hotelCache.clearHotelsCache();
};

const deleteRoom = async (hotelId, roomId) => {
  const hotel = await hotelRepository.getHotelById(hotelId);

  if (!hotel) {
    throw new Error("Hotel not found");
  }

  const room = await hotelRepository.getRoomById(hotelId, roomId);

  if (!room) {
    throw new Error("Room not found");
  }

  await hotelRepository.deleteRoom(hotelId, roomId);

  await hotelCache.clearRoomsCache(hotelId);
};

module.exports = {
  getHotels,
  getRoomsByHotelId,
  createHotel,
  createRoom,
  deleteHotel,
  deleteRoom,
};

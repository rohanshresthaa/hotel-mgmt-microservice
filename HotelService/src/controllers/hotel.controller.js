const ApiResponse = require("../utils/api_response");
const hotelService = require("../services/hotel.service");

const getHotels = async (req, res) => {
  try {
    const hotels = await hotelService.getHotels();
    res.json(ApiResponse.success("Hotels fetched successfully", { hotels }));
  } catch (error) {
    res.status(500).json(ApiResponse.failure(error.message));
  }
};

const getRooms = async (req, res) => {
  try {
    const rooms = await hotelService.getRoomsByHotelId(req.params.hotelId);
    res.json(ApiResponse.success("Rooms fetched successfully", { rooms }));
  } catch (error) {
    res.status(500).json(ApiResponse.failure(error.message));
  }
};

const createHotel = async (req, res) => {
  try {
    const hotel = await hotelService.createHotel(req.body);
    res
      .status(201)
      .json(ApiResponse.success("Hotel created successfully", { hotel }));
  } catch (error) {
    res.status(500).json(ApiResponse.failure(error.message));
  }
};

const createRoom = async (req, res) => {
  try {
    const room = await hotelService.createRoom(req.body);
    res
      .status(201)
      .json(ApiResponse.success("Room created successfully", { room }));
  } catch (error) {
    res.status(500).json(ApiResponse.failure(error.message));
  }
};

const deleteHotel = async (req, res) => {
  try {
    await hotelService.deleteHotel(req.params.hotelId);
    res.json(ApiResponse.success("Hotel deleted successfully"));
  } catch (error) {
    res.status(500).json(ApiResponse.failure(error.message));
  }
};

const deleteRoom = async (req, res) => {
  try {
    await hotelService.deleteRoom(req.params.hotelId, req.params.roomId);
    res.json(ApiResponse.success("Room deleted successfully"));
  } catch (error) {
    res.status(500).json(ApiResponse.failure(error.message));
  }
};

module.exports = {
  getHotels,
  getRooms,
  createHotel,
  createRoom,
  deleteHotel,
  deleteRoom,
};

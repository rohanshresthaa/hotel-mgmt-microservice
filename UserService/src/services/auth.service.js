const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const userRepository = require("../repository/user.repository");

const JWT_SECRET = process.env.JWT_SECRET || "dev_secret";
const TOKEN_EXPIRES_IN = process.env.JWT_EXPIRES_IN || "7d";

function createToken(payload) {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: TOKEN_EXPIRES_IN });
}

async function registerUser(email, password) {
  const existing = await userRepository.getUserByEmail(email);
  if (existing) {
    const error = new Error("User already exists");
    error.code = "USER_EXISTS";
    throw error;
  }
  const passwordHash = await bcrypt.hash(password, 10);
  const user = await userRepository.createUser(email, passwordHash);
  return { user: { id: user.id, email: user.email } };
}

async function loginUser(email, password) {
  const user = await userRepository.getUserByEmail(email);
  if (!user) {
    const error = new Error("Invalid credentials");
    error.code = "INVALID_CREDENTIALS";
    throw error;
  }
  const valid = await bcrypt.compare(password, user.password_hash);
  if (!valid) {
    const error = new Error("Invalid credentials");
    error.code = "INVALID_CREDENTIALS";
    throw error;
  }
  const token = createToken({ id: user.id, email: user.email });
  return { user: { id: user.id, email: user.email }, token };
}

async function getUserById(id) {
  return userRepository.getUserById(id);
}

module.exports = {
  registerUser,
  loginUser,
  getUserById,
};

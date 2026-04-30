const authService = require("../services/auth.service");

async function signup(req, res) {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ message: "Email and password are required" });
  }
  try {
    const result = await authService.registerUser(email, password);
    return res.status(201).json({
        
    });
  } catch (err) {
    if (err.code === "USER_EXISTS") {
      return res.status(409).json({ message: "User already exists" });
    }
    console.error("Error in signup:", err);
    return res.status(500).json({ message: "Internal server error" });
  }
}

async function login(req, res) {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ message: "Email and password are required" });
  }
  try {
    const result = await authService.loginUser(email, password);
    return res.status(200).json(result);
  } catch (err) {
    if (err.code === "INVALID_CREDENTIALS") {
      return res.status(401).json({ message: "Invalid credentials" });
    }
    console.error("Error in login:", err);
    return res.status(500).json({ message: "Internal server error" });
  }
}

async function getUser(req, res) {
  try {
    const user = await authService.getUserById(req.user.id);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    return res.status(200).json(user);
  } catch (err) {
    console.error("Error in getMe:", err);
    return res.status(500).json({ message: "Internal server error" });
  }
}

module.exports = {
  signup,
  login,
  getUser,
};

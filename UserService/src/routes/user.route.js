const express = require("express");
const authController = require("../controller/auth.controller");
const { authenticateToken } = require("../middleware/auth.middleware");

const router = express.Router();

router.post("/auth/signup", authController.signup);
router.post("/auth/login", authController.login);
router.get("/auth/me", authenticateToken, authController.getUser);

module.exports = router;

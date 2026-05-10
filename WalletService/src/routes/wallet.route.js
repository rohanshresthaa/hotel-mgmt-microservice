const express = require("express");
const router = express.Router();
const walletController = require("../controller/wallet.controller");
const { authenticateToken } = require("../middleware/auth.middleware");
const { authenticateInternal } = require("../middleware/internal.middleware");

// User-facing routes (JWT protected)
router.get("/balance", authenticateToken, walletController.getBalance);
router.post("/load", authenticateToken, walletController.loadMoney);
router.post("/withdraw", authenticateToken, walletController.withdraw);
router.get(
  "/transactions",
  authenticateToken,
  walletController.getTransactions,
);

// Internal service-to-service route (internal secret protected)
// Called by booking service to check balance before creating a booking
router.get(
  "/internal/balance/:userId",
  authenticateInternal,
  walletController.getBalanceByUserId,
);

module.exports = router;

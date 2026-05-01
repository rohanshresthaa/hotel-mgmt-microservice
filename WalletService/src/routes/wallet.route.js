const express = require("express");
const router = express.Router();
const walletController = require("../controller/wallet.controller"); // fix: plural
const { authenticateToken } = require("../middleware/auth.middleware");

router.get("/balance", authenticateToken, walletController.getBalance);
router.post("/load", authenticateToken, walletController.loadMoney);
router.post("/withdraw", authenticateToken, walletController.withdraw);
router.get(
  "/transactions",
  authenticateToken,
  walletController.getTransactions,
);

module.exports = router;

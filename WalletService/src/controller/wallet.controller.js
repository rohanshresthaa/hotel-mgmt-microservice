const walletService = require("../services/wallet.service");
const ApiResponse = require("../utils/api_response");

// Functions to load money, withdraw, get balance, and get transactions for the logged-in user

// POST /api/wallet/load - load money into wallet
const loadMoney = async (req, res) => {
  try {
    const { amount } = req.body;
    if (!amount) {
      return res.status(400).json(ApiResponse.failure("Amount is required"));
    }
    const result = await walletService.loadMoney(req.user.id, amount);
    return res
      .status(200)
      .json(ApiResponse.success("Money loaded successfully", result));
  } catch (error) {
    const status = error.message.includes("Invalid") ? 400 : 500;

    return res.status(status).json(ApiResponse.failure(error.message));
  }
};


// POST /api/wallet/withdraw - withdraw money from wallet
const withdraw = async (req, res) => {
  try {
    const { amount } = req.body;
    if (!amount) {
      return res.status(400).json(ApiResponse.failure("Amount is required"));
    }
    const result = await walletService.withdraw(req.user.id, amount);
    return res
      .status(200)
      .json(ApiResponse.success("Withdrawal successful", result));
  } catch (error) {
    const status = error.message.includes("Insufficient")
      ? 422
      : error.message.includes("Invalid")
        ? 400
        : error.message.includes("not found")
          ? 404
          : 500;
    return res.status(status).json(ApiResponse.failure(error.message));
  }
};

// GET /api/wallet/balance - get current balance for logged-in user
const getBalance = async (req, res) => {
  try {
    const result = await walletService.getBalance(req.user.id);
    return res
      .status(200)
      .json(ApiResponse.success("Balance fetched successfully", result));
  } catch (error) {
    return res.status(500).json(ApiResponse.failure(error.message));
  }
};

// Internal endpoint: called by other services (e.g. booking service) using a service secret.
// userId comes from the URL param, not req.user.
const getBalanceByUserId = async (req, res) => {
  try {
    const { userId } = req.params;
    const result = await walletService.getBalance(userId);
    return res
      .status(200)
      .json(ApiResponse.success("Balance fetched successfully", result));
  } catch (error) {
    return res.status(500).json(ApiResponse.failure(error.message));
  }
};


// GET /api/wallet/transactions - get transaction history for logged-in user
const getTransactions = async (req, res) => {
  try {
    const transactions = await walletService.getTransactions(req.user.id);
    return res.status(200).json(
      ApiResponse.success("Transactions fetched successfully", {
        transactions,
      }),
    );
  } catch (error) {
    return res.status(500).json(ApiResponse.failure(error.message));
  }
};

module.exports = {
  loadMoney,
  withdraw,
  getBalance,
  getBalanceByUserId,
  getTransactions,
};

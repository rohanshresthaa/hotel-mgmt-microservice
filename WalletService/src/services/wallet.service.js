const walletRepository = require("../repository/wallet.repository");
const walletCache = require("../cache/wallet.cache");

const getBalance = async (userId) => {
  const cached = await walletCache.getBalanceCache(userId);
  if (cached) {
    console.log("Balance from cache");
    return cached;
  }

  let wallet = await walletRepository.getWalletByUserId(userId);
  if (!wallet) {
    wallet = await walletRepository.createWallet(userId);
  }

  await walletCache.setBalanceCache(userId, wallet.balance);
  return { balance: wallet.balance };
};

const loadMoney = async (userId, amount) => {
  if (!amount || amount <= 0) throw new Error("Invalid amount");

  let wallet = await walletRepository.getWalletByUserId(userId);
  if (!wallet) {
    wallet = await walletRepository.createWallet(userId);
  }

  const newBalance = parseFloat(wallet.balance) + parseFloat(amount);
  await walletRepository.updateBalance(userId, newBalance);

  await walletRepository.createTransaction({
    fromUser: null,
    toUser: userId,
    amount,
    type: "LOAD",
    status: "SUCCESS",
  });

  await walletCache.clearBalanceCache(userId);
  await walletCache.clearTransactionsCache(userId);

  return { balance: newBalance };
};

const withdraw = async (userId, amount) => {
  if (!amount || amount <= 0) throw new Error("Invalid amount");

  let wallet = await walletRepository.getWalletByUserId(userId);
  if (!wallet) throw new Error("Wallet not found");

  if (parseFloat(wallet.balance) < parseFloat(amount)) {
    // log failed transaction
    await walletRepository.createTransaction({
      fromUser: userId,
      toUser: null,
      amount,
      type: "PAYMENT",
      status: "FAILED",
    });
    throw new Error("Insufficient balance");
  }

  const newBalance = parseFloat(wallet.balance) - parseFloat(amount);
  await walletRepository.updateBalance(userId, newBalance);

  await walletRepository.createTransaction({
    fromUser: userId,
    toUser: null,
    amount,
    type: "PAYMENT",
    status: "SUCCESS",
  });

  await walletCache.clearBalanceCache(userId);
  await walletCache.clearTransactionsCache(userId);

  return { balance: newBalance };
};

const getTransactions = async (userId) => {
  const cached = await walletCache.getTransactionsCache(userId);
  if (cached) {
    console.log("Transactions from cache");
    return cached;
  }

  const transactions = await walletRepository.getTransactionsByUserId(userId);
  await walletCache.setTransactionsCache(userId, transactions);

  return transactions;
};

module.exports = { getBalance, loadMoney, withdraw, getTransactions };

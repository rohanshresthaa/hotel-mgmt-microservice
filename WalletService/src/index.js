const express = require("express");
const cors = require("cors");
require("dotenv").config();
const { runSchema, testConnection } = require("./config/db");
const routes = require("./routes/wallet.route");
const {
  startBookingSubscriber,
} = require("./events/subscribers/booking.subscriber");

const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 3003;

app.get("/", (req, res) => {
  res.send("Wallet Service is running");
});

app.use("/api", routes);

async function initializeDatabase() {
  try {
    const connected = await testConnection();
    if (!connected) {
      console.error("Failed to connect to database");
      process.exit(1);
    }
    await runSchema();
  } catch (err) {
    console.error("Database initialization failed:", err);
    process.exit(1);
  }
}

async function startServer() {
  try {
    await initializeDatabase();
    await startBookingSubscriber(); // start listening for booking events
    app.listen(PORT, () => {
      console.log(`Wallet Service is running on port ${PORT}`);
    });
  } catch (error) {
    console.error("Failed to start server:", error);
    process.exit(1);
  }
}

startServer();

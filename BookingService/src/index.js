const express = require("express");
const cors = require("cors");
require("dotenv").config();
const { runSchema, testConnection } = require("./config/db");
const routes = require("./routes/booking.route");
const {
  startPaymentSubscriber,
} = require("./events/subscribers/payment.subscriber");

const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 3004;

app.get("/", (req, res) => {
  res.send("Booking Service is running"); // fix: was "Wallet Service"
});

app.use("/api/bookings", routes);

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
    await startPaymentSubscriber();
    app.listen(PORT, () => {
      console.log(`Booking Service is running on port ${PORT}`);
    });
  } catch (error) {
    console.error("Failed to start server:", error);
    process.exit(1);
  }
}

startServer();

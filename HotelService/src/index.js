const express = require("express");
const cors = require("cors");
require("dotenv").config();
const { runSchema, testConnection } = require("./database/db.js");
const routes = require("./routes/hotel.route.js");

const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 5000;

app.get("/", (req, res) => {
  res.send("User Service is running");
});

app.use("/api", routes);

async function initializeDatabase() {
  try {
    // Test connection
    const connected = await testConnection();
    if (!connected) {
      console.error("Failed to connect to database");
      process.exit(1);
    }

    // Run schema
    await runSchema();
  } catch (err) {
    console.error("Database initialization failed:", err);
    process.exit(1);
  }
}

async function startServer() {
  try {
    await initializeDatabase();
    app.listen(PORT, () => {
      console.log(`User Service is running on port ${PORT}`);
    });
  } catch (error) {
    console.error("Failed to start server:", error);
    process.exit(1);
  }
}

startServer();

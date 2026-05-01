const { Pool } = require("pg");
const fs = require("fs");
const path = require("path");

// Database connection
const pool = new Pool({
  host: process.env.DB_HOST || "localhost",
  user: process.env.DB_USER || "postgres",
  password: process.env.DB_PASSWORD || "password",
  database: process.env.DB_NAME || "wallet_db",
  port: process.env.DB_PORT || 5435,
});

// Function to run database schema
async function runSchema() {
  try {
    console.log("Running database schema...");

    // Read schema file
    const schemaPath = path.join(__dirname, "../database/schema.sql");
    const schema = fs.readFileSync(schemaPath, "utf8");

    // Execute schema
    await pool.query(schema);
    console.log("Database schema executed successfully");
  } catch (err) {
    console.error("Error running schema:", err);
    throw err;
  }
}

// Test database connection
async function testConnection() {
  try {
    const result = await pool.query("SELECT NOW()");
    console.log("Database connected successfully");
    return true;
  } catch (err) {
    console.error("Database connection error:", err);
    return false;
  }
}

module.exports = {
  pool,
  runSchema,
  testConnection,
};

const express = require("express");
const cors = require("cors");
const rateLimit = require("express-rate-limit");
const { createProxyMiddleware } = require("http-proxy-middleware");
require("dotenv").config();

// ─── Detect http-proxy-middleware version ────────────────────────────────────
let HPM_VERSION = 2;
try {
  const pkg = require("http-proxy-middleware/package.json");
  HPM_VERSION = Number.parseInt(pkg.version.split(".")[0], 10);
} catch (_) {}
console.log(`[Gateway] http-proxy-middleware v${HPM_VERSION}`);

// ─── App setup ───────────────────────────────────────────────────────────────
const app = express();
app.use(cors());


// ─── Configurable constants ─────────────────────────────────────────────────
const PORT = process.env.PORT || 3000;
const REQUEST_TIMEOUT_MS = Number.parseInt(
  process.env.REQUEST_TIMEOUT_MS || "8000",
  10,
);

// ─── Service URLs (with defaults) ─────────────────────────────────────────────
const USER_SERVICE_URL =
  process.env.USER_SERVICE_URL || "http://localhost:3003";
const HOTEL_SERVICE_URL =
  process.env.HOTEL_SERVICE_URL || "http://localhost:3002";
const WALLET_SERVICE_URL =
  process.env.WALLET_SERVICE_URL || "http://localhost:3005";
const BOOKING_SERVICE_URL =
  process.env.BOOKING_SERVICE_URL || "http://localhost:3001";

console.log("[Gateway] Service URLs:");
console.log("  USER   :", USER_SERVICE_URL);
console.log("  HOTEL  :", HOTEL_SERVICE_URL);
console.log("  WALLET :", WALLET_SERVICE_URL);
console.log("  BOOKING:", BOOKING_SERVICE_URL);

// ─── Rate limiter ────────────────────────────────────────────────────────────
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
});
app.use("/api", apiLimiter);

// ─── Health check ────────────────────────────────────────────────────────────
app.get("/", (req, res) =>
  res.json({ status: "API Gateway is running", port: PORT }),
);

// ─── Helper: fetch with timeout ──────────────────────────────────────────────
async function fetchJsonWithTimeout(url, options = {}) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
  try {
    console.log(`[Composition] → ${options.method || "GET"} ${url}`);
    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
    });
    const bodyText = await response.text();
    console.log(`[Composition] ← ${response.status} ${url}`);
    if (!response.ok) {
      throw new Error(`Upstream ${response.status}: ${bodyText}`);
    }
    try {
      return JSON.parse(bodyText);
    } catch {
      return bodyText;
    }
  } finally {
    clearTimeout(timeoutId);
  }
}

// ─── Auth guard helper ───────────────────────────────────────────────────────
function requireAuth(req, res) {
  const authHeader = req.headers.authorization;
  if (!authHeader) {
    res.status(401).json({ message: "Missing Authorization header" });
    return null;
  }
  return authHeader;
}

// ════════════════════════════════════════════════════════════════════════════
//  COMPOSITION ROUTES  ← must be registered BEFORE proxy middleware
// ════════════════════════════════════════════════════════════════════════════

const compositionRouter = express.Router();
compositionRouter.use(express.json()); // scoped only here — safe

// ── 1. GET /api/compositions/me ──────────────────────────────────────────────
// Returns authenticated user profile + wallet balance.
// Example: GET http://localhost:3000/api/compositions/me
//          Authorization: Bearer <token>
compositionRouter.get("/me", async (req, res) => {
  const authHeader = requireAuth(req, res);
  if (!authHeader) return;
  try {
    const headers = { authorization: authHeader };
    const [user, wallet] = await Promise.all([
      fetchJsonWithTimeout(`${USER_SERVICE_URL}/api/auth/me`, { headers }),
      fetchJsonWithTimeout(`${WALLET_SERVICE_URL}/api/balance`, { headers }),
    ]);
    return res.json({ user, wallet });
  } catch (err) {
    return res
      .status(502)
      .json({ message: "Composition /me failed", error: err.message });
  }
});

// ── 2. GET /api/compositions/dashboard ───────────────────────────────────────
// Returns user profile + wallet balance + all user bookings.
// Example: GET http://localhost:3000/api/compositions/dashboard
//          Authorization: Bearer <token>
compositionRouter.get("/dashboard", async (req, res) => {
  const authHeader = requireAuth(req, res);
  if (!authHeader) return;
  try {
    const headers = { authorization: authHeader };
    const [user, wallet, bookings] = await Promise.all([
      fetchJsonWithTimeout(`${USER_SERVICE_URL}/api/auth/me`, { headers }),
      fetchJsonWithTimeout(`${WALLET_SERVICE_URL}/api/balance`, { headers }),
      fetchJsonWithTimeout(`${BOOKING_SERVICE_URL}/api/bookings`, { headers }),
    ]);
    return res.json({ user, wallet, bookings });
  } catch (err) {
    return res
      .status(502)
      .json({ message: "Composition /dashboard failed", error: err.message });
  }
});

// ── 3. GET /api/compositions/bookings/:bookingId ──────────────────────────────
// Returns a single booking enriched with hotel + room details.
// Example: GET http://localhost:3000/api/compositions/bookings/42
//          Authorization: Bearer <token>
compositionRouter.get("/bookings/:bookingId", async (req, res) => {
  const authHeader = requireAuth(req, res);
  if (!authHeader) return;
  try {
    const headers = { authorization: authHeader };
    const { bookingId } = req.params;

    const bookingRes = await fetchJsonWithTimeout(
      `${BOOKING_SERVICE_URL}/api/bookings/${bookingId}`,
      { headers },
    );
    const booking = bookingRes?.data?.booking ?? bookingRes;

    const [hotelsRes, roomsRes] = await Promise.all([
      fetchJsonWithTimeout(`${HOTEL_SERVICE_URL}/api`, { headers }),
      fetchJsonWithTimeout(
        `${HOTEL_SERVICE_URL}/api/${booking.hotel_id}/rooms`,
        { headers },
      ),
    ]);

    const hotels = hotelsRes?.data?.hotels ?? hotelsRes;
    const rooms = roomsRes?.data?.rooms ?? roomsRes;

    const hotel = Array.isArray(hotels)
      ? hotels.find((h) => String(h.id) === String(booking.hotel_id))
      : null;
    const room = Array.isArray(rooms)
      ? rooms.find((r) => String(r.id) === String(booking.room_id))
      : null;

    return res.json({ booking, hotel, room });
  } catch (err) {
    return res.status(502).json({
      message: "Composition /bookings/:id failed",
      error: err.message,
    });
  }
});

// ── 4. GET /api/compositions/wallet/full ─────────────────────────────────────
// Returns wallet balance + full transaction history.
// Example: GET http://localhost:3000/api/compositions/wallet/full
//          Authorization: Bearer <token>
compositionRouter.get("/wallet/full", async (req, res) => {
  const authHeader = requireAuth(req, res);
  if (!authHeader) return;
  try {
    const headers = { authorization: authHeader };
    const [balance, transactions] = await Promise.all([
      fetchJsonWithTimeout(`${WALLET_SERVICE_URL}/api/balance`, { headers }),
      fetchJsonWithTimeout(`${WALLET_SERVICE_URL}/api/transactions`, {
        headers,
      }),
    ]);
    return res.json({ balance, transactions });
  } catch (err) {
    return res
      .status(502)
      .json({ message: "Composition /wallet/full failed", error: err.message });
  }
});

// ── 5. POST /api/compositions/book ───────────────────────────────────────────
// Creates a booking and returns it with the updated wallet balance.
// Example: POST http://localhost:3000/api/compositions/book
//          Authorization: Bearer <token>
//          Body: { "hotelId": 1, "roomId": 5, "amount": 150 }
compositionRouter.post("/book", async (req, res) => {
  const authHeader = requireAuth(req, res);
  if (!authHeader) return;
  try {
    const headers = {
      authorization: authHeader,
      "Content-Type": "application/json",
    };
    const booking = await fetchJsonWithTimeout(
      `${BOOKING_SERVICE_URL}/api/bookings`,
      {
        method: "POST",
        headers,
        body: JSON.stringify(req.body),
      },
    );
    const wallet = await fetchJsonWithTimeout(
      `${WALLET_SERVICE_URL}/api/balance`,
      { headers },
    );
    return res.status(201).json({ booking, wallet });
  } catch (err) {
    return res
      .status(502)
      .json({ message: "Composition /book failed", error: err.message });
  }
});

// ── 6. GET /api/compositions/hotels ──────────────────────────────────────────
// Returns all hotels with their rooms pre-fetched.
// Example: GET http://localhost:3000/api/compositions/hotels
//          Authorization: Bearer <token>
compositionRouter.get("/hotels", async (req, res) => {
  const authHeader = requireAuth(req, res);
  if (!authHeader) return;
  try {
    const headers = { authorization: authHeader };
    const hotelsRes = await fetchJsonWithTimeout(`${HOTEL_SERVICE_URL}/api`, {
      headers,
    });
    const hotels = hotelsRes?.data?.hotels ?? hotelsRes;

    if (!Array.isArray(hotels) || hotels.length === 0) {
      return res.json({ hotels: [] });
    }

    const hotelsWithRooms = await Promise.all(
      hotels.map(async (hotel) => {
        try {
          const roomsRes = await fetchJsonWithTimeout(
            `${HOTEL_SERVICE_URL}/api/${hotel.id}/rooms`,
            { headers },
          );
          const rooms = roomsRes?.data?.rooms ?? roomsRes;
          return { ...hotel, rooms: Array.isArray(rooms) ? rooms : [] };
        } catch {
          return { ...hotel, rooms: [] };
        }
      }),
    );

    return res.json({ hotels: hotelsWithRooms });
  } catch (err) {
    return res
      .status(502)
      .json({ message: "Composition /hotels failed", error: err.message });
  }
});

// Mount all composition routes
app.use("/api/compositions", compositionRouter);

//Function to create a proxy middleware with consistent logging and error handling
function makeProxy(target, pathRewrite) {
  const config = {
    target,
    changeOrigin: true,
    timeout: REQUEST_TIMEOUT_MS,
    proxyTimeout: REQUEST_TIMEOUT_MS,
  };

  if (pathRewrite) config.pathRewrite = pathRewrite;

  const onError = (err, req, res) => {
    console.error(`[Proxy] Error → ${target}: ${err.message}`);
    if (!res.headersSent) {
      res.status(502).json({ message: "Bad gateway", error: err.message });
    }
  };

  const onProxyReq = (proxyReq, req) => {
    console.log(`[Proxy] ${req.method} ${req.url} → ${target}`);
  };

  // v3 uses on.error / on.proxyReq; v2 uses onError / onProxyReq at top level
  if (HPM_VERSION >= 3) {
    config.on = { error: onError, proxyReq: onProxyReq };
  } else {
    config.onError = onError;
    config.onProxyReq = onProxyReq;
  }

  return createProxyMiddleware(config);
}

// /api/users/auth/signup   → USER_SERVICE /api/auth/signup
// /api/users/auth/login    → USER_SERVICE /api/auth/login
// /api/users/auth/me       → USER_SERVICE /api/auth/me
app.use(
  "/api/users",
  makeProxy(USER_SERVICE_URL, (path) => `/api${path}`),
);

// /api/hotels              → HOTEL_SERVICE /api
// /api/hotels/:id/rooms    → HOTEL_SERVICE /api/:id/rooms
app.use(
  "/api/hotels",
  makeProxy(HOTEL_SERVICE_URL, (path) => `/api${path}`),
);

// /api/wallet/balance      → WALLET_SERVICE /api/balance
// /api/wallet/load         → WALLET_SERVICE /api/load
// /api/wallet/withdraw     → WALLET_SERVICE /api/withdraw
// /api/wallet/transactions → WALLET_SERVICE /api/transactions
app.use(
  "/api/wallet",
  makeProxy(WALLET_SERVICE_URL, (path) => `/api${path}`),
);

// /api/bookings            → BOOKING_SERVICE /api/bookings
// /api/bookings/:id        → BOOKING_SERVICE /api/bookings/:id
// /api/bookings/:id/status → BOOKING_SERVICE /api/bookings/:id/status
app.use(
  "/api/bookings",
  makeProxy(BOOKING_SERVICE_URL, (path) => `/api/bookings${path}`),
);

// ─── 404 catch-all ───────────────────────────────────────────────────────────
app.use((req, res) => {
  res
    .status(404)
    .json({ message: `Route not found: ${req.method} ${req.url}` });
});

// ─── Start ───────────────────────────────────────────────────────────────────
const server = app.listen(PORT, () => {
  console.log(`\n✅ [Gateway] Running on http://localhost:${PORT}\n`);
  console.log("── Auth ──────────────────────────────────────────");
  console.log("  POST   /api/users/auth/signup");
  console.log("  POST   /api/users/auth/login");
  console.log("  GET    /api/users/auth/me");
  console.log("── Hotels ────────────────────────────────────────");
  console.log("  GET    /api/hotels");
  console.log("  POST   /api/hotels");
  console.log("  DELETE /api/hotels/:hotelId");
  console.log("  GET    /api/hotels/:hotelId/rooms");
  console.log("  POST   /api/hotels/rooms");
  console.log("  DELETE /api/hotels/:hotelId/rooms/:roomId");
  console.log("── Wallet ────────────────────────────────────────");
  console.log("  GET    /api/wallet/balance");
  console.log("  POST   /api/wallet/load");
  console.log("  POST   /api/wallet/withdraw");
  console.log("  GET    /api/wallet/transactions");
  console.log("── Bookings ──────────────────────────────────────");
  console.log("  POST   /api/bookings");
  console.log("  GET    /api/bookings");
  console.log("  GET    /api/bookings/:bookingId");
  console.log("  DELETE /api/bookings/:bookingId");
  console.log("  PUT    /api/bookings/:bookingId/status");
  console.log("── Compositions ──────────────────────────────────");
  console.log("  GET    /api/compositions/me");
  console.log("  GET    /api/compositions/dashboard");
  console.log("  GET    /api/compositions/bookings/:bookingId");
  console.log("  GET    /api/compositions/wallet/full");
  console.log("  POST   /api/compositions/book");
  console.log("  GET    /api/compositions/hotels");
  console.log("──────────────────────────────────────────────────\n");
});

server.requestTimeout = REQUEST_TIMEOUT_MS;
server.headersTimeout = REQUEST_TIMEOUT_MS + 1000;

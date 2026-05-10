// Middleware to authenticate internal service-to-service requests.
// Callers must include the header: x-internal-secret: <INTERNAL_SECRET>
const authenticateInternal = (req, res, next) => {
  const secret = req.headers["x-internal-secret"];
  if (!secret || secret !== process.env.INTERNAL_SECRET) {
    return res.status(403).json({ success: false, message: "Forbidden" });
  }

  console.log(
    `[authenticateInternal] Authorized internal request to ${req.method} ${req.originalUrl}`,
  );
  next();
};

module.exports = { authenticateInternal };

const serverless = require("serverless-http");
// server is located at the repository root `server/` folder; when this
// file lives under `client/api/index.js` we must go up two levels to reach it.
const app = require("../../server/server");
const { connectDB } = require("../../server/lib/db");

const handler = serverless(app);

module.exports = async (req, res) => {
  // Allow non-DB routes to work even if DB is misconfigured
  const path = (req.url || "").toLowerCase();
  const nonDbPaths = [
    "/",
    "/api",
    "/favicon.ico",
    "/api/favicon.ico",
    "/health",
    "/api/health",
  ];

  if (!nonDbPaths.includes(path)) {
    try {
      await connectDB();
    } catch (err) {
      console.error("DB connect failed:", err);
      // Continue to handler to allow consistent JSON error responses from routes
      // Some routes may still work without DB; those requiring DB will handle errors
    }
  }

  try {
    return await handler(req, res);
  } catch (err) {
    console.error("Serverless handler error:", err);
    try {
      res.statusCode = 500;
      res.setHeader("Content-Type", "application/json");
      return res.end(
        JSON.stringify({ status: "error", message: "Server error" })
      );
    } catch (writeErr) {
      // Fallback plain text if headers/body cannot be written
      res.statusCode = 500;
      return res.end("Internal Server Error");
    }
  }
};

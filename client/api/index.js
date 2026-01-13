const serverless = require("serverless-http");

// Lazily require the server code at runtime so that this file can load even
// if the repo layout differs in the deployment environment. Cache the
// handler after first successful require.
let cachedHandler = null;
let cachedConnectDB = null;

function buildFallbackApp(message) {
  const express = require("express");
  const a = express();
  a.get(["/", "/api"], (req, res) =>
    res.status(500).json({ status: "error", message })
  );
  a.all("/api/*", (req, res) =>
    res.status(500).json({ status: "error", message })
  );
  return a;
}

module.exports = async (req, res) => {
  try {
    if (!cachedHandler) {
      try {
        // server located at repo root 'server/' relative to this file (client/api)
        const app = require("../../server/server");
        try {
          const dbModule = require("../../server/lib/db");
          cachedConnectDB = dbModule.connectDB;
        } catch (dbErr) {
          // db may be missing in serverless deployments; keep going and let routes handle DB absence
          console.warn(
            "Warning: db module not available in serverless wrapper:",
            dbErr && dbErr.message
          );
        }
        cachedHandler = serverless(app);
      } catch (e) {
        console.error(
          "Failed to require server app:",
          e && e.stack ? e.stack : e
        );
        // Fallback app returns a clear JSON error so deploys don't crash at require time
        const fallback = buildFallbackApp(
          "Server code not found or failed to initialize. Check deployment bundle and logs."
        );
        cachedHandler = serverless(fallback);
      }
    }

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

    if (!nonDbPaths.includes(path) && cachedConnectDB) {
      try {
        await cachedConnectDB();
      } catch (err) {
        console.error("DB connect failed:", err && err.message);
        // Continue to handler to allow consistent JSON error responses from routes
      }
    }

    return await cachedHandler(req, res);
  } catch (err) {
    console.error(
      "Serverless handler error:",
      err && err.stack ? err.stack : err
    );
    try {
      res.statusCode = 500;
      res.setHeader("Content-Type", "application/json");
      return res.end(
        JSON.stringify({ status: "error", message: "Server error" })
      );
    } catch (writeErr) {
      res.statusCode = 500;
      return res.end("Internal Server Error");
    }
  }
};

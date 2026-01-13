// DEPRECATED: app.js removed in favor of server.js
// This file used to export an Express app. To avoid accidental usage
// while preserving build/deploy stability, we export a tiny fallback
// handler that returns 410 Gone and instructions.
const express = require("express");
const app = express();

app.use((req, res) => {
  res.status(410).json({
    status: "error",
    message:
      "server/app.js has been removed. Use server/server.js as the application entry point. If you see this, remove imports of server/app.js.",
  });
});

module.exports = app;

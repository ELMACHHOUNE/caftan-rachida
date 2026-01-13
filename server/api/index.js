// Serverless wrapper for Vercel/Netlify-style function deployments.
// Exports the Express app wrapped with serverless-http. Attempts a
// non-fatal DB connection during module init so importing the function
// doesn't crash if the DB env isn't set. Errors are logged for visibility.
const serverless = require("serverless-http");

// Import the Express app exported from server.js
const app = require("../server");
const { connectDB } = require("../lib/db");

// Try to connect to the database, but don't throw on failure so the
// function import won't crash. Errors are logged for visibility.
(async () => {
  try {
    if (process.env.MONGODB_URI) {
      // Never block the Vercel function on DB connect during cold starts.
      // If Mongo is slow/unreachable, awaiting here can trigger a 504 timeout.
      connectDB().catch((err) => {
        console.error("Non-fatal DB connect error in serverless wrapper:", err);
      });
      console.log("DB connection attempt started in serverless wrapper");
    } else {
      console.warn(
        "MONGODB_URI not set; skipping DB connection in serverless wrapper"
      );
    }
  } catch (err) {
    console.error("Non-fatal DB connect error in serverless wrapper:", err);
  }
})();

module.exports = serverless(app);

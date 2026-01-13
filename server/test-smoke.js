// Minimal smoke test to ensure the Express app and serverless handler can be imported
// without hanging (important for Vercel/serverless cold starts).
//
// Run: npm test

process.env.MONGODB_URI = process.env.MONGODB_URI || "";
process.env.JWT_SECRET = process.env.JWT_SECRET || "test";

const app = require("./server");

if (!app || typeof app !== "function") {
  console.error("Expected Express app export from ./server.js");
  process.exit(1);
}

console.log("OK: server.js exports an Express app");

// Also ensure the serverless entry can be required.
try {
  const handler = require("./api/index");
  if (!handler || typeof handler !== "function") {
    console.error("Expected serverless handler to be a function");
    process.exit(1);
  }
  console.log("OK: api/index.js exports a serverless handler");
} catch (e) {
  console.error("Failed to import serverless handler:", e);
  process.exit(1);
}

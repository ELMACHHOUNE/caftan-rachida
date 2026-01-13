const express = require("express");
const path = require("path");
const os = require("os");
const mongoose = require("mongoose");
const { connectDB } = require("./lib/db");
const cors = require("cors");
require("dotenv").config();

const app = express();

// Basic env validation to surface misconfiguration early
const requiredEnv = ["MONGODB_URI", "JWT_SECRET"];
const missingEnv = requiredEnv.filter((k) => !process.env[k]);
if (missingEnv.length) {
  console.warn(
    `Missing required environment variables: ${missingEnv.join(
      ", "
    )}. Some features may fail.`
  );
}

// Import routes
const authRoutes = require("./routes/auth");
const userRoutes = require("./routes/users");
const productRoutes = require("./routes/products");
const categoryRoutes = require("./routes/categories");
const orderRoutes = require("./routes/orders");
const settingsRoutes = require("./routes/settings");
const contactRoutes = require("./routes/contact");

// Import middleware
const errorHandler = require("./middleware/errorHandler");

// Security middleware and rate limiting removed for serverless compatibility

const allowedOriginsEnv =
  process.env.ALLOWED_ORIGINS || "http://localhost:3000";
const allowedOrigins = allowedOriginsEnv
  .split(",")
  .map((s) => s.trim())
  .filter(Boolean);
app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin || allowedOrigins.includes(origin)) {
        return callback(null, true);
      }
      return callback(new Error("Not allowed by CORS"));
    },
    credentials: true,
  })
);
// Preflight handler without wildcard path (Express 5)
app.use((req, res, next) => {
  if (req.method === "OPTIONS") {
    const origin = req.headers.origin;
    if (!origin || allowedOrigins.includes(origin)) {
      if (origin) res.header("Access-Control-Allow-Origin", origin);
      res.header("Access-Control-Allow-Credentials", "true");
      res.header("Access-Control-Allow-Methods", "GET,POST,PUT,PATCH,DELETE");
      res.header("Access-Control-Allow-Headers", "Content-Type, Authorization");
      return res.sendStatus(204);
    }
    return res.sendStatus(403);
  }
  next();
});

// Body parser middleware
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

// Serve uploaded files statically under /api/uploads and /uploads
// Use a writable path in serverless (e.g., /tmp) to avoid ENOENT
const isServerless =
  !!process.env.VERCEL || process.env.SERVERLESS_ENV === "true";
const uploadsPath = process.env.UPLOADS_DIR
  ? path.resolve(process.env.UPLOADS_DIR)
  : isServerless
  ? path.join(os.tmpdir(), "uploads")
  : path.join(__dirname, "uploads");

app.use(
  "/api/uploads",
  (req, res, next) => {
    res.setHeader("Cross-Origin-Resource-Policy", "cross-origin");
    next();
  },
  express.static(uploadsPath)
);
app.use(
  "/uploads",
  (req, res, next) => {
    res.setHeader("Cross-Origin-Resource-Policy", "cross-origin");
    next();
  },
  express.static(uploadsPath)
);

// Routes
// Support both '/api/*' for local/server use and '/*' for Vercel serverless mounted at /api
// Redirect helper: if someone visits '/products' (or other top-level api routes)
// without the '/api' prefix, forward them to the canonical '/api' path.
// This helps deployments where the function root differs from local expectations
// and keeps a single canonical set of handlers under '/api/*'.
app.use((req, res, next) => {
  try {
    // Only redirect GET requests for top-level resources
    if (req.method === "GET") {
      const m = req.path.match(/^\/(auth|users|products|categories|orders|settings|contact|uploads)(\/.*)?$/);
      if (m && !req.path.startsWith("/api/")) {
        return res.redirect(302, `/api${req.path}`);
      }
    }
  } catch (e) {
    // Ignore redirect errors and continue to normal routing
    console.error("Redirect middleware error:", e);
  }
  next();
});

app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/products", productRoutes);
app.use("/api/categories", categoryRoutes);
app.use("/api/orders", orderRoutes);
app.use("/api/settings", settingsRoutes);
app.use("/api/contact", contactRoutes);

app.use("/auth", authRoutes);
app.use("/users", userRoutes);
app.use("/products", productRoutes);
app.use("/categories", categoryRoutes);
app.use("/orders", orderRoutes);
app.use("/settings", settingsRoutes);
app.use("/contact", contactRoutes);

// Health check routes
app.get("/api/health", (req, res) => {
  const dbState = mongoose.connection?.readyState;
  const dbStatus =
    dbState === 1
      ? "connected"
      : dbState === 2
      ? "connecting"
      : dbState === 0
      ? "disconnected"
      : "disconnecting";
  res.status(200).json({
    status: "success",
    message: "Server is running!",
    db: dbStatus,
    hasMongoUri: !!process.env.MONGODB_URI,
    timestamp: new Date().toISOString(),
  });
});
app.get("/health", (req, res) => {
  res.status(200).json({
    status: "success",
    message: "Server is running! (root path)",
    timestamp: new Date().toISOString(),
  });
});

// Root API index to avoid 404/500 when hitting base function path on Vercel
app.get("/", (req, res) => {
  const base = req.baseUrl || "";
  res.status(200).json({
    status: "success",
    message: "API root",
    endpoints: {
      health: `${base}/health`,
      auth: `${base}/auth`,
      users: `${base}/users`,
      products: `${base}/products`,
      categories: `${base}/categories`,
      orders: `${base}/orders`,
      settings: `${base}/settings`,
      contact: `${base}/contact`,
      uploads: `${base}/uploads`,
    },
    timestamp: new Date().toISOString(),
  });
});

// Also respond on '/api' when the app isn't mounted (Vercel quirks)
app.get("/api", (req, res) => {
  const base = "";
  res.status(200).json({
    status: "success",
    message: "API root",
    endpoints: {
      health: `${base}/health`,
      auth: `${base}/auth`,
      users: `${base}/users`,
      products: `${base}/products`,
      categories: `${base}/categories`,
      orders: `${base}/orders`,
      settings: `${base}/settings`,
      contact: `${base}/contact`,
      uploads: `${base}/uploads`,
    },
    timestamp: new Date().toISOString(),
  });
});

// Favicon handler to prevent noisy errors in logs
app.get("/favicon.ico", (req, res) => res.status(204).end());
app.get("/api/favicon.ico", (req, res) => res.status(204).end());

// 404 handler (Express 5 compatible: no '*' wildcard)
app.use((req, res) => {
  res.status(404).json({
    status: "error",
    message: `Route ${req.originalUrl} not found`,
  });
});

// Error handling middleware (must be last)
app.use(errorHandler);

// Error handling for uncaught exceptions
process.on("uncaughtException", (err) => {
  console.error("Uncaught Exception:", err);
  console.error("Stack:", err.stack);
  process.exit(1);
});

process.on("unhandledRejection", (reason, promise) => {
  console.error("Unhandled Rejection at:", promise, "reason:", reason);
  process.exit(1);
});

// Database connection
if (require.main === module) {
  (async () => {
    try {
      await connectDB();
      // Default category auto-seeding removed. Categories must be created via the API or admin UI.

      const PORT = process.env.PORT || 5000;
      const server = app.listen(PORT, "0.0.0.0", () => {
        console.log(
          `Server running in ${process.env.NODE_ENV} mode on port ${PORT}`
        );
        // Prefer the non-prefixed base URL so frontends and local tooling can use http://localhost:PORT
        console.log(`Health endpoint: http://localhost:${PORT}/health`);
        console.log(`API base URL: http://localhost:${PORT}`);
      });
      server.on("error", (err) => {
        console.error("Server error:", err);
      });
    } catch (err) {
      console.error("Startup error:", err);
      process.exit(1);
    }
  })();
}

module.exports = app;

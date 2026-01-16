const express = require("express");
const path = require("path");
const os = require("os");
const mongoose = require("mongoose");
const { connectDB } = require("./lib/db");
const cors = require("cors");
require("dotenv").config();

const app = express();

// Ensure DB connection is attempted when the module is loaded (helps serverless
// environments where `require.main === module` is false). connectDB is idempotent
// and will no-op if already connected.
// In serverless, never block module init on DB connection.
// Cold starts + slow Mongo can otherwise hit Vercel's function timeout.
// We kick off a best-effort connection attempt in the background.
if (process.env.MONGODB_URI) {
  connectDB().catch((err) => {
    console.error("Non-fatal DB connect error at module init:", err);
  });
} else {
  console.warn("MONGODB_URI not present at module init; DB connect skipped");
}

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

// Models used for debug/status endpoints
const Category = require("./models/Category");
const Product = require("./models/Product");

// Import middleware
const errorHandler = require("./middleware/errorHandler");
// Ensure static uploads path matches multer storage
const { uploadsDir } = require("./middleware/upload");

// Security middleware and rate limiting removed for serverless compatibility

// Comma-separated list of allowed browser origins.
// Include localhost for dev and the deployed frontend domain for prod.
// You can override via ALLOWED_ORIGINS in Vercel.
const allowedOriginsEnv =
  process.env.ALLOWED_ORIGINS || "http://localhost:3000,https://caftan-rachida.vercel.app";
const allowedOrigins = allowedOriginsEnv
  .split(",")
  .map((s) => s.trim())
  .filter(Boolean);
// CORS
// Important: In browsers, CORS is enforced based on the *response headers*.
// If we reject an origin by throwing an error, Express will return an error
// response *without* CORS headers, and the browser will show:
// "No 'Access-Control-Allow-Origin' header is present".
//
// To make debugging sane and ensure consistent behavior, we:
// 1) Decide if the Origin is allowed.
// 2) If allowed, always set CORS headers.
// 3) For disallowed origins, respond 403 (still without ACAO, by design).
const isOriginAllowed = (origin) => !origin || allowedOrigins.includes(origin);

app.use((req, res, next) => {
  const origin = req.headers.origin;
  if (isOriginAllowed(origin)) {
    if (origin) res.setHeader("Access-Control-Allow-Origin", origin);
    res.setHeader("Vary", "Origin");
    res.setHeader("Access-Control-Allow-Credentials", "true");
  }
  next();
});

// Handle preflight requests early for all routes.
app.use((req, res, next) => {
  if (req.method !== "OPTIONS") return next();

  const origin = req.headers.origin;
  if (!isOriginAllowed(origin)) return res.sendStatus(403);

  if (origin) res.setHeader("Access-Control-Allow-Origin", origin);
  res.setHeader("Vary", "Origin");
  res.setHeader("Access-Control-Allow-Credentials", "true");
  res.setHeader(
    "Access-Control-Allow-Methods",
    "GET,POST,PUT,PATCH,DELETE,OPTIONS"
  );
  res.setHeader(
    "Access-Control-Allow-Headers",
    req.headers["access-control-request-headers"] ||
      "Content-Type, Authorization"
  );
  return res.sendStatus(204);
});

// Keep the cors() middleware for normal requests as well.
// Use a more robust CORS configuration for serverless environments
app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (like mobile apps or curl requests)
      if (!origin) return callback(null, true);
      
      // Check if the origin is in the allowed list
      if (isOriginAllowed(origin)) return callback(null, true);
      
      // Origin not allowed
      return callback(new Error('Not allowed by CORS'), false);
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
    exposedHeaders: ['Content-Length', 'Content-Range'],
    maxAge: 86400, // 24 hours
    preflightContinue: false,
    optionsSuccessStatus: 204,
  })
);

// Body parser middleware
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

// Serve uploaded files under /api/uploads and /uploads
// First try GridFS (persistent), then fall back to filesystem
const uploadsPath = uploadsDir;
const {
  openGridFSDownloadStream,
  detectContentType,
} = require("./lib/storage");

// GridFS streaming handler must come BEFORE express.static
app.get("/api/uploads/:filename", async (req, res, next) => {
  try {
    const { filename } = req.params;
    // If DB is not connected (cold start), immediately fall back to static/404
    if (mongoose.connection?.readyState !== 1) {
      return next();
    }

    const stream = openGridFSDownloadStream(filename);
    if (!stream) return next();

    res.setHeader("Cross-Origin-Resource-Policy", "cross-origin");
    res.setHeader("Cache-Control", "public, max-age=31536000, immutable");
    res.setHeader("Content-Type", detectContentType(filename));

    let responded = false;
    const failSafe = setTimeout(() => {
      if (!responded) {
        try {
          stream.destroy();
        } catch {}
        next();
      }
    }, Number(process.env.UPLOADS_STREAM_TIMEOUT_MS || 2000));

    stream.on("error", () => {
      clearTimeout(failSafe);
      next();
    });
    stream.on("close", () => {
      clearTimeout(failSafe);
      responded = true;
    });

    return stream.pipe(res);
  } catch (e) {
    return next();
  }
});

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

// Debug/status endpoint to inspect DB connection and collection counts.
// Keep this endpoint safe for now (no secrets) — useful during deploy troubleshooting.
app.get("/api/debug/status", async (req, res) => {
  try {
    const dbState = mongoose.connection?.readyState;
    const dbStatus =
      dbState === 1
        ? "connected"
        : dbState === 2
        ? "connecting"
        : dbState === 0
        ? "disconnected"
        : "disconnecting";

    const hasMongoUri = !!process.env.MONGODB_URI;

    let categoryCount = null;
    let productCount = null;
    let sampleCategory = null;
    let sampleProduct = null;

    try {
      categoryCount = await Category.countDocuments();
      productCount = await Product.countDocuments();
      sampleCategory = await Category.findOne().lean();
      sampleProduct = await Product.findOne().lean();
    } catch (e) {
      // ignore - counts may fail if DB not connected
    }

    res.json({
      status: "success",
      db: { status: dbStatus, hasMongoUri },
      counts: { categories: categoryCount, products: productCount },
      samples: { category: sampleCategory, product: sampleProduct },
      timestamp: new Date().toISOString(),
    });
  } catch (err) {
    console.error("Debug status error:", err);
    res.status(500).json({ status: "error", message: "Debug status failed" });
  }
});

// Debug endpoint to inspect the uploads directory contents.
// NOTE: On Vercel serverless, filesystem is ephemeral; files may disappear between invocations.
app.get("/api/debug/uploads", (req, res) => {
  try {
    const fs = require("fs");
    const files = fs.existsSync(uploadsPath) ? fs.readdirSync(uploadsPath) : [];
    res.json({
      status: "success",
      data: {
        uploadsPath,
        fileCount: files.length,
        files: files.slice(0, 50),
      },
    });
  } catch (error) {
    res
      .status(500)
      .json({ status: "error", message: "Failed to read uploads" });
  }
});

// Debug endpoint to check GridFS presence for a filename
app.get("/api/debug/gridfs/:filename", async (req, res) => {
  try {
    const { filename } = req.params;
    const state = mongoose.connection?.readyState;
    let present = false;
    let error = null;
    try {
      if (state === 1) {
        const stream = openGridFSDownloadStream(filename);
        if (stream) {
          stream.on("file", () => {
            present = true;
          });
          stream.on("error", () => {
            present = false;
          });
          // Destroy immediately; we only probe
          try {
            stream.destroy();
          } catch {}
        }
      }
    } catch (e) {
      error = e?.message || String(e);
    }
    res.json({
      status: "success",
      dbReadyState: state,
      present,
      error,
    });
  } catch (e) {
    res.status(500).json({ status: "error", message: "GridFS debug failed" });
  }
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
      const server = app.listen(PORT, () => {
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

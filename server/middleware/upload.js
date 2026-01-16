const multer = require("multer");
const path = require("path");
const fs = require("fs");
const os = require("os");

// Determine uploads directory (allow override via UPLOADS_DIR)
// IMPORTANT: Vercel/serverless environments have ephemeral filesystems.
// Use os.tmpdir() in serverless so static serving path matches server.js.
const isServerless =
  !!process.env.VERCEL || process.env.SERVERLESS_ENV === "true";
const uploadsDir = process.env.UPLOADS_DIR
  ? path.resolve(process.env.UPLOADS_DIR)
  : isServerless
  ? path.join(os.tmpdir(), "uploads")
  : path.join(__dirname, "..", "uploads");

// Ensure the uploads directory exists
try {
  fs.mkdirSync(uploadsDir, { recursive: true });
} catch (err) {
  // If creation fails, fall back to memory storage
  console.warn(
    "Failed to create uploads directory, falling back to memory storage:",
    err
  );
}

// Disk storage to save files under server/uploads
const storage = fs.existsSync(uploadsDir)
  ? multer.diskStorage({
      destination: function (req, file, cb) {
        cb(null, uploadsDir);
      },
      filename: function (req, file, cb) {
        // Use timestamp + original name (sanitized)
        const timestamp = Date.now();
        const safeName = (file.originalname || "upload").replace(
          /[^a-zA-Z0-9.-]/g,
          "-"
        );
        cb(null, `${timestamp}-${safeName}`);
      },
    })
  : multer.memoryStorage();

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 },
});

module.exports = { upload, uploadsDir };

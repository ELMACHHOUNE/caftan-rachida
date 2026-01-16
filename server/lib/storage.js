const path = require("path");
const fs = require("fs");
const mongoose = require("mongoose");
const { GridFSBucket } = require("mongodb");

function getBucket() {
  const db = mongoose.connection.db;
  if (!db) throw new Error("MongoDB not connected");
  // Use a named bucket to avoid collisions
  return new GridFSBucket(db, {
    bucketName: process.env.GRIDFS_BUCKET || "uploads",
  });
}

function detectContentType(filename) {
  const ext = (path.extname(filename) || "").toLowerCase();
  switch (ext) {
    case ".webp":
      return "image/webp";
    case ".jpg":
    case ".jpeg":
      return "image/jpeg";
    case ".png":
      return "image/png";
    case ".gif":
      return "image/gif";
    default:
      return "application/octet-stream";
  }
}

// Save an uploaded file into GridFS for persistence in serverless environments.
// Accepts either a file path (from multer diskStorage) or a Buffer (from memoryStorage).
async function saveToGridFS(filename, options = {}) {
  const bucket = getBucket();
  const contentType = options.contentType || detectContentType(filename);

  return new Promise((resolve, reject) => {
    let readStream;
    if (options.buffer && Buffer.isBuffer(options.buffer)) {
      readStream = require("stream").Readable.from(options.buffer);
    } else if (options.filePath) {
      try {
        readStream = fs.createReadStream(options.filePath);
      } catch (e) {
        return reject(e);
      }
    } else {
      return reject(new Error("saveToGridFS requires buffer or filePath"));
    }

    const uploadStream = bucket.openUploadStream(filename, {
      contentType,
      metadata: options.metadata || {},
    });

    readStream
      .on("error", (err) => reject(err))
      .pipe(uploadStream)
      .on("error", (err) => reject(err))
      .on("finish", () => resolve(uploadStream.id));
  });
}

// Open a readable stream from GridFS by filename.
function openGridFSDownloadStream(filename) {
  const bucket = getBucket();
  try {
    return bucket.openDownloadStreamByName(filename);
  } catch (e) {
    return null;
  }
}

module.exports = {
  saveToGridFS,
  openGridFSDownloadStream,
  detectContentType,
};

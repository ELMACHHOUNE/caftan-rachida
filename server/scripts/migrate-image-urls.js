/*
  Migrate old localhost upload URLs in MongoDB to the current server base.

  Why:
  - Some records may have image URLs like: http://localhost:5000/uploads/<file>
  - When deployed, those URLs should be: https://<your-server-domain>/api/uploads/<file>

  Usage (PowerShell):
    cd server
    $env:MONGODB_URI='...'
    $env:SERVER_PUBLIC_BASE_URL='https://caftan-server.vercel.app'
    node scripts/migrate-image-urls.js

  Notes:
  - This updates Product.images[].url and Category.image.url when they start with http://localhost:5000/uploads/
*/

const mongoose = require("mongoose");
const Product = require("../models/Product");
const Category = require("../models/Category");

const MONGODB_URI = process.env.MONGODB_URI;
const SERVER_PUBLIC_BASE_URL = (
  process.env.SERVER_PUBLIC_BASE_URL || ""
).replace(/\/+$/, "");

if (!MONGODB_URI) {
  console.error("Missing MONGODB_URI");
  process.exit(1);
}

if (!SERVER_PUBLIC_BASE_URL) {
  console.error(
    "Missing SERVER_PUBLIC_BASE_URL (example: https://caftan-server.vercel.app)"
  );
  process.exit(1);
}

const FROM_PREFIX = "http://localhost:5000/uploads/";
const TO_PREFIX = `${SERVER_PUBLIC_BASE_URL}/api/uploads/`;

function mapUrl(url) {
  if (typeof url !== "string") return url;
  if (url.startsWith(FROM_PREFIX)) {
    return TO_PREFIX + url.slice(FROM_PREFIX.length);
  }
  return url;
}

(async () => {
  await mongoose.connect(MONGODB_URI);

  let updatedProducts = 0;
  let updatedCategories = 0;

  const products = await Product.find({
    "images.url": { $regex: "^http://localhost:5000/uploads/" },
  });
  for (const p of products) {
    let changed = false;
    p.images = (p.images || []).map((img) => {
      const next = { ...img };
      next.url = mapUrl(next.url);
      if (next.url !== img.url) changed = true;
      return next;
    });
    if (changed) {
      await p.save();
      updatedProducts++;
    }
  }

  const categories = await Category.find({
    "image.url": { $regex: "^http://localhost:5000/uploads/" },
  });
  for (const c of categories) {
    if (c.image && typeof c.image.url === "string") {
      const next = mapUrl(c.image.url);
      if (next !== c.image.url) {
        c.image.url = next;
        await c.save();
        updatedCategories++;
      }
    }
  }

  console.log("Done. Updated:", {
    updatedProducts,
    updatedCategories,
    toPrefix: TO_PREFIX,
  });
  await mongoose.disconnect();
})().catch((err) => {
  console.error(err);
  process.exit(1);
});

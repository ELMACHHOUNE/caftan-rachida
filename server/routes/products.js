const express = require("express");
const { body, validationResult, query } = require("express-validator");
const mongoose = require("mongoose");
const Product = require("../models/Product");
const Category = require("../models/Category");
// local file uploads handled via multer diskStorage (middleware/upload.js)
const { auth, admin, optionalAuth } = require("../middleware/auth");
const { upload, uploadsDir } = require("../middleware/upload");
const fs = require("fs");
const path = require("path");

const router = express.Router();

// Helper to log errors with stack and request context for easier debugging in
// production deployments.
function logRouteError(label, err, req) {
  try {
    console.error(`${label}:`, err && err.message ? err.message : err);
    if (err && err.stack) console.error(err.stack);
    if (req)
      console.error("Request:", {
        method: req.method,
        path: req.originalUrl,
        query: req.query,
      });
  } catch (e) {
    console.error("Failed to log error:", e);
  }
}
// @desc    Get all products
// @route   GET /api/products
// @access  Public
router.get(
  "/",
  [
    query("page")
      .optional()
      .isInt({ min: 1 })
      .withMessage("Page must be a positive integer"),
    query("limit")
      .optional()
      .isInt({ min: 1, max: 50 })
      .withMessage("Limit must be between 1 and 50"),
    query("search")
      .optional()
      .trim()
      .isLength({ max: 100 })
      .withMessage("Search term cannot exceed 100 characters"),
    query("minPrice")
      .optional()
      .isFloat({ min: 0 })
      .withMessage("Minimum price must be a positive number"),
    query("maxPrice")
      .optional()
      .isFloat({ min: 0 })
      .withMessage("Maximum price must be a positive number"),
  ],
  async (req, res) => {
    try {
      // Check for validation errors
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          status: "error",
          message: "Validation failed",
          errors: errors.array(),
        });
      }

      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 12;
      const search = req.query.search || "";
      const category = req.query.category;
      const featured = req.query.featured;
      const onSale = req.query.onSale;
      const minPrice = parseFloat(req.query.minPrice);
      const maxPrice = parseFloat(req.query.maxPrice);
      const sortBy = req.query.sortBy || "createdAt";
      const sortOrder = req.query.sortOrder === "asc" ? 1 : -1;

      // Build query
      let query = { isActive: true };

      if (search) {
        query.$text = { $search: search };
      }

      if (category) {
        query.category = category;
      }

      if (featured === "true") {
        query.featured = true;
      }

      if (onSale === "true") {
        query.onSale = true;
      }

      if (minPrice || maxPrice) {
        query.price = {};
        if (minPrice) query.price.$gte = minPrice;
        if (maxPrice) query.price.$lte = maxPrice;
      }

      // Calculate skip value
      const skip = (page - 1) * limit;

      // Build sort object
      let sort = {};
      if (search && !req.query.sortBy) {
        sort = { score: { $meta: "textScore" } };
      } else {
        sort[sortBy] = sortOrder;
      }

      // Get products + total count in parallel.
      // Using .lean() is a big win on serverless (skips Mongoose document hydration).
      const [products, totalProducts] = await Promise.all([
        Product.find(query)
          .populate("category", "name slug")
          .populate("createdBy", "name")
          .sort(sort)
          .skip(skip)
          .limit(limit)
          .lean(),
        Product.countDocuments(query),
      ]);
      const totalPages = Math.ceil(totalProducts / limit);

      res.json({
        status: "success",
        data: {
          products,
          pagination: {
            currentPage: page,
            totalPages,
            totalProducts,
            hasNext: page < totalPages,
            hasPrev: page > 1,
          },
        },
      });
    } catch (error) {
      logRouteError("Get products error", error, req);
      res.status(500).json({
        status: "error",
        message: "Server error",
      });
    }
  }
);

// @desc    Get featured products
// @route   GET /api/products/featured/list
// @access  Public
router.get("/featured/list", async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 8;

    const products = await Product.find({
      featured: true,
      isActive: true,
    })
      .populate("category", "name slug")
      .sort({ createdAt: -1 })
      .limit(limit)
      .lean();

    res.json({
      status: "success",
      data: { products },
    });
  } catch (error) {
    logRouteError("Get featured products error", error, req);
    res.status(500).json({
      status: "error",
      message: "Server error",
    });
  }
});

// @desc    Get single product
// @route   GET /api/products/:id
// @access  Public
router.get("/:id", async (req, res) => {
  try {
    if (!req.params.id || !mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({
        status: "error",
        message: "Invalid product id",
      });
    }
    const product = await Product.findById(req.params.id)
      .populate("category", "name slug description")
      .populate("createdBy", "name")
      .populate("reviews.user", "name avatar")
      .lean();

    if (!product) {
      return res.status(404).json({
        status: "error",
        message: "Product not found",
      });
    }

    if (!product.isActive) {
      return res.status(404).json({
        status: "error",
        message: "Product not available",
      });
    }

    res.json({
      status: "success",
      data: { product },
    });
  } catch (error) {
    logRouteError("Get product error", error, req);
    res.status(500).json({
      status: "error",
      message: "Server error",
    });
  }
});

// @desc    Create new product
// @route   POST /api/products
// @access  Private/Admin
router.post(
  "/",
  [auth, admin, upload.single("image")],
  [
    body("name")
      .trim()
      .isLength({ min: 2, max: 100 })
      .withMessage("Product name must be between 2 and 100 characters"),
    body("description")
      .trim()
      .isLength({ min: 10, max: 1000 })
      .withMessage("Description must be between 10 and 1000 characters"),
    body("price")
      .isFloat({ min: 0 })
      .withMessage("Price must be a positive number"),
    body("category")
      .isMongoId()
      .withMessage("Please provide a valid category ID"),
    body("stock")
      .isInt({ min: 0 })
      .withMessage("Stock must be a non-negative integer"),
  ],
  async (req, res) => {
    try {
      // Check for validation errors
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          status: "error",
          message: "Validation failed",
          errors: errors.array(),
        });
      }

      // Check if category exists
      const category = await Category.findById(req.body.category);
      if (!category) {
        return res.status(400).json({
          status: "error",
          message: "Category not found",
        });
      }

      const body = req.body;
      // If file uploaded, multer will have stored the file on disk
      // If memory storage was used (no filename), write buffer to disk
      if (req.file) {
        let filename = req.file.filename;
        if (!filename && req.file.buffer) {
          const timestamp = Date.now();
          const safeName = (req.file.originalname || "upload").replace(
            /[^a-zA-Z0-9.-]/g,
            "-"
          );
          filename = `${timestamp}-${safeName}`;
          try {
            fs.writeFileSync(path.join(uploadsDir, filename), req.file.buffer);
          } catch (writeErr) {
            console.error("Failed to write uploaded file to disk:", writeErr);
            filename = null;
          }
        }

        if (filename) {
          // Persist a copy to GridFS so it survives serverless cold starts
          try {
            const { saveToGridFS } = require("../lib/storage");
            const filePath =
              req.file.path && fs.existsSync(req.file.path)
                ? req.file.path
                : null;
            await saveToGridFS(filename, {
              filePath,
              buffer: !filePath ? req.file.buffer : undefined,
              contentType: req.file.mimetype,
              metadata: { model: "Product", field: "images" },
            });
          } catch (gridErr) {
            console.warn(
              "GridFS persist failed (continuing with URL):",
              gridErr?.message || gridErr
            );
          }

          const base = `${req.protocol}://${req.get("host")}`;
          body.images = [
            {
              url: `${base}/api/uploads/${filename}`,
              public_id: null,
              alt: req.body.imageAlt || body.name,
            },
          ];
        }
      }

      // Create product
      const product = new Product({
        ...body,
        createdBy: req.user.id,
      });

      await product.save();

      // Populate the response
      await product.populate("category", "name slug");
      await product.populate("createdBy", "name");

      res.status(201).json({
        status: "success",
        message: "Product created successfully",
        data: { product },
      });
    } catch (error) {
      logRouteError("Create product error", error, req);
      res.status(500).json({
        status: "error",
        message: "Server error",
      });
    }
  }
);

// @desc    Update product
// @route   PUT /api/products/:id
// @access  Private/Admin
router.put(
  "/:id",
  [auth, admin, upload.single("image")],
  [
    body("name")
      .optional()
      .trim()
      .isLength({ min: 2, max: 100 })
      .withMessage("Product name must be between 2 and 100 characters"),
    body("description")
      .optional()
      .trim()
      .isLength({ min: 10, max: 1000 })
      .withMessage("Description must be between 10 and 1000 characters"),
    body("price")
      .optional()
      .isFloat({ min: 0 })
      .withMessage("Price must be a positive number"),
    body("category")
      .optional()
      .isMongoId()
      .withMessage("Please provide a valid category ID"),
    body("stock")
      .optional()
      .isInt({ min: 0 })
      .withMessage("Stock must be a non-negative integer"),
  ],
  async (req, res) => {
    try {
      // Check for validation errors
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          status: "error",
          message: "Validation failed",
          errors: errors.array(),
        });
      }

      // Check if category exists (if updating category)
      if (req.body.category) {
        const category = await Category.findById(req.body.category);
        if (!category) {
          return res.status(400).json({
            status: "error",
            message: "Category not found",
          });
        }
      }

      const updateData = { ...req.body };
      if (req.file) {
        let filename = req.file.filename;
        if (!filename && req.file.buffer) {
          const timestamp = Date.now();
          const safeName = (req.file.originalname || "upload").replace(
            /[^a-zA-Z0-9.-]/g,
            "-"
          );
          filename = `${timestamp}-${safeName}`;
          try {
            fs.writeFileSync(path.join(uploadsDir, filename), req.file.buffer);
          } catch (writeErr) {
            console.error(
              "Failed to write uploaded file to disk (update):",
              writeErr
            );
            filename = null;
          }
        }

        if (filename) {
          const base = `${req.protocol}://${req.get("host")}`;
          updateData.images = [
            {
              url: `${base}/api/uploads/${filename}`,
              public_id: null,
              alt: req.body.imageAlt || updateData.name,
            },
          ];
        }
      }

      const product = await Product.findByIdAndUpdate(
        req.params.id,
        updateData,
        { new: true, runValidators: true }
      )
        .populate("category", "name slug")
        .populate("createdBy", "name");

      if (!product) {
        return res.status(404).json({
          status: "error",
          message: "Product not found",
        });
      }

      res.json({
        status: "success",
        message: "Product updated successfully",
        data: { product },
      });
    } catch (error) {
      logRouteError("Update product error", error, req);
      res.status(500).json({
        status: "error",
        message: "Server error",
      });
    }
  }
);

// @desc    Delete product
// @route   DELETE /api/products/:id
// @access  Private/Admin
router.delete("/:id", [auth, admin], async (req, res) => {
  try {
    const product = await Product.findByIdAndDelete(req.params.id);

    if (!product) {
      return res.status(404).json({
        status: "error",
        message: "Product not found",
      });
    }

    res.json({
      status: "success",
      message: "Product deleted successfully",
    });
  } catch (error) {
    logRouteError("Delete product error", error, req);
    res.status(500).json({
      status: "error",
      message: "Server error",
    });
  }
});

// @desc    Add product review
// @route   POST /api/products/:id/reviews
// @access  Private
router.post(
  "/:id/reviews",
  auth,
  [
    body("rating")
      .isInt({ min: 1, max: 5 })
      .withMessage("Rating must be between 1 and 5"),
    body("comment")
      .trim()
      .isLength({ min: 5, max: 500 })
      .withMessage("Comment must be between 5 and 500 characters"),
  ],
  async (req, res) => {
    try {
      // Check for validation errors
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          status: "error",
          message: "Validation failed",
          errors: errors.array(),
        });
      }

      const { rating, comment } = req.body;

      const product = await Product.findById(req.params.id);

      if (!product) {
        return res.status(404).json({
          status: "error",
          message: "Product not found",
        });
      }

      // Check if user already reviewed this product
      const existingReview = product.reviews.find(
        (review) => review.user.toString() === req.user.id
      );

      if (existingReview) {
        return res.status(400).json({
          status: "error",
          message: "You have already reviewed this product",
        });
      }

      // Add review
      product.reviews.push({
        user: req.user.id,
        rating,
        comment,
      });

      // Update ratings
      product.updateRatings();

      await product.save();

      // Populate the new review
      await product.populate("reviews.user", "name avatar");

      res.status(201).json({
        status: "success",
        message: "Review added successfully",
        data: {
          review: product.reviews[product.reviews.length - 1],
          ratings: product.ratings,
        },
      });
    } catch (error) {
      logRouteError("Add review error", error, req);
      res.status(500).json({
        status: "error",
        message: "Server error",
      });
    }
  }
);

module.exports = router;

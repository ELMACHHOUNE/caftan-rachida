const express = require("express");
const { body, validationResult, query } = require("express-validator");
const Category = require("../models/Category");
const Product = require("../models/Product");
const { auth, admin } = require("../middleware/auth");
const { upload, uploadsDir } = require("../middleware/upload");
const fs = require("fs");
const path = require("path");

const router = express.Router();

// Ensure default categories exist when none are present (useful on serverless deploys)
async function ensureDefaultCategories() {
  const count = await Category.countDocuments();
  if (count > 0) return;
  const defaults = [
    {
      name: "Caftan",
      description: "Traditional caftan collection",
      isActive: true,
      sortOrder: 1,
    },
    {
      name: "Dresses",
      description: "Elegant dresses collection",
      isActive: true,
      sortOrder: 2,
    },
  ];
  for (const def of defaults) {
    const existing = await Category.findOne({
      name: new RegExp(`^${def.name}$`, "i"),
    });
    if (!existing) {
      await Category.create(def);
    }
  }
}

// @desc    Get all categories
// @route   GET /api/categories
// @access  Public
router.get(
  "/",
  [
    query("includeInactive")
      .optional()
      .isBoolean()
      .withMessage("includeInactive must be a boolean"),
  ],
  async (req, res) => {
    try {
      console.log("GET /api/categories called", {
        includeInactive: req.query.includeInactive,
      });
      // Seed defaults if empty
      try {
        await ensureDefaultCategories();
      } catch (_) {}
      const includeInactive = req.query.includeInactive === "true";

      // Build query
      let query = {};
      if (!includeInactive) {
        query.isActive = true;
      }

      const categories = await Category.find(query)
        .populate("parentCategory", "name slug")
        .populate("subcategories", "name slug")
        .sort({ sortOrder: 1, name: 1 });

      return res.json({
        status: "success",
        data: { categories },
      });
    } catch (error) {
      console.error("Get categories error:", error);
      try {
        // Soft fallback to keep UI functional; returns empty list
        console.warn("Returning empty categories due to error");
        return res.json({ status: "success", data: { categories: [] } });
      } catch (_) {
        return res
          .status(500)
          .json({ status: "error", message: "Server error" });
      }
    }
  }
);

// @desc    Get category tree structure
// @route   GET /api/categories/tree
// @access  Public
router.get("/tree", async (req, res) => {
  try {
    // Get all active categories
    const categories = await Category.find({ isActive: true }).sort({
      sortOrder: 1,
      name: 1,
    });

    // Build tree structure
    const categoryTree = [];
    const categoryMap = new Map();

    // First pass: Create map of all categories
    categories.forEach((category) => {
      categoryMap.set(category._id.toString(), {
        ...category.toObject(),
        children: [],
      });
    });

    // Second pass: Build tree structure
    categories.forEach((category) => {
      const categoryObj = categoryMap.get(category._id.toString());

      if (category.parentCategory) {
        const parent = categoryMap.get(category.parentCategory.toString());
        if (parent) {
          parent.children.push(categoryObj);
        }
      } else {
        categoryTree.push(categoryObj);
      }
    });

    res.json({
      status: "success",
      data: { categories: categoryTree },
    });
  } catch (error) {
    console.error("Get category tree error:", error);
    res.status(500).json({
      status: "error",
      message: "Server error",
    });
  }
});

// @desc    Get single category
// @route   GET /api/categories/:id
// @access  Public
router.get("/:id", async (req, res) => {
  try {
    const category = await Category.findById(req.params.id)
      .populate("parentCategory", "name slug")
      .populate("subcategories", "name slug description image");

    if (!category) {
      return res.status(404).json({
        status: "error",
        message: "Category not found",
      });
    }

    // Get products count for this category
    const productCount = await Product.countDocuments({
      category: category._id,
      isActive: true,
    });

    res.json({
      status: "success",
      data: {
        category: {
          ...category.toObject(),
          productCount,
        },
      },
    });
  } catch (error) {
    console.error("Get category error:", error);
    res.status(500).json({
      status: "error",
      message: "Server error",
    });
  }
});

// @desc    Create new category
// @route   POST /api/categories
// @access  Private/Admin
const createValidators = [
  body("name")
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage("Category name must be between 2 and 50 characters"),
  body("description")
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage("Description cannot exceed 500 characters"),
  body("parentCategory")
    .optional({ checkFalsy: true })
    .isMongoId()
    .withMessage("Please provide a valid parent category ID"),
  body("sortOrder")
    .optional({ checkFalsy: true })
    .isInt({ min: 0 })
    .toInt()
    .withMessage("Sort order must be a non-negative integer"),
];

router.post(
  "/",
  auth,
  admin,
  upload.single("image"),
  ...createValidators,
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

      const { name, parentCategory } = req.body;

      // Check if category name already exists
      const existingCategory = await Category.findOne({
        name: new RegExp(`^${name}$`, "i"),
      });
      if (existingCategory) {
        return res.status(400).json({
          status: "error",
          message: "Category with this name already exists",
        });
      }

      // Check if parent category exists (if provided)
      if (parentCategory) {
        const parent = await Category.findById(parentCategory);
        if (!parent) {
          return res.status(400).json({
            status: "error",
            message: "Parent category not found",
          });
        }
      }

      const body = req.body;
      // If a file was uploaded, save its public URL path for clients to fetch
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
              "Failed to write uploaded category file to disk:",
              writeErr
            );
            filename = null;
          }
        }

        if (filename) {
          const base = `${req.protocol}://${req.get("host")}`;
          body.image = {
            url: `${base}/uploads/${filename}`,
            public_id: null,
            alt: body.name,
          };
        }
      }

      // Create category
      const category = new Category(body);
      await category.save();

      // If this is a subcategory, add it to parent's subcategories array
      if (parentCategory) {
        await Category.findByIdAndUpdate(parentCategory, {
          $push: { subcategories: category._id },
        });
      }

      // Populate the response
      await category.populate("parentCategory", "name slug");

      res.status(201).json({
        status: "success",
        message: "Category created successfully",
        data: { category },
      });
    } catch (error) {
      console.error("Create category error:", error);
      res.status(500).json({
        status: "error",
        message: error?.message || "Server error",
      });
    }
  }
);

// @desc    Update category
// @route   PUT /api/categories/:id
// @access  Private/Admin
const updateValidators = [
  body("name")
    .optional()
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage("Category name must be between 2 and 50 characters"),
  body("description")
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage("Description cannot exceed 500 characters"),
  body("parentCategory")
    .optional({ checkFalsy: true })
    .isMongoId()
    .withMessage("Please provide a valid parent category ID"),
  body("sortOrder")
    .optional({ checkFalsy: true })
    .isInt({ min: 0 })
    .toInt()
    .withMessage("Sort order must be a non-negative integer"),
  body("isActive")
    .optional()
    .isBoolean()
    .withMessage("isActive must be a boolean"),
];

router.put(
  "/:id",
  auth,
  admin,
  upload.single("image"),
  ...updateValidators,
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

      const { name, parentCategory } = req.body;

      // Find category
      const category = await Category.findById(req.params.id);
      if (!category) {
        return res.status(404).json({
          status: "error",
          message: "Category not found",
        });
      }

      // Check if name already exists (if updating name)
      if (name && name !== category.name) {
        const existingCategory = await Category.findOne({
          name: new RegExp(`^${name}$`, "i"),
          _id: { $ne: req.params.id },
        });
        if (existingCategory) {
          return res.status(400).json({
            status: "error",
            message: "Category with this name already exists",
          });
        }
      }

      // Check if parent category exists (if updating parent)
      if (
        parentCategory &&
        parentCategory !== category.parentCategory?.toString()
      ) {
        const parent = await Category.findById(parentCategory);
        if (!parent) {
          return res.status(400).json({
            status: "error",
            message: "Parent category not found",
          });
        }

        // Prevent circular reference
        if (parentCategory === req.params.id) {
          return res.status(400).json({
            status: "error",
            message: "A category cannot be its own parent",
          });
        }
      }

      // Update category
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
              "Failed to write uploaded category file to disk (update):",
              writeErr
            );
            filename = null;
          }
        }

        if (filename) {
          const base = `${req.protocol}://${req.get("host")}`;
          updateData.image = {
            url: `${base}/uploads/${filename}`,
            public_id: null,
            alt: updateData.name,
          };
        }
      }

      const updatedCategory = await Category.findByIdAndUpdate(
        req.params.id,
        updateData,
        { new: true, runValidators: true }
      )
        .populate("parentCategory", "name slug")
        .populate("subcategories", "name slug");

      res.json({
        status: "success",
        message: "Category updated successfully",
        data: { category: updatedCategory },
      });
    } catch (error) {
      console.error("Update category error:", error);
      res.status(500).json({
        status: "error",
        message: error?.message || "Server error",
      });
    }
  }
);

// @desc    Delete category
// @route   DELETE /api/categories/:id
// @access  Private/Admin
router.delete("/:id", [auth, admin], async (req, res) => {
  try {
    const category = await Category.findById(req.params.id);

    if (!category) {
      return res.status(404).json({
        status: "error",
        message: "Category not found",
      });
    }

    // Check if category has products
    const productCount = await Product.countDocuments({
      category: req.params.id,
    });
    if (productCount > 0) {
      return res.status(400).json({
        status: "error",
        message: `Cannot delete category. It has ${productCount} product(s) associated with it.`,
      });
    }

    // Check if category has subcategories
    const subcategoryCount = await Category.countDocuments({
      parentCategory: req.params.id,
    });
    if (subcategoryCount > 0) {
      return res.status(400).json({
        status: "error",
        message: `Cannot delete category. It has ${subcategoryCount} subcategory(ies).`,
      });
    }

    // Remove from parent's subcategories array if it has a parent
    if (category.parentCategory) {
      await Category.findByIdAndUpdate(category.parentCategory, {
        $pull: { subcategories: req.params.id },
      });
    }

    await Category.findByIdAndDelete(req.params.id);

    res.json({
      status: "success",
      message: "Category deleted successfully",
    });
  } catch (error) {
    console.error("Delete category error:", error);
    res.status(500).json({
      status: "error",
      message: "Server error",
    });
  }
});

// @desc    Get categories with product counts
// @route   GET /api/categories/with-counts
// @access  Public
router.get("/with-counts", async (req, res) => {
  try {
    try {
      await ensureDefaultCategories();
    } catch (_) {}
    const categories = await Category.aggregate([
      { $match: { isActive: true } },
      {
        $lookup: {
          from: "products",
          localField: "_id",
          foreignField: "category",
          as: "products",
        },
      },
      {
        $addFields: {
          productCount: {
            $size: {
              $filter: {
                input: "$products",
                as: "product",
                cond: { $eq: ["$$product.isActive", true] },
              },
            },
          },
        },
      },
      { $project: { products: 0 } },
      { $sort: { sortOrder: 1, name: 1 } },
    ]);

    return res.json({ status: "success", data: { categories } });
  } catch (error) {
    console.error("Get categories with counts error:", error);
    // Fallback: return active categories without counts to avoid UI-breaking 500s
    try {
      const list = await Category.find({ isActive: true })
        .sort({ sortOrder: 1, name: 1 })
        .lean();
      const categories = list.map((c) => ({ ...c, productCount: 0 }));
      return res.json({ status: "success", data: { categories } });
    } catch (fallbackErr) {
      console.error("Categories fallback failed:", fallbackErr);
      return res.status(500).json({ status: "error", message: "Server error" });
    }
  }
});

module.exports = router;

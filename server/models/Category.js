const mongoose = require("mongoose");

const categorySchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, "Please provide a category name"],
    unique: true,
    trim: true,
    maxlength: [50, "Category name cannot exceed 50 characters"],
  },
  slug: {
    type: String,
    unique: true,
    lowercase: true,
  },
  description: {
    type: String,
    maxlength: [500, "Description cannot exceed 500 characters"],
  },
  image: {
    url: String,
    public_id: String,
    alt: String,
  },
  parentCategory: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Category",
    default: null,
  },
  subcategories: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Category",
    },
  ],
  isActive: {
    type: Boolean,
    default: true,
  },
  sortOrder: {
    type: Number,
    default: 0,
  },
  metaTitle: {
    type: String,
    maxlength: [60, "Meta title cannot exceed 60 characters"],
  },
  metaDescription: {
    type: String,
    maxlength: [160, "Meta description cannot exceed 160 characters"],
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
});

// Generate slug from name before saving
// Use synchronous pre hook (no `next` callback) to avoid incompatible middleware signatures
categorySchema.pre("save", function () {
  if (this.isModified("name")) {
    this.slug = this.name
      .toLowerCase()
      .replace(/[^a-zA-Z0-9]/g, "-")
      .replace(/--+/g, "-")
      .replace(/^-|-$/g, "");
  }
  this.updatedAt = Date.now();
});

// Populate subcategories
categorySchema.virtual("populatedSubcategories", {
  ref: "Category",
  localField: "_id",
  foreignField: "parentCategory",
});

// Method to get full category path
categorySchema.methods.getPath = async function () {
  let path = [this.name];
  let current = this;

  while (current.parentCategory) {
    current = await this.constructor.findById(current.parentCategory);
    if (current) {
      path.unshift(current.name);
    } else {
      break;
    }
  }

  return path.join(" > ");
};

module.exports = mongoose.model("Category", categorySchema);

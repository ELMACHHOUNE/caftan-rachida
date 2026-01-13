const mongoose = require("mongoose");

const productSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, "Please provide a product name"],
    trim: true,
    maxlength: [100, "Product name cannot exceed 100 characters"],
  },
  description: {
    type: String,
    required: [true, "Please provide a product description"],
    maxlength: [1000, "Description cannot exceed 1000 characters"],
  },
  price: {
    type: Number,
    required: [true, "Please provide a price"],
    min: [0, "Price cannot be negative"],
  },
  originalPrice: {
    type: Number,
    min: [0, "Original price cannot be negative"],
  },
  category: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Category",
    required: [true, "Please select a category"],
  },
  subcategory: {
    type: String,
    trim: true,
  },
  brand: {
    type: String,
    trim: true,
  },
  images: [
    {
      url: {
        type: String,
        required: true,
      },
      public_id: String,
      alt: String,
    },
  ],
  colors: [
    {
      name: String,
      value: String,
      image: String,
    },
  ],
  sizes: [
    {
      name: String,
      value: String,
      stock: {
        type: Number,
        default: 0,
      },
    },
  ],
  stock: {
    type: Number,
    required: [true, "Please provide stock quantity"],
    min: [0, "Stock cannot be negative"],
    default: 0,
  },
  sku: {
    type: String,
    unique: true,
    sparse: true,
  },
  featured: {
    type: Boolean,
    default: false,
  },
  onSale: {
    type: Boolean,
    default: false,
  },
  salePercentage: {
    type: Number,
    min: 0,
    max: 100,
    default: 0,
  },
  tags: [String],
  specifications: [
    {
      name: String,
      value: String,
    },
  ],
  weight: {
    type: Number,
    min: 0,
  },
  dimensions: {
    length: Number,
    width: Number,
    height: Number,
  },
  ratings: {
    average: {
      type: Number,
      default: 0,
      min: 0,
      max: 5,
    },
    count: {
      type: Number,
      default: 0,
    },
  },
  reviews: [
    {
      user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
      },
      rating: {
        type: Number,
        required: true,
        min: 1,
        max: 5,
      },
      comment: {
        type: String,
        required: true,
        maxlength: [500, "Review comment cannot exceed 500 characters"],
      },
      createdAt: {
        type: Date,
        default: Date.now,
      },
    },
  ],
  isActive: {
    type: Boolean,
    default: true,
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
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

// Update the updatedAt field before saving
// Use synchronous hook (no `next`) to avoid middleware signature mismatches
productSchema.pre("save", function () {
  this.updatedAt = Date.now();
});

// Calculate sale price
productSchema.virtual("salePrice").get(function () {
  if (this.onSale && this.salePercentage > 0) {
    return this.price * (1 - this.salePercentage / 100);
  }
  return this.price;
});

// Update ratings when a new review is added
productSchema.methods.updateRatings = function () {
  if (this.reviews.length > 0) {
    const totalRating = this.reviews.reduce(
      (sum, review) => sum + review.rating,
      0
    );
    this.ratings.average = totalRating / this.reviews.length;
    this.ratings.count = this.reviews.length;
  } else {
    this.ratings.average = 0;
    this.ratings.count = 0;
  }
};

// Indexes for better performance
productSchema.index({ name: "text", description: "text" });
productSchema.index({ category: 1 });
productSchema.index({ price: 1 });
productSchema.index({ featured: 1 });
productSchema.index({ createdAt: -1 });

module.exports = mongoose.model("Product", productSchema);

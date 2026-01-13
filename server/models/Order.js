const mongoose = require("mongoose");

const orderSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  orderItems: [
    {
      product: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Product",
        required: true,
      },
      name: {
        type: String,
        required: true,
      },
      image: {
        type: String,
        required: true,
      },
      price: {
        type: Number,
        required: true,
      },
      quantity: {
        type: Number,
        required: true,
        min: 1,
      },
      size: String,
      color: String,
      sku: String,
    },
  ],
  shippingAddress: {
    fullName: {
      type: String,
      required: true,
    },
    address: {
      type: String,
      required: true,
    },
    city: {
      type: String,
      required: true,
    },
    state: {
      type: String,
      required: true,
    },
    zipCode: {
      type: String,
      required: true,
    },
    country: {
      type: String,
      required: true,
      default: "USA",
    },
    phone: {
      type: String,
      required: true,
    },
  },
  paymentMethod: {
    type: String,
    required: true,
    enum: ["credit_card", "debit_card", "paypal", "stripe", "cash_on_delivery"],
  },
  paymentResult: {
    id: String,
    status: String,
    update_time: String,
    email_address: String,
  },
  subtotal: {
    type: Number,
    required: true,
    min: 0,
  },
  taxAmount: {
    type: Number,
    required: true,
    default: 0,
    min: 0,
  },
  shippingCost: {
    type: Number,
    required: true,
    default: 0,
    min: 0,
  },
  discount: {
    type: Number,
    default: 0,
    min: 0,
  },
  totalAmount: {
    type: Number,
    required: true,
    min: 0,
  },
  orderStatus: {
    type: String,
    enum: [
      "pending",
      "confirmed",
      "processing",
      "shipped",
      "delivered",
      "cancelled",
      "refunded",
    ],
    default: "pending",
  },
  isPaid: {
    type: Boolean,
    default: false,
  },
  paidAt: {
    type: Date,
  },
  isDelivered: {
    type: Boolean,
    default: false,
  },
  deliveredAt: {
    type: Date,
  },
  trackingNumber: {
    type: String,
  },
  shippingCarrier: {
    type: String,
  },
  orderNotes: {
    type: String,
    maxlength: [500, "Order notes cannot exceed 500 characters"],
  },
  statusHistory: [
    {
      status: {
        type: String,
        required: true,
      },
      timestamp: {
        type: Date,
        default: Date.now,
      },
      note: String,
    },
  ],
  couponCode: {
    type: String,
    trim: true,
  },
  refundAmount: {
    type: Number,
    default: 0,
    min: 0,
  },
  refundReason: {
    type: String,
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

// Generate order number
orderSchema.pre("save", function () {
  if (this.isNew) {
    const timestamp = Date.now().toString();
    const randomNum = Math.floor(Math.random() * 1000)
      .toString()
      .padStart(3, "0");
    this.orderNumber = `ORD-${timestamp.slice(-6)}${randomNum}`;
  }
  this.updatedAt = Date.now();
});

// Add status to history when status changes
orderSchema.pre("save", function () {
  if (this.isModified("orderStatus") && !this.isNew) {
    this.statusHistory.push({
      status: this.orderStatus,
      timestamp: new Date(),
    });
  }
});

// Virtual for order number
orderSchema.virtual("orderNumber").get(function () {
  return `ORD-${this._id.toString().slice(-8).toUpperCase()}`;
});

// Method to calculate total
orderSchema.methods.calculateTotal = function () {
  this.subtotal = this.orderItems.reduce((total, item) => {
    return total + item.price * item.quantity;
  }, 0);

  this.totalAmount =
    this.subtotal + this.taxAmount + this.shippingCost - this.discount;
  return this.totalAmount;
};

// Indexes for better performance
orderSchema.index({ user: 1 });
orderSchema.index({ orderStatus: 1 });
orderSchema.index({ createdAt: -1 });
orderSchema.index({ "orderItems.product": 1 });

module.exports = mongoose.model("Order", orderSchema);

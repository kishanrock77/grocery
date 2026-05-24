const mongoose = require("mongoose");

const couponSchema = new mongoose.Schema(
  {
    // Coupon Name / Code
    couponName: {
      type: String,
      required: true,
      trim: true,
      uppercase: true
    },

    // Active / Deactive
    active: {
      type: Boolean,
      default: true
    },
 
    showbydeafultincheckoutpage: {
      type: Boolean,
      default: false
    },
    // Status
    status: {
      type: Boolean,
      default: true
    },

    // Discount Type
    // flat OR percent
    discountType: {
      type: String,
      enum: ["flat", "percent"],
      required: true
    },

    // Discount Value
    // flat amount OR percentage
    discountValue: {
      type: Number,
      required: true,
      min: 0
    },

    // Admin Id
    adminId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Admin",
      required: true
    },

    // Stores where coupon is NOT applicable
    notApplicableStoreIds: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Store"
      }
    ],

    // Stores where coupon is ONLY applicable
    onlyApplicableStoreIds: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Store"
      }
    ]
  },
  {
    timestamps: {
      createdAt: "createdOn",
      updatedAt: "updatedOn"
    }
  }
);

module.exports = mongoose.model("Coupon", couponSchema);
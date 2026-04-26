const mongoose = require("mongoose");

const ItemSchema = new mongoose.Schema(
  {
    itemType: {
      type: String,
      enum: ["single", "variant"],
      default: "single",
    },

    itemName: {
      type: String,
      required: true,
      trim: true,
    },

    itemSubName: {
      type: String,
      default: "",
      trim: true,
    },

    description: {
      type: String,
      default: "",
    },

    storePrice: {
      type: Number,
      default: 0,
    },
    variant_or_addon: {
      type: String,
      enum: ["variant", "addon", ''],
      default: "variant",
    },
    appPrice: {
      type: Number,
      default: 0,
    },

    // ✅ Categories (3-Level Structure)
    categories: [
      {
        level1: { type: String },
        level2: { type: String },
        level3: { type: String },
      },
    ],
    // ✅ NEW: Item Questions
    itemQuestions: [
      {
        title: { type: String },
       options: [
  {
    label: { type: String, required: true },
    storePrice: { type: Number, required: true },
    appPrice: { type: Number, default: 0 }
  }
]
      }
    ],

    // ✅ NEW: Unit
    unit: {
      type: String,
      enum: ["kg", "litre", "piece", "pound", ""],
      default: ""
    },
    // ✅ Dynamic Filter Keys
    filterKeys: [
      {
        key: { type: String },
        value: { type: String },
      },
    ],

    // ✅ Images
    images: [
      {
        type: String,
      },
    ],

    // ✅ Used as Child Item in Variants
    useThisItemAsChild: {
      type: Boolean,
      default: false,
    },

    // ✅ Parent Item IDs for Variant Mapping
    parentId: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Item",
      },
    ],

    variantItems: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Item",
      },
    ],
    addons: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Item",
      },
    ],

    // ✅ NEW: Original Admin Item Reference
    original_item_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Item",
      default: null,
    },

    // ✅ Admin or Store ID
    addedBy: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
    },

    // ✅ Admin or Store Identifier
    addedByString: {
      type: String,
      enum: ["admin", "store"],
      required: true,
    },

    // ✅ Store ID (null for Admin Items)
    storeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Store",
      default: null,
    },

    // ✅ Soft Delete Status
    status: {
      type: Boolean,
      default: true,
    },

    // ✅ Show on Frontend
    showOnFront: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

// ✅ Indexes for Performance
ItemSchema.index({ status: 1 });
ItemSchema.index({ addedBy: 1 });
ItemSchema.index({ storeId: 1 });
ItemSchema.index({ parentId: 1 });
ItemSchema.index({ createdAt: -1 });

// ✅ New Index for Fast Matching
ItemSchema.index({ original_item_id: 1 });
ItemSchema.index({ storeId: 1, original_item_id: 1 });

module.exports = mongoose.model("Item", ItemSchema);
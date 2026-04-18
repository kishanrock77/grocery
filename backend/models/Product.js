const mongoose = require("mongoose");

const AddOnSchema = new mongoose.Schema({
  name: { type: String, required: true },
  price: { type: Number, required: true },
  description: { type: String },
  images: [{ type: String }]
});

const VariantSchema = new mongoose.Schema({
  name: { type: String, required: true },
  price: { type: Number, required: true },
  description: { type: String },
  images: [{ type: String }],
  variants: [this],         // nested variant 2nd level
  addOns: [AddOnSchema]     // add-ons per variant
});

const ProductSchema = new mongoose.Schema({
  name: { type: String, required: true },
  description: { type: String },
  price: { type: Number, required: true },
  images: [{ type: String }],
  mainProductId: { type: mongoose.Schema.Types.ObjectId, ref: "Product", default: null },
  variants: [VariantSchema],
  addOns: [AddOnSchema],
  adminId: { type: mongoose.Schema.Types.ObjectId, ref: "AdminUser" },
  storeIds: [{ type: mongoose.Schema.Types.ObjectId, ref: "Store" }],
  status: { type: Boolean, default: true }
}, { timestamps: true });

module.exports = mongoose.model("Product", ProductSchema);
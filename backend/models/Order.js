const mongoose = require("mongoose");

const OrderItemSchema = new mongoose.Schema({
  productId: { type: mongoose.Schema.Types.ObjectId, ref: "Product", required: true }, // variant id or main product id
  mainProductId: { type: mongoose.Schema.Types.ObjectId, ref: "Product" },             // parent main product
  name: { type: String, required: true },
  variantName: { type: String },          // optional
  quantity: { type: Number, required: true, default: 1 },
  price: { type: Number, required: true },
  addOns: [
    {
      name: { type: String, required: true },
      price: { type: Number, required: true },
      description: { type: String },
    }
  ]
});

const OrderSchema = new mongoose.Schema({
  orderNumber: { type: String, required: true, unique: true },
  customerId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  storeId: { type: mongoose.Schema.Types.ObjectId, ref: "Store" },
  deliveryBoyId: { type: mongoose.Schema.Types.ObjectId, ref: "DeliveryBoy", default: null },
  orderItems: [OrderItemSchema],
  orderAmount: { type: Number, required: true },
  deliveryAddress: { type: String, required: true },
  userLocation: { type: { type: String }, coordinates: [Number] },
  orderStatus: { type: String, default: "pending" }, // pending, store_accepted, assigned, accepted, packed, delivered, cancelled
  paymentStatus: { type: String, default: "pending" }, // pending, paid
  assignTime: { type: Date },
  status: { type: Boolean, default: true }
}, { timestamps: true });

module.exports = mongoose.model("Order", OrderSchema);
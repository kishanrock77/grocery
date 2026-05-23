// models/suborder.model.js

const mongoose = require('mongoose');

const subOrderSchema = new mongoose.Schema(
  {
    // MAIN ORDER LINK
    orderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Order',
      required: true
    },
    adminId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "AdminUser"
    },
    mainorderid: {
      type: String,
      required: true,
      trim: true
    },

    // UNIQUE SUB ORDER ID
    suborderid: {
      type: String,
      required: true,
      unique: true,
      trim: true
    },

    // CUSTOMER
    customerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Customer',
      required: true
    },

    // STORE
    storeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Store',
      required: true
    },

    // DELIVERY BOY
    deliveryBoyId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Deliveryboy',
      default: null
    },

    // STORE TOTAL
    storeTotal: {
      type: Number,
      required: true,
      default: 0
    },

    // STATUS
    suborderstatus: {
      type: String,
      default: 'Pending'
    },

    // STORE DATA
    storeInfo: {
      type: Object,
      required: true
    },

    // ONLY THIS STORE ITEMS
    items: {
      type: Array,
      required: true,
      default: []
    }
  },
  {
    timestamps: true
  }
);

module.exports =
  mongoose.models.SubOrder ||
  mongoose.model('SubOrder', subOrderSchema);
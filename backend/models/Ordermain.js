// models/order.model.js

const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema(
  {
    mainorderid: {
      type: String,
      required: true,
      unique: true,
      trim: true
    },
    amountfromwallet: {
      type: Number,
      default: 0
    },
    adminId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "AdminUser"
    },
    customerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Customer',
      required: true
    },

    date: {
      type: String,
      required: true
    },

    totalamount: {
      type: Number,
      required: true,
      default: 0
    },

    couponcode: {
      type: String,
      default: null,
      trim: true
    },

    discountAmount: {
      type: Number,
      default: 0
    },
handlingCharge: {
      type: Number,
      default: 0
    },
    paymentMethod: {
      type: String,
      required: true,

    },
    paymentStatus: {
      type: String,
      required: true,

    },

    transactionId: {
      type: String,
      default: null,
      trim: true
    },

    deliveryCharge: {
      type: Number,
      default: 0
    },

    deliverydiscount: {
      type: Number,
      default: 0
    },



    ordrdatetime: {
      type: Date,
      default: Date.now
    }
  },
  {
    timestamps: true
  }
);

module.exports =
  mongoose.models.Ordermain ||
  mongoose.model('Ordermain', orderSchema);
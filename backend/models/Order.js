// models/order.model.js

const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema(
  {
    orderid: {
      type: String,
      required: true,
      unique: true,
      trim: true
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

    paymentMethod: {
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

    mainorderstatus: {
      type: String,
      default: 'Pending' 
       
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
  mongoose.models.Order ||
  mongoose.model('Order', orderSchema);
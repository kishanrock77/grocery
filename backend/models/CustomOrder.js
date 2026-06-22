const mongoose = require("mongoose");


const customOrderSchema = new mongoose.Schema({

  adminId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true
  },



  customerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Customer",
    required: true
  },


  type: {
    type: String,
    enum: [
      "cake",
      "medical",
      "other"
    ],
    required: true
  },



  images: [
    String
  ],


  pdf: String,



  // cake

  cake: {

    flavour: String,

    message: String,

    weight: String,
    egglesstype:String

  },



  // medical

  medical: [

    {
      name: String,

      quantity: String
    }

  ],




  // other

  other: {

    itemName: String

  },




  extraDetail: String,



  // admin status

  statusByAdmin: {

    type: String,

    default: "pending"

  },
 storeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Store",
      default: null,
    },


  cancelReason: {

    type: String,

    default: ""

  },



  estimateAmount: {

    type: Number,

    default: 0

  },

  estimateAmount_store: {

    type: Number,

    default: 0

  },
  estimatemessage: {

    type: String,



  },




  // customer status


  statusByCustomer: {

    type: String,

    default: "pending"

  },




  createdAt: {

    type: Date,

    default: Date.now

  },
  // ✅ Categories (3-Level Structure)
  categories: [
    {
      level1: { type: String },
      level2: { type: String },
      level3: { type: String },
    },
  ],
  finalitemid: {

    type: String,

    default: "pending"

  }




});



module.exports =
  mongoose.model(
    "CustomOrder",
    customOrderSchema
  );
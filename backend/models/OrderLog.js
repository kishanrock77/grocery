const mongoose = require("mongoose");

const OrderLogSchema = new mongoose.Schema({

  orderId:{
    type:mongoose.Schema.Types.ObjectId,
    ref:"Order"
  },

  action:{
    type:String
  },

  message:{
    type:String
  },

  actionById:{
    type:mongoose.Schema.Types.ObjectId
  },

  actionByType:{
    type:String
  },

  status:{
    type:Boolean,
    default:true
  }

},{timestamps:true});

module.exports = mongoose.model("OrderLog",OrderLogSchema);
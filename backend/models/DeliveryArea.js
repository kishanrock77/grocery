const mongoose = require("mongoose");

const DeliveryAreaSchema = new mongoose.Schema({

areaName:{
type:String,
required:true
},

areaType:{
type:String,
enum:["city","village"],
required:true
},

adminId:{
type:mongoose.Schema.Types.ObjectId,
ref:"AdminUser"
},

status:{
type:Boolean,
default:true
}

},{timestamps:true});

module.exports = mongoose.model("DeliveryArea",DeliveryAreaSchema);
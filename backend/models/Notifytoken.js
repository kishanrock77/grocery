const mongoose = require("mongoose");

const NotifytokenSchema = new mongoose.Schema({

 

uniqueidofdevice: String,

 
fcmToken: String,
 

}, { timestamps: true });

module.exports = mongoose.model("Notifytoken", NotifytokenSchema);
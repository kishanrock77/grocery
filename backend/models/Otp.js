const mongoose = require("mongoose");

const OtpSchema = new mongoose.Schema({

  mobile: {
    type: String,
    required: true,
    unique: true
  },

  otp: {
    type: String,
    default: "1111"
  },

  type: {
    type: String,
    enum: ["register", "forgot"],
    default: "register"
  }

}, { timestamps: true });

module.exports = mongoose.model("Otp", OtpSchema);
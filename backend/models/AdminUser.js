const mongoose = require("mongoose");

const AdminUserSchema = new mongoose.Schema({

name: { type: String, required: true },

phone: String,

email: { type: String, required: true, unique: true },

password: { type: String, required: true },

city: String,

state: String,

country: String,

latitude: Number,

longitude: Number,

userType: { type: String, default: "admin" }

}, { timestamps: true });

module.exports = mongoose.model("AdminUser", AdminUserSchema);
const mongoose = require("mongoose");

const StoreOwnerSchema = new mongoose.Schema({
    name: String,
    mobile: String,  password: String,
    email: {
        type: String,
        unique: true,   // 🔥 unique constraint
        sparse: true,   // allow null emails (optional but useful)
        lowercase: true,
        trim: true
    },
    addedBy: mongoose.Schema.Types.ObjectId,
fcmToken: String,

    status: {
        type: Boolean,
        default: true   // active by default
    }

}, { timestamps: true });

module.exports = mongoose.model("StoreOwner", StoreOwnerSchema);
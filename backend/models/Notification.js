const mongoose = require("mongoose");

const NotificationSchema = new mongoose.Schema({

    userId: {
        type: mongoose.Schema.Types.ObjectId
    },

    userType: {
        type: String
    },

    title: String,

    message: String,

    relatedOrderId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Order"
    },

    isRead: {
        type: Boolean,
        default: false
    },

    status: {
        type: Boolean,
        default: true
    }
    ,notificationssent: {
        type: Boolean,
        default: false
    }

}, { timestamps: true });

module.exports = mongoose.model("Notification", NotificationSchema);
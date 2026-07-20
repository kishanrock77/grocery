const mongoose = require("mongoose");

const NotificationSchema = new mongoose.Schema({

    userId: {
        type: mongoose.Schema.Types.Mixed,
        default: null
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
NotificationSchema.index({
  userId: 1,
  userType: 1
});

NotificationSchema.index({
  relatedOrderId: 1
});
module.exports = mongoose.model("Notification", NotificationSchema);
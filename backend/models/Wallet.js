const mongoose = require("mongoose");

const WalletSchema = new mongoose.Schema({

    customerId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Customer",
        required: true
    },

    datetime: {
        type: Date,
        default: Date.now
    },

    reason: {
        type: String,
        trim: true,
        required: true
    },

    amountType: {
        type: String,
        enum: ["credit", "debit"],
        required: true
    },

    amount: {
        type: Number,
        required: true,
        min: 0
    },

    actionById: {
        type: mongoose.Schema.Types.ObjectId
    }, actionByType: {
        type: String
    }

}, {
    timestamps: true
});

module.exports = mongoose.model("Wallet", WalletSchema);
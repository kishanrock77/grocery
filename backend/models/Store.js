const mongoose = require("mongoose");

const StoreSchema = new mongoose.Schema({



    storeName: String,

    location: {
        type: {
            type: String,
            default: "Point"
        },
        coordinates: [Number]
    },
    address: String,
    address_map: String,

    landmark: String,
    city: String,
    state: {
        default: "Uttar Pradesh",
        type: String
    },

    ownerid: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "StoreOwner"
    },
    storeType: String,

    images: [String],

    activeStatus: {
        type: Boolean,
        default: true
    },

    openingTime: String,
    closingTime: String,

    openCloseStatus: String,
    ifCloseStatusReason: String,
    weekOff: [String],

    status: {
        type: Boolean,
        default: true
    },
    addedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "AdminUser"
    },
    commissionforadmin: {
        type: Number,
        default: 0
    },
    increasepriceby: {
        type: Number,
        default: 0
    },

}, { timestamps: true });


StoreSchema.index({ location: "2dsphere" });

module.exports = mongoose.model("Store", StoreSchema);
const mongoose = require("mongoose");

const DeliveryAreaSchema = new mongoose.Schema({

    areaName: {
        type: String,
        required: true,
        trim: true
    },

    cityName: {
        type: String,
        required: true,
        trim: true
    },
   
    stateName: {
        type: String,
        default: "Uttar Pradesh"
    },

    adminId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "AdminUser"
    },

    status: {
        type: Boolean,
        default: true
    },
    polygoncordinates: {
        type: Array,
        default: []
    }

}, { timestamps: true });

// ✅ UNIQUE COMBINATION
DeliveryAreaSchema.index(
    { cityName: 1, areaName: 1 },
    { unique: true }
);


module.exports = mongoose.model("DeliveryArea", DeliveryAreaSchema);
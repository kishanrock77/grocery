const mongoose = require("mongoose");

const DeliveryBoySchema = new mongoose.Schema({

  name: {
    type: String,
    required: true
  },

  profilePic: {
    type: String
  },


  email: {
    type: String,
    required: true,
    unique: true
  },

  password: {
    type: String,
    required: true
  },

  mobile: {
    type: String,
    required: true
  },

  address: {
    type: String
  },

  // GEO LOCATION
  location: {
    type: {
      type: String,
      default: "Point"
    },
    coordinates: {
      type: [Number], // [longitude, latitude]
      default: [0, 0]
    }
  },
  fcmToken: String,

uniqueidofdevice: String,
  address_map:{
      type: String,
      default: ""
    },
  activeStatus: {
    type: Boolean,
    default: true
  },
  isAvailable: {
    type: Boolean,
    default: true
  },
  onsalaryorcommission: {
    type: String,
    enum: ["salary", "commission"],
    default: "salary"
  },
  commission: {
    type: String,
    default: "0"
  },
  comissionType: {
    type: String,
    enum: ["percent", "fixed",''],
    default: "percent"
  },
  status: {
    type: Boolean,
    default: true
  },

  addedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "AdminUser"
  },
  deliveryAreas: {
    type: [String],
    default: []
  },
  pickupAreas: {
    type: [String],
    default: []
  }

}, { timestamps: true });


// GEO INDEX (nearby search ke liye)
DeliveryBoySchema.index({ location: "2dsphere" });

module.exports = mongoose.model("DeliveryBoy", DeliveryBoySchema);
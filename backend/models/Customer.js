const mongoose = require("mongoose");

const customerSchema = new mongoose.Schema({

  mobile: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },

  password: {
    type: String,
    required: true
  },

  name: {
    type: String,
    required: true,
    trim: true
  },

  // 📍 Multiple Addresses
  address: [
    {
      contactName: {
        type: String,
        default: ""
      },
      contactMobile: {
        type: String,
        default: ""
      },
      fullAddress: {
        type: String,
        default: ""
      },
      mapAddress: {
        type: String,
        default: ""
      },
      latitude: {
        type: Number,
        default: 0
      },
       
      city: {
        type: String,
        default: ""
      },
      state: {
        type: String,
        default: ""
      },
      pincode: {
        type: String,
        default: ""
      },
      longitude: {
        type: Number,
        default: 0
      },
      landmark: {
        type: String,
        default: ""
      },

      label: {
        type: String, // home, office
        default: "home"
      }
    }
  ],

  // ✅ Verification (optional future use)
  isMobileVerified: {
    type: Boolean,
    default: false
  },

  // ✅ Active / Inactive
  status: {
    type: Boolean,
    default: true
  },

  // 🕒 Created time
  created_on: {
    type: Date,
    default: Date.now
  }

}, {
  timestamps: false
});

 
module.exports = mongoose.model("Customer", customerSchema);
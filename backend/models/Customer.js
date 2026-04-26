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
      fullAddress: {
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

// ⚡ Fast query index
customerSchema.index({ mobile: 1 });

module.exports = mongoose.model("Customer", customerSchema);
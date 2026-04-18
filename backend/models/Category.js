const mongoose = require("mongoose");

const CategorySchema = new mongoose.Schema({
  categoryName: { type: String, required: true },
  addedBy: String,

  store_id: { type: Number, default: -1 },

  status: { type: Boolean, default: true },

  parent_id: { type:String, default: '-1' },
  grandparent_id: { type: String, default: '-1'  },

  level_no: { type: Number, required: true },
filtersforlevel3category:[String],
  imagepath: String

}, { timestamps: true });

module.exports = mongoose.model("Category", CategorySchema);
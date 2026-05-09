const mongoose = require("mongoose");

const CategorySchema = new mongoose.Schema({
  categoryName: { type: String, required: true },

  addedBy: {
    type: String,
    index: true // ✅ single index
  },

  store_id: { type: Number, default: -1 },

  status: {
    type: Boolean,
    default: true,
    index: true // ✅ single index
  },

  parent_id: { type: String, default: '-1' },

  grandparent_id: { type: String, default: '-1' },

  level_no: { type: Number, required: true },

  filtersforlevel3category: [String],

  imagepath: String

}, { timestamps: true });


// ✅ compound index (BEST for queries using both)
CategorySchema.index({ addedBy: 1, status: 1 });

module.exports = mongoose.model("Category", CategorySchema);
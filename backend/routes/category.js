const express = require("express");
const router = express.Router();
const Category = require("../models/Category");
const upload = require("../middleware/uploadcategory"); // same middleware use kar sakte ho

router.post("/add", upload.single("image"), async (req, res) => {
  try {
    const data = req.body;

    // 🔍 check duplicate
    const existing = await Category.findOne({
      categoryName: data.categoryName,
      addedBy: data.addedBy,
      level_no: data.level_no,
      parent_id: data.parent_id && data.parent_id !== "null" ? data.parent_id : '-1',
      grandparent_id: data.grandparent_id && data.grandparent_id !== "null" ? data.grandparent_id : '-1',
      status: true
    });

    if (existing) {
      return res.json({
        success: false,
        message: "Category already exists"
      });
    }
    let filterarr = [];
    if (data.filtersforlevel3category != '') {
      filterarr = data.filtersforlevel3category.split(",")
    }
    console.log(filterarr)
    const category = new Category({
      categoryName: data.categoryName,
      addedBy: data.addedBy,
      filtersforlevel3category: filterarr,
      level_no: data.level_no,
      parent_id: data.parent_id || null,
      grandparent_id: data.grandparent_id || null,
      imagepath: req.file ? "uploads/category/" + req.file.filename : ""
    });

    await category.save();

    res.json({ success: true, message: "Category saved " });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});


router.put("/update/:id", upload.single("image"), async (req, res) => {
  try {
    const data = req.body;

    // 🔍 duplicate check (exclude current id)
    const existing = await Category.findOne({
      categoryName: data.categoryName,

      addedBy: data.addedBy,
      level_no: data.level_no,
      parent_id: data.parent_id || null,
      grandparent_id: data.grandparent_id || null,
      status: true,
      _id: { $ne: req.params.id }
    });

    if (existing) {
      return res.json({
        success: false,
        message: "Category already exists"
      });
    }
let filterarr = [];
    if (data.filtersforlevel3category != '') {
      filterarr = data.filtersforlevel3category.split(",")
    }
    console.log(filterarr)
    let updateObj = {
      categoryName: data.categoryName,
      level_no: data.level_no,
      filtersforlevel3category: filterarr,
      // 🔥 FIX HERE
      parent_id: data.parent_id && data.parent_id !== null && data.parent_id !== "null" ? data.parent_id : -1,
      grandparent_id: data.grandparent_id && data.grandparent_id !== null && data.grandparent_id !== "null" ? data.grandparent_id : -1
    };

    if (req.file) {
      updateObj.imagepath = "uploads/category/" + req.file.filename;
    }

    await Category.findByIdAndUpdate(req.params.id, updateObj);

    res.json({ success: true });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.delete("/delete/:id", async (req, res) => {
  const id = req.params.id;

  // delete selected
  await Category.findByIdAndUpdate(id, { status: false });

  // delete children
  await Category.updateMany(
    { parent_id: id },
    { status: false }
  );

  // delete grand children
  await Category.updateMany(
    { grandparent_id: id },
    { status: false }
  );

  res.json({ success: true });
});
router.get("/list/:userId", async (req, res) => {
  try {
    const list = await Category.find({
      addedBy: req.params.userId,
      status: true
    }).sort({ createdAt: -1 });

    res.json(list);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
module.exports = router;
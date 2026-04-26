const express = require("express");
const router = express.Router();
const Category = require("../models/Category");
const { uploadSingleImage, uploadMultipleImages } = require("../middleware/uploadAWSS3");
const { DeleteObjectCommand } = require("@aws-sdk/client-s3");

const { S3Client } = require("@aws-sdk/client-s3");

const s3 = new S3Client({
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY,
    secretAccessKey: process.env.AWS_SECRET_KEY
  }
});

const deleteFromS3 = async (url) => {
  try {
    const key = url.split(".amazonaws.com/")[1];

    await s3.send(new DeleteObjectCommand({
      Bucket: process.env.AWS_BUCKET,
      Key: key
    }));
  } catch (err) {
    console.error("S3 delete error:", err);
  }
};
router.post("/add", uploadSingleImage('image'), async (req, res) => {
  try {
    const data = req.body;
    const existing = await Category.findOne({
      categoryName: new RegExp(`^${data.categoryName.trim()}$`, "i"),
      addedBy: data.addedBy,
      level_no: data.level_no,
      parent_id: data.parent_id || null,
      grandparent_id: data.grandparent_id || null,
      status: true
    });
    if (existing) {
      return res.json({
        success: false,
        message: "Category already exists"
      });
    }

    let filterarr = [];
    if (data.filtersforlevel3category) {
      filterarr = data.filtersforlevel3category.split(",");
    }

    const category = new Category({
      categoryName: data.categoryName,
      addedBy: data.addedBy,
      filtersforlevel3category: filterarr,
      level_no: data.level_no,
      parent_id: data.parent_id || null,
      grandparent_id: data.grandparent_id || null,

      // ✅ FINAL FIX
      imagepath: data.imagepath || ""   // 👈 middleware se aa raha hai
    });

    await category.save();

    res.json({ success: true, message: "Category saved" });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
router.put(
  "/update/:id",
  uploadSingleImage("image"),
  async (req, res) => {
    try {
      const data = req.body;

      // 🔍 Duplicate Check (exclude current)

      const existing = await Category.findOne({
        categoryName: new RegExp(`^${data.categoryName.trim()}$`, "i"),
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

      // 🔧 Filters
      let filterarr = [];
      if (data.filtersforlevel3category) {
        filterarr = data.filtersforlevel3category.split(",");
      }

      // 🔍 Get existing category (for old image)
      const existingCategory = await Category.findById(req.params.id);

      // =========================
      // 🖼️ IMAGE HANDLING (S3 FIX)
      // =========================
      let imagepath = existingCategory?.imagepath || "";

      if (req.file) {
        // 🔥 S3 URL (IMPORTANT FIX)
        imagepath = data.imagepath;
      }

      // =========================
      // 🧱 UPDATE OBJECT
      // =========================
      let updateObj = {
        categoryName: data.categoryName,
        level_no: data.level_no,
        filtersforlevel3category: filterarr,
        parent_id:
          data.parent_id && data.parent_id !== "null"
            ? data.parent_id
            : -1,
        grandparent_id:
          data.grandparent_id && data.grandparent_id !== "null"
            ? data.grandparent_id
            : -1,
        imagepath
      };

      // =========================
      // 🔄 UPDATE
      // =========================
      const updated = await Category.findByIdAndUpdate(
        req.params.id,
        updateObj,
        { new: true }
      );

      return res.json({
        success: true,
        message: "Category Updated Successfully",
        data: updated
      });

    } catch (err) {
      console.error("CATEGORY UPDATE ERROR:", err);
      res.status(500).json({
        success: false,
        message: err.message
      });
    }
  }
);

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
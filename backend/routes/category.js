const express = require("express");
const router = express.Router();
const Category = require("../models/Category");
const { uploadSingleImage, uploadMultipleImages } = require("../middleware/uploadAWSS3");


router.post("/add", uploadMultipleImages("images", 5), async (req, res) => {
  try {
    const body = req.body;

    // 🔧 Safe JSON parser
    const safeParse = (val, fallback = []) => {
      try {
        return val ? JSON.parse(val) : fallback;
      } catch {
        return fallback;
      }
    };

    // 🏬 Store handling
    let storeObjectId = null;
    if (
      body.storeId &&
      body.storeId !== "-1" &&
      mongoose.Types.ObjectId.isValid(body.storeId)
    ) {
      storeObjectId = new mongoose.Types.ObjectId(body.storeId);
    }

    // 🖼️ Images from S3 middleware
    let images = req.body.images || [];
    if (!Array.isArray(images)) images = [];

    // 🧱 Create item
    const item = new Item({
      itemType: body.itemType,
      variant_or_addon: body.variant_or_addon,

      itemName: body.itemName,
      itemSubName: body.itemSubName || "",
      description: body.description || "",

      storePrice: Number(body.storePrice) || 0,
      appPrice: Number(body.appPrice) || 0,

      categories: safeParse(body.categories),
      filterKeys: safeParse(body.filterKeys),

      useThisItemAsChild: body.useThisItemAsChild === "true",

      addedBy: new mongoose.Types.ObjectId(body.addedBy),
      addedByString: body.addedByString,

      storeId: storeObjectId,

      variantItems: safeParse(body.variantItems),
      addons: safeParse(body.addons),

      itemQuestions: safeParse(body.itemQuestions),

      showOnFront: body.showOnFront === "true",

      // ✅ FINAL IMAGE FIELD
      images: images,

      unit: body.unit || "",
      parentId: []
    });

    const savedItem = await item.save();

    // 🔗 Variant Linking
    if (body.itemType === "variant" && body.variantItems) {
      const variantIds = safeParse(body.variantItems);

      await Item.updateMany(
        { _id: { $in: variantIds } },
        { $addToSet: { parentId: savedItem._id } }
      );
    }

    res.json({
      success: true,
      message: "Item Added Successfully",
      data: savedItem,
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({
      success: false,
      message: err.message,
    });
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
        imagepath = req.file.location;
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
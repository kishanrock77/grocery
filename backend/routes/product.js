const express = require("express");
const router = express.Router();
const Product = require("../models/Product");
const multer = require("multer");
const path = require("path");

// Multer setup for image upload
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, "uploads/products"),
  filename: (req, file, cb) => cb(null, Date.now() + path.extname(file.originalname))
});
const upload = multer({ storage });

/* --------------------------------
CREATE MAIN PRODUCT OR VARIANT
-------------------------------- */
router.post("/create", upload.fields([
  { name: "productImages", maxCount: 5 },
  { name: "addOnImages", maxCount: 5 } // optional, for add-ons
]), async (req, res) => {
  try {
    const productImages = req.files["productImages"] ? req.files["productImages"].map(f => f.path) : [];
    const addOns = req.body.addOns ? JSON.parse(req.body.addOns) : [];

    // Attach uploaded images to add-ons
    addOns.forEach((addon, index) => {
      if (req.files["addOnImages"] && req.files["addOnImages"][index]) {
        addon.images = [req.files["addOnImages"][index].path];
      }
    });

    const variants = req.body.variants ? JSON.parse(req.body.variants) : [];

    const product = new Product({
      name: req.body.name,
      description: req.body.description,
      price: req.body.price,
      images: productImages,
      mainProductId: req.body.mainProductId || null,
      variants: variants,
      addOns: addOns,
      adminId: req.body.adminId,
      storeIds: req.body.storeIds ? JSON.parse(req.body.storeIds) : []
    });

    await product.save();
    res.json({ msg: "Product created", product });

  } catch (err) {
    console.log(err);
    res.status(500).send(err);
  }
});

/* --------------------------------
UPDATE PRODUCT / VARIANT / ADD-ON
-------------------------------- */
router.put("/update/:id", upload.fields([
  { name: "productImages", maxCount: 5 },
  { name: "addOnImages", maxCount: 5 }
]), async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) return res.status(404).json({ msg: "Product not found" });

    // Update basic fields
    if (req.body.name) product.name = req.body.name;
    if (req.body.description) product.description = req.body.description;
    if (req.body.price) product.price = req.body.price;

    // Update images
    if (req.files["productImages"]) {
      product.images = req.files["productImages"].map(f => f.path);
    }

    // Update add-ons
    if (req.body.addOns) {
      const addOns = JSON.parse(req.body.addOns);
      addOns.forEach((addon, index) => {
        if (req.files["addOnImages"] && req.files["addOnImages"][index]) {
          addon.images = [req.files["addOnImages"][index].path];
        }
      });
      product.addOns = addOns;
    }

    // Update variants
    if (req.body.variants) product.variants = JSON.parse(req.body.variants);

    // Update stores
    if (req.body.storeIds) product.storeIds = JSON.parse(req.body.storeIds);

    await product.save();
    res.json({ msg: "Product updated", product });

  } catch (err) {
    console.log(err);
    res.status(500).send(err);
  }
});

/* --------------------------------
SOFT DELETE PRODUCT / VARIANT / ADD-ON
-------------------------------- */
router.delete("/delete/:id", async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) return res.status(404).json({ msg: "Product not found" });

    product.status = false;
    await product.save();
    res.json({ msg: "Product deleted (soft delete)" });

  } catch (err) {
    console.log(err);
    res.status(500).send(err);
  }
});

/* --------------------------------
LIST PRODUCTS (ADMIN)
-------------------------------- */
router.get("/list", async (req, res) => {
  try {
    const products = await Product.find({ status: true })
      .populate("adminId", "name email")
      .populate("storeIds", "name city");
    res.json(products);
  } catch (err) {
    console.log(err);
    res.status(500).send(err);
  }
});
/* --------------------------------
1️⃣ List all products added by a specific admin
-------------------------------- */
router.get("/list/admin/:adminId", async (req, res) => {
  try {
    const products = await Product.find({ adminId: req.params.adminId, status: true })
      .populate("storeIds", "name city")
      .sort({ createdAt: -1 });
    res.json(products);
  } catch (err) {
    console.log(err);
    res.status(500).send(err);
  }
});

/* --------------------------------
2️⃣ List all products for a specific store
-------------------------------- */
router.get("/list/store/:storeId", async (req, res) => {
  try {
    const storeId = req.params.storeId;

    const products = await Product.find({ storeIds: storeId, status: true })
      .populate("adminId", "name email")
      .sort({ createdAt: -1 });

    res.json(products);
  } catch (err) {
    console.log(err);
    res.status(500).send(err);
  }
});

/* --------------------------------
3️⃣ Get single product by ID (with variants + add-ons)
-------------------------------- */
router.get("/detail/:productId", async (req, res) => {
  try {
    const product = await Product.findById(req.params.productId)
      .populate("adminId", "name email")
      .populate("storeIds", "name city");

    if (!product) return res.status(404).json({ msg: "Product not found" });

    res.json(product);
  } catch (err) {
    console.log(err);
    res.status(500).send(err);
  }
});

module.exports = router;
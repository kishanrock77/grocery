const express = require("express");
const router = express.Router();
const StoreOwner = require("../models/storeOwner");


// CREATE
router.post("/add", async (req, res) => {
  try {

    // 🔍 check duplicate email
    if(req.body.email){
      const exists = await StoreOwner.findOne({ email: req.body.email,status: true });

      if(exists){
        return res.json({
          success:false,
          message:"Email already exists  "
        });
      }
    }

    req.body.status = true;

    const data = new StoreOwner(req.body);
    await data.save();

    res.json({ success: true, message: "Store Owner Added", data });

  } catch (err) {

    // 🔥 Mongo duplicate error handle
    if(err.code === 11000){
      return res.json({
        success:false,
        message:"Email already exists  "
      });
    }

    res.status(500).json({ success:false, message: err.message });
  }
});

// READ ALL
 
router.post("/list", async (req, res) => {
  try {

    const data = await StoreOwner.find({
      status: true,
      addedBy: req.body.adminId
    }).sort({ createdAt: -1 });

    res.json({ success: true, data });

  } catch (err) {
    res.status(500).json({ success:false, message: err.message });
  }
});

// UPDATE
router.put("/update/:id", async (req, res) => {
  try {

    // 🔍 check duplicate email (exclude current record)
    if(req.body.email){
      const exists = await StoreOwner.findOne({
        email: req.body.email,status: true,
        _id: { $ne: req.params.id }
      });

      if(exists){
        return res.json({
          success:false,
          message:"Email already exists ❌"
        });
      }
    }

    delete req.body.status;

    const data = await StoreOwner.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    );

    res.json({ success: true, message: "Updated", data });

  } catch (err) {

    if(err.code === 11000){
      return res.json({
        success:false,
        message:"Email already exists ❌"
      });
    }

    res.status(500).json({ success:false, message: err.message });
  }
});

// DELETE
router.delete("/delete/:id", async (req, res) => {
  try {

    await StoreOwner.findByIdAndUpdate(
      req.params.id,
      { status: false },
      { new: true }
    );

    res.json({ success: true, message: "Deleted (Soft)" });

  } catch (err) {
    res.status(500).json({ success:false, message: err.message });
  }
});

module.exports = router;
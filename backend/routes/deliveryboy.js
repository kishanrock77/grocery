const express = require("express");
const router = express.Router();
const DeliveryBoy = require("../models/DeliveryBoy");
const {uploadSingleImage, uploadMultipleImages} = require("../middleware/uploadAWSS3");


/*
--------------------------------
ADD DELIVERY BOY
--------------------------------
*/

router.post("/add", uploadSingleImage('image'), async (req, res) => {
  try {
    console.log("lllllll")
    const existing = await DeliveryBoy.findOne({
      email: req.body.email,
      status: true
    });
    console.log(req.body)
    if (existing) {
      return res.json({ msg: "Email already exists", status: false });
    }
    console.log("req.body")
    let profilePic = "";

    if (req.file) {
      profilePic =   req.file.filename;
      // profilePic = "uploads/deliveryboy/" + req.file.filename;
    }
    let deliveryAreas = [];

    try {
      deliveryAreas = req.body.deliveryAreas
        ? JSON.parse(req.body.deliveryAreas)
        : [];
    } catch (e) {
      console.log("JSON error:", e);
    }


    let pickupAreas = [];

    try {
      pickupAreas = req.body.pickupAreas
        ? JSON.parse(req.body.pickupAreas)
        : [];
    } catch (e) {
      console.log("JSON error:", e);
    }
    const deliveryBoy = new DeliveryBoy({
      name: req.body.name,
      addedBy: req.body.addedBy,

      email: req.body.email,
      password: req.body.password,
      mobile: req.body.mobile,
      address: req.body.address,
      profilePic: profilePic,
      onsalaryorcommission: req.body.onsalaryorcommission,
      commission: req.body.commission,
      comissionType: req.body.comissionType,
      deliveryAreas: deliveryAreas,
      pickupAreas:pickupAreas
    });
    console.log("req.ddddd")
    await deliveryBoy.save();

    res.json({
      msg: "Delivery Boy added successfully",
      status: true
    });

  } catch (err) {
    res.status(500).send(err);
  }
});


/*
--------------------------------
LIST
--------------------------------
*/

router.post("/list", async (req, res) => {
  try {

    const data = await DeliveryBoy.find({ status: true, addedBy: req.body.adminId })
      .sort({ createdAt: -1 });

    res.json(data);

  } catch (err) {
    res.status(500).send(err);
  }
});


/*
--------------------------------
DETAIL
--------------------------------
*/

router.get("/detail/:id", async (req, res) => {
  try {

    const data = await DeliveryBoy.findById(req.params.id);
    res.json(data);

  } catch (err) {
    res.status(500).send(err);
  }
});


/*
--------------------------------
UPDATE
--------------------------------
*/

router.put("/update/:id", uploadSingleImage('image'), async (req, res) => {
  try {

    let updateData = req.body;

    const existing = await DeliveryBoy.findOne({
      email: req.body.email,
      status: true,
      _id: { $ne: req.params.id }
    });

    if (existing) {
      return res.json({ msg: "Email already exists", status: false });
    }

    if (req.file) {
      updateData.profilePic =   req.file.filename;
      // updateData.profilePic = "uploads/deliveryboy/" + req.file.filename;
    }
    updateData.deliveryAreas = JSON.parse(req.body.deliveryAreas || "[]");
        updateData.pickupAreas = JSON.parse(req.body.pickupAreas || "[]");

    

    await DeliveryBoy.findByIdAndUpdate(req.params.id, updateData);

    res.json({
      msg: "Updated successfully",
      status: true
    });

  } catch (err) {
    res.status(500).send(err);
  }
});


/*
--------------------------------
STATUS CHANGE
--------------------------------
*/

router.put("/activeStatus/:id", async (req, res) => {
  try {
console.log(req.body.activeStatus,req.params.id)
    await DeliveryBoy.findByIdAndUpdate(req.params.id, {
      activeStatus: req.body.activeStatus
    });

    res.json({
      success: true,
      message: "Status Updated"
    });

  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message
    });
  }
});


/*
--------------------------------
DELETE (SOFT)
--------------------------------
*/

router.delete("/delete/:id", async (req, res) => {
  try {

    await DeliveryBoy.findByIdAndUpdate(req.params.id, {
      status: false
    });

    res.json({ msg: "Deleted", status: true });

  } catch (err) {
    res.status(500).send(err);
  }
});

module.exports = router;
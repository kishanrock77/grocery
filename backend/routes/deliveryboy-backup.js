const express = require("express");
const router = express.Router();

const bcrypt = require("bcryptjs");

const DeliveryBoy = require("../models/DeliveryBoy");

const upload = require("../middleware/upload");



/*
---------------------------------------
ADD DELIVERY BOY
---------------------------------------
*/

router.post("/add", upload.single("profilePic"), async (req, res) => {

  try {

    const existing = await DeliveryBoy.findOne({
      email: req.body.email,
      status: true
    });

    if (existing) {
      return res.json({ msg: "Email already exists" });
    }

    const hash = await bcrypt.hash(req.body.password, 10);

    const boy = new DeliveryBoy({

      name: req.body.name,

      email: req.body.email,

      password: hash,

      mobile: req.body.mobile,

      address: req.body.address,

      profilePic: req.file ? req.file.filename : "",

      location: {
        type: "Point",
        coordinates: [
          parseFloat(req.body.longitude),
          parseFloat(req.body.latitude)
        ]
      }

    });

    await boy.save();

    res.json({
      msg: "Delivery boy added successfully"
    });

  } catch (err) {

    res.status(500).send(err);

  }

});



/*
---------------------------------------
DELIVERY BOY LIST
---------------------------------------
*/

router.get("/list", async (req, res) => {

  try {

    const list = await DeliveryBoy.find({
      status: true
    }).select("-password")
      .sort({ createdAt: -1 });

    res.json(list);

  } catch (err) {

    res.status(500).send(err);

  }

});



/*
---------------------------------------
DELIVERY BOY DETAIL
---------------------------------------
*/

router.get("/detail/:id", async (req, res) => {

  try {

    const boy = await DeliveryBoy.findById(req.params.id)
      .select("-password");

    res.json(boy);

  } catch (err) {

    res.status(500).send(err);

  }

});



/*
---------------------------------------
UPDATE DELIVERY BOY
---------------------------------------
*/

router.put("/update/:id", upload.single("profilePic"), async (req, res) => {

  try {

    let updateData = {

      name: req.body.name,

      mobile: req.body.mobile,

      address: req.body.address

    };

    if (req.file) {
      updateData.profilePic = req.file.filename;
    }

    await DeliveryBoy.findByIdAndUpdate(
      req.params.id,
      updateData
    );

    res.json({
      msg: "Delivery boy updated"
    });

  } catch (err) {

    res.status(500).send(err);

  }

});



/*
---------------------------------------
CHANGE PASSWORD
---------------------------------------
*/

router.put("/change-password/:id", async (req, res) => {

  try {

    const hash = await bcrypt.hash(req.body.password, 10);

    await DeliveryBoy.findByIdAndUpdate(
      req.params.id,
      { password: hash }
    );

    res.json({
      msg: "Password changed"
    });

  } catch (err) {

    res.status(500).send(err);

  }

});



/*
---------------------------------------
UPDATE LOCATION (LIVE GPS)
---------------------------------------
*/

router.put("/update-location/:id", async (req, res) => {

  try {

    await DeliveryBoy.findByIdAndUpdate(
      req.params.id,
      {
        location: {
          type: "Point",
          coordinates: [
            parseFloat(req.body.longitude),
            parseFloat(req.body.latitude)
          ]
        }
      }
    );

    res.json({
      msg: "Location updated"
    });

  } catch (err) {

    res.status(500).send(err);

  }

});



/*
---------------------------------------
NEAREST DELIVERY BOY
---------------------------------------
*/

router.get("/nearest", async (req, res) => {

  try {

    const lat = parseFloat(req.query.lat);
    const lng = parseFloat(req.query.lng);

    const boy = await DeliveryBoy.findOne({

      status: true,
      isAvailable: true,

      location: {
        $near: {
          $geometry: {
            type: "Point",
            coordinates: [lng, lat]
          },
          $maxDistance: 5000
        }
      }

    }).select("-password");

    res.json(boy);

  } catch (err) {

    res.status(500).send(err);

  }

});



/*
---------------------------------------
DELETE DELIVERY BOY (SOFT DELETE)
---------------------------------------
*/

router.delete("/delete/:id", async (req, res) => {

  try {

    await DeliveryBoy.findByIdAndUpdate(
      req.params.id,
      { status: false }
    );

    res.json({
      msg: "Delivery boy deleted"
    });

  } catch (err) {

    res.status(500).send(err);

  }

});


router.put("/live-location/:id", async (req, res) => {

  try {

    await DeliveryBoy.findByIdAndUpdate(
      req.params.id,
      {
        location: {
          type: "Point",
          coordinates: [
            parseFloat(req.body.longitude),
            parseFloat(req.body.latitude)
          ]
        }
      }
    );

    res.json({
      msg: "Location updated"
    });

  } catch (err) {

    res.status(500).send(err);

  }

});
module.exports = router;
const express = require("express");
const router = express.Router();
const Store = require("../models/Store");
const upload = require("../middleware/storeUpload");



/*
--------------------------------
DISTANCE FUNCTION
--------------------------------
*/

function getDistance(lat1, lon1, lat2, lon2) {

  const R = 6371;

  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) *
    Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) *
    Math.sin(dLon / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c;

}



/*
--------------------------------
DELIVERY CHARGE
--------------------------------
*/

function getDeliveryCharge(distance) {

  if (distance <= 2) return 20;
  if (distance <= 5) return 40;
  if (distance <= 8) return 60;

  return 80;

}



/*
--------------------------------
ETA TIME
--------------------------------
*/

function getETA(distance) {

  const speed = 25;

  const time = distance / speed;

  return Math.round(time * 60);

}



/*
--------------------------------
ADD STORE
--------------------------------
*/

router.post("/add", upload.array("images", 5), async (req, res) => {

  try {

    const existing = await Store.findOne({
      storeName: req.body.storeName,
      status: true
    });

    if (existing) {
      return res.json({ msg: "Store Name already exists", status: false });
    }

    let imageArr = [];

    if (req.files) {
      req.files.forEach(file => {
        imageArr.push("uploads/store/" + file.filename)
      });
    }

    const store = new Store({

      addedBy: req.body.addedBy,

      storeName: req.body.storeName,

      location: {
        type: "Point",
        coordinates: [
          parseFloat(req.body.longitude),
          parseFloat(req.body.latitude)
        ]
      },

      city: req.body.city,
      state: req.body.state,

      ownerid: req.body.ownerid,

      address: req.body.address,
      address_map: req.body.address_map,
      landmark: req.body.landmark,
      storeType: req.body.storeType,

      activeStatus: req.body.activeStatus,

      increasepriceby: req.body.increasepriceby,
      commissionforadmin: req.body.commissionforadmin,

      openingTime: req.body.openingTime,

      closingTime: req.body.closingTime,

      openCloseStatus: req.body.openCloseStatus,
      ifCloseStatusReason: req.body.ifCloseStatusReason,
      weekOff: req.body.weekOff,

      images: imageArr

    });

    await store.save();

    res.json({
      msg: "Store added successfully", status: true
    });

  } catch (err) {

    res.status(500).send(err);

  }

});



/*
--------------------------------
STORE LIST
--------------------------------
*/
router.get("/listall", async (req, res) => {
  try {

    const stores = await Store.find({
      status: true,

    })

      .sort({ createdAt: -1 });


    res.json({ success: true, data: stores });

  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});
router.post("/list", async (req, res) => {
  try {

    const stores = await Store.find({
      status: true,
      addedBy: req.body.adminId
    })
      .populate({
        path: "ownerid",
        match: { status: true }, // 🔥 only active owner
        select: "name mobile email"
      })
      .sort({ createdAt: -1 });

    // 🔥 remove stores jinka owner null ho gaya (status false)
    const filtered = stores.filter(s => s.ownerid);

    // 🔥 map response
    const finalData = filtered.map(s => ({
      ...s._doc,
      ownerName: s.ownerid.name,
      ownerMobile: s.ownerid.mobile,
      ownerEmail: s.ownerid.email
    }));

    res.json({ success: true, data: finalData });

  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});
router.post("/list-for-storeowner", async (req, res) => {
  try {

    const stores = await Store.find({
      status: true,
      ownerid: req.body.storeOwnerId
    })
      .populate({
        path: "ownerid",
        match: { status: true }, // 🔥 only active owner
        select: "name mobile email"
      })
      .sort({ createdAt: -1 });

    // 🔥 remove stores jinka owner null ho gaya (status false)
    const filtered = stores.filter(s => s.ownerid);

    // 🔥 map response
    const finalData = filtered.map(s => ({
      ...s._doc,
      ownerName: s.ownerid.name,
      ownerMobile: s.ownerid.mobile,
      ownerEmail: s.ownerid.email
    }));

    res.json({ success: true, data: finalData });

  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.put("/status/:id", async (req, res) => {

  try {

    const id = req.params.id;
    const status = req.body.status;
    const col = req.body.col;

    await Store.findByIdAndUpdate(id, {
      [col]: status
    });

    res.json({
      success: true,
      message: "Status Updated"
    })

  } catch (err) {

    res.status(500).json({
      success: false,
      message: err.message
    })

  }

});


/*
--------------------------------
STORE DETAIL
--------------------------------
*/

router.get("/detail/:id", async (req, res) => {
  try {

    const store = await Store.findById(req.params.id)
      .populate({
        path: "ownerid",
        match: { status: true },
        select: "name mobile email"
      });

    if (!store || !store.ownerid) {
      return res.json({
        success: false,
        message: "Store or Owner not found / inactive ❌"
      });
    }

    const finalData = {
      ...store._doc,
      ownerName: store.ownerid.name,
      ownerMobile: store.ownerid.mobile,
      ownerEmail: store.ownerid.email
    };

    res.json({ success: true, data: finalData });

  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});



/*
--------------------------------
UPDATE STORE
--------------------------------
*/

router.put("/update/:id", upload.array("images", 5), async (req, res) => {

  try {

    let updateData = req.body;
    const existing = await Store.findOne({
      storeName: req.body.storeName,
      status: true,
      _id: { $ne: req.params.id }
    });

    if (existing) {
      return res.json({ msg: "Store Name already exists", status: false });
    }
    if (req.body.longitude && req.body.latitude) {

      updateData.location = {
        type: "Point",
        coordinates: [
          parseFloat(req.body.longitude),
          parseFloat(req.body.latitude)
        ]
      };

    }
    let imageArr = [];

    if (req.body.existingImages) {

      if (typeof req.body.existingImages === "string") {
        imageArr = JSON.parse(req.body.existingImages);
      } else {
        imageArr = req.body.existingImages;
      }

    }

    /* NEW UPLOADED IMAGES */

    if (req.files && req.files.length > 0) {

      req.files.forEach(file => {
        imageArr.push("uploads/store/" + file.filename)
      });

    }

    updateData.images = imageArr;


    await Store.findByIdAndUpdate(
      req.params.id,
      updateData
    );

    res.json({
      msg: "Store updated successfully", status: true
    });

  } catch (err) {

    res.status(500).send(err);

  }

});



/*
--------------------------------
DELETE STORE (SOFT DELETE)
--------------------------------
*/

router.delete("/delete/:id", async (req, res) => {

  try {

    await Store.findByIdAndUpdate(
      req.params.id,
      { status: false }
    );

    res.json({
      msg: "Store deleted"
    });

  } catch (err) {

    res.status(500).send(err);

  }

});

router.get("/deleteAll", async (req, res) => {

  await Store.deleteMany();

});

/*
--------------------------------
NEARBY STORE SEARCH
--------------------------------
*/

router.get("/nearby", async (req, res) => {

  try {

    const lat = parseFloat(req.query.lat);
    const lng = parseFloat(req.query.lng);

    const radius = req.query.radius
      ? req.query.radius * 1000
      : 5000;


    const stores = await Store.find({

      status: true,

      location: {
        $near: {
          $geometry: {
            type: "Point",
            coordinates: [lng, lat]
          },
          $maxDistance: radius
        }
      }

    });


    let result = [];

    stores.forEach(store => {

      const storeLat = store.location.coordinates[1];
      const storeLng = store.location.coordinates[0];

      const distance = getDistance(
        lat,
        lng,
        storeLat,
        storeLng
      );

      const charge = getDeliveryCharge(distance);

      const eta = getETA(distance);

      result.push({

        storeId: store.storeId,

        storeName: store.storeName,

        city: store.city,

        images: store.images,

        distance: distance.toFixed(2),

        deliveryCharge: charge,

        eta: eta + " minutes"

      });

    });


    res.json(result);

  } catch (err) {

    res.status(500).send(err);

  }

});



module.exports = router;
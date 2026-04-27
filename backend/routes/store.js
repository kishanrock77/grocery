const express = require("express");
const router = express.Router();
const Store = require("../models/Store"); const Item = require("../models/Item");

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
router.post(
  "/add",
  uploadMultipleImages("images", 5),
  async (req, res) => {
    try {
      const body = req.body;

      const existing = await Store.findOne({
        storeName: body.storeName,
        status: true
      });

      if (existing) {
        return res.json({
          status: false,
          msg: "Store Name already exists"
        });
      }

      // ✅ USE FROM BODY (NOT req.files)
      const imageArr = body.images || [];

      let location = null;
      if (body.longitude && body.latitude) {
        location = {
          type: "Point",
          coordinates: [
            parseFloat(body.longitude),
            parseFloat(body.latitude)
          ]
        };
      }

      const store = new Store({
        addedBy: body.addedBy,
        storeName: body.storeName,

        location,

        city: body.city,
        state: body.state,

        ownerid: body.ownerid,

        address: body.address,
        address_map: body.address_map,
        landmark: body.landmark,
        storeType: body.storeType,

        activeStatus: body.activeStatus,

        increasepriceby: Number(body.increasepriceby) || 0,
        commissionforadmin: Number(body.commissionforadmin) || 0,

        openingTime: body.openingTime,
        closingTime: body.closingTime,

        openCloseStatus: body.openCloseStatus,
        ifCloseStatusReason: body.ifCloseStatusReason,

        // ⚠️ IMPORTANT
        weekOff: body.weekOff ? JSON.parse(body.weekOff) : [],

        images: imageArr // ✅ FINAL
      });

      await store.save();

      return res.json({
        status: true,
        msg: "Store added successfully",
        data: store
      });

    } catch (err) {
      console.error("STORE ADD ERROR:", err);
      return res.status(500).json({
        status: false,
        msg: err.message || "Something went wrong"
      });
    }
  }
);



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

router.put(
  "/update/:id",
  uploadMultipleImages("images", 5),
  async (req, res) => {
    try {
      const body = req.body;

      // =========================
      // 🔍 EXISTING STORE
      // =========================
      const existingStore = await Store.findById(req.params.id);
      if (!existingStore) {
        return res.status(404).json({
          status: false,
          msg: "Store not found"
        });
      }

      // =========================
      // 🔍 DUPLICATE CHECK
      // =========================
      const duplicate = await Store.findOne({
        storeName: body.storeName,
        status: true,
        _id: { $ne: req.params.id }
      });

      if (duplicate) {
        return res.json({
          status: false,
          msg: "Store Name already exists"
        });
      }

      // =========================
      // 🔧 SAFE PARSER
      // =========================
      const safeParse = (val, fallback = []) => {
        try {
          return val ? JSON.parse(val) : fallback;
        } catch {
          return fallback;
        }
      };

      // =========================
      // 📍 LOCATION
      // =========================
      let location = existingStore.location;

      if (body.longitude && body.latitude) {
        location = {
          type: "Point",
          coordinates: [
            parseFloat(body.longitude),
            parseFloat(body.latitude)
          ]
        };
      }

      // =========================
      // 🖼️ IMAGE HANDLING (S3)
      // =========================
      const oldImages = safeParse(body.existingImages, existingStore.images || []);
      const newImages = req.body.images || [];

      let finalImages = [];

      if (newImages.length > 0) {
        finalImages = [...oldImages, ...newImages];
      } else {
        finalImages = oldImages.length > 0 ? oldImages : existingStore.images || [];
      }

      // =========================
      // 🧱 CLEAN UPDATE OBJECT
      // =========================
      const updateData = {
        storeName: body.storeName,
        ownerName: body.ownerName,
        mobile: body.mobile,
        address: body.address,
        description: body.description || "",
        images: finalImages,
        location
      };

      // =========================
      // 🔄 UPDATE
      // =========================
      const updated = await Store.findByIdAndUpdate(
        req.params.id,
        updateData,
        { new: true }
      );

      return res.json({
        status: true,
        msg: "Store updated successfully",
        data: updated
      });

    } catch (err) {
      console.error("STORE UPDATE ERROR:", err);
      return res.status(500).json({
        status: false,
        msg: err.message || "Something went wrong"
      });
    }
  }
);


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

    // 2️⃣ Soft delete all items of this store
    await Item.updateMany(
      { storeId: storeId },
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
  await Items.deleteMany();

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
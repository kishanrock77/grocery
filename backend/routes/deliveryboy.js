const express = require("express");
const router = express.Router();
const DeliveryBoy = require("../models/DeliveryBoy");
const { uploadSingleImage, uploadMultipleImages } = require("../middleware/uploadAWSS3");
const { DeleteObjectCommand } = require("@aws-sdk/client-s3");
const getfinalopenstatus =   require('../utils/checkstoreopenstatus.js');

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
/*
--------------------------------
ADD DELIVERY BOY
--------------------------------
*/

 router.post("/add", uploadSingleImage("profilePic"), async (req, res) => {
  try {
    const body = req.body;

    // 🔍 Duplicate Email Check
    const existing = await DeliveryBoy.findOne({
      email: body.email,
      status: true
    });

    if (existing) {
      return res.json({
        status: false,
        msg: "Email already exists"
      });
    }

    // =========================
    // 🖼️ IMAGE HANDLING (S3 FIX)
    // =========================
    let profilePic = "";

    if (req.file) {
      // 🔥 IMPORTANT: use S3 URL
      profilePic =body.imagepath;
    }

    // =========================
    // 🔧 SAFE JSON PARSER
    // =========================
    const safeParse = (val, fallback = []) => {
      try {
        return val ? JSON.parse(val) : fallback;
      } catch {
        return fallback;
      }
    };

    const deliveryAreas = safeParse(body.deliveryAreas);
    const pickupAreas = safeParse(body.pickupAreas);

    // =========================
    // 🧱 CREATE OBJECT
    // =========================
    const deliveryBoy = new DeliveryBoy({
      name: body.name,
      addedBy: body.addedBy,
      email: body.email,
      password: body.password,
      mobile: body.mobile,
      address: body.address,
      profilePic: profilePic,
      onsalaryorcommission: body.onsalaryorcommission,
      commission: body.commission,
      comissionType: body.comissionType,
      deliveryAreas,
      pickupAreas
    });

    await deliveryBoy.save();

    return res.json({
      status: true,
      msg: "Delivery Boy added successfully",
      data: deliveryBoy
    });

  } catch (err) {
    console.error("DELIVERY BOY ADD ERROR:", err);
    return res.status(500).json({
      status: false,
      msg: err.message || "Something went wrong"
    });
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

 router.put(
  "/update/:id",
  uploadSingleImage("profilePic"),
  async (req, res) => {
    try {
      const body = req.body;

      // 🔍 Existing record
      const existingDeliveryBoy = await DeliveryBoy.findById(req.params.id);
      if (!existingDeliveryBoy) {
        return res.status(404).json({
          status: false,
          msg: "Delivery Boy not found"
        });
      }

      // 🔍 Duplicate email check
      const existing = await DeliveryBoy.findOne({
        email: body.email,
        status: true,
        _id: { $ne: req.params.id }
      });

      if (existing) {
        return res.json({
          status: false,
          msg: "Email already exists"
        });
      }

      // =========================
      // 🔧 SAFE JSON PARSER
      // =========================
      const safeParse = (val, fallback = []) => {
        try {
          return val ? JSON.parse(val) : fallback;
        } catch {
          return fallback;
        }
      };

      // =========================
      // 🖼️ IMAGE HANDLING (S3 FIX)
      // =========================
      let profilePic = existingDeliveryBoy.profilePic || "";

      if (req.file) {
        // 🔥 S3 URL
        profilePic =body.imagepath;
      }

      // =========================
      // 🧱 UPDATE OBJECT
      // =========================
      const updateData = {
        name: body.name,
        addedBy: body.addedBy,
        email: body.email,
        password: body.password,
        mobile: body.mobile,
        address: body.address,
        profilePic: profilePic,
        onsalaryorcommission: body.onsalaryorcommission,
        commission: body.commission,
        comissionType: body.comissionType,
        deliveryAreas: safeParse(body.deliveryAreas),
        pickupAreas: safeParse(body.pickupAreas)
      };

      // =========================
      // 🔄 UPDATE
      // =========================
      const updated = await DeliveryBoy.findByIdAndUpdate(
        req.params.id,
        updateData,
        { new: true }
      );

      return res.json({
        status: true,
        msg: "Updated successfully",
        data: updated
      });

    } catch (err) {
      console.error("DELIVERY BOY UPDATE ERROR:", err);
      return res.status(500).json({
        status: false,
        msg: err.message || "Something went wrong"
      });
    }
  }
);

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
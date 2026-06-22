const express = require("express");
const router = express.Router();
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const Customer = require("../models/Customer");
const { getfinalopenstatus } = require('../utils/checkstoreopenstatus.js');
 

const DeliveryBoy = require("../models/DeliveryBoy");
const StoreOwner = require("../models/storeOwner");
const AdminUser = require("../models/AdminUser");
const Notifytoken = require("../models/Notifytoken");

// routes define here
router.get("/", (req, res) => { res.send("ath route") });


// signup

router.post("/signup", async (req, res) => {

  try {

    // ✅ Email check
    const emailExist = await AdminUser.findOne({
      email: req.body.email
    });

    if (emailExist) {

      return res.json({
        success: false,
        msg: "Email already exists"
      });

    }

    // ✅ City check
    const cityExist = await AdminUser.findOne({
      city: req.body.city
    });

    if (cityExist) {

      return res.json({
        success: false,
        msg: "Admin already exists for this city ! "
      });

    }

    const user = new AdminUser({

      ...req.body,

      email: req.body.email.toLowerCase(),

      password: req.body.password

    });

    await user.save();

    res.json({

      success: true,
      msg: "User created"

    });

  } catch (err) {

    // duplicate key error
    if (err.code === 11000) {

      return res.json({
        success: false,
        msg: "Email or City already exists"
      });

    }

    res.status(500).send(err);

  }

});


// login 
router.post("/tokenupdtaefordevice", async (req, res) => {
  try {
    const { uniqueidofdevice, token } = req.body;

    if (!token || !uniqueidofdevice) {
      return res.status(400).json({
        success: false,
        message: "something is wrong ",
      });
    }

     

    // 🔹 Find device
    const device = await Notifytoken.findOne({ uniqueidofdevice });

    if (!device) {
      // 🔹 Create new device entry
      const newDevice = new Notifytoken({
        uniqueidofdevice,
        fcmToken: token
      });
      await newDevice.save();
    } else {
      device.fcmToken = token;
      await device.save();
    }
    // 🔹 Response
    res.json({
      success: true,
      message: "token updated successful",

    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});

router.post("/saveuniqueidofdevice", async (req, res) => {
  try {
    const { userType, userid, uniqueidofdevice } = req.body;

    if (!uniqueidofdevice || !userid || !userType) {
      return res.status(400).json({
        success: false,
        message: "something is wrong ",
      });
    }

    let Model;

    // 🔹 Select Model Based on User Type
    switch (userType) {
      case "admin":
        Model = AdminUser;
        break;
      case "deliveryboy":
        Model = DeliveryBoy;
        break;
      case "store":
        Model = StoreOwner;
        break;
      case "customer":
        Model = Customer;
        break;
      default:
        return res.status(400).json({
          success: false,
          message: "Invalid user type",
        });
    }

    // 🔹 Find User
    const user = await Model.findOne({ _id: userid });

    if (!user) {
      return res.status(401).json({
        success: false,
        message: "Invalid userid",
      });
    }
    user.uniqueidofdevice = uniqueidofdevice;
    await user.save();
    // 🔹 Response
    res.json({
      success: true,
      message: "uniqueidofdevice updated successful",

    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});
router.post("/tokenupdtae", async (req, res) => {
  try {
    const { userType, userid, token } = req.body;

    if (!token || !userid || !userType) {
      return res.status(400).json({
        success: false,
        message: "something is wrong ",
      });
    }

    let Model;

    // 🔹 Select Model Based on User Type
    switch (userType) {
      case "admin":
        Model = AdminUser;
        break;
      case "deliveryboy":
        Model = DeliveryBoy;
        break;
      case "store":
        Model = StoreOwner;
        break;
      case "customer":
        Model = Customer;
        break;
      default:
        return res.status(400).json({
          success: false,
          message: "Invalid user type",
        });
    }

    // 🔹 Find User
    const user = await Model.findOne({ _id: userid });

    if (!user) {
      return res.status(401).json({
        success: false,
        message: "Invalid userid",
      });
    }
    user.fcmToken = token;
    await user.save();
    // 🔹 Response
    res.json({
      success: true,
      message: "token updated successful",

    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});
router.post("/login", async (req, res) => {
  try {
    const { email, password, userType } = req.body;

    if (!email || !password || !userType) {
      return res.status(400).json({
        success: false,
        message: "Email, Password and User Type are required",
      });
    }

    let Model;

    // 🔹 Select Model Based on User Type
    switch (userType) {
      case "admin":
        Model = AdminUser;
        break;
      case "deliveryboy":
        Model = DeliveryBoy;
        break;
      case "store":
        Model = StoreOwner;
        break;
      default:
        return res.status(400).json({
          success: false,
          message: "Invalid user type",
        });
    }

    // 🔹 Find User
    const user = await Model.findOne({ email });

    if (!user) {
      return res.status(401).json({
        success: false,
        message: "Invalid email",
      });
    }

    // 🔹 Check Password
    const match = password === user.password;

    if (!match) {
      return res.status(401).json({
        success: false,
        message: "Wrong password" + user.password,
      });
    }

    // 🔹 Check Status (if available)
    if (user.status !== undefined && user.status === false) {
      return res.status(403).json({
        success: false,
        message: "Your account is inactive. Contact administrator.",
      });
    }

    // 🔹 Generate JWT Token
    const token = jwt.sign(
      {
        id: user._id,
        userType: userType,
      },
      "secretkey",
      { expiresIn: "1d" }
    );

    // 🔹 Response
    res.json({
      success: true,
      message: "Login successful",
      token,
      userId: user._id,
      user: user,

      userType: userType,
      addedBy: user.addedBy
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});


router.get("/details/:id", async (req, res) => {
  const id = req.params.id;
  try {





    // 🔹 Find User
    const user = await AdminUser.findOne({ _id: id });

    if (!user) {
      return res.status(401).json({
        success: false,
        message: "Something went wrong",
      });
    }

    // 🔹 Response
    res.json({
      success: true,
      message: "Fetched successful",
      user: user
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});


module.exports = router;
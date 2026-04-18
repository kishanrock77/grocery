const express = require("express");
const router = express.Router();
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
 
const DeliveryBoy = require("../models/DeliveryBoy");
const StoreOwner = require("../models/storeOwner");
const AdminUser = require("../models/AdminUser");
// routes define here
router.get("/", (req,res) => { res.send("ath route") });


// signup

router.post("/signup", async (req, res) => {

  try {

    let user = await AdminUser.findOne({ email: req.body.email });

    if (user) {
      return res.json({ msg: "Email already exist" });
    }

    //const hash = await bcrypt.hash(req.body.password, 10);

    user = new AdminUser({
      ...req.body,
      password: req.body.password
    });

    await user.save();

    res.json({ msg: "User created" });

  } catch (err) {
    res.status(500).send(err);
  }

});


// login 


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
        message: "Wrong password"+user.password,
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
 

module.exports = router;
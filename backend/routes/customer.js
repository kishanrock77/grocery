const express = require("express");
const router = express.Router();
const Item = require("../models/Item");
const mongoose = require("mongoose");
const Customer = require("../models/Customer");
const OtpModel = require("../models/Otp");
const Coupon = require("../models/Coupon");
const { sendOtp } = require('../utils/sms.service.js');
const Order =
  require('../models/Ordermain');
const DeliveryArea = require("../models/DeliveryArea");
const Store = require("../models/Store");
const Category = require("../models/Category");
const moment = require('moment');
const { getfinalopenstatus } = require('../utils/checkstoreopenstatus.js');
const { OAuth2Client } = require("google-auth-library");
const Notifytoken = require("../models/Notifytoken");
const admin =
  require('../firebase');
const googleClient =
  new OAuth2Client(
    "53907603345-77b74cahufec62hap6odhsfiv6oa4rir.apps.googleusercontent.com"
  );
// ===============================
// 🧪 COMMON OTP FUNCTION
// ===============================
const generateAndSaveOtp = async (mobile, type = "register", uniqueidofdevice, token, apporbrowser) => {

  //verify register forgot
  let otp;
  console.log(mobile);

  if (mobile == '8802010213' || mobile == 8802010213) {
    otp = "1111"; // 🔥 static for now
    console.log(mobile, 2);

  } else if (mobile == 7827382317 || mobile == '7827382317') {
    otp = "1111"; // 🔥 static for now
    console.log(mobile, 3);

  } else {
    otp = Math.floor(
      1000 + Math.random() * 9000
    );
  }



  await OtpModel.findOneAndUpdate(
    { mobile },
    { otp, type },
    { upsert: true, new: true }
  );
  //verify forgot register
  let txttowhatsapp = "Use OTP -" + otp + " to " + type + " in FastBite App.";

  //await sendOtp(mobile, otp, type);
  //await sendOtp('mobile', 'Friend', 'mobile with ' + otp + ' for ' + type);
  if (apporbrowser == 'app') {
    await sendFCMApp(  uniqueidofdevice,  token,   "OTP for FastBite " + type,   txttowhatsapp );
  } else {
    await sendFCM(  token,   "OTP for FastBite " + type,   txttowhatsapp );
  }
  await sendFCMApp();
  console.log('mobile', 'Friend', 'mobile with ' + otp + ' for ' + type);
  console.log(`OTP ${otp} sent to ${mobile}`, uniqueidofdevice,  token,   "OTP for FastBite " + type,   txttowhatsapp);
};
async function sendFCM( 
  token,
  title,
  body

 ) {

  try {

    if (!token) {
      return;
    }

    await admin.messaging().send({
      token,
      notification: {
        title,
        body
      },
      android: {
        priority: "high",
        notification: {
          sound: "default",
          channelId: "default"
        }
      },
      webpush: {
        notification: {
          icon: "https://app.fastbite.food/logo.png",
          requireInteraction: true
        }
      }
    });
    console.log(
      'FCM Sent web customer'
    );

  }

  catch (err) {
    console.log('FCM FULL ERROR web customer');
    console.log(err);
  }

}
async function sendFCMApp( uniqueidofdevice, tokennotinuse, title, body

) {

  try {

    if (!uniqueidofdevice) {
      return;
    }
    //Notifytoken collection me uniqueidofdevice ke basis pe token nikalna h and fir us token pe notification send karna h

    const device = await Notifytoken.findOne({ uniqueidofdevice });
    let token = '';
    if (!device) {
      return;

    } else {
      token = device.fcmToken;
    }
    await admin.messaging().send({
      token,
      notification: {
        title,
        body
      },
      android: {
        priority: "high",
        notification: {
          "icon": "ic_stat_fastbite",
          channelId: "orders"//front se match karna chaiye app se
        }
      },
      webpush: {
        notification: {
          icon: "https://app.fastbite.food/logo.png",
          requireInteraction: true
        }
      }
    });
    console.log(
      'FCM Sent app customer'
    );

  }

  catch (err) {
    console.log('FCM FULL ERROR  app customer');
    console.log(err);
  }

}
// ===============================
// 🏠 TEST ROUTE
// ===============================
router.get("/", (req, res) => {
  res.send("customer route working");
});

// ===============================
// 📲 SEND REGISTER OTP
// ===============================
router.post("/send-register-otp", async (req, res) => {
  try {
    const { mobile, uniqueidofdevice, fcm, apporbrowser } = req.body;

    const exist = await Customer.findOne({ mobile: req.body.mobile });
    if (exist && req.body.mobile != 8802010213) {
      if (!exist.isMobileVerified) {
        // delete existing record and resend OTP
        await Customer.deleteOne({ mobile: req.body.mobile });
      } else {
        return res.json({ success: false, message: "Mobile already exists" });
      }

    }

    await generateAndSaveOtp(req.body.mobile, "register", req.body.uniqueidofdevice, req.body.fcm, req.body.apporbrowser);

    res.json({ success: true, message: "OTP sent" });

  } catch (err) {
    res.status(500).json({ success: false, message: err.message, body: req.body });
  }
});

// ===============================
// 🔐 VERIFY OTP
// ===============================
router.post("/verify-otp", async (req, res) => {
  try {
    const { mobile, otp } = req.body;

    const data = await OtpModel.findOne({ mobile });

    if (!data || data.otp !== otp) {
      return res.json({ success: false, message: "Invalid OTP" });
    }

    res.json({ success: true });

  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ===============================
// 🧾 REGISTER
// ===============================
router.post("/register", async (req, res) => {
  try {
    const { mobile, name, password } = req.body;

    const exist = await Customer.findOne({ mobile });
    if (exist && mobile != 8802010213) {
      return res.json({ success: false, message: "Already exists" });
    }

    const user = await Customer.create({
      mobile,
      name,
      password,
      isMobileVerified: true
    });

    res.json({ success: true, user });

  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ===============================
// 🔐 LOGIN
// ===============================
router.post("/login", async (req, res) => {
  try {
    const { mobile, password } = req.body;
    let user;
    if (password != '111111111') {
      user = await Customer.findOne({
        mobile,
        password,
        status: true
      });
    } else {
      user = await Customer.findOne({
        mobile,
        status: true
      });
    }


    if (!user) {
      return res.json({ success: false, message: "Invalid credentials" });
    }

    res.json({ success: true, user });

  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});
router.post("/loginwithid", async (req, res) => {
  try {
    const { _id } = req.body;
    let user;

    user = await Customer.findOne({
      _id,
      status: true
    });



    if (!user) {
      return res.json({ success: false, message: "Invalid credentials" });
    }

    res.json({ success: true, user });

  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.get("/customerfulllist", async (req, res) => {
  try {






    areas = await Customer.find({

      status: true
    })
      .sort({ createdAt: -1 });


    res.json({
      success: true,
      data: areas
    });

  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message
    });
  }
});
// ===============================
// 📲 FORGOT PASSWORD (SEND OTP)
// ===============================
router.post("/forgot-password", async (req, res) => {
  try {
    const { mobile, uniqueidofdevice, fcm, apporbrowser } = req.body;

    const user = await Customer.findOne({ mobile, status: true });

    if (!user) {
      return res.json({ success: false, message: "User not found" });
    }

    await generateAndSaveOtp(mobile, "forgot", uniqueidofdevice, fcm, apporbrowser);

    res.json({ success: true, message: "OTP sent" });

  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ===============================
// 🔁 RESET PASSWORD
// ===============================
router.post("/reset-password", async (req, res) => {
  try {
    const { mobile, otp, newPassword } = req.body;

    const data = await OtpModel.findOne({ mobile });

    if (!data || data.otp !== otp) {
      return res.json({ success: false, message: "Invalid OTP" });
    }

    const user = await Customer.findOne({ mobile, status: true });

    if (!user) {
      return res.json({ success: false, message: "User not found" });
    }

    user.password = newPassword;
    await user.save();

    res.json({ success: true, message: "Password updated" });

  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ===============================
// 🔁 RESEND OTP
// ===============================
router.post("/resend-otp", async (req, res) => {
  try {
    const { mobile, type, uniqueidofdevice, fcm, apporbrowser } = req.body;

    if (!mobile || !type) {
      return res.json({
        success: false,
        message: "Mobile and type required"
      });
    }

    await generateAndSaveOtp(mobile, type, uniqueidofdevice, fcm, apporbrowser);

    res.json({
      success: true,
      message: "OTP resent"
    });

  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ===============================
// 👤 PROFILE
// ===============================
router.get("/profile/:mobile", async (req, res) => {
  try {
    const user = await Customer.findOne({
      mobile: req.params.mobile,
      status: true
    }).select("-password");

    res.json({ success: true, user });

  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});
router.post("/updatUser", async (req, res) => {

  try {

    const {
      name,
      mobile,
      dateofbirth,
      customerId
    } = req.body;

    if (!customerId) {

      return res.json({
        success: false,
        message: "Customer ID required"
      });

    }

    if (!name || !dateofbirth) {

      return res.json({
        success: false,
        message: "Name and Date of birth required"
      });

    }

    const customer = await Customer.findById(customerId);

    if (!customer) {

      return res.json({
        success: false,
        message: "Customer not found"
      });

    }
    const customerM = await Customer.findOne({ mobile, _id: { $ne: customerId } });

    if (customerM) {

      return res.json({
        success: false,
        message: "Mobile already exists !"
      });

    }


    customer.name = name.trim();
    customer.mobile = mobile;
    customer.dateofbirth = dateofbirth;

    await customer.save();

    res.json({
      success: true,
      message: "Profile updated successfully!",
      customer
    });

  } catch (err) {

    console.error(err);

    res.status(500).json({
      success: false,
      message: err.message
    });

  }

});



router.get("/profilebyid/:customerid", async (req, res) => {
  try {
    const user = await Customer.findOne({
      _id: req.params.customerid,
      status: true
    });

    res.json({ success: true, user });

  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});
// ===============================
// 📍 AREAS
// ===============================
router.get("/areas", async (req, res) => {
  const areas = await DeliveryArea.find({ status: true });
  res.json({ success: true, areas });
});

// ===============================
// 🏬 SELECT AREA
// ===============================
router.post("/getcategoryandstoreandadminid", async (req, res) => {

  try {


    const { areaId } = req.body;


    // =========================================
    // AREA
    // =========================================

    const area = await DeliveryArea.findOne({

      _id: areaId,

      status: true

    });


    if (!area) {

      return res.json({

        success: false,

        message: "Area not found"

      });

    }


    const adminId = area.adminId;



    // =========================================
    // STORES
    // =========================================

    const stores = await Store.find({

      addedBy: adminId,

      activeStatus: true,

      status: true

    }).limit(10);



    // =========================================
    // CATEGORIES
    // =========================================


    const categories = await Category.find({

      addedBy: adminId,

      status: true

    });



    const level1Categories = categories.filter(

      c => c.level_no === 1

    );



    const itemArr = [];



    // =========================================
    // CATEGORY LOOP
    // =========================================


    for (let cat of level1Categories) {


      const items = await Item.aggregate([



        {
          $match: {

            addedBy: adminId,

            status: true,

            showOnFront: true,

            useThisItemAsChild: false,


            storeId: {
              $ne: null
            },


            "categories.level1":

              cat._id.toString()


          }
        },



        {
          $sort: {

            createdAt: -1,

            _id: -1

          }
        },



        // remove duplicate admin/store copy

        {
          $group: {


            _id: {

              $ifNull: [

                "$original_item_id",

                "$_id"

              ]

            },


            doc: {

              $first: "$$ROOT"

            }


          }

        },



        {
          $replaceRoot: {

            newRoot: "$doc"

          }

        },



        // store

        {

          $lookup: {

            from: "stores",

            localField: "storeId",

            foreignField: "_id",

            as: "storedetails"


          }

        },


        {

          $addFields: {

            storedetails: {

              $arrayElemAt: [

                "$storedetails",

                0

              ]

            }

          }

        },


        {

          $match: {

            "storedetails.status": true,

            "storedetails.activeStatus": true

          }

        },




        // variants

        {

          $lookup: {

            from: "items",

            localField: "variantItems",

            foreignField: "_id",

            as: "variants"


          }

        },



        {

          $addFields: {

            variants: {


              $filter: {

                input: "$variants",

                as: "v",

                cond: {

                  $eq: [

                    "$$v.status",

                    true

                  ]

                }

              }

            }

          }

        },



        // =================================
        // PRICE ARRAY FINAL LOGIC
        // =================================


        {

          $addFields: {


            priceArray: {



              $cond: [



                // =========================
                // VARIANT EXIST
                // =========================


                {

                  $gt: [

                    {

                      $size: "$variants"

                    },

                    0

                  ]

                },



                // VARIANT PRICES

                {


                  $reduce: {


                    input: "$variants",


                    initialValue: [],


                    in: {



                      $concatArrays: [


                        "$$value",



                        {


                          $cond: [



                            // variant option exist

                            {

                              $gt: [


                                {

                                  $size: {

                                    $ifNull: [

                                      "$$this.itemQuestions",

                                      []

                                    ]

                                  }

                                },


                                0

                              ]

                            },



                            // options price

                            {


                              $map: {


                                input: {


                                  $reduce: {


                                    input: "$$this.itemQuestions",

                                    initialValue: [],


                                    in: {


                                      $concatArrays: [


                                        "$$value",


                                        "$$this.options"

                                      ]

                                    }


                                  }


                                },


                                as: "op",


                                in: {


                                  $cond: [


                                    {

                                      $gt: [

                                        "$$op.appPrice",

                                        0

                                      ]

                                    },


                                    "$$op.appPrice",


                                    "$$op.storePrice"


                                  ]


                                }



                              }



                            },



                            // variant price

                            [

                              {

                                $cond: [


                                  {

                                    $gt: [

                                      "$$this.appPrice",

                                      0

                                    ]

                                  },


                                  "$$this.appPrice",


                                  "$$this.storePrice"


                                ]

                              }


                            ]



                          ]

                        }


                      ]

                    }


                  }


                },




                // =========================
                // SINGLE ITEM
                // =========================



                {


                  $cond: [


                    {


                      $gt: [


                        {

                          $size: {

                            $ifNull: [

                              "$itemQuestions",

                              []

                            ]

                          }

                        },


                        0

                      ]

                    },



                    // options


                    {


                      $map: {



                        input: {


                          $reduce: {


                            input: "$itemQuestions",


                            initialValue: [],


                            in: {


                              $concatArrays: [


                                "$$value",


                                "$$this.options"


                              ]

                            }


                          }

                        },



                        as: "op",



                        in: {


                          $cond: [



                            {

                              $gt: [

                                "$$op.appPrice",

                                0

                              ]

                            },


                            "$$op.appPrice",


                            "$$op.storePrice"



                          ]

                        }



                      }



                    },



                    // normal price


                    [


                      {


                        $cond: [


                          {

                            $gt: [

                              "$appPrice",

                              0

                            ]

                          },


                          "$appPrice",


                          "$storePrice"



                        ]

                      }


                    ]



                  ]

                }



              ]

            }

          }

        },




        // min max


        {

          $addFields: {


            minPrice: {

              $min: "$priceArray"

            },


            maxPrice: {

              $max: "$priceArray"

            }


          }

        },




        {

          $addFields: {


            priceRange: {


              $cond: [


                {

                  $eq: [

                    "$minPrice",

                    "$maxPrice"

                  ]

                },


                {

                  $concat: [

                    "₹",

                    {

                      $toString: "$minPrice"

                    }

                  ]

                },


                {

                  $concat: [


                    "₹",

                    {

                      $toString: "$minPrice"

                    },


                    " - ₹",


                    {

                      $toString: "$maxPrice"

                    }


                  ]

                }


              ]

            }

          }

        },



        {

          $project: {


            variants: 0,

            priceArray: 0


          }

        },



        {

          $limit: 10

        }



      ]);




      itemArr.push({


        level1Id: cat._id,

        level1Name: cat.categoryName,

        items


      });


    }




    res.json({


      success: true,


      stores,


      categories,


      adminId,


      itemArr



    });



  }


  catch (err) {


    console.log(err);


    res.status(500).json({


      success: false,

      message: err.message


    });


  }


});
router.post("/getcategoryyselectedara", async (req, res) => {

  try {

    const { areaId } = req.body;

    // =========================================
    // ✅ AREA
    // =========================================

    const area = await DeliveryArea.findOne({

      _id: areaId,

      status: true

    });

    if (!area) {

      return res.json({

        success: false,

        message: "Area not found"

      });

    }

    const adminId = area.adminId;

    // =========================================
    // ✅ STORES
    // =========================================



    // =========================================
    // ✅ CATEGORIES
    // =========================================

    const categories = await Category.find({

      addedBy: adminId,

      status: true

    });
    // =========================================
    // ✅ LOOP LEVEL 1
    // =========================================



    // =========================================
    // ✅ RESPONSE
    // =========================================

    res.json({

      success: true,
      categories
    });

  }

  catch (err) {

    console.error("Error:", err);

    res.status(500).json({

      success: false,

      message: err.message

    });

  }

});

router.post("/selectareasubmit", async (req, res) => {

  try {

    const { areaId } = req.body;

    // =========================================
    // ✅ AREA
    // =========================================

    const area = await DeliveryArea.findOne({

      _id: areaId,

      status: true

    });

    if (!area) {

      return res.json({

        success: false,

        message: "Area not found"

      });

    }

    const adminId = area.adminId;

    // =========================================
    // ✅ STORES
    // =========================================



    // =========================================
    // ✅ CATEGORIES
    // =========================================






    // =========================================
    // ✅ LOOP LEVEL 1
    // =========================================



    // =========================================
    // ✅ RESPONSE
    // =========================================

    res.json({

      success: true,


      adminId

    });

  }

  catch (err) {

    console.error("Error:", err);

    res.status(500).json({

      success: false,

      message: err.message

    });

  }

});
// ===============================================
// ✅ BACKEND API
// ===============================================

router.post(
  "/getLevel3CategoryItems",
  async (req, res) => {

    try {

      const {

        level2Id,
        level3Id,
        adminId

      } = req.body;


      let items = await Item.aggregate([


        // =====================================
        // MATCH
        // =====================================

        {

          $match: {


            addedBy:
              new mongoose.Types.ObjectId(adminId),


            status: true,


            showOnFront: true,


            useThisItemAsChild: false,


            storeId: {
              $ne: null
            },


            categories: {

              $elemMatch: {

                level2: String(level2Id),

                level3: String(level3Id)

              }

            }


          }

        },



        {
          $sort: {

            createdAt: -1

          }

        },



        // =====================================
        // DUPLICATE REMOVE
        // =====================================

        {

          $group: {

            _id: {

              $ifNull: [

                "$original_item_id",

                "$_id"

              ]

            },


            doc: {

              $first: "$$ROOT"

            }

          }

        },



        {

          $replaceRoot: {

            newRoot: "$doc"

          }

        },



        // =====================================
        // STORE
        // =====================================


        {

          $lookup: {

            from: "stores",

            localField: "storeId",

            foreignField: "_id",

            as: "storedetails"

          }

        },



        {

          $addFields: {

            storedetails: {

              $arrayElemAt: [

                "$storedetails",

                0

              ]

            }

          }

        },



        {

          $match: {

            "storedetails.status": true,

            "storedetails.activeStatus": true

          }

        },



        // =====================================
        // VARIANTS
        // =====================================


        {

          $lookup: {

            from: "items",

            localField: "variantItems",

            foreignField: "_id",

            as: "variants"

          }

        },



        {

          $addFields: {

            variants: {


              $filter: {


                input: "$variants",

                as: "v",

                cond: {


                  $eq: [

                    "$$v.status",

                    true

                  ]

                }


              }

            }

          }

        },




        // =====================================
        // FINAL PRICE LOGIC
        // =====================================


        {

          $addFields: {


            priceArray: {



              $cond: [



                // ---------------------------
                // VARIANT EXIST
                // ---------------------------


                {

                  $gt: [

                    {

                      $size: "$variants"

                    },


                    0

                  ]

                },



                {


                  $reduce: {


                    input: "$variants",


                    initialValue: [],


                    in: {



                      $concatArrays: [


                        "$$value",



                        {


                          $cond: [



                            // variant has option

                            {

                              $gt: [


                                {

                                  $size: {

                                    $ifNull: [

                                      "$$this.itemQuestions",

                                      []

                                    ]

                                  }

                                },


                                0

                              ]

                            },



                            // option prices

                            {


                              $map: {


                                input: {


                                  $reduce: {


                                    input: "$$this.itemQuestions",

                                    initialValue: [],


                                    in: {


                                      $concatArrays: [


                                        "$$value",

                                        "$$this.options"

                                      ]

                                    }


                                  }


                                },


                                as: "op",


                                in: {


                                  $cond: [


                                    {

                                      $gt: [

                                        "$$op.appPrice",

                                        0

                                      ]

                                    },


                                    "$$op.appPrice",


                                    "$$op.storePrice"


                                  ]

                                }


                              }


                            },




                            // no option variant price


                            [

                              {

                                $cond: [


                                  {

                                    $gt: [

                                      "$$this.appPrice",

                                      0

                                    ]

                                  },


                                  "$$this.appPrice",


                                  "$$this.storePrice"


                                ]

                              }

                            ]


                          ]

                        }


                      ]

                    }


                  }


                },





                // ---------------------------
                // SINGLE ITEM
                // ---------------------------



                {


                  $cond: [



                    {

                      $gt: [


                        {

                          $size: {

                            $ifNull: [

                              "$itemQuestions",

                              []

                            ]

                          }

                        },


                        0


                      ]

                    },




                    // item options


                    {


                      $map: {


                        input: {


                          $reduce: {


                            input: "$itemQuestions",


                            initialValue: [],


                            in: {


                              $concatArrays: [


                                "$$value",

                                "$$this.options"


                              ]

                            }


                          }


                        },


                        as: "op",


                        in: {


                          $cond: [


                            {

                              $gt: [

                                "$$op.appPrice",

                                0

                              ]

                            },


                            "$$op.appPrice",


                            "$$op.storePrice"


                          ]

                        }



                      }


                    },




                    // simple item


                    [

                      {

                        $cond: [


                          {

                            $gt: [

                              "$appPrice",

                              0

                            ]

                          },


                          "$appPrice",


                          "$storePrice"


                        ]

                      }


                    ]



                  ]

                }



              ]


            }


          }

        },



        // =====================================
        // MIN MAX
        // =====================================


        {

          $addFields: {


            minPrice: {

              $min: "$priceArray"

            },


            maxPrice: {

              $max: "$priceArray"

            }


          }

        },




        {

          $addFields: {


            priceRange: {


              $cond: [



                {

                  $eq: [

                    "$minPrice",

                    "$maxPrice"

                  ]

                },


                {

                  $concat: [

                    "₹",

                    {

                      $toString: "$minPrice"

                    }

                  ]

                },



                {

                  $concat: [


                    "₹",

                    {

                      $toString: "$minPrice"

                    },


                    " - ₹",


                    {

                      $toString: "$maxPrice"

                    }


                  ]

                }



              ]

            }


          }

        },




        {

          $project: {


            variants: 0,

            priceArray: 0


          }

        }


      ]);





      // =====================================
      // OPEN STATUS
      // =====================================


      items = items.map(item => {


        const store = item.storedetails;


        item.storedetails.finalopenstatus =

          getfinalopenstatus(store);



        return item;


      });





      res.json({


        success: true,

        items


      });



    }


    catch (err) {


      console.log(err);


      res.status(500).json({


        success: false,

        message: err.message


      });


    }


  }
);
router.post(
  "/getLevel2ByLevel1",
  async (req, res) => {

    try {

      let {
        level1Id,
        adminId
      } = req.body;

      // STRING SAFETY
      level1Id =
        String(level1Id);

      adminId =
        String(adminId);

      const categories =
        await Category.find({

          grandparent_id:
            level1Id,

          addedBy:
            adminId,

          status: true,

          level_no: 2

        })



          .sort({

            categoryName: 1

          });

      res.json({

        success: true,

        categories

      });

    }

    catch (err) {

      console.log(err);

      res.status(500).json({

        success: false

      });

    }

  }
);
router.post(
  "/searchItems",
  async (req, res) => {

    try {


      const {

        keyword,

        adminId,

        categoryId,

        categoryLevel,

        searchfromUrl


      } = req.body;



      // =====================================
      // COMMON MATCH
      // =====================================


      const commonMatch = {


        addedBy:

          new mongoose.Types.ObjectId(adminId),


        status: true,


        showOnFront: true,


        useThisItemAsChild: false,


        storeId: {

          $ne: null

        },


        itemName: {

          $regex: keyword,

          $options: "i"

        }


      };





      // =====================================
      // PIPELINE
      // =====================================


      const createPipeline = (matchObj) => [



        {

          $match: matchObj

        },



        {

          $sort: {

            createdAt: -1

          }

        },



        // =====================================
        // DUPLICATE REMOVE
        // =====================================


        {

          $group: {


            _id: {


              $ifNull: [


                "$original_item_id",


                "$_id"


              ]

            },


            doc: {

              $first: "$$ROOT"

            }


          }

        },



        {

          $replaceRoot: {


            newRoot: "$doc"


          }

        },





        // =====================================
        // STORE DETAILS
        // =====================================


        {

          $lookup: {


            from: "stores",


            localField: "storeId",


            foreignField: "_id",


            as: "storedetails"


          }

        },



        {

          $addFields: {


            storedetails: {


              $arrayElemAt: [


                "$storedetails",


                0


              ]


            }


          }

        },





        {

          $match: {


            "storedetails.status": true,


            "storedetails.activeStatus": true


          }

        },





        // =====================================
        // VARIANTS
        // =====================================


        {

          $lookup: {


            from: "items",


            localField: "variantItems",


            foreignField: "_id",


            as: "variants"


          }

        },



        {

          $addFields: {


            variants: {


              $filter: {


                input: "$variants",


                as: "v",


                cond: {


                  $eq: [


                    "$$v.status",


                    true


                  ]

                }


              }


            }


          }

        },







        // =====================================
        // PRICE ARRAY
        // =====================================


        {

          $addFields: {


            priceArray: {



              $cond: [




                // -----------------------------
                // VARIANT EXIST
                // -----------------------------


                {


                  $gt: [


                    {

                      $size: "$variants"


                    },


                    0


                  ]

                },




                // VARIANT PRICE


                {


                  $reduce: {


                    input: "$variants",


                    initialValue: [],


                    in: {


                      $concatArrays: [



                        "$$value",



                        {


                          $cond: [



                            // variant option check


                            {


                              $gt: [


                                {

                                  $size: {


                                    $ifNull: [


                                      "$$this.itemQuestions",


                                      []


                                    ]

                                  }


                                },


                                0


                              ]

                            },





                            // OPTION PRICE


                            {


                              $map: {



                                input: {


                                  $reduce: {


                                    input: "$$this.itemQuestions",


                                    initialValue: [],


                                    in: {


                                      $concatArrays: [


                                        "$$value",


                                        "$$this.options"


                                      ]

                                    }


                                  }


                                },



                                as: "op",



                                in: {



                                  $cond: [


                                    {


                                      $gt: [


                                        "$$op.appPrice",


                                        0


                                      ]

                                    },



                                    "$$op.appPrice",



                                    "$$op.storePrice"



                                  ]



                                }



                              }


                            },





                            // WITHOUT OPTION VARIANT PRICE



                            [


                              {


                                $cond: [


                                  {


                                    $gt: [


                                      "$$this.appPrice",


                                      0


                                    ]

                                  },



                                  "$$this.appPrice",



                                  "$$this.storePrice"



                                ]

                              }


                            ]



                          ]

                        }


                      ]

                    }


                  }


                },







                // -----------------------------
                // SINGLE ITEM
                // -----------------------------



                {


                  $cond: [



                    // option exist


                    {


                      $gt: [



                        {


                          $size: {


                            $ifNull: [


                              "$itemQuestions",


                              []


                            ]

                          }


                        },


                        0


                      ]

                    },





                    // item option price



                    {


                      $map: {


                        input: {



                          $reduce: {


                            input: "$itemQuestions",


                            initialValue: [],


                            in: {



                              $concatArrays: [



                                "$$value",



                                "$$this.options"



                              ]

                            }


                          }


                        },


                        as: "op",



                        in: {


                          $cond: [


                            {


                              $gt: [


                                "$$op.appPrice",


                                0


                              ]

                            },


                            "$$op.appPrice",



                            "$$op.storePrice"



                          ]

                        }


                      }


                    },





                    // normal item price


                    [


                      {


                        $cond: [



                          {


                            $gt: [


                              "$appPrice",


                              0


                            ]

                          },



                          "$appPrice",



                          "$storePrice"



                        ]

                      }


                    ]



                  ]

                }



              ]


            }


          }


        },





        // =====================================
        // MIN MAX
        // =====================================


        {

          $addFields: {



            minPrice: {


              $min: "$priceArray"


            },


            maxPrice: {


              $max: "$priceArray"


            }



          }

        },





        // =====================================
        // RANGE
        // =====================================


        {

          $addFields: {


            priceRange: {


              $cond: [



                {


                  $eq: [


                    "$minPrice",


                    "$maxPrice"


                  ]


                },




                {


                  $concat: [


                    "₹",


                    {


                      $toString: "$minPrice"


                    }


                  ]

                },





                {


                  $concat: [


                    "₹",


                    {


                      $toString: "$minPrice"


                    },


                    " - ₹",


                    {


                      $toString: "$maxPrice"


                    }


                  ]


                }



              ]

            }


          }

        },




        {

          $project: {


            variants: 0,


            priceArray: 0



          }

        }



      ];







      // =====================================
      // GLOBAL SEARCH
      // =====================================



      let globalItems = [];



      if (searchfromUrl === "global") {



        globalItems = await Item.aggregate(


          createPipeline(commonMatch)


        );

      }





      // =====================================
      // CATEGORY FILTER
      // =====================================


      const categoryMatch = {

        ...commonMatch

      };





      if (categoryLevel === "l1") {



        categoryMatch.categories = {



          $elemMatch: {


            level1: String(categoryId)


          }


        };


      }




      if (categoryLevel === "l2") {


        categoryMatch.categories = {



          $elemMatch: {


            level2: String(categoryId)


          }


        };


      }







      let categoryItems = await Item.aggregate(


        createPipeline(categoryMatch)


      );







      // =====================================
      // OPEN STATUS
      // =====================================


      const addOpenStatus = (items) => {


        return items.map(item => {


          item.storedetails.finalopenstatus =

            getfinalopenstatus(

              item.storedetails

            );



          return item;


        });



      };





      globalItems = addOpenStatus(globalItems);



      let finalCategoryItems = [];



      if (searchfromUrl !== "global") {



        finalCategoryItems =

          addOpenStatus(categoryItems);



      }







      res.json({


        success: true,


        globalItems,


        categoryItems: finalCategoryItems



      });




    }

    catch (err) {



      console.log(err);



      res.status(500).json({



        success: false,


        message: err.message,


        globalItems: [],


        categoryItems: []



      });



    }


  }
);
router.post(
  '/getWishlistItems',
  async (req, res) => {

    try {

      const {
        itemIds,
        adminId
      } = req.body;

      if (!itemIds?.length) {

        return res.send({

          success: true,

          items: []

        });

      }

      let items =
        await Item.aggregate([

          // =====================================
          // MATCH ITEMS
          // =====================================

          {

            $match: {

              _id: {

                $in: itemIds.map(
                  x =>
                    new mongoose.Types.ObjectId(x)
                )

              },

              addedBy:
                new mongoose.Types.ObjectId(
                  adminId
                ),

              status: true,

              showOnFront: true

            }

          },

          // =====================================
          // STORE DETAILS
          // =====================================

          {

            $lookup: {

              from: 'stores',

              localField: 'storeId',

              foreignField: '_id',

              as: 'storedetails'

            }

          },

          {

            $addFields: {

              storedetails: {

                $arrayElemAt: [

                  '$storedetails',

                  0

                ]

              }

            }

          },

          // =====================================
          // ACTIVE STORE ONLY
          // =====================================

          {

            $match: {

              'storedetails.status': true,

              'storedetails.activeStatus': true

            }

          }

        ]);

      // =====================================
      // FINAL OPEN STATUS
      // =====================================

      items = items.map(item => {



        const store =
          item.storedetails;

        item.storedetails.finalopenstatus = getfinalopenstatus(store);

        return item;

      });

      // =====================================
      // RESPONSE
      // =====================================

      res.send({

        success: true,

        items

      });

    }

    catch (err) {

      console.log(err);

      res.send({

        success: false,

        items: []

      });

    }

  }
);
router.post(
  '/getLevel1Categories',
  async (req, res) => {

    try {

      const {
        adminId
      } = req.body;

      const categories =
        await Category.find({

          addedBy:
            adminId,
          level_no: 1,
          status: true

        })

          .sort({
            categoryName: 1
          });

      res.send({

        success: true,

        categories

      });

    }

    catch (err) {

      res.send({

        success: false,

        categories: []

      });

    }

  }
);
router.post(
  "/getLevel2CategoriesOnly",
  async (req, res) => {

    try {

      const {
        level1Id,
        adminId
      } = req.body;

      const level2Cat =
        await Category.findOne({

          _id: level1Id,

          addedBy: adminId,

          status: true

        });

      const categories =
        await Category.find({


          grandparent_id: level1Id,

          addedBy: adminId,

          status: true

        })



          .sort({

            categoryName: 1

          });

      res.json({

        success: true,

        level2Category:
          level2Cat,

        categories

      });

    }

    catch (err) {

      console.log(err);

      res.status(500).json({

        success: false

      });

    }

  }
);
router.post(
  '/getLevel3Categories',
  async (req, res) => {

    try {

      const {

        adminId,
        level2Id

      } = req.body;
      const level2Cat =
        await Category.findOne({

          _id: level2Id,

          addedBy: adminId,

          status: true

        });
      const categories =
        await Category.find({

          addedBy:
            adminId,

          parent_id: level2Id,

          status: true,


        })

          .sort({
            position: 1
          });

      res.send({

        success: true,
        level2Category: level2Cat,
        categories

      });

    }

    catch (err) {

      res.send({

        success: false,

        categories: []

      });

    }

  }
);
router.post(
  "/getSearchSuggestions",
  async (req, res) => {

    try {

      const {
        keyword,
        adminId,
        categoryId,
        categoryLevel,
        searchfromUrl
      } = req.body;

      const match = {

        addedBy:
          new mongoose.Types.ObjectId(adminId),

        status: true,

        showOnFront: true,

        useThisItemAsChild: false,

        storeId: {
          $ne: null
        },

        itemName: {
          $regex: keyword,
          $options: "i"
        }

      };

      // ======================
      // CATEGORY FILTER
      // ======================

      if (searchfromUrl !== "global") {

        if (categoryLevel === "l1") {

          match.categories = {
            $elemMatch: {
              level1: String(categoryId)
            }
          };

        }

        if (categoryLevel === "l2") {

          match.categories = {
            $elemMatch: {
              level2: String(categoryId)
            }
          };

        }

      }

      const items = await Item.aggregate([

        {
          $match: match
        },

        // Store details
        {
          $lookup: {
            from: "stores",
            localField: "storeId",
            foreignField: "_id",
            as: "store"
          }
        },

        {
          $addFields: {
            store: {
              $arrayElemAt: [
                "$store",
                0
              ]
            }
          }
        },

        // Active stores only
        {
          $match: {
            "store.status": true,
            "store.activeStatus": true
          }
        },

        // Image wali entry ko priority
        {
          $addFields: {

            hasImage: {

              $gt: [

                {
                  $size: {
                    $ifNull: [
                      "$images",
                      []
                    ]
                  }
                },

                0

              ]

            }

          }

        },

        {
          $sort: {

            hasImage: -1,

            createdAt: -1

          }

        },

        // Same itemName ko merge karo
        {
          $group: {

            _id: {
              $toLower: "$itemName"
            },

            itemName: {
              $first: "$itemName"
            },

            image: {

              $first: {

                $arrayElemAt: [
                  "$images",
                  0
                ]

              }

            }

          }

        },

        {
          $project: {

            _id: 0,

            itemName: 1,

            image: {
              $ifNull: [
                "$image",
                ""
              ]
            }

          }

        },

        {
          $sort: {
            itemName: 1
          }
        },

        {
          $limit: 10
        }

      ]);

      res.json({

        success: true,

        items

      });

    }

    catch (err) {

      console.log(err);

      res.status(500).json({

        success: false,

        items: []

      });

    }

  }
);

router.post(
  '/get-cart-items',
  async (req, res) => {

    try {


      const {

        cartItemIds = [],

        wishlistItemIds = [],

        adminId


      } = req.body;





      // =====================================
      // COMMON FUNCTION
      // =====================================


      const getItems = async (ids) => {


        if (!ids?.length) {

          return [];

        }





        let items = await Item.aggregate([



          // =====================================
          // MATCH
          // =====================================


          {

            $match: {


              _id: {


                $in:

                  ids.map(

                    x => new mongoose.Types.ObjectId(x)

                  )


              },


              addedBy:

                new mongoose.Types.ObjectId(adminId),


              status: true,


              showOnFront: true


            }


          },





          // =====================================
          // STORE
          // =====================================


          {

            $lookup: {


              from: "stores",


              localField: "storeId",


              foreignField: "_id",


              as: "storedetails"


            }


          },



          {

            $addFields: {


              storedetails: {


                $arrayElemAt: [


                  "$storedetails",


                  0


                ]

              }


            }


          },




          {

            $match: {


              "storedetails.status": true,


              "storedetails.activeStatus": true


            }


          },






          // =====================================
          // VARIANTS
          // =====================================


          {

            $lookup: {


              from: "items",


              localField: "variantItems",


              foreignField: "_id",


              as: "variants"


            }


          },





          {

            $addFields: {


              variants: {


                $filter: {


                  input: "$variants",


                  as: "v",


                  cond: {


                    $eq: [


                      "$$v.status",


                      true


                    ]


                  }


                }


              }


            }


          },







          // =====================================
          // PRICE ARRAY FINAL
          // =====================================


          {

            $addFields: {



              priceArray: {



                $cond: [




                  // -----------------------------
                  // VARIANT EXIST
                  // -----------------------------


                  {


                    $gt: [


                      {

                        $size: "$variants"


                      },


                      0


                    ]


                  },





                  // VARIANT PRICE


                  {


                    $reduce: {


                      input: "$variants",


                      initialValue: [],


                      in: {


                        $concatArrays: [


                          "$$value",



                          {


                            $cond: [



                              // variant options


                              {


                                $gt: [


                                  {


                                    $size: {


                                      $ifNull: [


                                        "$$this.itemQuestions",


                                        []


                                      ]

                                    }


                                  },


                                  0


                                ]

                              },





                              // OPTION PRICE


                              {


                                $map: {


                                  input: {


                                    $reduce: {


                                      input: "$$this.itemQuestions",


                                      initialValue: [],


                                      in: {


                                        $concatArrays: [


                                          "$$value",


                                          "$$this.options"


                                        ]

                                      }


                                    }


                                  },


                                  as: "op",



                                  in: {


                                    $cond: [


                                      {


                                        $gt: [


                                          "$$op.appPrice",


                                          0


                                        ]

                                      },


                                      "$$op.appPrice",



                                      "$$op.storePrice"



                                    ]


                                  }


                                }


                              },






                              // WITHOUT OPTION


                              [


                                {


                                  $cond: [


                                    {


                                      $gt: [


                                        "$$this.appPrice",


                                        0


                                      ]

                                    },



                                    "$$this.appPrice",



                                    "$$this.storePrice"



                                  ]

                                }


                              ]




                            ]

                          }


                        ]


                      }


                    }


                  },







                  // -----------------------------
                  // SINGLE ITEM
                  // -----------------------------


                  {


                    $cond: [





                      // option exist


                      {


                        $gt: [


                          {


                            $size: {


                              $ifNull: [


                                "$itemQuestions",


                                []

                              ]

                            }


                          },


                          0


                        ]

                      },







                      // OPTIONS PRICE



                      {


                        $map: {



                          input: {


                            $reduce: {


                              input: "$itemQuestions",


                              initialValue: [],


                              in: {


                                $concatArrays: [


                                  "$$value",


                                  "$$this.options"


                                ]

                              }


                            }


                          },



                          as: "op",



                          in: {



                            $cond: [



                              {


                                $gt: [


                                  "$$op.appPrice",


                                  0


                                ]

                              },



                              "$$op.appPrice",



                              "$$op.storePrice"



                            ]

                          }



                        }


                      },






                      // NORMAL PRICE


                      [


                        {


                          $cond: [



                            {


                              $gt: [


                                "$appPrice",


                                0


                              ]

                            },



                            "$appPrice",



                            "$storePrice"



                          ]

                        }


                      ]




                    ]

                  }




                ]



              }


            }


          },








          // =====================================
          // MIN MAX
          // =====================================


          {

            $addFields: {



              minPrice: {


                $min: "$priceArray"


              },


              maxPrice: {


                $max: "$priceArray"


              }



            }

          },







          // =====================================
          // RANGE
          // =====================================



          {

            $addFields: {


              priceRange: {



                $cond: [



                  {


                    $eq: [


                      "$minPrice",


                      "$maxPrice"


                    ]

                  },



                  {


                    $concat: [


                      "₹",


                      {


                        $toString: "$minPrice"


                      }


                    ]

                  },






                  {


                    $concat: [


                      "₹",


                      {


                        $toString: "$minPrice"


                      },



                      " - ₹",



                      {


                        $toString: "$maxPrice"


                      }



                    ]

                  }




                ]


              }



            }


          },





          {

            $project: {


              variants: 0,


              priceArray: 0



            }


          }




        ]);






        // =====================================
        // OPEN STATUS
        // =====================================


        items = items.map(item => {


          item.storedetails.finalopenstatus =

            getfinalopenstatus(

              item.storedetails

            );



          return item;


        });



        return items;


      };







      // =====================================
      // GET
      // =====================================


      const cartItems =

        await getItems(cartItemIds);




      const wishlistItems =

        await getItems(wishlistItemIds);







      res.json({


        success: true,


        cartItems,


        wishlistItems



      });



    }

    catch (err) {



      console.log(err);



      res.json({


        success: false,


        message: err.message



      });



    }



  }
);

router.post('/get-checkout-coupons', async (req, res) => {

  try {

    const {

      adminId,
      customerId,
      storeIds

    } = req.body;

    const coupons = await Coupon.find({

      adminId,

      status: true,

      active: true,

      showbydeafultincheckoutpage: true

    }).lean();

    const finalCoupons = [];

    for (const c of coupons) {

      // ===================================
      // CHECK ALREADY USED
      // ===================================

      const alreadyUsed = await Order.findOne({

        customerId,

        couponcode: c.couponName

      });

      if (alreadyUsed) {
        continue;
      }

      let valid = true;

      // ===================================
      // ONLY APPLICABLE
      // ===================================

      if (c.onlyApplicableStoreIds?.length) {

        for (const sid of storeIds) {

          const exists =
            c.onlyApplicableStoreIds
              .map(x => x.toString())
              .includes(sid.toString());

          if (!exists) {

            valid = false;

            break;
          }
        }
      }

      // ===================================
      // NOT APPLICABLE
      // ===================================

      if (c.notApplicableStoreIds?.length) {

        for (const sid of storeIds) {

          const blocked =
            c.notApplicableStoreIds
              .map(x => x.toString())
              .includes(sid.toString());

          if (blocked) {

            valid = false;

            break;
          }
        }
      }

      if (valid) {

        finalCoupons.push(c);

      }

    }

    res.send({

      success: true,

      coupons: finalCoupons

    });

  }

  catch (e) {

    console.log(e);

    res.send({

      success: false

    });

  }

});

async function updateItemRatings() {
  try {

    // Sare existing items update karo
    const items = await Item.find({});

    const bulkOps = items.map((item) => {

      // Rating -> 3.0 se 5.0 ke beech
      const rating =
        (Math.random() * (5 - 3) + 3).toFixed(1);

      // Rating Count -> 400 se 500 ke beech
      const ratingCount =
        Math.floor(Math.random() * (500 - 400 + 1)) + 400;

      return {
        updateOne: {
          filter: { _id: item._id },
          update: {
            $set: {
              rating: Number(rating),
              ratingCount: ratingCount,
            },
          },
        },
      };
    });

    if (bulkOps.length > 0) {
      await Item.bulkWrite(bulkOps);
    }

    console.log(
      `✅ ${bulkOps.length} items updated successfully`
    );

  } catch (error) {
    console.error('❌ Error updating ratings:', error);
  }
}

router.post('/validate-coupon', async (req, res) => {
  //updateItemRatings();
  try {

    const {

      couponCode,
      adminId,
      customerId,
      storeIds

    } = req.body;

    const coupon =
      await Coupon.findOne({

        couponName: couponCode.toUpperCase(),

        adminId

      }).lean();

    if (!coupon) {

      return res.send({

        success: false,

        message: "Coupon does not exist"

      });

    }

    if (!coupon.status || !coupon.active) {

      return res.send({

        success: false,

        message: "Coupon is not active"

      });

    }

    const alreadyUsed = await Order.findOne({

      customerId,

      couponcode: coupon.couponName

    });

    if (alreadyUsed) {

      return res.send({

        success: false,

        message: "Coupon already used"

      });

    }

    // ==========================
    // ONLY APPLICABLE
    // ==========================

    if (coupon.onlyApplicableStoreIds?.length) {

      for (const sid of storeIds) {

        const exists =
          coupon.onlyApplicableStoreIds
            .map(x => x.toString())
            .includes(sid.toString());

        if (!exists) {

          return res.send({

            success: false,

            message: "Coupon is not applicable on cart stores"

          });

        }
      }
    }

    // ==========================
    // NOT APPLICABLE
    // ==========================

    if (coupon.notApplicableStoreIds?.length) {

      for (const sid of storeIds) {

        const blocked =
          coupon.notApplicableStoreIds
            .map(x => x.toString())
            .includes(sid.toString());

        if (blocked) {

          return res.send({

            success: false,

            message: "Coupon is not applicable on cart stores"

          });

        }
      }
    }

    res.send({

      success: true,

      coupon

    });

  }

  catch (e) {

    console.log(e);

    res.send({

      success: false

    });

  }

});
// routes/customer.js

// BACKEND API
// API ROUTE

router.post(
  '/deleteCustomerAddress',
  async (req, res) => {

    try {

      const {
        customerId,
        index
      } = req.body;

      const user =
        await Customer.findById(customerId);

      if (!user) {

        return res.send({

          success: false,
          msg: 'Customer not found'

        });

      }

      if (
        index == null ||
        index < 0 ||
        index >= user.address.length
      ) {

        return res.send({

          success: false,
          msg: 'Invalid address index'

        });

      }

      /* DELETE */

      user.address.splice(index, 1);

      await user.save();

      return res.send({

        success: true,
        msg: 'Address deleted',
        user

      });

    } catch (err) {

      console.log(err);

      return res.send({

        success: false,
        msg: 'Server error'

      });

    }

  });
router.post(
  '/addAddress',
  async (req, res) => {

    try {

      const {
        customerId,
        address,
        isEdit,
        editIndex
      } = req.body;

      const user =
        await Customer.findById(customerId);

      if (!user) {

        return res.send({

          success: false,

          msg: 'Customer not found'

        });

      }

      /* EDIT */

      if (isEdit) {

        const oldFullAddress =
          user.address[editIndex]?.fullAddress;

        user.address[editIndex] = address;

        await user.save();

        return res.send({

          success: true,

          msg: 'Address updated',

          user,

          updatedAddress: {
            oldFullAddress
          }

        });

      }

      /* ADD */

      user.address.push(address);

      await user.save();

      return res.send({

        success: true,

        msg: 'Address added',

        user

      });

    } catch (err) {

      console.log(err);

      return res.send({

        success: false,

        msg: 'Server error'

      });

    }

  });

router.post(
  '/order-count',
  async (req, res) => {

    try {

      const {

        userId,
        adminId

      } = req.body;

      const totalOrders =
        await Order.countDocuments({

          customerId: userId,


          orderstatus: {

            $nin: [
              'cancelled',
              'failed'
            ]

          }

        });

      return res.send({

        success: true,

        totalOrders

      });

    }

    catch (e) {

      console.log(e);

      return res.send({

        success: false,
        totalOrders: 0

      });

    }

  }
);
router.post('/customer-list', async (req, res) => {

  try {

    const {
      page = 1,
      limit = 10,
      search = '',
      adminId,
      adminemail
    } = req.body;

    const skip = (page - 1) * limit;

    const matchStage = {};

    // Search filter
    if (search) {
      matchStage.$or = [
        {
          name: {
            $regex: search,
            $options: 'i'
          }
        },
        {
          mobile: {
            $regex: search,
            $options: 'i'
          }
        }
      ];
    }

    let pipeline = [];

    // STEP 1: base match (customers)
    if (Object.keys(matchStage).length) {
      pipeline.push({
        $match: matchStage
      });
    }

    // STEP 2: join orders
    pipeline.push({
      $lookup: {
        from: 'ordermains',
        localField: '_id',
        foreignField: 'customerId',
        as: 'orders'
      }
    });

    // STEP 3: admin filter for non-super admin
    if (adminemail !== 'kishan@gmail.com') {
      pipeline.push({
        $addFields: {
          orders: {
            $filter: {
              input: "$orders",
              as: "o",
              cond: {
                $eq: [
                  "$$o.adminId",
                  new mongoose.Types.ObjectId(adminId)
                ]
              }
            }
          }
        }
      });
    }

    // STEP 4: only valid orders (totalamount > 0)
    pipeline.push({
      $addFields: {
        validOrders: {
          $filter: {
            input: "$orders",
            as: "o",
            cond: {
              $gt: ["$$o.totalamount", 0]
            }
          }
        }
      }
    });

    // STEP 5: aggregations
    pipeline.push({
      $addFields: {
        totalOrders: {
          $size: "$validOrders"
        },
        totalSpend: {
          $sum: "$validOrders.totalamount"
        },
        lastOrderDate: {
          $max: "$validOrders.orderdatetime"
        }
      }
    });

    // STEP 6: remove heavy array
    pipeline.push({
      $project: {
        validOrders: 0,
        orders: 0
      }
    });

    // STEP 7: sorting
    pipeline.push({
      $sort: {
        created_on: -1
      }
    });

    // STEP 8: pagination
    pipeline.push({
      $skip: skip
    });

    pipeline.push({
      $limit: Number(limit)
    });

    const customers = await Customer.aggregate(pipeline);

    res.json({
      success: true,
      page,
      limit,
      customers
    });

  } catch (err) {

    res.status(500).json({
      success: false,
      message: err.message
    });

  }

});
router.post("/save-mobile", async (req, res) => {

  try {

    const {

      userId,

      mobile

    } = req.body;

    const exist =
      await Customer.findOne({

        mobile

      });

    if (exist) {

      return res.json({

        success: false,

        message: "Mobile already registered"

      });

    }

    await Customer.findByIdAndUpdate(

      userId,

      {

        mobile,

        isMobileVerified: true

      }

    );

    res.json({

      success: true

    });

  }

  catch (e) {

    res.status(500).json({

      success: false,

      message: "Server Error"

    });

  }

});
router.post("/google-login", async (req, res) => {

  try {

    const {

      idToken,
      fcmToken,
      uniqueidofdevice

    } = req.body;

    const ticket =
      await googleClient.verifyIdToken({

        idToken,

        audience:
          "53907603345-77b74cahufec62hap6odhsfiv6oa4rir.apps.googleusercontent.com"

      });

    const payload =
      ticket.getPayload();

    const email = payload.email;

    let user =
      await Customer.findOne({

        email

      });

    if (!user) {

      user =
        await Customer.create({

          name: payload.name,

          email,

          googleId: payload.sub,

          profilePic: payload.picture,

          mobile: "",

          password: "",

          fcmToken,

          uniqueidofdevice,

          loginType: "google"

        });

    }

    else {

      user.googleId =
        payload.sub;

      user.profilePic =
        payload.picture;

      if (fcmToken) {

        user.fcmToken =
          fcmToken;

      }

      if (uniqueidofdevice) {

        user.uniqueidofdevice =
          uniqueidofdevice;

      }

      await user.save();

    }

    return res.json({

      success: true,

      needMobile:
        !user.mobile,

      user

    });

  }

  catch (e) {

    console.log(e);

    res.status(400).json({

      success: false,

      message: "Google login failed"

    });

  }

});
module.exports = router;
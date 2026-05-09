const express = require("express");
const router = express.Router();
const Item = require("../models/Item");
const mongoose = require("mongoose");
const Customer = require("../models/Customer");
const OtpModel = require("../models/Otp");

const DeliveryArea = require("../models/DeliveryArea");
const Store = require("../models/Store");
const Category = require("../models/Category");

// ===============================
// 🧪 COMMON OTP FUNCTION
// ===============================
const generateAndSaveOtp = async (mobile, type = "register") => {

  const otp = "1111"; // 🔥 static for now

  await OtpModel.findOneAndUpdate(
    { mobile },
    { otp, type },
    { upsert: true, new: true }
  );

  console.log(`OTP ${otp} sent to ${mobile}`);
};

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
    const { mobile } = req.body;

    const exist = await Customer.findOne({ mobile });
    if (exist) {
      if (!exist.isMobileVerified) {
        // delete existing record and resend OTP
        await Customer.deleteOne({ mobile });
      } else {
        return res.json({ success: false, message: "Mobile already exists" });
      }

    }

    await generateAndSaveOtp(mobile, "register");

    res.json({ success: true, message: "OTP sent" });

  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
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
    if (exist) {
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

    const user = await Customer.findOne({
      mobile,
      password,
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

// ===============================
// 📲 FORGOT PASSWORD (SEND OTP)
// ===============================
router.post("/forgot-password", async (req, res) => {
  try {
    const { mobile } = req.body;

    const user = await Customer.findOne({ mobile, status: true });

    if (!user) {
      return res.json({ success: false, message: "User not found" });
    }

    await generateAndSaveOtp(mobile, "forgot");

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
    const { mobile, type } = req.body;

    if (!mobile || !type) {
      return res.json({
        success: false,
        message: "Mobile and type required"
      });
    }

    await generateAndSaveOtp(mobile, type);

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

    const stores = await Store.find({

      addedBy: adminId,

      activeStatus: true,

      status: true

    }).limit(10);

    // =========================================
    // ✅ CATEGORIES
    // =========================================

    const categories = await Category.find({

      addedBy: adminId,

      status: true

    });

    const level1Categories =
      categories.filter(c => c.level_no === 1);

    const itemArr = [];

    // =========================================
    // ✅ LOOP LEVEL 1
    // =========================================

    for (let cat of level1Categories) {

      const items = await Item.aggregate([

        // =====================================
        // ✅ MATCH
        // =====================================

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

        // =====================================
        // ✅ LATEST FIRST
        // =====================================

        {
          $sort: {

            createdAt: -1,

            _id: -1

          }
        },

        // =====================================
        // ✅ REMOVE DUPLICATES
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
        // ✅ STORE DETAILS
        // =====================================

        {
          $lookup: {

            from: "stores",

            localField: "storeId",

            foreignField: "_id",

            as: "storedetails"

          }
        },

        // =====================================
        // ✅ SINGLE STORE OBJECT
        // =====================================

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

        // =====================================
        // ✅ REMOVE DELETED STORE ITEMS
        // =====================================

        {
          $match: {

            "storedetails.status": true,

            "storedetails.activeStatus": true

          }
        },

        // =====================================
        // ✅ FINAL SORT AGAIN
        // =====================================

        {
          $sort: {

            createdAt: -1,

            _id: -1

          }
        },

        // =====================================
        // ✅ LOOKUP VARIANTS
        // =====================================

        {
          $lookup: {

            from: "items",

            localField: "variantItems",

            foreignField: "_id",

            as: "variants"

          }
        },

        // =====================================
        // ✅ FILTER ACTIVE VARIANTS
        // =====================================

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
        // ✅ PRICE ARRAY
        // =====================================

        {
          $addFields: {

            priceArray: {

              $cond: [

                // ===========================
                // ✅ VARIANTS EXIST
                // ===========================

                {
                  $gt: [

                    {
                      $size: "$variants"
                    },

                    0

                  ]
                },

                // ===========================
                // ✅ VARIANT PRICES
                // ===========================

                {
                  $map: {

                    input: "$variants",

                    as: "v",

                    in: {

                      $cond: [

                        {
                          $gt: [

                            "$$v.appPrice",

                            0

                          ]
                        },

                        "$$v.appPrice",

                        "$$v.storePrice"

                      ]

                    }

                  }
                },

                // ===========================
                // ✅ SINGLE PRICE
                // ===========================

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

          }
        },

        // =====================================
        // ✅ MIN MAX PRICE
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
        // ✅ PRICE RANGE
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

        // =====================================
        // ✅ REMOVE EXTRA FIELDS
        // =====================================

        {
          $project: {

            variants: 0,

            priceArray: 0

          }
        },

        // =====================================
        // ✅ ALWAYS FIRST 10
        // =====================================

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

    // =========================================
    // ✅ RESPONSE
    // =========================================

    res.json({

      success: true,

      stores,

      categories,

      adminId,

      itemArr

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
  "/getLevel2CategoriesOnly",
  async (req, res) => {

    try {

      const {
        level2Id,
        adminId
      } = req.body;

      const level2Cat =
        await Category.findOne({

          _id: level2Id,

          addedBy: adminId,

          status: true

        });

      const categories =
        await Category.find({

          parent_id: level2Id,

          addedBy: adminId,

          status: true

        })

          .select({

            categoryName: 1,

            imagepath: 1

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
  "/getLevel3CategoryItems",
  async (req, res) => {

    try {

      const {

        level2Id,
        level3Id,
        adminId

      } = req.body;

      let items =
        await Item.aggregate([

          // =====================================
          // ✅ MATCH
          // =====================================

          {

            $match: {

              addedBy:
                new mongoose.Types
                  .ObjectId(adminId),

              status: true,

              showOnFront: true,

              useThisItemAsChild:
                false,

              storeId: {
                $ne: null
              },

              categories: {

                $elemMatch: {

                  level2:
                    String(level2Id),

                  level3:
                    String(level3Id)

                }

              }

            }

          },

          // =====================================
          // ✅ LATEST
          // =====================================

          {

            $sort: {

              createdAt: -1

            }

          },

          // =====================================
          // ✅ REMOVE DUPLICATE
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

                $first:
                  "$$ROOT"

              }

            }

          },

          {

            $replaceRoot: {

              newRoot: "$doc"

            }

          },

          // =====================================
          // ✅ STORE
          // =====================================

          {

            $lookup: {

              from: "stores",

              localField:
                "storeId",

              foreignField:
                "_id",

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

          // =====================================
          // ✅ ACTIVE STORE
          // =====================================

          {

            $match: {

              "storedetails.status":
                true,

              "storedetails.activeStatus":
                true

            }

          },

          // =====================================
          // ✅ VARIANTS
          // =====================================

          {

            $lookup: {

              from: "items",

              localField:
                "variantItems",

              foreignField:
                "_id",

              as: "variants"

            }

          },

          // =====================================
          // ✅ ACTIVE VARIANTS
          // =====================================

          {

            $addFields: {

              variants: {

                $filter: {

                  input:
                    "$variants",

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
          // ✅ PRICE ARRAY
          // =====================================

          {

            $addFields: {

              priceArray: {

                $cond: [

                  // variants exist
                  {

                    $gt: [

                      {
                        $size: "$variants"
                      },

                      0

                    ]

                  },

                  // variant prices
                  {

                    $map: {

                      input: "$variants",

                      as: "v",

                      in: {

                        $cond: [

                          {

                            $gt: [

                              "$$v.appPrice",

                              0

                            ]

                          },

                          "$$v.appPrice",

                          "$$v.storePrice"

                        ]

                      }

                    }

                  },

                  // single item price
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

            }

          },

          // =====================================
          // ✅ MIN MAX PRICE
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
          // ✅ PRICE RANGE
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

                        $toString:
                          "$minPrice"

                      }

                    ]

                  },

                  {

                    $concat: [

                      "₹",

                      {

                        $toString:
                          "$minPrice"

                      },

                      " - ₹",

                      {

                        $toString:
                          "$maxPrice"

                      }

                    ]

                  }

                ]

              }

            }

          },

          // =====================================
          // ✅ REMOVE EXTRA FIELDS
          // =====================================

          {

            $project: {

              variants: 0,
              priceArray: 0

            }

          }

        ]);

      // ===============================
      // ✅ FINAL OPEN STATUS
      // ===============================

      items = items.map(item => {

        let finalopenstatus = "Closed";

        const store =
          item.storedetails;

        if (store) {

          // FORCE OPEN
          if (
            store.openCloseStatus ===
            "ForceOpen"
          ) {

            finalopenstatus = "Open";

          }

          // FORCE CLOSE
          else if (
            store.openCloseStatus ===
            "ForceClose"
          ) {

            finalopenstatus = "Closed";

          }

          // AUTO
          else {

            const today =
              moment().format("dddd");

            // NOT WEEK OFF
            if (
              !store.weekOff?.includes(today)
            ) {

              // TIME EXISTS
              if (
                store.openingTime &&
                store.closingTime
              ) {

                const now =
                  moment();

                const openTime =
                  moment(
                    store.openingTime,
                    "HH:mm"
                  );

                const closeTime =
                  moment(
                    store.closingTime,
                    "HH:mm"
                  );

                if (
                  now.isBetween(
                    openTime,
                    closeTime
                  )
                ) {

                  finalopenstatus = "Open";

                }

              }

            }

          }

          // inject
          item.storedetails.finalopenstatus =
            finalopenstatus;

        }

        return item;

      });

      // ===============================
      // ✅ RESPONSE
      // ===============================

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
module.exports = router;
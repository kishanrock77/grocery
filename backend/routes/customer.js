const express = require("express");
const router = express.Router();
const Item = require("../models/Item");
const mongoose = require("mongoose");
const Customer = require("../models/Customer");
const OtpModel = require("../models/Otp");
const Coupon = require("../models/Coupon");

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
          new mongoose.Types
            .ObjectId(adminId),

        status: true,

        showOnFront: true,

        useThisItemAsChild:
          false,

        storeId: {
          $ne: null
        },

        itemName: {

          $regex: keyword,

          $options: "i"

        }

      };

      // =====================================
      // PIPELINE FUNCTION
      // =====================================

      const createPipeline =
        (matchObj) => [

          // =========================
          // MATCH
          // =========================

          {
            $match: matchObj
          },

          // =========================
          // LATEST
          // =========================

          {
            $sort: {
              createdAt: -1
            }
          },

          // =========================
          // REMOVE DUPLICATE
          // =========================

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

          // =========================
          // STORE DETAILS
          // =========================

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

          // =========================
          // ACTIVE STORE
          // =========================

          {
            $match: {

              "storedetails.status":
                true,

              "storedetails.activeStatus":
                true

            }

          },

          // =========================
          // VARIANTS
          // =========================

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

          // =========================
          // ACTIVE VARIANTS
          // =========================

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

          // =========================
          // PRICE ARRAY
          // =========================

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

                      input:
                        "$variants",

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

          // =========================
          // MIN MAX
          // =========================

          {
            $addFields: {

              minPrice: {

                $min:
                  "$priceArray"

              },

              maxPrice: {

                $max:
                  "$priceArray"

              }

            }

          },

          // =========================
          // PRICE RANGE
          // =========================

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

          // =========================
          // REMOVE EXTRA
          // =========================

          {
            $project: {

              variants: 0,

              priceArray: 0

            }

          }

        ];

      // =====================================
      // GLOBAL ITEMS
      // =====================================

      let globalItems = [];

      if (
        searchfromUrl ===
        "global"
      ) {

        globalItems =
          await Item.aggregate(

            createPipeline(
              commonMatch
            )

          );

      }

      // =====================================
      // CATEGORY ITEMS
      // =====================================

      const categoryMatch = {

        ...commonMatch

      };

      // level1

      if (
        categoryLevel === "l1"
      ) {

        categoryMatch.categories = {

          $elemMatch: {

            level1:
              String(categoryId)

          }

        };

      }

      // level2

      if (
        categoryLevel === "l2"
      ) {

        categoryMatch.categories = {

          $elemMatch: {

            level2:
              String(categoryId)

          }

        };

      }

      const categoryItems =
        await Item.aggregate(

          createPipeline(
            categoryMatch
          )

        );

      // =====================================
      // FINAL OPEN STATUS
      // =====================================

      const addOpenStatus =
        (items) => {

          return items.map(item => {

            let finalopenstatus =
              "Closed";

            const store =
              item.storedetails;

            if (store) {

              // force open

              if (
                store.openCloseStatus ===
                "ForceOpen"
              ) {

                finalopenstatus =
                  "Open";

              }

              // force close

              else if (
                store.openCloseStatus ===
                "ForceClose"
              ) {

                finalopenstatus =
                  "Closed";

              }

              // auto

              else {

                const today =
                  moment()
                    .format("dddd");

                // not week off

                if (
                  !store.weekOff
                    ?.includes(today)
                ) {

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

                      finalopenstatus =
                        "Open";

                    }

                  }

                }

              }

              item.storedetails
                .finalopenstatus =

                finalopenstatus;

            }

            return item;

          });

        };

      globalItems =
        addOpenStatus(
          globalItems
        );

      // avoid duplicate api call
      // in global mode category items not needed

      let finalCategoryItems = [];

      if (
        searchfromUrl !==
        "global"
      ) {

        finalCategoryItems =
          addOpenStatus(
            categoryItems
          );

      }

      // =====================================
      // RESPONSE
      // =====================================

      res.json({

        success: true,

        globalItems,

        categoryItems:
          finalCategoryItems

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
          // ✅ MATCH ITEMS
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
          // ✅ STORE DETAILS
          // =====================================

          {

            $lookup: {

              from: 'stores',

              localField: 'storeId',

              foreignField: '_id',

              as: 'storeData'

            }

          },

          {

            $addFields: {

              storeData: {

                $arrayElemAt: [

                  '$storeData',

                  0

                ]

              }

            }

          },

          // =====================================
          // ✅ ACTIVE STORE ONLY
          // =====================================

          {

            $match: {

              'storeData.status': true,

              'storeData.activeStatus': true

            }

          }

        ]);

      // =====================================
      // ✅ FINAL OPEN STATUS
      // =====================================

      items = items.map(item => {

        let finalopenstatus =
          "Closed";

        const store =
          item.storeData;

        if (store) {

          // FORCE OPEN
          if (
            store.openCloseStatus ===
            "ForceOpen"
          ) {

            finalopenstatus =
              "Open";

          }

          // FORCE CLOSE
          else if (
            store.openCloseStatus ===
            "ForceClose"
          ) {

            finalopenstatus =
              "Closed";

          }

          // AUTO
          else {

            const today =
              moment().format(
                "dddd"
              );

            // NOT WEEK OFF
            if (
              !store.weekOff?.includes(
                today
              )
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

                  finalopenstatus =
                    "Open";

                }

              }

            }

          }

          // inject
          item.storeData.finalopenstatus =
            finalopenstatus;

        }

        return item;

      });

      // =====================================
      // ✅ RESPONSE
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
  '/getSearchSuggestions',
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

        itemName: {
          $regex: keyword,
          $options: 'i'
        }

      };

      // ======================
      // CATEGORY CONDITION
      // ======================

      if (searchfromUrl !== 'global') {

        if (categoryLevel === 'l1') {

          match.level1Id =
            new mongoose.Types.ObjectId(categoryId);

        }

        if (categoryLevel === 'l2') {

          match.level2Id =
            new mongoose.Types.ObjectId(categoryId);

        }

      }

      const items = await Item.aggregate([

        {
          $match: match
        },

        // same itemName ko group karo
        {
          $group: {

            _id: {
              $toLower: '$itemName'
            },

            itemName: {
              $first: '$itemName'
            },

            image: {
              $first: {
                $arrayElemAt: [
                  '$images',
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

            image: 1

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
  '/get-cart-items',
  async (req, res) => {

    try {

      const {

        cartItemIds = [],
        wishlistItemIds = [],
        adminId

      } = req.body;

      // =====================================
      // ✅ COMMON FUNCTION
      // =====================================

      const getItems = async (ids) => {

        if (!ids?.length) {

          return [];

        }

        let items =
          await Item.aggregate([

            // =====================================
            // ✅ MATCH ITEMS
            // =====================================

            {

              $match: {

                _id: {

                  $in: ids.map(
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
            // ✅ STORE DETAILS
            // =====================================

            {

              $lookup: {

                from: 'stores',

                localField: 'storeId',

                foreignField: '_id',

                as: 'storeId'

              }

            },

            {

              $addFields: {

                storeId: {

                  $arrayElemAt: [

                    '$storeId',

                    0

                  ]

                }

              }

            },

            // =====================================
            // ✅ ACTIVE STORE ONLY
            // =====================================

            {

              $match: {

                'storeId.status': true,

                'storeId.activeStatus': true

              }

            }

          ]);

        // =====================================
        // ✅ FINAL OPEN STATUS
        // =====================================

        items = items.map(item => {

          let finalopenstatus =
            "Closed";

          const store =
            item.storeId;

          if (store) {

            // FORCE OPEN
            if (
              store.openCloseStatus ===
              "ForceOpen"
            ) {

              finalopenstatus =
                "Open";

            }

            // FORCE CLOSE
            else if (
              store.openCloseStatus ===
              "ForceClose"
            ) {

              finalopenstatus =
                "Closed";

            }

            // AUTO
            else {

              const today =
                moment().format(
                  "dddd"
                );

              // NOT WEEK OFF
              if (
                !store.weekOff?.includes(
                  today
                )
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

                    finalopenstatus =
                      "Open";

                  }

                }

              }

            }

            // inject
            item.storeId.finalopenstatus =
              finalopenstatus;

          }

          return item;

        });

        return items;

      };

      // =====================================
      // ✅ GET DATA
      // =====================================

      const cartItems =
        await getItems(
          cartItemIds
        );

      const wishlistItems =
        await getItems(
          wishlistItemIds
        );

      // =====================================
      // ✅ RESPONSE
      // =====================================

      res.send({

        success: true,

        cartItems,

        wishlistItems

      });

    }

    catch (e) {

      console.log(e);

      res.send({

        success: false

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


router.post('/validate-coupon', async (req, res) => {

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
module.exports = router;
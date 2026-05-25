const express = require("express");
const router = express.Router();
const Item = require("../models/Item");
const mongoose = require("mongoose");
const Customer = require("../models/Customer");
const OtpModel = require("../models/Otp");
const moment = require('moment');
const DeliveryArea = require("../models/DeliveryArea");
const Store = require("../models/Store");
const Category = require("../models/Category");
  
  


// =====================================================
// ✅ 1. GET CATEGORIES + ADMIN ID
// =====================================================

router.post("/categories", async (req, res) => {

  try {

    const { areaId } = req.body;

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

    const categories = await Category.find({
      addedBy: adminId,
      status: true
    });

    res.json({
      success: true,
      adminId,
      categories
    });

  } catch (err) {

    res.status(500).json({
      success: false,
      message: err.message
    });

  }

});


// =====================================================
// ✅ 2. GET STORES
// =====================================================

router.post("/stores", async (req, res) => {

  try {

    const { adminId } = req.body;

    const stores = await Store.find({

      addedBy: adminId,

      activeStatus: true,

      status: true

    }).limit(10);

    res.json({
      success: true,
      stores
    });

  }

  catch (err) {

    res.status(500).json({
      success: false,
      message: err.message
    });

  }

});


// =====================================================
// ✅ 3. GET ITEMS OF LEVEL1
// =====================================================

 router.post(
  "/level1-items",
  async (req, res) => {

    try {

      const {

        adminId,
        level1Id

      } = req.body;

      // =====================================
      // ITEMS
      // =====================================

      let items =
        await Item.aggregate([

          // =====================================
          // MATCH
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

                  level1:
                    String(level1Id)

                }

              }

            }

          },

          // =====================================
          // LATEST
          // =====================================

          {

            $sort: {

              createdAt: -1,

              _id: -1

            }

          },

          // =====================================
          // REMOVE DUPLICATE
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
          // STORE DETAILS
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
          // ACTIVE STORE
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
          // VARIANTS
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
          // ACTIVE VARIANTS
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
          // PRICE ARRAY
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

                  // single item

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
          // MIN MAX PRICE
          // =====================================

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

          // =====================================
          // PRICE RANGE
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
          // REMOVE EXTRA
          // =====================================

          {

            $project: {

              variants: 0,

              priceArray: 0

            }

          },

          // =====================================
          // LIMIT
          // =====================================

          {

            $limit: 10

          }

        ]);

      // =====================================
      // FINAL OPEN STATUS
      // =====================================

      items = items.map(item => {

        let finalopenstatus =
          "Closed";

        const store =
          item.storedetails;

        if (store) {

          // =========================
          // FORCE OPEN
          // =========================

          if (

            store.openCloseStatus ===

            "ForceOpen"

          ) {

            finalopenstatus =
              "Open";

          }

          // =========================
          // FORCE CLOSE
          // =========================

          else if (

            store.openCloseStatus ===

            "ForceClose"

          ) {

            finalopenstatus =
              "Closed";

          }

          // =========================
          // AUTO
          // =========================

          else {

            const today =
              moment()
                .format("dddd");

            // not week off

            if (

              !store.weekOff
                ?.includes(today)

            ) {

              // opening closing exists

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

          item.storedetails.finalopenstatus =

            finalopenstatus;

        }

        return item;

      });

      // =====================================
      // RESPONSE
      // =====================================

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

module.exports = router;
 
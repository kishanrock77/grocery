const express = require("express");
const router = express.Router();
const Item = require("../models/Item");
const mongoose = require("mongoose");
const Customer = require("../models/Customer");
const OtpModel = require("../models/Otp");

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

router.post("/level1-items", async (req, res) => {

  try {

    const {
      adminId,
      level1Id
    } = req.body;

    const items = await Item.aggregate([

      {
        $match: {

        addedBy: new mongoose.Types.ObjectId(adminId),

          status: true,

          showOnFront: true,

          useThisItemAsChild: false,

          storeId: { $ne: null },

          "categories.level1": level1Id
        }
      },

      {
        $sort: {
          createdAt: -1,
          _id: -1
        }
      },

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

      {
        $addFields: {

          priceArray: {

            $cond: [

              {
                $gt: [
                  { $size: "$variants" },
                  0
                ]
              },

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
                  { $toString: "$minPrice" }
                ]
              },

              {
                $concat: [

                  "₹",

                  { $toString: "$minPrice" },

                  " - ₹",

                  { $toString: "$maxPrice" }
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

    res.json({
      success: true,
      items
    });

  }

  catch (err) {

    res.status(500).json({
      success: false,
      message: err.message
    });

  }

});

module.exports = router;
 
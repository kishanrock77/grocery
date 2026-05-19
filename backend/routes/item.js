const express = require("express");
const router = express.Router();
const mongoose = require("mongoose");
const Item = require("../models/Item");
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
// ✅ Safe JSON Parser
const parseJSON = (data) => {
  if (!data) return [];
  if (typeof data === "object") return data;
  try {
    return JSON.parse(data);
  } catch {
    return [];
  }
};

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
// ===============================
// ✅ Add Item
// ===============================
router.post("/add", uploadMultipleImages("images", 5), async (req, res) => {
  try {
    const body = req.body;
    let storeObjectId = null;

    if (
      body.storeId &&
      body.storeId !== "-1" &&
      mongoose.Types.ObjectId.isValid(body.storeId)
    ) {
      storeObjectId = new mongoose.Types.ObjectId(body.storeId);
    }
    let rating =
          Math.round((Math.random() * 1.5 + 3.5) * 10) / 10;
    
        let ratingCount =
          Math.floor(Math.random() * 4000 + 1000);
    const item = new Item({
      itemType: body.itemType,
      vegtype: body.vegtype,
      variant_or_addon: body.variant_or_addon,
      itemName: body.itemName, rating: rating, ratingCount: ratingCount,
      itemSubName: body.itemSubName || "",
      description: body.description || "",
      storePrice: Number(body.storePrice) || 0,
      appPrice: Number(body.appPrice) || 0,
      categories: parseJSON(body.categories),
      filterKeys: parseJSON(body.filterKeys),
      useThisItemAsChild: body.useThisItemAsChild === "true",
      addedBy: new mongoose.Types.ObjectId(body.addedBy),
      addedByString: body.addedByString,
      storeId: storeObjectId,
      variantItems: body.variantItems ? parseJSON(body.variantItems) : [],
      addons: body.addons ? parseJSON(body.addons) : [],
      showOnFront: body.showOnFront === "true",
      //images: req.files ? req.files.map((f) => "uploads/items/" + f.filename) : [],

      images: body.images || [],
      itemQuestions: body.itemQuestions ? parseJSON(body.itemQuestions) : [],

      unit: body.unit || "",      size: body.size || "",

      parentId: [],
    });

    const savedItem = await item.save();

    // ✅ Variant Logic
    if (body.itemType === "variant" && body.variantItems) {
      const variantIds = parseJSON(body.variantItems);
      await Item.updateMany(
        { _id: { $in: variantIds } },
        { $addToSet: { parentId: savedItem._id } }
      );
    }

    res.json({
      success: true,
      message: "Item Added Successfully",
      data: savedItem,
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
});


// ===============================
// ✅ Get Item Detail
// ===============================
router.get("/detail/:id", async (req, res) => {
  try {

    // add tstus condition here
    const item = await Item.findById(req.params.id).where('status').equals(true);

    if (!item) {
      return res.status(404).json({
        success: false,
        message: "Item not found",
      });
    }

    res.json({ success: true, data: item });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
});
 router.get("/customeritemdetail/:id", async (req, res) => {

  try {

    let item = await Item.findOne({

      _id: req.params.id,
      status: true

    })

    .populate({
      path: "variantItems",
      match: { status: true }
    })

    .populate({
      path: "addons",
      match: { status: true }
    })

    .populate({
      path: "storeId"
    })

    .lean();

    if (!item) {

      return res.status(404).json({
        success: false,
        message: "Item not found"
      });

    }

    // =====================================
    // ✅ RENAME storeId -> storedetails
    // =====================================

    item.storedetails = item.storeId;

    delete item.storeId;

    // =====================================
    // ✅ PRICE RANGE
    // =====================================

    let priceArray = [];

    // ✅ variant item prices
    if (
      item.variantItems &&
      item.variantItems.length > 0
    ) {

      priceArray = item.variantItems.map(v => {

        return v.appPrice > 0
          ? v.appPrice
          : v.storePrice;

      });

    }

    // ✅ single item price
    else {

      priceArray = [

        item.appPrice > 0
          ? item.appPrice
          : item.storePrice

      ];

    }

    const minPrice = Math.min(...priceArray);

    const maxPrice = Math.max(...priceArray);

    item.minPrice = minPrice;

    item.maxPrice = maxPrice;

    item.priceRange =
      minPrice === maxPrice
        ? `₹${minPrice}`
        : `₹${minPrice} - ₹${maxPrice}`;

    // =====================================
    // ✅ STORE OPEN STATUS
    // =====================================

    let finalopenstatus = "Closed";

    const store = item.storedetails;

    if (store) {

      if (store.openCloseStatus === "ForceOpen") {

        finalopenstatus = "Open";

      }

      else if (store.openCloseStatus === "ForceClose") {

        finalopenstatus = "Closed";

      }

      else {

        const today = moment().format("dddd");

        // ✅ not week off
        if (!store.weekOff?.includes(today)) {

          // ✅ timing exists
          if (store.openingTime && store.closingTime) {

            const now = moment();

            const openTime =
              moment(store.openingTime, "HH:mm");

            const closeTime =
              moment(store.closingTime, "HH:mm");

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

      // ✅ inject in store object
      item.storedetails.finalopenstatus =
        finalopenstatus;

    }

    // =====================================
    // ✅ RESPONSE
    // =====================================

    res.json({

      success: true,
      data: item,

    });

  }

  catch (err) {

    console.error(err);

    res.status(500).json({

      success: false,
      message: err.message

    });

  }

});
router.post("/multi-details", async (req, res) => {
  try {
    const { ids } = req.body;

    if (!ids || ids.length === 0) {
      return res.json({ success: false, message: "No IDs provided" });
    }

    const items = await Item.find({
      _id: { $in: ids },
      status: true
    })
      .populate({
        path: "addons",
        match: { status: true },
        select: "itemName storePrice appPrice description"
      })
      .lean();

    res.json({
      success: true,
      data: items
    });

  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message
    });
  }
});
// ===============================
// ✅ Update Item
// ===============================


router.put(
  "/update/:id",
  uploadMultipleImages("images", 5),
  async (req, res) => {
    try {
      const body = req.body;

      // 🔍 Existing item
      const existingItem = await Item.findById(req.params.id).where('status').equals(true);
      if (!existingItem) {
        return res.status(404).json({
          success: false,
          message: "Item not found",
        });
      }

      // 🔧 Safe JSON parser
      const safeParse = (val, fallback = []) => {
        try {
          return val ? JSON.parse(val) : fallback;
        } catch {
          return fallback;
        }
      };

      // =========================
      // 🖼️ IMAGE HANDLING (FINAL)
      // =========================

      let oldImages = safeParse(body.oldimages, []);
      let newImages = req.body.images || [];

      if (!Array.isArray(oldImages)) oldImages = [];
      if (!Array.isArray(newImages)) newImages = [];

      // 🔴 Find removed images (for delete)
      const removedImages = (existingItem.images || []).filter(
        (img) => !oldImages.includes(img)
      );

      // 🔥 Delete from S3
      for (let img of removedImages) {
        await deleteFromS3(img);
      }

      // ✅ Final images
      const finalImages = [...oldImages, ...newImages];

      // =========================
      // 🧱 MAIN UPDATE DATA
      // =========================

      let updateData = {
        itemType: body.itemType,
         vegtype: body.vegtype,
        variant_or_addon: body.variant_or_addon,
        itemName: body.itemName,
        itemSubName: body.itemSubName || "",
        description: body.description || "",

        storePrice: Number(body.storePrice) || 0,
        appPrice: Number(body.appPrice) || 0,

        categories: safeParse(body.categories),
        filterKeys: safeParse(body.filterKeys),

        useThisItemAsChild: body.useThisItemAsChild === "true",

        variantItems: safeParse(body.variantItems),
        addons: safeParse(body.addons),
        itemQuestions: safeParse(body.itemQuestions),

        unit: body.unit || "",
 size: body.size || "",
        images: finalImages
      };

      // 🏬 Store handling
      if (body.storeId !== undefined) {
        if (
          body.storeId &&
          body.storeId !== "-1" &&
          mongoose.Types.ObjectId.isValid(body.storeId)
        ) {
          updateData.storeId = new mongoose.Types.ObjectId(body.storeId);
        } else {
          updateData.storeId = null;
        }
      }

      // =========================
      // 🔄 UPDATE ITEM
      // =========================

      const updatedItem = await Item.findByIdAndUpdate(
        req.params.id,
        updateData,
        { new: true }
      );

      // =========================
      // 🔗 VARIANT LINKING
      // =========================

      // 🧹 remove old parent
      await Item.updateMany(
        { parentId: req.params.id },
        { $pull: { parentId: req.params.id } }
      );

      // 🔗 add new
      if (body.itemType === "variant" && body.variantItems) {
        const variantIds = safeParse(body.variantItems);

        await Item.updateMany(
          { _id: { $in: variantIds } },
          { $addToSet: { parentId: req.params.id } }
        );
      }

      return res.json({
        success: true,
        message: "Item Updated Successfully",
        data: updatedItem,
      });

    } catch (err) {
      console.error(err);
      return res.status(500).json({
        success: false,
        message: err.message || "Something went wrong",
      });
    }
  }
);

// ===============================
// ✅ Get Child Items for Variants
// ===============================
router.post("/child-items", async (req, res) => {
  try {
    let { selectedCategories, userType,
      adminId,
      storeId } = req.body;
    let filter;
    if (userType === 'admin') {
      filter = {
        useThisItemAsChild: true,
        variant_or_addon: "variant",
        status: true,
        addedBy: new mongoose.Types.ObjectId(adminId),
        addedByString: "admin",
        storeId: null
      };
    } else {
      filter = {
        useThisItemAsChild: true, variant_or_addon: "variant",

        status: true,
        storeId: new mongoose.Types.ObjectId(storeId)
      };
    }
    // 🎯 Base Filter


    // 📦 Category Filter
    if (selectedCategories && selectedCategories.length > 0) {
      // Agar objects aaye hain to unse level3 nikaalein
      if (typeof selectedCategories[0] === "object") {
        selectedCategories = selectedCategories.map(
          (cat) => cat.level3
        );
      }

      filter["categories.level3"] = { $in: selectedCategories };
    }

    const items = await Item.find(filter)
     
      .populate({
        path: "storeId",
        select: "storeName",
      })
      .sort({ createdAt: -1 })
      .lean();

    res.json({
      success: true,
      data: items,
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
});
// ===============================
// ✅ Get Addon Items for Variants
// ===============================
router.post("/addon-items", async (req, res) => {
  try {
    let { selectedCategories, userType,
      adminId,
      storeId } = req.body;
    let filter;
    if (userType === 'admin') {
      filter = {
        useThisItemAsChild: true, variant_or_addon: "addon",

        status: true,
        addedBy: new mongoose.Types.ObjectId(adminId),
        addedByString: "admin",
        storeId: null
      };
    } else {
      filter = {
        useThisItemAsChild: true, variant_or_addon: "addon",
        status: true,
        storeId: new mongoose.Types.ObjectId(storeId)
      };
    }
    // 🎯 Base Filter


    // 📦 Category Filter
    if (selectedCategories && selectedCategories.length > 0) {
      // Agar objects aaye hain to unse level3 nikaalein
      if (typeof selectedCategories[0] === "object") {
        selectedCategories = selectedCategories.map(
          (cat) => cat.level1
        );
      }

      filter["categories.level1"] = { $in: selectedCategories };
    }

    const items = await Item.find(filter)
       
      .populate({
        path: "storeId",
        select: "storeName",
      })
      .sort({ createdAt: -1 })
      .lean();

    res.json({
      success: true,
      data: items,
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
});


// ===============================
// ✅ Item List (Role-Based)
// ===============================
// ✅ Item List with Pagination & Filters


router.post("/list", async (req, res) => {

  try {
    //await Item.deleteMany({ status: false });
    let {
      page = 1,
      limit = 10,
      loginId,
      storeId,
      categoryId,
      itemName
    } = req.body;

    // 🔢 Pagination
    page = parseInt(page) || 1;
    limit = parseInt(limit) || 10;
    const skip = (page - 1) * limit;

    // 🎯 Base Filter
    let filter = { status: true };

    // =====================================================
    // 🔐 Store Filtering Logic
    // =====================================================
    if (storeId !== undefined && storeId !== null && storeId !== "") {
      if (storeId === "Onlystore") {
        filter.storeId = { $exists: true, $ne: null };
      } else if (storeId === "-1") {
        filter.$or = [
          { storeId: null },
          { storeId: { $exists: false } }
        ];
        filter.addedBy = new mongoose.Types.ObjectId(loginId);

      } else if (mongoose.Types.ObjectId.isValid(storeId)) {
        filter.storeId = new mongoose.Types.ObjectId(storeId);
      }
    } else if (loginId && mongoose.Types.ObjectId.isValid(loginId)) {

      console.log("ffffffffff")
      filter.addedBy = new mongoose.Types.ObjectId(loginId);
    }

    // =====================================================
    // 📦 Category Filter (Level 3)
    // =====================================================
    if (categoryId && categoryId.trim() !== "") {
      filter["categories.level3"] = categoryId;
    }

    // =====================================================
    // 🔍 Item Name Search
    // =====================================================
    if (itemName && itemName.trim() !== "") {
      filter.itemName = {
        $regex: itemName.trim(),
        $options: "i"
      };
    }

    // =====================================================
    // 📊 Debug Logs (Remove in Production)
    // =====================================================
    console.log("Request Payload:", req.body);
    console.log("Generated Filter:", JSON.stringify(filter, null, 2));

    // =====================================================
    // 📊 Total Count
    // =====================================================
    const total = await Item.countDocuments(filter);

    // =====================================================
    // 📦 Fetch Items with Store Name
    // =====================================================
    const items = await Item.find(filter)
      .populate({
        path: "storeId",
        select: "storeName",
        match: { _id: { $exists: true } }
      })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean();

    // =====================================================
    // 🏪 Format Store Name
    // =====================================================
    const formattedItems = items.map(item => ({
      ...item,
      storeId: item.storeId?._id || null,
      storeName: item.storeId?.storeName || "General Item"
    }));

    // =====================================================
    // ✅ Final Response
    // =====================================================
    res.json({
      success: true,
      data: formattedItems,
      pagination: {
        total,
        page,
        limit,
        pages: Math.ceil(total / limit)
      }
    });

  } catch (err) {
    console.error("Error in /list API:", err);
    res.status(500).json({
      success: false,
      message: err.message
    });
  }
});


// ===============================
// ✅ Soft Delete Item
// ===============================


router.delete("/deleteAll", async (req, res) => {
  try {
    const result = await Item.deleteMany({});

    res.json({
      success: true,
      message: "All items deleted permanently.",
      deletedCount: result.deletedCount
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message
    });
  }
});


router.delete("/delete/:id", async (req, res) => {
  try {
    const id = req.params.id;

    await Item.findByIdAndUpdate(id, { status: false });

    // Remove parent references from child items
    await Item.updateMany(
      { parentId: id },
      { $pull: { parentId: id } }
    );
    await Item.updateMany(
      { variantItems: id },
      { $pull: { variantItems: id } }
    );

    res.json({
      success: true,
      message: "Item Deleted Successfully",
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
});
router.get("/general-items/:categoryId/:adminId", async (req, res) => {
  try {
    const { categoryId, adminId } = req.params;

    const items = await Item.find({
      status: true,
      storeId: null,
      addedBy: adminId,
      addedByString: "admin",
      useThisItemAsChild: false, // Parent Items Only
      parentId: { $size: 0 },
      "categories.level1": categoryId
    })

      .populate({
        path: "variantItems",
        match: { status: true },
        options: { sort: { itemName: 1 } }
      })
      .populate({
        path: "addons",
        match: { status: true },
        options: { sort: { itemName: 1 } }
      })
      .sort({ itemName: 1 });

    res.json({
      success: true,
      count: items.length,
      data: items,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});
router.get("/store-items/:storeId", async (req, res) => {
  try {
    const { storeId } = req.params;

    const items = await Item.find({
      storeId: storeId,
      status: true,
      parentId: { $size: 0 }
    })
      //.select("itemName storePrice appPrice original_item_id variantItems")
      .populate({
        path: "variantItems",
        //  select: "itemName storePrice appPrice original_item_id",
      })
      .populate({
        path: "addons",
        //  select: "itemName storePrice appPrice original_item_id",
      });

    res.json({
      success: true,
      data: items,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});

router.put("/update-show-on-front", async (req, res) => {
  try {
    const { itemId, showOnFront } = req.body;

    if (!itemId) {
      return res.status(400).json({
        success: false,
        message: "Item ID is required"
      });
    }

    const updatedItem = await Item.findByIdAndUpdate(
      itemId,
      { showOnFront },
      { new: true }
    );

    res.json({
      success: true,
      message: "Item updated successfully",
      data: updatedItem
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: "Server error"
    });
  }
});
// router.post("/map-items", async (req, res) => {
//   try {
//     const { storeId, adminId, selectedItems, categoryId } = req.body;

//     if (!storeId || !adminId) {
//       return res.status(400).json({
//         success: false,
//         message: "Store ID and Admin ID are required",
//       });
//     }

//     if (!categoryId) {
//       return res.status(400).json({
//         success: false,
//         message: "Category ID is required",
//       });
//     }

//     const selectedIds = selectedItems.map(item => item.itemId);

//     // 🔴 Unselect Items → Status False (Only Selected Category)
//     await Item.updateMany(
//       {
//         storeId: storeId,
//         addedBy: adminId,
//         addedByString: "admin",
//         parentId: { $size: 0 }, // Only parent items
//         "categories.level1": categoryId,
//         original_item_id: { $nin: selectedIds }
//       },
//       { $set: { status: false } }
//     );

//     // 🔴 Deactivate Variants of Unselected Parents
//     const unselectedParents = await Item.find({
//       storeId: storeId,
//       parentId: { $size: 0 },
//       "categories.level1": categoryId,
//       original_item_id: { $nin: selectedIds }
//     }).select("_id");

//     const parentIds = unselectedParents.map(p => p._id);

//     if (parentIds.length > 0) {
//       await Item.updateMany(
//         {
//           parentId: { $in: parentIds }
//         },
//         { $set: { status: false } }
//       );
//     }

//     // 🟢 Process Selected Items
//     for (let item of selectedItems) {
//       const generalItem = await Item.findOne({
//         _id: item.itemId,
//         addedBy: adminId,
//         addedByString: "admin"
//       }).populate("variantItems");

//       if (!generalItem) continue;

//       // 🔍 Check Existing Store Parent Item
//       let existingItem = await Item.findOne({
//         storeId: storeId,
//         original_item_id: item.itemId,
//         parentId: { $size: 0 }
//       }).populate("variantItems");

//       if (existingItem) {
//         // ✅ Update Parent Prices
//         existingItem.status = true;
//         existingItem.storePrice = item.storePrice;
//         existingItem.appPrice = item.appPrice;
//         await existingItem.save();

//         // ✅ Update or Create Variants
//         if (generalItem.variantItems.length > 0) {
//           for (let variant of generalItem.variantItems) {
//             const selectedVariant = item.variants?.find(
//               v => v.variantId.toString() === variant._id.toString()
//             );

//             if (!selectedVariant) continue;

//             let existingVariant = await Item.findOne({
//               storeId: storeId,
//               original_item_id: variant._id,
//               parentId: existingItem._id
//             });

//             if (existingVariant) {
//               existingVariant.status = true;
//               existingVariant.storePrice = selectedVariant.storePrice;
//               existingVariant.appPrice = selectedVariant.appPrice;
//               await existingVariant.save();
//             } else {
//               const variantData = variant.toObject();
//               delete variantData._id;
//               delete variantData.createdAt;
//               delete variantData.updatedAt;

//               variantData.storeId = storeId;
//               variantData.original_item_id = variant._id;
//               variantData.addedBy = adminId;
//               variantData.addedByString = "admin";
//               variantData.parentId = [existingItem._id];
//               variantData.storePrice = selectedVariant.storePrice;
//               variantData.appPrice = selectedVariant.appPrice;

//               const newVariant = await Item.create(variantData);
//               existingItem.variantItems.push(newVariant._id);
//             }
//           }

//           await existingItem.save();
//         }

//         continue;
//       }

//       // 🟢 Clone Parent Item
//       const parentData = generalItem.toObject();
//       delete parentData._id;
//       delete parentData.createdAt;
//       delete parentData.updatedAt;

//       parentData.storeId = storeId;
//       parentData.original_item_id = generalItem._id;
//       parentData.addedBy = adminId;
//       parentData.addedByString = "admin";
//       parentData.parentId = [];
//       parentData.variantItems = [];
//       parentData.storePrice = item.storePrice;
//       parentData.appPrice = item.appPrice;

//       const newParent = await Item.create(parentData);

//       // 🟢 Clone Variants
//       if (generalItem.variantItems.length > 0) {
//         for (let variant of generalItem.variantItems) {
//           const selectedVariant = item.variants?.find(
//             v => v.variantId.toString() === variant._id.toString()
//           );

//           const variantData = variant.toObject();
//           delete variantData._id;
//           delete variantData.createdAt;
//           delete variantData.updatedAt;

//           variantData.storeId = storeId;
//           variantData.original_item_id = variant._id;
//           variantData.addedBy = adminId;
//           variantData.addedByString = "admin";
//           variantData.parentId = [newParent._id];

//           if (selectedVariant) {
//             variantData.storePrice = selectedVariant.storePrice;
//             variantData.appPrice = selectedVariant.appPrice;
//           }

//           const newVariant = await Item.create(variantData);
//           newParent.variantItems.push(newVariant._id);
//         }

//         await newParent.save();
//       }
//     }

//     res.json({
//       success: true,
//       message: "Items mapped and prices saved successfully.",
//     });

//   } catch (error) {
//     res.status(500).json({
//       success: false,
//       message: error.message,
//     });
//   }
// });

router.post("/map-items", async (req, res) => {
  try {
    const { storeId, adminId, selectedItems, categoryId } = req.body;

    if (!storeId || !adminId) {
      return res.status(400).json({
        success: false,
        message: "Store ID and Admin ID are required",
      });
    }

    if (!categoryId) {
      return res.status(400).json({
        success: false,
        message: "Category ID is required",
      });
    }

    const selectedIds = selectedItems.map(item => item.itemId);

    // =========================================================
    // 🔴 STEP 1: Unselect Parent Items
    // =========================================================
    await Item.updateMany(
      {
        storeId,
        addedBy: adminId,
        addedByString: "admin",
        parentId: { $size: 0 },
        "categories.level1": categoryId,
        original_item_id: { $nin: selectedIds }
      },
      { $set: { status: false } }
    );

    // =========================================================
    // 🔴 STEP 2: Unselect ALL CHILDREN (variant + addon)
    // =========================================================
    const unselectedParents = await Item.find({
      storeId,
      parentId: { $size: 0 },
      "categories.level1": categoryId,
      original_item_id: { $nin: selectedIds }
    }).select("_id");

    const parentIds = unselectedParents.map(p => p._id);

    if (parentIds.length > 0) {
      await Item.updateMany(
        {
          parentId: { $in: parentIds },
          variant_or_addon: { $in: ["variant", "addon"] }
        },
        { $set: { status: false } }
      );
    }

    // =========================================================
    // 🟢 STEP 3: Process Selected Items
    // =========================================================
    for (let item of selectedItems) {

      const generalItem = await Item.findOne({
        _id: item.itemId,
        addedBy: adminId,
        addedByString: "admin"
      })
        .populate("variantItems")
        .populate("addons");

      if (!generalItem) continue;

      let existingItem = await Item.findOne({
        storeId,
        original_item_id: item.itemId,
        parentId: { $size: 0 }
      })
        .populate("variantItems")
        .populate("addons");

      // =====================================================
      // 🟢 CASE 1: EXISTING ITEM
      // =====================================================
      if (existingItem) {

        existingItem.status = true;
        existingItem.storePrice = item.storePrice;
        existingItem.appPrice = item.appPrice;
        existingItem.itemQuestions = item.itemQuestions || [];
        await existingItem.save();

        // =========================
        // ✅ VARIANTS
        // =========================
        for (let variant of generalItem.variantItems || []) {

          const selectedVariant = item.variants?.find(
            v => v.variantId.toString() === variant._id.toString()
          );

          if (!selectedVariant) {
            await Item.updateMany(
              {
                storeId,
                original_item_id: variant._id,
                parentId: existingItem._id
              },
              { $set: { status: false } }
            );
            continue;
          }

          let existingVariant = await Item.findOne({
            storeId,
            original_item_id: variant._id,
            parentId: existingItem._id
          });

          if (existingVariant) {
            existingVariant.status = true;
            existingVariant.storePrice = selectedVariant.storePrice;
            existingVariant.appPrice = selectedVariant.appPrice;
            existingVariant.itemQuestions = selectedVariant.itemQuestions || [];

            await existingVariant.save();
          } else {
            const data = variant.toObject();
            delete data._id;

            data.storeId = storeId;
            data.original_item_id = variant._id;
            data.addedBy = adminId;
            data.addedByString = "admin";
            data.parentId = [existingItem._id];
            data.storePrice = selectedVariant.storePrice;
            data.appPrice = selectedVariant.appPrice;

            const newVar = await Item.create(data);
            existingItem.variantItems.push(newVar._id);
          }
        }

        // =========================
        // ✅ ADDONS (SAME LOGIC)
        // =========================
        for (let addon of generalItem.addons || []) {

          const selectedAddon = item.addons?.find(
            a => a.addonId.toString() === addon._id.toString()
          );

          if (!selectedAddon) {
            await Item.updateMany(
              {
                storeId,
                original_item_id: addon._id,
                parentId: existingItem._id
              },
              { $set: { status: false } }
            );
            continue;
          }

          let existingAddon = await Item.findOne({
            storeId,
            original_item_id: addon._id,
            parentId: existingItem._id
          });

          if (existingAddon) {
            existingAddon.status = true;
            existingAddon.storePrice = selectedAddon.storePrice;
            existingAddon.appPrice = selectedAddon.appPrice;
            await existingAddon.save();
          } else {
            const data = addon.toObject();
            delete data._id;

            data.storeId = storeId;
            data.original_item_id = addon._id;
            data.addedBy = adminId;
            data.addedByString = "admin";
            data.parentId = [existingItem._id];
            data.storePrice = selectedAddon.storePrice;
            data.appPrice = selectedAddon.appPrice;

            const newAddon = await Item.create(data);
            existingItem.addons.push(newAddon._id);
          }
        }

        await existingItem.save();
        continue;
      }

      // =====================================================
      // 🟢 CASE 2: NEW ITEM (CLONE)
      // =====================================================
      const parentData = generalItem.toObject();
      delete parentData._id;
      parentData.itemQuestions = item.itemQuestions || [];
      parentData.storeId = storeId;
      parentData.original_item_id = generalItem._id;
      parentData.addedBy = adminId;
      parentData.addedByString = "admin";
      parentData.parentId = [];
      parentData.variantItems = [];
      parentData.addons = [];
      parentData.storePrice = item.storePrice;
      parentData.appPrice = item.appPrice;

      const newParent = await Item.create(parentData);

      // =========================
      // 🟢 CLONE VARIANTS
      // =========================
      for (let variant of generalItem.variantItems || []) {

        const selectedVariant = item.variants?.find(
          v => v.variantId.toString() === variant._id.toString()
        );

        if (!selectedVariant) continue;

        const data = variant.toObject();
        delete data._id;
        data.itemQuestions = selectedVariant.itemQuestions || [];
        data.storeId = storeId;
        data.original_item_id = variant._id;
        data.addedBy = adminId;
        data.addedByString = "admin";
        data.parentId = [newParent._id];
        data.storePrice = selectedVariant.storePrice;
        data.appPrice = selectedVariant.appPrice;

        const newVar = await Item.create(data);
        newParent.variantItems.push(newVar._id);
      }

      // =========================
      // 🟢 CLONE ADDONS
      // =========================
      for (let addon of generalItem.addons || []) {

        const selectedAddon = item.addons?.find(
          a => a.addonId.toString() === addon._id.toString()
        );

        if (!selectedAddon) continue;

        const data = addon.toObject();
        delete data._id;

        data.storeId = storeId;
        data.original_item_id = addon._id;
        data.addedBy = adminId;
        data.addedByString = "admin";
        data.parentId = [newParent._id];
        data.storePrice = selectedAddon.storePrice;
        data.appPrice = selectedAddon.appPrice;

        const newAddon = await Item.create(data);
        newParent.addons.push(newAddon._id);
      }

      await newParent.save();
    }

    res.json({
      success: true,
      message: "Items mapped successfully with variants & addons",
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});
module.exports = router;
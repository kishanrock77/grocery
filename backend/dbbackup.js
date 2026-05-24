// migrate-db-safe.js

require("dotenv").config();

const mongoose = require("mongoose");

// ===============================
// DB URLS
// ===============================

const SOURCE_DB = process.env.MONGO_URL;
const DEST_DB = process.env.MONGO_URL_LOCAL_wifi;

// ===============================
// MODELS
// ===============================

const AdminUser = require("./models/AdminUser");
const Category = require("./models/Category");
const Customer = require("./models/Customer");
const Coupon = require("./models/Coupon");
const DeliveryArea = require("./models/DeliveryArea");
const DeliveryBoy = require("./models/DeliveryBoy");
const Item = require("./models/Item");
const Notification = require("./models/Notification");
const Order = require("./models/Ordermain");
const Suborder = require("./models/Suborder");
const OrderLog = require("./models/OrderLog");
const Otp = require("./models/Otp");
const Store = require("./models/Store");
const storeOwner = require("./models/storeOwner");

// ===============================
// MODEL ARRAY
// ===============================

const modelsArray = [
  AdminUser,
  Category,
  Customer,
  Coupon,
  DeliveryArea,
  DeliveryBoy,
  Item,
  Notification,
  Order,
  Suborder,
  OrderLog,
  Otp,
  Store,
  storeOwner
];

// ===============================
// MAIN
// ===============================

async function migrateDatabase() {

  let sourceConn;
  let destConn;

  try {

    console.log("\n🚀 Connecting SOURCE DB...");
    sourceConn = await mongoose.createConnection(SOURCE_DB).asPromise();
    console.log("✅ SOURCE connected");

    console.log("\n🚀 Connecting DESTINATION DB...");
    destConn = await mongoose.createConnection(DEST_DB).asPromise();
    console.log("✅ DESTINATION connected");

    // =====================================
    // STEP 1 : READ ALL DATA FIRST
    // =====================================

    const allData = {};

    console.log("\n📥 Reading source database...\n");

    for (const model of modelsArray) {

      const modelName = model.modelName;

      const SourceModel = sourceConn.model(
        modelName,
        model.schema,
        model.collection.name
      );

      const docs = await SourceModel.find({})
        .lean()
        .maxTimeMS(0);

      allData[modelName] = {
        docs,
        schema: model.schema,
        collectionName: model.collection.name
      };

      console.log(
        `✅ ${modelName}: ${docs.length} docs loaded`
      );
    }

    console.log("\n✅ ALL SOURCE DATA LOADED SUCCESSFULLY");

    // =====================================
    // STEP 2 : CLEAR DESTINATION
    // =====================================

    console.log("\n🗑 Clearing destination DB...\n");

    const collections = await destConn.db.collections();

    for (const collection of collections) {

      try {

        await collection.deleteMany({});

        console.log(`✅ Cleared: ${collection.collectionName}`);

      } catch (err) {

        console.log(
          `⚠️ Could not clear ${collection.collectionName}`
        );
      }
    }

    // =====================================
    // STEP 3 : INSERT DATA
    // =====================================

    console.log("\n📤 Inserting data...\n");

    for (const model of modelsArray) {

      const modelName = model.modelName;

      const data = allData[modelName];

      const DestModel = destConn.model(
        modelName,
        data.schema,
        data.collectionName
      );

      try {

        // recreate indexes
        await DestModel.syncIndexes();

        if (data.docs.length > 0) {

          await DestModel.insertMany(
            data.docs,
            {
              ordered: false
            }
          );

          console.log(
            `✅ ${modelName}: inserted ${data.docs.length}`
          );

        } else {

          console.log(
            `⚠️ ${modelName}: no documents`
          );
        }

      } catch (err) {

        console.log(
          `❌ Failed inserting ${modelName}`
        );

        console.log(err.message);
      }
    }

    console.log("\n🎉 DATABASE MIGRATION COMPLETED");

    await sourceConn.close();
    await destConn.close();

    process.exit(0);

  } catch (error) {

    console.error("\n❌ MIGRATION FAILED\n");

    console.error(error);

    if (sourceConn) await sourceConn.close();
    if (destConn) await destConn.close();

    process.exit(1);
  }
}

migrateDatabase();
// routes/order.js
const mongoose = require("mongoose");
const express = require('express');
const Razorpay = require('razorpay');
const admin =
  require('../firebase');
const router = express.Router();
const Wallet = require("../models/Wallet");
const { getIO } =
  require("../socket");
const Customer = require("../models/Customer");
const { getfinalopenstatus } = require('../utils/checkstoreopenstatus.js');

const Order = require("../models/Ordermain");
const Store = require("../models/Store");
const StoreOwner = require("../models/storeOwner");


const DeliveryBoy = require("../models/DeliveryBoy");
const DeliveryArea = require("../models/DeliveryArea");
const Notifytoken = require("../models/Notifytoken");

const OrderLog = require("../models/OrderLog");
const SubOrder = require("../models/Suborder");
const Item = require("../models/Item");
const AdminUserModel = require("../models/AdminUser");


const CustomOrder =
  require("../models/CustomOrder");
const Notification =
  require('../models/Notification');

//




const objectstatusjson =
  require('../utils/objectstatusjson');
const { uploadSingleImage, uploadMultipleImages, uploadMultipleFields } = require("../middleware/uploadAWSS3");
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

// ======================================================
// SAVE LOG
// ======================================================

async function saveLog(

  orderId,
  action,
  message,
  userId,
  userType

) {

  await OrderLog.create({

    orderId,

    action,

    message,

    actionById: userId,

    actionByType: userType

  });

}

async function sendFCMApp({ uniqueidofdevice, tokennotinuse, title, body, storeOwnerDoc

}) {

  try {

    console.log("storeOwnerDoc " + title);
    console.log(storeOwnerDoc);

    if (!uniqueidofdevice) {

      console.log('uniqueidofdevice not found - ' + title);
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
      'FCM Sent app 151'
    );

  }

  catch (err) {
    console.log('FCM FULL ERROR app 157');
    console.log(err);
    console.log(err.code);
    console.log(err.message);
    console.log(err.errorInfo);
  }

}

async function sendFCM({
  token,
  title,
  body

}) {

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
      'FCM Sent web 200'
    );

  }

  catch (err) {
    //console.log('FCM FULL ERROR web');
    //console.log(err);
  }

}

// ======================================================
// SAVE NOTIFICATION
// ======================================================

async function saveNotification({

  userId,
  userType,
  title,
  message,
  relatedOrderId

}) {
  console.log("userType " + userType);

  let storeOwnerDoc;
  if (!userId) {
    return;
  }
  const notification =
    await Notification.create({

      userId,
      userType,
      title,
      message,
      relatedOrderId

    });

  //fcm 

  let token = '';

  if (userType == 'Customer') {



    const user =
      await Customer.findById(
        userId
      );
    uniqueidofdevice =
      user?.uniqueidofdevice;
    token =
      user?.fcmToken;
    console.log("Customer " + user);

  }

  else if (
    userType == 'DeliveryBoy'
  ) {

    const user =
      await DeliveryBoy.findById(
        userId
      );
    uniqueidofdevice =
      user?.uniqueidofdevice;
    token =
      user?.fcmToken;

  }

  else if (
    userType == 'Store'
  ) {

    console.log("store owner id is " + userId);

    storeOwnerDoc =
      await StoreOwner.findById(
        userId
      );
    uniqueidofdevice =
      storeOwnerDoc?.uniqueidofdevice;
    token =
      storeOwnerDoc?.fcmToken;

  }

  else if (
    userType == 'Admin'
  ) {

    const AdminUser =
      await AdminUserModel.findById(
        userId
      );

    token =
      AdminUser?.fcmToken;
    uniqueidofdevice =
      AdminUser?.uniqueidofdevice;

  }
  title = "Hi " + userType + " - " + title;

  console.log('title 311: ' + title);
  await sendFCMApp({
    uniqueidofdevice,
    token,

    title,

    body: message, storeOwnerDoc

  });

  console.log('title 322: ' + title);
  await sendFCM({
    token,

    title,

    body: message

  });

  //fcm emnd



  try {

    const io = getIO();
    console.log('io 322: ' + io);
    io.to(
      userId.toString()
    ).emit(
      "newNotification",
      notification
    );

  }
  catch (err) {

    console.log(
      "Socket notification error:",
      err.message
    );

  }

}



// ======================================================
// SEND NOTIFICATIONS
// ======================================================





// ======================================================
// UPDATE SUB ORDER STATUS
// ======================================================

async function updateSubOrderStatus({

  subOrder,
  statuskey,
  actionById,
  actionByType

}) {

  const statusData =
    objectstatusjson[statuskey];

  if (!statusData) {

    throw new Error(
      'Invalid status key'
    );

  }

  // ==========================================
  // VALID FLOW CHECK
  // ==========================================

  if (
    subOrder.currentstatuskey
  ) {

    const currentStatusData =

      objectstatusjson[
      subOrder.currentstatuskey
      ];

    const allowedNextActions =

      currentStatusData
        ?.nextactionkey || [];

    if (

      !allowedNextActions.includes(
        statuskey
      )

    ) {

      throw new Error(

        `Invalid status flow from ${subOrder.currentstatuskey} to ${statuskey}`

      );

    }

  }

  // ==========================================
  // UPDATE STATUS
  // ==========================================

  subOrder.currentstatuskey =
    statuskey;
  subOrder.iscancellable = statusData.iscancellable;
  subOrder.suborderstatus =

    statusData
      .keyvalueforfrontend;

  subOrder.statustext =

    statusData
      .textmessageofstatus;






  if (subOrder.currentstatuskey == 'orderrejectedbystore' || subOrder.currentstatuskey == 'orderacceptedbystore') {

    subOrder.finalstoreId = subOrder.storeId;

  }

  await subOrder.save();

  // ==========================================
  // SAVE LOG
  // ==========================================
  let logmessage = statusData.orderlogmessage;
  //let logmessage = "Sub order -" + subOrder.suborderid + ", Store - " + subOrder.storeInfo.storeName + " - " + statusData.orderlogmessage;
  await saveLog(

    subOrder._id,

    statuskey,

    logmessage,

    actionById,

    actionByType

  );

  // ==========================================
  // SEND NOTIFICATION
  // ==========================================

  const order =
    await Order.findById(
      subOrder.orderId
    );
  ///when chnaging status

  console.log('when chnaging status');
  await sendNotifications({

    statuskey,

    order,

    subOrder

  });

}

// ======================================================
// CREATE ORDER
// ======================================================

router.post(

  '/create-order',

  async (req, res) => {

    try {

      const {

        cart,

        couponcode,

        discountAmount,
        handlingCharge,
        deliverydiscount,
        amountfromwallet,
        deliveryCharge,

        totalamount,

        customerId,

        adminId,

        selectedaddress,

        deleveryinstruction,

        paymentMethod,
        profit,
        paymentStatus

      } = req.body;

      // ==========================================
      // VALIDATION
      // ==========================================

      if (!customerId) {

        return res.status(400).json({

          success: false,

          message:
            'Customer id required'

        });

      }

      if (!adminId) {

        return res.status(400).json({

          success: false,

          message:
            'Admin id required'

        });

      }

      if (

        !cart ||

        !Array.isArray(cart) ||

        cart.length == 0

      ) {

        return res.status(400).json({

          success: false,

          message:
            'Cart empty'

        });

      }

      // ==========================================
      // STORE + ITEM VALIDATION
      // ==========================================
      const customerCityId =
        selectedaddress.city;
      for (const storeBlock of cart) {

        const store =
          await Store.findById(
            storeBlock.storeId
          );

        if (!store) {

          return res.status(400).json({

            success: false,

            message:
              'Store not found'

          });

        }

        // ======================================
        // STORE STATUS
        // ======================================

        if (
          store.status == false
        ) {

          return res.status(400).json({

            success: false,

            message:
              `${store.storeName} unavailable`

          });

        }

        // ======================================
        // ACTIVE STATUS
        // ======================================

        if (
          store.activeStatus == false
        ) {

          return res.status(400).json({

            success: false,

            message:
              `${store.storeName} inactive`

          });

        }

        // ======================================
        // OPEN STATUS
        // ======================================
        store.finalopenstatus = getfinalopenstatus(store);
        if (
          store.finalopenstatus ==
          'Closed'
        ) {

          return res.status(400).json({

            success: false,

            message:
              `${store.storeName} closed`

          });

        }

        // ======================================
        // ITEM VALIDATION
        // ======================================

        for (const itemBlock of storeBlock.items) {

          const item =
            await Item.findById(
              itemBlock.itemId
            );

          if (!item) {

            return res.status(400).json({

              success: false,

              message:
                'Item not found'

            });

          }

          // ITEM STATUS

          if (
            item.status == false
          ) {

            return res.status(400).json({

              success: false,

              message:
                `${item.itemName} unavailable`

            });

          }

          // SHOW ON FRONT

          if (
            item.showOnFront == false && item.isitfromcustom == false
          ) {

            return res.status(400).json({

              success: false,

              message:
                `${item.itemName} hidden`

            });

          }

        }


        // STORE CITY NAME
        const storeCityName =
          storeBlock?.storeInfo?.city
            ?.trim();

        if (
          customerCityId &&
          storeCityName
        ) {

          // STORE CITY DOCUMENT
          const storeCity =
            await DeliveryArea.findOne({

              cityName: {
                $regex: new RegExp(
                  `^${storeCityName}$`,
                  "i"
                )
              }

            });

          if (storeCity?._id) {

            // FIND MATCHING DELIVERY BOYS
            const deliveryBoys =
              await DeliveryBoy.find({
                addedBy: adminId,
                isAvailable: true,

                activeStatus: true,

                deliveryAreas: {
                  $in: [customerCityId]
                },

                pickupAreas: {
                  $in: [storeCity._id]
                }

              });

            if (deliveryBoys.length == 0) {
              return res.status(400).json({
                success: false,
                message: "No available delivery boys in the selected area"
              });
            }

          }

        }


      }

      /// check if deliievry bot avaibale or not in the area of customer and store area
      // and check if isAvailable true and activeStatus and status is true and 
      // deliveryAreas and pickupAreas match with customer city and store city
      //deliveryAreas and pickupAreas are array of strings in DeliveryBoy model and customer city and store city are strings  
      // if not available then return error message aaccordingly
      // CUSTOMER CITY ID




      ////end

      // ==========================================
      // CREATE MAIN ORDER
      // ==========================================
      let adminId_backup_for_online_pay = adminId;
      if (paymentMethod == 'online' && paymentStatus == 'pending') {
        // that mean payment failed
        adminIddb = '-1';
      } else {
        adminIddb = adminId;
      }
      const mainorderid =

        'ORD-' +
        new Date().getDate() +
        Math.floor(1000 + Math.random() * 9000);

      const order =
        await Order.create({

          mainorderid,

          customerId,

          adminId: adminIddb == "-1" ? null : adminIddb,
          adminId_backup_for_online_pay,
          date:
            new Date()
              .toLocaleDateString(),

          totalamount,
          amountfromwallet,
          couponcode:
            couponcode || '',
          handlingCharge:
            handlingCharge || 0,
          discountAmount:
            discountAmount || 0,
          profit: profit || 0,
          paymentMethod,

          paymentStatus,

          transactionId:
            null,

          deliveryCharge:
            deliveryCharge || 0,

          deliverydiscount:
            deliverydiscount || 0,

          selectedaddress,

          deleveryinstruction

        });

      // ==========================================
      // SAVE MAIN ORDER LOG
      // ==========================================

      if (adminIddb != "-1") {
        await thingstodowhenorderplaced(order._id, objectstatusjson, false, false)
      }



      // ==========================================
      // CREATE SUB ORDERS
      // ==========================================

      const createdSubOrders = [];

      for (const storeBlock of cart) {

        const suborderid =

          'SUB-' +

          new Date().getDate() +
          Math.floor(1000 + Math.random() * 9000);

        const subOrder =
          await SubOrder.create({

            orderId:
              order._id,

            mainorderid:
              order.mainorderid,

            suborderid,

            customerId,

            adminId: adminIddb == "-1" ? null : adminIddb,
            adminId_backup_for_online_pay,
            storeId:
              storeBlock.storeId,

            deliveryBoyId:
              null,

            storeTotal:
              storeBlock.storeTotal,
            storeTotaltoshowtostore: storeBlock.storeTotaltoshowtostore,

            currentstatuskey:
              'orderplacedbycustomer',

            suborderstatus:

              objectstatusjson
                .orderplacedbycustomer
                .keyvalueforfrontend,

            statustext:

              objectstatusjson
                .orderplacedbycustomer
                .textmessageofstatus,

            storeInfo:
              storeBlock.storeInfo,

            items:
              storeBlock.items,
            iscancellable: objectstatusjson
              .orderplacedbycustomer
              .iscancellable

          });

        createdSubOrders.push(
          subOrder
        );

        // ======================================
        // SAVE SUB ORDER LOG
        // ======================================

        if (adminIddb != '-1') {
          await thingstodowhenorderplacedSuborder(order, subOrder, objectstatusjson, customerId)
        }

      }

      // ==========================================
      // SUCCESS
      // ==========================================

      return res.status(201).json({

        success: true,

        message:
          'Order created successfully',

        order,

        subOrders:
          createdSubOrders

      });

    }

    catch (error) {

      //console.log(error);

      return res.status(500).json({

        success: false,

        message:
          error.message

      });

    }

  }

);

//cancel sub order by customer
router.post(

  '/cancel-suborder',

  async (req, res) => {

    try {

      const {
        _id: _id,
        customerId
      } = req.body;

      if (!_id || !customerId) {

        return res.status(400).json({

          success: false,

          message:
            'Sub order id and customer id required'

        });

      }

      const subOrder =
        await SubOrder.findById(
          _id
        );

      if (!subOrder) {

        return res.status(404).json({

          success: false,

          message:
            'Sub order not found'

        });

      }

      if (
        subOrder.customerId.toString() !==
        customerId
      ) {

        return res.status(403).json({

          success: false,

          message:
            'Unauthorized'

        });

      }

      await updateSubOrderStatus({

        subOrder,

        statuskey:
          'cancelledbycustomer',

        actionById:
          customerId,

        actionByType:
          'Customer'

      });

      //Ordermain se subOrder.orderId ka use kar k data nikalo
      // fir totalamount me se storeTotal minus kardp or new
      //totalamount nikalo..agar totalamount<199 or couponcode  FIRST50 tha to dicount bhi zero karo or couponcode ko blank or uska discountAmount totalamount me add kardo
      //fir main order me update kardo data..dusri jagah se bhi call krana h,,,first50 k alawa koi discount h to use 0 karo , couponcode  ko blank or uska discountAmount totalamount me add kardo
      //...agar paymentStatus pending nahi h to  storeTotal   amount uske waalet me save krado
      //ye pura code ek function me daalna.

      //console.log(subOrder)

      await handleRejectedSubOrderAmount({

        statuskey:
          'cancelledbycustomer',

        subOrder,

        cancelAmount:
          subOrder.storeTotal,

        actionById:
          customerId,

        actionByType:
          'Customer',

        suffix:
          'by customer'

      });

      return res.json({

        success: true,

        message:
          'Sub order cancelled successfully'

      });

    }

    catch (error) {

      //console.log(error);

      return res.status(500).json({

        success: false,

        message:
          error.message

      });

    }

  }

);

// ======================================================
// CREATE ORDER
// ======================================================
async function sendNotifications({

  statuskey,
  order,
  subOrder

}) {

  //console.log("i m in send n" + statuskey)
  //console.log(order);
  //console.log(subOrder)
  const statusData =
    objectstatusjson[statuskey];

  if (
    !statusData ||
    !statusData.notificationto
  ) {
    return;
  }

  const notifications =
    statusData.notificationto;
  let title = 'Order Update';
  if (statuskey == 'orderplacedbycustomer') {
    title = "Main order-" + order.mainorderid + " - New Order Placed";
  } else {
    title = "Update for order-" + subOrder.suborderid;
  }
  // ==========================================
  // ADMIN
  // ==========================================

  if (
    notifications.Admin &&
    order.adminId
  ) {

    await saveNotification({

      userId:
        order.adminId,

      userType:
        'Admin',

      title:
        title,

      message:
        notifications.Admin.message,

      relatedOrderId:
        order._id

    });

  }

  // ==========================================
  // CUSTOMER
  // ==========================================

  if (notifications.Customer) {

    await saveNotification({

      userId:
        order.customerId,

      userType:
        'Customer',

      title:
        title,

      message:
        notifications.Customer.message,

      relatedOrderId:
        order._id

    });

  }

  // ==========================================
  // DELIVERY BOY
  // ==========================================

  if (
    notifications.DeliveryBoy &&
    subOrder.deliveryBoyId
  ) {

    await saveNotification({

      userId:
        subOrder.deliveryBoyId,

      userType:
        'DeliveryBoy',

      title:
        title,

      message:
        notifications.DeliveryBoy.message,

      relatedOrderId:
        order._id

    });

  }
  // ==========================================
  // ALL ONLINE DELIVERY BOYS
  // ==========================================

  // ==========================================
  // ALL ONLINE DELIVERY BOYS
  // ==========================================

  if (
    notifications.All_Online_DeliveryBoys
  ) {

    // CUSTOMER CITY ID
    const customerCityId =
      order?.selectedaddress?.city;

    // STORE CITY NAME
    const storeCityName =
      subOrder?.storeInfo?.city
        ?.trim();

    if (
      customerCityId &&
      storeCityName
    ) {

      // STORE CITY DOCUMENT
      const storeCity =
        await DeliveryArea.findOne({

          cityName: {
            $regex: new RegExp(
              `^${storeCityName}$`,
              "i"
            )
          }

        });

      if (storeCity?._id) {

        // FIND MATCHING DELIVERY BOYS
        const deliveryBoys =
          await DeliveryBoy.find({

            isAvailable: true,
            addedBy: order.adminId,
            activeStatus: true,

            deliveryAreas: {
              $in: [customerCityId]
            },

            pickupAreas: {
              $in: [storeCity._id]
            }

          });

        // SEND NOTIFICATION
        for (const boy of deliveryBoys) {

          await saveNotification({

            userId:
              boy._id,

            userType:
              'DeliveryBoy',

            title:
              title,

            message:
              notifications
                .All_Online_DeliveryBoys
                .message,

            relatedOrderId:
              order._id

          });

        }

      }

    }

  }
  // ==========================================
  // STORE
  // ==========================================

  if (notifications.Store && subOrder.storeId) {

    const store =
      await Store.findById(
        subOrder.storeId
      );

    if (store?.ownerid) {

      await saveNotification({

        userId:
          store.ownerid,

        userType:
          'Store',

        title:
          title,

        message:
          notifications.Store.message,

        relatedOrderId:
          subOrder._id

      });

    }

  }

}


// change payment method start
// change payment method start
router.post('/change-payment-method-to-cod', async (req, res) => {

  try {

    const { _id } = req.body;

    if (!_id) {
      return res.status(400).json({
        success: false,
        message: "Order id required"
      });
    }


    const order = await Order.findByIdAndUpdate(
      _id,
      {
        paymentMethod: 'cod',

      },
      {
        new: true
      }
    );


    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found"
      });
    }

    await thingstodowhenorderplaced(_id, objectstatusjson, true, true)

    res.json({
      success: true,
      message: "Payment method changed to COD",
      data: order
    });


  } catch (error) {

    //console.log(error);

    res.status(500).json({
      success: false,
      message: "Server error"
    });

  }

});
// change payment method end

// change payment method end


// ======================================================
// CHANGE SUB ORDER STATUS
// ======================================================

router.post(

  '/change-suborder-status',

  async (req, res) => {

    try {

      const {

        subOrderId,

        statuskey,
        storeTotal,
        actionById,

        actionByType,
        singleDelievryBoyOrMultipleDelievryBoyForAllStores
      } = req.body;

      // ==========================================
      // FIND SUB ORDER
      // ==========================================

      const subOrder =
        await SubOrder.findById(
          subOrderId
        );

      if (!subOrder) {

        return res.status(404).json({

          success: false,

          message:
            'Sub order not found'

        });

      }

      // ==========================================
      // UPDATE STATUS change-suborder-status
      // ==========================================

      await updateSubOrderStatus({

        subOrder,

        statuskey,

        actionById,

        actionByType


      });

      if (statuskey == 'delivered') {
        const mainOrder =
          await Order.findById(
            subOrder.orderId
          );

        mainOrder.paymentStatus = "completed";

        //jan multiple store h and multiple delevery bouy h to hum cod accpt nahi kar rahe h
        await mainOrder.save();
      }
      if (statuskey == 'orderrejectedbystore') {
        //Ordermain se subOrder.orderId ka use kar k data nikalo
        // fir totalamount me se storeTotal minus kardp or new
        //totalamount nikalo..agar totalamount<199 or couponcode  FIRST50 tha to dicount bhi zero karo or couponcode ko blank or uska discountAmount totalamount me add kardo
        //fir main order me update kardo data..dusri jagah se bhi call krana h,,,first50 k alawa koi discount h to use 0 karo , couponcode  ko blank or uska discountAmount totalamount me add kardo
        //...agar paymentStatus pending nahi h to  storeTotal   amount uske waalet me save krado
        //ye pura code ek function me daalna.
        await handleRejectedSubOrderAmount({

          statuskey,

          subOrder,

          cancelAmount:
            storeTotal,

          actionById,

          actionByType,

          suffix:
            'by store'

        });
      }

      // ==========================================
      // RESPONSE
      // ==========================================

      return res.json({

        success: true,

        message:
          'Status updated successfully'

      });

    }

    catch (error) {

      //console.log(error);

      return res.status(500).json({

        success: false,

        message:
          error.message

      });

    }

  }

);
// ==========================================
// FUNCTION
// ==========================================

async function thingstodowhenorderplacedSuborder(order, subOrder, objectstatusjson, customerId) {

  await saveLog(

    subOrder._id,

    'orderplacedbycustomer',

    objectstatusjson
      .orderplacedbycustomer
      .orderlogmessage,

    customerId,

    'Customer'

  );

  // ======================================
  // SEND NOTIFICATION
  // ======================================

  await sendNotifications({

    statuskey:
      'orderplacedbycustomer',

    order,

    subOrder

  });
}
async function thingstodowhenorderplaced(_id, objectstatusjson, commingfromrazorpay = false, completesuborderprocess = false) {
  //_id  =  ordermain ki _id

  //use _id to fetch order from Ordermain
  let order = await Order.findById(_id);

  if (!order) {
    throw new Error('Order not found');
  }

  const { customerId, mainorderid, amountfromwallet, adminId_backup_for_online_pay, adminId } = order;

  if (commingfromrazorpay) {

    if (adminId) {
      //iska matlab pahle cod tha bad me online pay kar diya
      return;

    }
    // Update adminId in Ordermain with backup adminId for online payment
    await Order.updateOne(
      { _id },
      { $set: { adminId: order.adminId_backup_for_online_pay } }
    );

    await SubOrder.updateMany(
      { orderId: _id },
      { $set: { adminId: order.adminId_backup_for_online_pay } }
    );
  }



  await saveLog(

    order._id,

    'orderplacedbycustomer',

    objectstatusjson
      .orderplacedbycustomer
      .orderlogmessage,

    customerId,

    'Customer'

  );

  if (amountfromwallet > 0) {
    await subtractamountfromwalletfromwallet(amountfromwallet, customerId, mainorderid, order._id);
  }
  if (completesuborderprocess) {
    //fetch data from suborder where orderId = _id and result will be array..and loop through that array
    const subOrders = await SubOrder.find({ orderId: _id });
    order = await Order.findById(_id);
    for (const subOrder of subOrders) {

      await thingstodowhenorderplacedSuborder(order, subOrder, objectstatusjson, customerId)

    }


  }


}


async function subtractamountfromwalletfromwallet(amountfromwallet, customerId, mainorderid, _id) {


  await Wallet.create({

    customerId:
      customerId,

    reason:
      `Amount deducted from wallet for use in order  ${mainorderid}`,

    amountType:
      "debit",

    amount:
      Number(amountfromwallet || 0),

    customerId,

    actionByType: 'Customer',

    datetime:
      new Date()

  });



  // ==========================================
  // SEND NOTIFICATION
  // ==========================================

  await saveNotification({

    userId:
      customerId,

    userType:
      'Customer',

    title:
      'Wallet updated with debit of amount Rs ' +
      Number(amountfromwallet || 0) + ' for use in order ' + mainorderid,

    message:
      Number(amountfromwallet || 0) +
      ' has been debited from your wallet because of   order placed usng wallet amount ' +
      mainorderid,

    relatedOrderId:
      _id

  });


}

async function handleRejectedSubOrderAmount({
  statuskey,
  subOrder,
  cancelAmount,
  actionById,
  actionByType,
  suffix

}) {

  // ==========================================
  // FIND MAIN ORDER 
  // ==========================================

  const mainOrder =
    await Order.findById(
      subOrder.orderId
    );

  if (!mainOrder) {
    throw new Error("Main order not found");
  }

  // ==========================================
  // FIND TOTAL SUB ORDERS
  // ==========================================

  const totalSubOrdersCount =
    await SubOrder.countDocuments({

      orderId:
        subOrder.orderId, suborderstatus: {
          $ne: 'Cancelled'
        }

    });

  // ==========================================
  // IF ONLY ONE SUBORDER
  // ==========================================
  //
  //
  if (totalSubOrdersCount == 0) {
    cancelAmount = mainOrder.totalamount;
    mainOrder.totalamount = 0;

    mainOrder.discountAmount = 0;

    mainOrder.deliveryCharge = 0;
    mainOrder.handlingCharge = 0;

    mainOrder.deliverydiscount = 0;

    mainOrder.couponcode = "";

    await mainOrder.save();

  }

  // ==========================================
  // MULTIPLE SUBORDERS
  // ==========================================

  else {

    // ==========================================
    // UPDATE TOTAL AMOUNT
    // ==========================================

    let newTotal =
      Number(mainOrder.totalamount || 0) -
      Number(cancelAmount || 0);

    if (newTotal < 0) {
      newTotal = 0;
    }

    // ==========================================
    // REMOVE DISCOUNT / COUPON
    // ==========================================

    if (mainOrder.discountAmount > 0) {

      // FIRST50 condition
      if (
        newTotal < 199 &&
        mainOrder.couponcode == "FIRST50"
      ) {

        newTotal =
          newTotal +
          Number(mainOrder.discountAmount || 0);

        mainOrder.discountAmount = 0;

        mainOrder.couponcode = "";

      }
      else if (
        newTotal > 199 &&
        mainOrder.couponcode == "FIRST50"
      ) {



      }
      // any other coupon also remove
      else if (
        mainOrder.couponcode
      ) {

        newTotal =
          newTotal +
          Number(mainOrder.discountAmount || 0);

        mainOrder.discountAmount = 0;

        mainOrder.couponcode = "";

      }

    }

    // ==========================================
    // SAVE NEW TOTAL
    // ==========================================

    mainOrder.totalamount = newTotal;

    if (newTotal < Number(cancelAmount || 0)) {
      cancelAmount = newTotal;
    }

    await mainOrder.save();

  }

  // ==========================================
  // WALLET CREDIT
  // ==========================================


  let amounttoaddinwallet = 0;
  if (
    mainOrder.paymentStatus &&
    mainOrder.paymentStatus != "pending"
  ) {
    amounttoaddinwallet = cancelAmount;
  } else {
    if (totalSubOrdersCount == 0) {
      amounttoaddinwallet = mainOrder.amountfromwallet;
    } else {

      if (cancelAmount > mainOrder.amountfromwallet) {
        amounttoaddinwallet = mainOrder.amountfromwallet;
      } else if (cancelAmount < mainOrder.amountfromwallet) {
        amounttoaddinwallet = mainOrder.amountfromwallet - cancelAmount;
      } else if (cancelAmount == mainOrder.amountfromwallet) {
        amounttoaddinwallet =
          cancelAmount;
      }
    }
  }


  if (amounttoaddinwallet > 0) {
    await Wallet.create({

      customerId:
        mainOrder.customerId,

      reason:
        `Refund for cancelled suborder ${subOrder.suborderid} ${suffix}`,

      amountType:
        "credit",

      amount:
        Number(amounttoaddinwallet || 0),

      actionById,

      actionByType,

      datetime:
        new Date()

    });

    // ==========================================
    // SAVE LOG
    // ==========================================

    await saveLog(

      subOrder._id,

      statuskey,

      Number(amounttoaddinwallet || 0) +
      ' has been credited to your wallet because of cancelled order ' +
      subOrder.suborderid,

      actionById,

      actionByType

    );

    // ==========================================
    // SEND NOTIFICATION
    // ==========================================

    await saveNotification({

      userId:
        subOrder.customerId,

      userType:
        'Customer',

      title:
        'Wallet updated with amount Rs ' +
        Number(amounttoaddinwallet || 0),

      message:
        Number(amounttoaddinwallet || 0) +
        ' has been credited to your wallet because of cancelled order ' +
        subOrder.suborderid,

      relatedOrderId:
        subOrder._id

    });

  }

}




// ======================================================
// ORDER DETAILS
// ======================================================

router.get(

  '/order-details/:id/:ordertype',

  async (req, res) => {

    try {

      const {
        id,
        ordertype
      } = req.params;

      // ==========================================
      // MAIN ORDER
      // ==========================================

      if (ordertype == 'main') {

        // MAIN ORDER

        const order =
          await Order.findOne({

            _id: id

          });

        if (!order) {

          return res.status(404).json({

            success: false,

            message:
              'Order not found'

          });

        }

        // SUB ORDERS

        const subOrdersRaw =
          await SubOrder.find({

            orderId:
              order._id

          })

            .sort({

              createdAt: -1

            });

        // SUB ORDERS WITH LOGS

        const subOrders = [];

        for (const subOrder of subOrdersRaw) {

          const logs =
            await OrderLog.find({

              orderId:
                subOrder._id

            })

              .sort({

                createdAt: 1

              });

          subOrders.push({

            ...subOrder.toObject(),

            logs

          });

        }

        // MAIN ORDER LOGS

        const mainOrderLogs =
          await OrderLog.find({

            orderId:
              order._id

          })

            .sort({

              createdAt: 1

            });

        // RESPONSE

        return res.json({

          success: true,

          ordertype:
            'main',

          order: {

            ...order.toObject(),

            logs:
              mainOrderLogs

          },

          subOrders

        });

      }

      // ==========================================
      // SUB ORDER
      // ==========================================

      else if (
        ordertype == 'sub'
      ) {

        // SUB ORDER

        const subOrderRaw =
          await SubOrder.findOne({

            _id: id

          });

        if (!subOrderRaw) {

          return res.status(404).json({

            success: false,

            message:
              'Sub order not found'

          });

        }

        // MAIN ORDER

        const mainOrder =
          await Order.findById(

            subOrderRaw.orderId

          );

        // SUB ORDER LOGS

        const subOrderLogs =
          await OrderLog.find({

            orderId:
              subOrderRaw._id

          })

            .sort({

              createdAt: 1

            });

        // MAIN ORDER LOGS

        const mainOrderLogs =
          await OrderLog.find({

            orderId:
              mainOrder._id

          })

            .sort({

              createdAt: 1

            });

        // RESPONSE

        return res.json({

          success: true,

          ordertype:
            'sub',

          mainOrder: {

            ...mainOrder.toObject(),

            logs:
              mainOrderLogs

          },

          subOrder: {

            ...subOrderRaw.toObject(),

            logs:
              subOrderLogs

          }

        });

      }

      // ==========================================
      // INVALID TYPE
      // ==========================================

      else {

        return res.status(400).json({

          success: false,

          message:
            'Invalid order type'

        });

      }

    }

    catch (error) {

      //console.log(error);

      return res.status(500).json({

        success: false,

        message:
          error.message

      });

    }

  }

);


// ======================================================
// CUSTOMER ORDERS GROUPED
// ======================================================

router.get(

  '/customer-orders/:customerId',

  async (req, res) => {

    try {

      const {
        customerId
      } = req.params;

      if (!customerId) {

        return res.status(400).json({

          success: false,

          message:
            'Customer id required'

        });

      }

      // ==========================================
      // FIND SUB ORDERS
      // ==========================================

      const subOrders =
        await SubOrder.find({

          customerId

        })

          .sort({

            createdAt: -1

          });

      // ==========================================
      // GROUPS
      // ==========================================

      const groupedOrders = {

        pending: [],

        delivered: [],

        returned: []

      };

      // ==========================================
      // LOOP
      // ==========================================

      for (const subOrder of subOrders) {

        const mainOrder =
          await Order.findById(

            subOrder.orderId

          );

        const finalObj = {

          mainOrder,

          subOrder

        };

        // ======================================
        // DELIVERED
        // ======================================

        if (

          subOrder.suborderstatus ==
          'Delivered'

        ) {

          groupedOrders
            .delivered
            .push(finalObj);

        }

        // ======================================
        // RETURNED
        // ======================================

        else if (

          subOrder.suborderstatus ==
          'Returned'

        ) {

          groupedOrders
            .returned
            .push(finalObj);

        }

        // ======================================
        // PENDING
        // ======================================

        else {

          groupedOrders
            .pending
            .push(finalObj);

        }

      }

      // ==========================================
      // RESPONSE
      // ==========================================

      return res.json({

        success: true,

        orders:
          groupedOrders

      });

    }

    catch (error) {

      //console.log(error);

      return res.status(500).json({

        success: false,

        message:
          error.message

      });

    }

  }

);
router.get(
  '/role-orders-delivered/:usertype/:userId/:storeId',
  async (req, res) => {

    try {
      const {
        fromDate,
        toDate
      } = req.query;
      const { usertype, userId, storeId } = req.params;

      let newQuery = {};

      // =====================================
      // DELIVERY BOY
      // =====================================

      if (usertype === 'deliveryboy') {



        newQuery = {

          deliveryBoyId: userId,

          suborderstatus: 'Delivered'

        };



      }

      // =====================================
      // STORE
      // =====================================

      else if (usertype === 'store') {


        newQuery = {

          storeId: storeId,

          finalstoreId: storeId,

          suborderstatus: 'Delivered'

        };



      }

      // =====================================
      // ADMIN
      // =====================================

      else if (usertype === 'admin') {

        // NEW
        // finalstoreId ya deliveryBoyId me se
        // koi bhi null ho

        newQuery = {

          adminId: userId,

          suborderstatus: 'Delivered',


        };


      }

      else {

        return res.status(400).json({
          success: false,
          message: 'Invalid usertype'
        });

      }

      // =====================================
      // FETCH SUB ORDERS
      // =====================================
      if (fromDate && toDate) {

        const startDate = new Date(fromDate);
        startDate.setHours(0, 0, 0, 0);

        const endDate = new Date(toDate);
        endDate.setHours(23, 59, 59, 999);

        newQuery.suborderdatetime = {
          $gte: startDate,
          $lte: endDate
        };
      }
      const [
        newSubOrders
      ] = await Promise.all([

        SubOrder.find(newQuery)
          .sort({ createdAt: -1 })
          .lean(),



      ]);
      //console.log(newSubOrders);
      // =====================================
      // UNIQUE MAIN ORDER IDS
      // =====================================

      const allOrderIds = [

        ...new Set([

          ...newSubOrders.map(
            x => x.orderId?.toString()
          ),



        ])

      ];

      // =====================================
      // FETCH MAIN ORDERS
      // =====================================

      const mainOrders = await Order.find({
        _id: { $in: allOrderIds }
      }).lean();

      // =====================================
      // CREATE MAP
      // =====================================

      const orderMap = {};

      mainOrders.forEach(order => {

        orderMap[
          order._id.toString()
        ] = order;

      });

      // =====================================
      // FORMAT FUNCTION
      // =====================================

      const formatOrders = (subOrders = []) => {

        return subOrders.map(subOrder => ({

          mainOrder:
            orderMap[
            subOrder.orderId?.toString()
            ] || null,

          subOrder

        }));

      };

      // =====================================
      // RESPONSE
      // =====================================

      return res.status(200).json({

        success: true,

        orders: {
          delivered: formatOrders(newSubOrders)

        }

      });

    }

    catch (error) {

      console.log(
        'role-orders-delivered error',
        error
      );

      return res.status(500).json({

        success: false,

        message: error.message

      });

    }

  }
);
router.get(
  '/role-orders/:usertype/:userId/:storeId',
  async (req, res) => {

    try {

      const { usertype, userId, storeId } = req.params;

      let newQuery = {};
      let inProgressQuery = {};

      // =====================================
      // DELIVERY BOY
      // =====================================

      if (usertype === 'deliveryboy') {

        const notifications = await Notification.find({
          userId,
          userType: 'DeliveryBoy',
          relatedOrderId: { $ne: null }
        }).lean();

        const orderIds = [
          ...new Set(
            notifications.map(
              x => x.relatedOrderId?.toString()
            )
          )
        ];

        // NEW
        // delivery boy ko wo orders dikhao
        // jisme delivery assign nahi hua

        newQuery = {

          orderId: { $in: orderIds },

          deliveryBoyId: null,

          suborderstatus: 'Pending'

        };

        // IN PROGRESS
        // delivery boy assigned

        inProgressQuery = {

          deliveryBoyId: userId,

          suborderstatus: 'Pending'

        };

      }

      // =====================================
      // STORE
      // =====================================

      else if (usertype === 'store') {

        // NEW
        // store assigned nahi hua

        newQuery = {

          storeId: storeId,

          finalstoreId: null,

          suborderstatus: 'Pending'

        };

        // IN PROGRESS
        // store accepted

        inProgressQuery = {

          finalstoreId: storeId,

          suborderstatus: 'Pending'

        };

      }

      // =====================================
      // ADMIN
      // =====================================

      else if (usertype === 'admin') {

        // NEW
        // finalstoreId ya deliveryBoyId me se
        // koi bhi null ho

        newQuery = {

          adminId: userId,

          suborderstatus: 'Pending',

          $or: [

            { finalstoreId: null },

            { deliveryBoyId: null }

          ]

        };

        // IN PROGRESS
        // dono assigned

        inProgressQuery = {

          adminId: userId,

          suborderstatus: 'Pending',

          finalstoreId: { $ne: null },

          deliveryBoyId: { $ne: null }

        };

      }

      else {

        return res.status(400).json({
          success: false,
          message: 'Invalid usertype'
        });

      }

      // =====================================
      // FETCH SUB ORDERS
      // =====================================

      const [
        newSubOrders,
        inProgressSubOrders
      ] = await Promise.all([

        SubOrder.find(newQuery)
          .sort({ createdAt: -1 })
          .lean(),

        SubOrder.find(inProgressQuery)
          .sort({ createdAt: -1 })
          .lean()

      ]);
      //console.log(newSubOrders);
      // =====================================
      // UNIQUE MAIN ORDER IDS
      // =====================================

      const allOrderIds = [

        ...new Set([

          ...newSubOrders.map(
            x => x.orderId?.toString()
          ),

          ...inProgressSubOrders.map(
            x => x.orderId?.toString()
          )

        ])

      ];

      // =====================================
      // FETCH MAIN ORDERS
      // =====================================

      const mainOrders = await Order.find({
        _id: { $in: allOrderIds }
      }).lean();

      // =====================================
      // CREATE MAP
      // =====================================

      const orderMap = {};

      mainOrders.forEach(order => {

        orderMap[
          order._id.toString()
        ] = order;

      });

      // =====================================
      // FORMAT FUNCTION
      // =====================================

      const formatOrders = (subOrders = []) => {

        return subOrders.map(subOrder => ({

          mainOrder:
            orderMap[
            subOrder.orderId?.toString()
            ] || null,

          subOrder

        }));

      };

      // =====================================
      // RESPONSE
      // =====================================

      return res.status(200).json({

        success: true,

        orders: {
          new: formatOrders(newSubOrders),

          inprogress: formatOrders(inProgressSubOrders)

        }

      });

    }

    catch (error) {

      console.log(
        'role-orders error',
        error
      );

      return res.status(500).json({

        success: false,

        message: error.message

      });

    }

  }
);
router.get(
  '/role-orders-cancelled/:usertype/:userId/:storeId',
  async (req, res) => {

    try {

      const { usertype, userId, storeId } = req.params;

      let newQuery = {};
      let inProgressQuery = {};

      // =====================================
      // DELIVERY BOY
      // =====================================



      // =====================================
      // STORE
      // =====================================

      if (usertype === 'store') {

        // NEW
        // store assigned nahi hua

        newQuery = {

          storeId: storeId,

          finalstoreId: storeId,

          suborderstatus: 'Cancelled'

        };



      }

      // =====================================
      // ADMIN
      // =====================================

      else if (usertype === 'admin') {

        // NEW
        // finalstoreId ya deliveryBoyId me se
        // koi bhi null ho

        newQuery = {

          adminId: userId,

          suborderstatus: 'Cancelled',



        };



      }

      else {

        return res.status(400).json({
          success: false,
          message: 'Invalid usertype'
        });

      }

      // =====================================
      // FETCH SUB ORDERS
      // =====================================

      const [
        newSubOrders
      ] = await Promise.all([

        SubOrder.find(newQuery)
          .sort({ createdAt: -1 })
          .lean()

      ]);

      // =====================================
      // UNIQUE MAIN ORDER IDS
      // =====================================

      const allOrderIds = [

        ...new Set([

          ...newSubOrders.map(
            x => x.orderId?.toString()
          )

        ])

      ];

      // =====================================
      // FETCH MAIN ORDERS
      // =====================================

      const mainOrders = await Order.find({
        _id: { $in: allOrderIds }
      }).lean();

      // =====================================
      // CREATE MAP
      // =====================================

      const orderMap = {};

      mainOrders.forEach(order => {

        orderMap[
          order._id.toString()
        ] = order;

      });

      // =====================================
      // FORMAT FUNCTION
      // =====================================

      const formatOrders = (subOrders = []) => {

        return subOrders.map(subOrder => ({

          mainOrder:
            orderMap[
            subOrder.orderId?.toString()
            ] || null,

          subOrder

        }));

      };

      // =====================================
      // RESPONSE
      // =====================================

      return res.status(200).json({

        success: true,

        orders: {
          cancelled: formatOrders(newSubOrders),



        }

      });

    }

    catch (error) {

      console.log(
        'role-orders-cancelled error',
        error
      );

      return res.status(500).json({

        success: false,

        message: error.message

      });

    }

  }
);
// ======================================================
// CUSTOMER ALL ORDER TABLE DATA
// ======================================================

router.get(

  '/customer-order-table-data/:customerId',

  async (req, res) => {

    try {

      const {
        customerId
      } = req.params;

      // ==========================================
      // VALIDATION
      // ==========================================

      if (!customerId) {

        return res.status(400).json({

          success: false,

          message:
            'Customer id required'

        });

      }

      // ==========================================
      // MAIN ORDER TABLE
      // ==========================================

      const mainordertablelist =
        await Order.find({

          customerId

        })

          .sort({

            createdAt: -1

          });

      // ==========================================
      // SUB ORDER TABLE
      // ==========================================

      const subordertablelist =
        await SubOrder.find({

          customerId

        })

          .sort({

            createdAt: -1

          });

      // ==========================================
      // RESPONSE
      // ==========================================

      return res.json({

        success: true,

        mainordertablelist,

        subordertablelist

      });

    }

    catch (error) {

      //console.log(error);

      return res.status(500).json({

        success: false,

        message:
          error.message

      });

    }

  }

);

router.get(

  '/allorders',

  async (req, res) => {

    try {



      // ==========================================
      // MAIN ORDER TABLE
      // ==========================================

      const mainordertablelist =
        await Order.find({



        })

          .sort({

            createdAt: -1

          });

      // ==========================================
      // SUB ORDER TABLE
      // ==========================================

      const subordertablelist =
        await SubOrder.find({



        })

          .sort({

            createdAt: -1

          });

      // ==========================================
      // RESPONSE
      // ==========================================

      return res.json({

        success: true,

        mainordertablelist,

        subordertablelist

      });

    }

    catch (error) {

      //console.log(error);

      return res.status(500).json({

        success: false,

        message:
          error.message

      });

    }

  }

);

// ======================================================
// DELIVERY BOY SELF ASSIGN MAIN ORDER
// ======================================================

router.post(
  '/assign-main-order-and-sub-order-to-deliveryboy',
  async (req, res) => {

    try {

      const {
        orderMainId,
        deliveryBoyId, deliveryBoyName, deliveryBoyMobile,
        actionById
      } = req.body;

      // ==========================================
      // VALIDATION
      // ==========================================

      if (!orderMainId) {

        return res.status(400).json({

          success: false,
          message: 'Main order id required'

        });

      }

      if (!deliveryBoyId) {

        return res.status(400).json({

          success: false,
          message: 'Delivery boy id required'

        });

      }

      // ==========================================
      // FIND MAIN ORDER
      // ==========================================

      const mainOrder = await Order.findById(
        orderMainId
      );

      if (!mainOrder) {

        return res.status(404).json({

          success: false,
          message: 'Main order not found'

        });

      }

      // ==========================================
      // FIND ALL SUB ORDERS
      // ==========================================

      const subOrders = await SubOrder.find({

        orderId: mainOrder._id

      });

      if (!subOrders.length) {

        return res.status(404).json({

          success: false,
          message: 'No suborders found'

        });

      }

      // ==========================================
      // CHECK IF ALREADY ASSIGNED
      // ==========================================

      const alreadyAssigned = subOrders.find(
        x => x.deliveryBoyId && x.subOrderstatus != 'Cancelled'
      );

      if (alreadyAssigned) {

        return res.status(400).json({

          success: false,
          message:
            'Delivery boy already assigned to one or more suborders'

        });

      }

      // ==========================================
      // ASSIGN DELIVERY BOY
      // ==========================================


      // below get delivery boy data from table


      let settlementtransactionidfordeliveryboy = '';
      let settlementmethodfordeliveryboy = '';
      let settlementdatetimefordeliveryboy = null;
      let settlementamountfordeliveryboy = 0;

      let settlementdonefordeliveryboy = false;


      const deliveryBoyData = await DeliveryBoy.find({

        _id: deliveryBoyId

      });

      if (!deliveryBoyData.length) {
        return res.status(404).json({

          success: false,
          message: 'Delivery boy not found'

        });

      } else {
        if (deliveryBoyData[0].onsalaryorcommission == 'salary') {
          // Do something

          settlementtransactionidfordeliveryboy = 'Salary';
          settlementmethodfordeliveryboy = 'Salary';
          settlementdatetimefordeliveryboy = new Date();
          settlementamountfordeliveryboy = 0;
          settlementdonefordeliveryboy = true;


        } else {
          if (deliveryBoyData[0].comissionType == 'fixed') {
            settlementamountfordeliveryboy = parseFloat(deliveryBoyData[0].commission).toFixed(2);

          }
          else if (deliveryBoyData[0].comissionType == 'percent') {
            settlementamountfordeliveryboy = (mainOrder.deliveryCharge * parseFloat(deliveryBoyData[0].commission) / 100) / subOrders.length;
          }

        }
      }



      //



      for (const subOrder of subOrders) {
        if (subOrder.suborderstatus != 'Cancelled') {

          subOrder.deliveryBoyId = deliveryBoyId;

          subOrder.deliveryBoyName = deliveryBoyName;
          subOrder.deliveryBoyMobile = deliveryBoyMobile;

          subOrder.settlementdonefordeliveryboy = settlementdonefordeliveryboy;
          subOrder.settlementamountfordeliveryboy = settlementamountfordeliveryboy;
          subOrder.settlementmethodfordeliveryboy = settlementmethodfordeliveryboy;
          subOrder.settlementdatetimefordeliveryboy = settlementdatetimefordeliveryboy;
          subOrder.settlementtransactionidfordeliveryboy = settlementtransactionidfordeliveryboy;

          await updateSubOrderStatus({

            subOrder,

            statuskey:
              'orderacceptedbydeliveryboy',

            actionById:
              deliveryBoyId,

            actionByType:
              'DeliveryBoy'

          });

        }

      }

      // ==========================================
      // RESPONSE
      // ==========================================

      return res.status(200).json({

        success: true,

        message:
          'Delivery boy assigned successfully to all suborders'

      });

    }

    catch (error) {

      //console.log(error);

      return res.status(500).json({

        success: false,
        message: error.message

      });

    }

  }
);

router.post('/set-settlement-amount-for-deliveryboy', async (req, res, next) => {

  try {
    var subOrderId = req.body.subOrderId;
    var settlementAmount = req.body.settlementamountfordeliveryboy;
    // write upate query to update settlement amount for delivery boy  
    const result = await SubOrder.updateOne({ _id: subOrderId }, { $set: { settlementamountfordeliveryboy: settlementAmount } });


    res.json({ message: "Worked Successfully !", result, success: "true" });
  } catch (error) {
    console.error(error);
    res.json({ message: "Something went wrong ! ", error: error.message, success: "false" });
  }
});
router.post('/markAsUnsettledForDeliveryBoy_or_store', async (req, res, next) => {

  try {
    var subOrderId = req.body.subOrderId;
    var type = req.body.type;
    if (type == 'store') {
      const result = await SubOrder.updateOne({ _id: subOrderId }, {
        $set: {
          settlementdoneforstore: false, settlementamountforstore: 0,
          settlementmethodforstore: '', settlementtransactionidforstore: ''
        }
      });
    } else if (type == 'deliveryboy') {
      const result = await SubOrder.updateOne({ _id: subOrderId }, {
        $set: {
          settlementdonefordeliveryboy: false,
          settlementmethodfordeliveryboy: '', settlementtransactionidfordeliveryboy: ''
        }
      });

    }



    res.json({ message: "Worked Successfully !", success: "true" });
  } catch (error) {
    console.error(error);
    res.json({ message: "Something went wrong ! ", error: error.message, success: "false" });
  }
});

router.post('/settle-store-payments', async (req, res) => {

  try {

    const {
      storeId,
      paymentMethod,
      settlementDateTime,
      transactionId, fromDate, toDate, commissiontotakefromstore_percent
    } = req.body;

    //console.log("storeId", storeId);

    const rowsBefore = await SubOrder.find({
      storeId
    });

    //console.log("Found Rows:", rowsBefore.length);
    let startDate = new Date(0);
    let endDate = new Date();

    if (fromDate && toDate) {
      startDate = new Date(fromDate);
      startDate.setHours(0, 0, 0, 0);

      endDate = new Date(toDate);
      endDate.setHours(23, 59, 59, 999);
    }

    const updateResult = await SubOrder.updateMany(
      {
        storeId,
        suborderstatus: 'Delivered',
        settlementdoneforstore: false, suborderdatetime: {
          $gte: new Date(startDate),
          $lte: new Date(endDate)
        }
      },
      {
        $set: {
          settlementdoneforstore: true,
          settlementdatetimeforstore: new Date(settlementDateTime),
          settlementmethodforstore: paymentMethod,
          settlementtransactionidforstore: transactionId || ''
        }
      }
    );
    const rows = await SubOrder.find({
      storeId
    });
    let remainingforstore = 0;
    for (const row of rows) {
      remainingforstore = row.storeTotaltoshowtostore - (row.storeTotaltoshowtostore * commissiontotakefromstore_percent / 100);

      row.settlementamountforstore =
        remainingforstore || 0;

      await row.save();

    }
    //console.log("Update Result", updateResult);

    return res.json({
      success: true,
      updateResult
    });

  } catch (err) {

    //console.log(err);

    return res.json({
      success: false,
      error: err.message
    });

  }

});
router.post('/settle-deliveryboy-payments', async (req, res) => {

  try {

    const {
      deliveryBoyId,
      paymentMethod,
      settlementDateTime,
      transactionId, fromDate, toDate
    } = req.body;

    let startDate = new Date(0);
    let endDate = new Date();

    if (fromDate && toDate) {
      startDate = new Date(fromDate);
      startDate.setHours(0, 0, 0, 0);

      endDate = new Date(toDate);
      endDate.setHours(23, 59, 59, 999);
    }

    await SubOrder.updateMany(
      {
        deliveryBoyId,
        suborderstatus: 'Delivered',
        $or: [
          { settlementdonefordeliveryboy: false },
          { settlementdonefordeliveryboy: { $exists: false } }
        ],
        ...(fromDate && toDate && {
          suborderdatetime: {
            $gte: startDate,
            $lte: endDate
          }
        })
      },
      {
        $set: {
          settlementdonefordeliveryboy: true,
          settlementdatetimefordeliveryboy: settlementDateTime,
          settlementmethodfordeliveryboy: paymentMethod,
          settlementtransactionidfordeliveryboy: transactionId || ''
        }
      }
    );

    return res.json({
      success: true
    });

  } catch (err) {

    //console.log(err);

    return res.json({
      success: false
    });

  }

});



//dashbard start

async function getDashboardStats({
  startDate = null,
  endDate = null,
  usertype,
  userId,
  storeId
}) {

  let query = {
    suborderstatus: 'Delivered'
  };

  // =========================
  // ROLE FILTER
  // =========================

  if (usertype === 'admin') {

    query.adminId = userId;

  }

  else if (usertype === 'store') {

    query.storeId = storeId;
    query.finalstoreId = storeId;

  }

  // =========================
  // DATE FILTER
  // =========================

  if (startDate && endDate) {

    query.suborderdatetime = {
      $gte: startDate,
      $lte: endDate
    };

  }

  // =========================
  // SUBORDERS FETCH
  // =========================

  const subOrders =
    await SubOrder.find(query).lean();

  // =========================
  // UNIQUE ORDERS
  // =========================

  const orderIds = [
    ...new Set(
      subOrders.map(x =>
        x.orderId?.toString()
      )
    )
  ];

  const orders =
    await Order.find({
      _id: { $in: orderIds }
    }).lean();

  const orderMap = {};

  orders.forEach(order => {
    orderMap[
      order._id.toString()
    ] = order;
  });

  // =========================
  // STORE DASHBOARD
  // =========================

  if (usertype === 'store') {

    const deliveredCount =
      subOrders.length;

    const deliveredAmount =
      subOrders.reduce(
        (sum, x) =>
          sum +
          Number(
            x.storeTotaltoshowtostore || 0
          ),
        0
      );

    const settledRows =
      subOrders.filter(
        x => x.settlementdoneforstore
      );

    const nonSettledRows =
      subOrders.filter(
        x => !x.settlementdoneforstore
      );

    // UNIQUE CUSTOMERS (STORE)
    const customerSet = new Set();

    subOrders.forEach(sub => {
      if (sub.customerId) {
        customerSet.add(
          sub.customerId.toString()
        );
      }
    });

    return {

      deliveredCount,

      deliveredAmount,

      settledCount:
        settledRows.length,

      settledAmount:
        settledRows.reduce(
          (sum, x) =>
            sum +
            Number(
              x.settlementamountforstore || 0
            ),
          0
        ),

      nonSettledCount:
        nonSettledRows.length,

      nonSettledAmount:
        nonSettledRows.reduce(
          (sum, x) =>
            sum +
            Number(
              x.storeTotaltoshowtostore || 0
            ),
          0
        ),

      customerCount:
        customerSet.size

    };
  }

  // =========================
  // ADMIN DASHBOARD
  // =========================

  const uniqueMainOrders = {};

  orders.forEach(order => {
    uniqueMainOrders[
      order._id.toString()
    ] = order;
  });

  let deliveredAmount = 0;

  let deliveredAmount_cod = 0;

  let deliveredAmount_online = 0;


  Object.values(uniqueMainOrders)
    .forEach(order => {



      let amount =
        Number(order.totalamount || 0);


      deliveredAmount += amount;



      if (
        order.paymentMethod &&
        order.paymentMethod.toLowerCase() === "cod"
      ) {

        deliveredAmount_cod += amount;

      }


      else if (

        order.paymentMethod &&

        order.paymentMethod.toLowerCase() !== "cod"

      ) {

        deliveredAmount_online += amount;

      }


    });

  let settledCount = 0;
  let settledAmount = 0;

  let nonSettledCount = 0;
  let nonSettledAmount = 0;

  let dbSettledCount = 0;
  let dbSettledAmount = 0;

  let dbNonSettledCount = 0;
  let dbNonSettledAmount = 0;

  let storeSettledCount = 0;
  let storeSettledAmount = 0;

  let storeNonSettledCount = 0;
  let storeNonSettledAmount = 0;

  // =========================
  // SUBORDER LOOP
  // =========================

  subOrders.forEach(sub => {

    if (
      sub.settlementdoneforstore &&
      sub.settlementdonefordeliveryboy
    ) {

      settledCount++;

      settledAmount +=
        Number(
          sub.settlementamountforstore || 0
        ) +
        Number(
          sub.settlementamountfordeliveryboy || 0
        );

    } else {

      nonSettledCount++;

      if (!sub.settlementdoneforstore) {

        nonSettledAmount +=
          Number(
            sub.storeTotaltoshowtostore || 0
          );
      }

      if (!sub.settlementdonefordeliveryboy) {

        nonSettledAmount +=
          Number(
            sub.settlementamountfordeliveryboy || 0
          );
      }

    }

    // DELIVERY BOY

    if (sub.settlementdonefordeliveryboy) {

      dbSettledCount++;

      dbSettledAmount +=
        Number(
          sub.settlementamountfordeliveryboy || 0
        );

    } else {

      dbNonSettledCount++;

      dbNonSettledAmount +=
        Number(
          sub.settlementamountfordeliveryboy || 0
        );
    }

    // STORE

    if (sub.settlementdoneforstore) {

      storeSettledCount++;

      storeSettledAmount +=
        Number(
          sub.settlementamountforstore || 0
        );

    } else {

      storeNonSettledCount++;

      storeNonSettledAmount +=
        Number(
          sub.storeTotaltoshowtostore || 0
        );
    }

  });

  // =========================
  // PROFIT CALCULATION
  // =========================

  let profit = 0;

  Object.values(uniqueMainOrders)
    .forEach(order => {

      const relatedSubs =
        subOrders.filter(
          x =>
            String(x.orderId) ===
            String(order._id)
        );

      const fullySettled =
        relatedSubs.every(
          x =>
            x.settlementdoneforstore &&
            x.settlementdonefordeliveryboy
        );

      if (!fullySettled) return;

      let storeTotal = 0;
      let dbTotal = 0;

      relatedSubs.forEach(sub => {

        storeTotal +=
          Number(
            sub.settlementamountforstore || 0
          );

        dbTotal +=
          Number(
            sub.settlementamountfordeliveryboy || 0
          );

      });

      profit +=
        Number(order.totalamount || 0)
        - storeTotal
        - dbTotal;

    });

  // =========================
  // UNIQUE CUSTOMER COUNT (ADMIN)
  // =========================

  const customerSet = new Set();

  subOrders.forEach(sub => {
    if (sub.customerId) {
      customerSet.add(
        sub.customerId.toString()
      );
    }
  });

  // =========================
  // RETURN
  // =========================

  return {

    deliveredCount:
      subOrders.length,

    deliveredAmount,

    profit,

    deliveredAmount_cod,


    deliveredAmount_online,
    settledCount,
    settledAmount,

    nonSettledCount,
    nonSettledAmount,

    dbSettledCount,
    dbSettledAmount,

    dbNonSettledCount,
    dbNonSettledAmount,

    storeSettledCount,
    storeSettledAmount,

    storeNonSettledCount,
    storeNonSettledAmount,

    customerCount:
      customerSet.size

  };
}
router.get(
  '/dashboard/:usertype/:userId/:storeId',
  async (req, res) => {

    try {

      const {
        usertype,
        userId,
        storeId
      } = req.params;

      const now = new Date();

      const todayStart =
        new Date(
          now.getFullYear(),
          now.getMonth(),
          now.getDate()
        );

      const todayEnd =
        new Date();

      const yesterdayStart =
        new Date(todayStart);

      yesterdayStart.setDate(
        yesterdayStart.getDate() - 1
      );

      const yesterdayEnd =
        new Date(todayStart);

      yesterdayEnd.setMilliseconds(-1);

      const currentMonthStart =
        new Date(
          now.getFullYear(),
          now.getMonth(),
          1
        );

      const lastMonthStart =
        new Date(
          now.getFullYear(),
          now.getMonth() - 1,
          1
        );

      const lastMonthEnd =
        new Date(
          now.getFullYear(),
          now.getMonth(),
          0,
          23,
          59,
          59
        );

      const last7Days =
        new Date();

      last7Days.setDate(
        last7Days.getDate() - 6
      );

      const last30Days =
        new Date();

      last30Days.setDate(
        last30Days.getDate() - 29
      );

      const currentWeekStart =
        new Date(now);

      currentWeekStart.setDate(
        now.getDate() - now.getDay()
      );

      const lastWeekStart =
        new Date(currentWeekStart);

      lastWeekStart.setDate(
        lastWeekStart.getDate() - 7
      );

      const lastWeekEnd =
        new Date(currentWeekStart);

      lastWeekEnd.setMilliseconds(-1);

      return res.json({

        success: true,

        today:
          await getDashboardStats({
            startDate: todayStart,
            endDate: todayEnd,
            usertype,
            userId,
            storeId
          }),

        yesterday:
          await getDashboardStats({
            startDate: yesterdayStart,
            endDate: yesterdayEnd,
            usertype,
            userId,
            storeId
          }),

        currentWeek:
          await getDashboardStats({
            startDate: currentWeekStart,
            endDate: now,
            usertype,
            userId,
            storeId
          }),

        lastWeek:
          await getDashboardStats({
            startDate: lastWeekStart,
            endDate: lastWeekEnd,
            usertype,
            userId,
            storeId
          }),

        last7Days:
          await getDashboardStats({
            startDate: last7Days,
            endDate: now,
            usertype,
            userId,
            storeId
          }),

        currentMonth:
          await getDashboardStats({
            startDate: currentMonthStart,
            endDate: now,
            usertype,
            userId,
            storeId
          }),

        lastMonth:
          await getDashboardStats({
            startDate: lastMonthStart,
            endDate: lastMonthEnd,
            usertype,
            userId,
            storeId
          }),

        last30Days:
          await getDashboardStats({
            startDate: last30Days,
            endDate: now,
            usertype,
            userId,
            storeId
          }),

        overall:
          await getDashboardStats({
            usertype,
            userId,
            storeId
          })

      });

    }

    catch (error) {

      //console.log(error);

      return res.status(500).json({

        success: false,

        message: error.message

      });

    }

  }
);
// dashboard end



///custom order


router.post(

  "/createcustomorder",


  uploadMultipleFields([

    {
      name: "images",
      maxCount: 5
    },

    {
      name: "pdf",
      maxCount: 1
    }

  ]),

  async (req, res) => {


    try {


      let body = req.body;



      let order =
        new CustomOrder({



          adminId:

            body.adminId
          ,



          customerId:

            body.customerId
          ,




          type:
            body.type,




          images:
            body.images || [],



          pdf:
            body.pdf || "",




          cake:

            body.cake ?
              JSON.parse(body.cake)
              : null,




          medical:

            body.medical ?
              JSON.parse(body.medical)
              : [],





          other:

            body.other ?
              JSON.parse(body.other)
              : null,




          extraDetail:

            body.extraDetail || ""


        });




      let saved =
        await order.save();





      // ADMIN NOTIFICATION


      await Notification.create({

        userId: body.adminId,

        title: "New Custom Order",

        message:
          `New ${body.type} order received`,


        type: "custom_order",

        referenceId: saved._id


      });





      res.json({

        success: true,

        message: "Custom Order Created",

        data: saved


      });



    }
    catch (err) {


      //console.log(err);


      res.status(500).json({

        success: false,

        message: err.message

      });


    }



  });








router.post(
  "/createnewitemwhencustomapprovecustoorder",

  async (req, res) => {


    try {


      let {

        _id,
        type,
        cake, categories
        , extraDetail, estimateAmount, estimateAmount_store,
        images, adminId, storeId, storeName, medical, itemName




      } = req.body;

      let finalitemid;
      let objtosave = {};
      objtosave.itemType = "single";
      objtosave.description = extraDetail;
      objtosave.message_on_cake_for_customorder = '';

      objtosave.isitfromcustom = true;
      objtosave.ratingCount = 1;
      objtosave.rating = 5;
      objtosave.appPrice = estimateAmount;
      objtosave.storePrice = estimateAmount_store;
      objtosave.variant_or_addon = "";
      objtosave.categories = categories;
      objtosave.itemQuestions = [];
      objtosave.size = '1';


      objtosave.filterKeys = [];
      objtosave.images = images;
      objtosave.useThisItemAsChild = false;
      objtosave.parentId = [];
      objtosave.variantItems = [];
      objtosave.addons = [];
      objtosave.original_item_id = null;
      objtosave.addedBy = adminId;

      objtosave.addedByString = 'store';
      objtosave.storeId = storeId;
      objtosave.showOnFront = false; //note 

      objtosave.storeName = storeName; //note  

      if (type == 'cake') {

        if (cake.egglesstype == 'With Egg') {

          objtosave.vegtype = "nonveg";
        }
        else {

          objtosave.vegtype = "veg";
        }
        objtosave.itemName = "Cake " + cake.flavour + " - " + cake.weight;
        objtosave.itemSubName = cake.flavour + " - " + cake.weight;

        objtosave.message_on_cake_for_customorder = cake.message;


        objtosave.unit = 'kg';



      } else if (type == 'medical') {
        objtosave.vegtype = "na";

        let mstr = '';
        medical.forEach((item) => {
          mstr += "Medicine - " + item.name + ", Quantity - " + item.quantity
        })
        if (mstr == '') {
          mstr = "Medicines "
        }
        objtosave.itemName = mstr;
        objtosave.itemSubName = mstr;

      }
      else if (type == 'other') {
        objtosave.vegtype = "na";
        objtosave.itemName = itemName;
        objtosave.itemSubName = itemName;

      }



      let item =
        new Item(objtosave);




      let savedItem =
        await item.save();

      let update = {};

      update = {

        finalitemid: savedItem._id
      };




      let data = await CustomOrder.findByIdAndUpdate(

        _id,

        update,

        {
          new: true
        }

      );



      res.json({

        success: true,
        finalitemid: savedItem._id,


      });



    }
    catch (e) {

      res.json({

        success: false,

        message: e.message

      });


    }

  });



// CUSTOMER ORDER LIST


router.post(
  "/actionbycustomerforcustomorder",

  async (req, res) => {


    try {


      let {

        _id,

        action,




      } = req.body;



      let update = {};

      update = {

        statusByCustomer: action,
        finalitemid: "pending"
      };




      let data = await CustomOrder.findByIdAndUpdate(

        _id,

        update,

        {
          new: true
        }

      );



      res.json({

        success: true,

        data

      });



    }
    catch (e) {

      res.json({

        success: false,

        message: e.message

      });


    }

  });



router.post(
  "/saveAdminreplyforcustomorder",

  async (req, res) => {


    try {


      let {
        customerId,
        orderId,

        action,

        storeId,

        categories,

        estimateAmount,
        estimateAmount_store,
        estimatemessage,

        cancelReason


      } = req.body;



      let update = {};



      if (action == "Approve") {


        update = {

          statusByAdmin: "approved",

          storeId,

          categories,

          estimateAmount,
          estimateAmount_store,
          estimatemessage

        };


      }

      else {


        update = {

          statusByAdmin: "rejected",

          cancelReason

        };


      }




      let data = await CustomOrder.findByIdAndUpdate(

        orderId,

        update,

        {
          new: true
        }

      );


      // ADMIN NOTIFICATION


      await Notification.create({

        userId: customerId,

        title: "Status update for Custom Order",

        message:
          `Custom Order has been ${action}. Please check fastBite app for more info `,


        type: "custom_order",

        referenceId: orderId


      });

      res.json({

        success: true,

        data

      });



    }
    catch (e) {

      res.json({

        success: false,

        message: e.message

      });


    }



  });

router.post(

  "/customorderlist",

  async (req, res) => {


    try {


      let {
        adminId,
        customerId,
        usertype
      } = req.body;



      let orders;



      if (usertype == 'admin') {


        orders = await CustomOrder.find({

          adminId: adminId

        })

          .populate({

            path: "customerId",

            select: "name mobile"

          })

          .populate({

            path: "storeId",

            select: "storeName"

          })

          .sort({

            createdAt: -1

          });





        // category names

        let Category = mongoose.model("Category");



        orders = await Promise.all(

          orders.map(async (order) => {


            let newCategories = [];



            if (order.categories?.length) {



              for (let cat of order.categories) {



                let level1 =
                  await Category.findById(cat.level1)
                    .select("categoryName");



                let level2 =
                  await Category.findById(cat.level2)
                    .select("categoryName");



                let level3 =
                  await Category.findById(cat.level3)
                    .select("categoryName");




                newCategories.push({

                  level1: {
                    id: cat.level1,
                    name: level1?.categoryName || ''
                  },


                  level2: {
                    id: cat.level2,
                    name: level2?.categoryName || ''
                  },


                  level3: {
                    id: cat.level3,
                    name: level3?.categoryName || ''
                  }


                });



              }



            }




            return {

              ...order.toObject(),


              storeName:
                order.storeId?.storeName || '',


              categories: newCategories



            }





          })

        );



      }

      else {


        orders =
          await CustomOrder.find({

            customerId: customerId

          })
            .populate({

              path: "storeId",

              select: "storeName"

            })
            .sort({

              createdAt: -1

            });


      }




      res.json({

        success: true,

        data: orders


      });



    }

    catch (err) {


      res.status(500).json({

        success: false,

        message: err.message

      });


    }


  });






//custom order end

//razorpay

router.post('/ceatebackendorderforazorpay', (req, res, next) => {

  var customerid = req.body.customerid;
  var order_id = req.body.orderId;
  var amount = +req.body.amount;
  // var key_id = 'rzp_test_j7RLzYPQkJqadt';
  // var instance = new Razorpay({
  //   key_id: key_id,
  //   key_secret: '4vXK6ldx0cm6msN1ys00Ptcs'
  // })

  // original start fastbite//
  var key_id = 'rzp_live_SyjCU22ljP4QGI';
  var instance = new Razorpay({
    key_id: key_id,
    key_secret: 'n00r4MoiKECB4SdWluJNJAn0'
  })

  //original end//

  //test start
  //var key_id = 'rzp_test_2c2QJAZekFLCny';// 'rzp_test_2c2QJAZekFLCny';
  //var instance = new Razorpay({
  // key_id: key_id,
  // key_secret: 'Z6y6VmieaPGXU7uuwBuEpuW5'  //'Z6y6VmieaPGXU7uuwBuEpuW5'
  //})
  // test end
  var options = {
    amount: parseInt(amount) * 100,  // amount in the smallest currency unit
    currency: "INR",
    receipt: order_id,
    notes: { "customerid": customerid, "order_id": order_id }
  };

  instance.orders.create(options, function (err, order) {

    if (err) {
      res.json({ message: "Something went wrong ! ", err, status: "ERROR" });
    } else {
      res.json({
        message: "Worked Successfully !", rajororder: order, order_id: order_id,
        key: key_id, status: "true"
      });
    }
  });
});

router.post('/completeorderforrazorpay', async (req, res, next) => {

  var customerid = req.body.customerid;
  var order_id = req.body.order_id;
  var amount = req.body.amount;

  var transaction_details = req.body.transaction_details;
  await Order.updateOne({ _id: order_id }, {
    $set: {
      paymentMethod: 'online',
      paymentStatus: 'paid', transaction_details: transaction_details, transactionId: transaction_details.razorpay_order_id
    }
  });
  await thingstodowhenorderplaced(order_id, objectstatusjson, true, true)
  return res.json({ success: true, message: "Payment completed successfully." });
});

//razorpay end
module.exports = router;
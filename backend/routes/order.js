// routes/order.js

const express = require('express');
const Razorpay = require('razorpay');
const admin =
  require('../firebase');
const router = express.Router();
const Wallet = require("../models/Wallet");
const { getIO } =
  require("../socket");
const Customer = require("../models/Customer");

const Order = require("../models/Ordermain");
const Store = require("../models/Store");
const StoreOwner = require("../models/storeOwner");


const DeliveryBoy = require("../models/DeliveryBoy");
const DeliveryArea = require("../models/DeliveryArea");

const OrderLog = require("../models/OrderLog");
const SubOrder = require("../models/Suborder");
const Item = require("../models/Item");
const AdminUserModel = require("../models/AdminUser");

const Notification =
  require('../models/Notification');

//




const objectstatusjson =
  require('../utils/objectstatusjson');



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
      'FCM Sent'
    );

  }

  catch (err) {
    console.log('FCM FULL ERROR');
    console.log(err);
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

    token =
      user?.fcmToken;

  }

  else if (
    userType == 'DeliveryBoy'
  ) {

    const user =
      await DeliveryBoy.findById(
        userId
      );

    token =
      user?.fcmToken;

  }

  else if (
    userType == 'Store'
  ) {

    const StoreOwner =
      await StoreOwner.findById(
        userId
      );

    token =
      StoreOwner?.fcmToken;

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

  }
  title = "Hi " + userType + " - " + title;
  await sendFCM({

    token,

    title,

    body: message

  });

  //fcm emnd



  // try {

  //   const io = getIO();

  //   io.to(
  //     userId.toString()
  //   ).emit(
  //     "newNotification",
  //     notification
  //   );
  //   await Notification.create({

  //     userId,
  //     userType,
  //     title: 'newNotification' + title,
  //     message: 'newNotification' + message,
  //     relatedOrderId

  //   });
  // }
  // catch (err) {

  //   console.log(
  //     "Socket notification error:",
  //     err.message
  //   );

  // }

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
            item.showOnFront == false
          ) {

            return res.status(400).json({

              success: false,

              message:
                `${item.itemName} hidden`

            });

          }

        }

      }

      // ==========================================
      // CREATE MAIN ORDER
      // ==========================================

      const mainorderid =

        'ORD-' +

        Date.now();

      const order =
        await Order.create({

          mainorderid,

          customerId,

          adminId,

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


      // ==========================================
      // CREATE SUB ORDERS
      // ==========================================

      const createdSubOrders = [];

      for (const storeBlock of cart) {

        const suborderid =

          'SUB-' +

          Date.now() +

          '-' +

          Math.floor(
            Math.random() * 10000
          );

        const subOrder =
          await SubOrder.create({

            orderId:
              order._id,

            mainorderid:
              order.mainorderid,

            suborderid,

            customerId,

            adminId,

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

      console.log(error);

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

      console.log(subOrder)

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

      console.log(error);

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

  if (notifications.Store && subOrder.finalstoreId) {

    const store =
      await Store.findById(
        subOrder.finalstoreId
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

      console.log(error);

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

      console.log(error);

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

      console.log(error);

      return res.status(500).json({

        success: false,

        message:
          error.message

      });

    }

  }

);

router.get(
  '/role-orders/:usertype/:userId',
  async (req, res) => {

    try {

      const { usertype, userId } = req.params;

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

          storeId: userId,

          finalstoreId: null,

          suborderstatus: 'Pending'

        };

        // IN PROGRESS
        // store accepted

        inProgressQuery = {

          finalstoreId: userId,

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
      console.log(newSubOrders);
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

      console.log(error);

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

      console.log(error);

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
        deliveryBoyId, deliveryBoyName,
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

      for (const subOrder of subOrders) {
        if (subOrder.suborderstatus != 'Cancelled') {

          subOrder.deliveryBoyId = deliveryBoyId;

          subOrder.deliveryBoyName = deliveryBoyName;


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

      console.log(error);

      return res.status(500).json({

        success: false,
        message: error.message

      });

    }

  }
);




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

  // original start//
  var key_id = 'rzp_live_LJWKXNL2lGNgFd';// 'rzp_test_2c2QJAZekFLCny';
  var instance = new Razorpay({
    key_id: key_id,
    key_secret: 'ycoSZmQ8n8qSNgcD3LS8dnMM'  //'Z6y6VmieaPGXU7uuwBuEpuW5'
  })

  //original end//

  //test start
  var key_id = 'rzp_test_2c2QJAZekFLCny';// 'rzp_test_2c2QJAZekFLCny';
  var instance = new Razorpay({
    key_id: key_id,
    key_secret: 'Z6y6VmieaPGXU7uuwBuEpuW5'  //'Z6y6VmieaPGXU7uuwBuEpuW5'
  })
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
  return res.json({ success: true, message: "Payment completed successfully." });
});

//razorpay end
module.exports = router;
// routes/order.js

const express = require('express');

const router = express.Router();

//
const Order = require("../models/Ordermain");
const Store = require("../models/Store");
const DeliveryBoy = require("../models/DeliveryBoy");
const OrderLog = require("../models/OrderLog");
const SubOrder = require("../models/Suborder");
const Item = require("../models/Item");

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

  await Notification.create({

    userId,

    userType,

    title,

    message,

    relatedOrderId

  });

}



// ======================================================
// SEND NOTIFICATIONS
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
        'Order Update',

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
        'Order Update',

      message:
        notifications.DeliveryBoy.message,

      relatedOrderId:
        order._id

    });

  }

  // ==========================================
  // STORE
  // ==========================================

  if (notifications.Store) {

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
          'Order Update',

        message:
          notifications.Store.message,

        relatedOrderId:
          order._id

      });

    }

  }

}



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

  subOrder.suborderstatus =

    statusData
      .keyvalueforfrontend;

  subOrder.statustext =

    statusData
      .textmessageofstatus;

  await subOrder.save();

  // ==========================================
  // SAVE LOG
  // ==========================================

  await saveLog(

    subOrder.orderId,

    statuskey,

    statusData
      .orderlogmessage,

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

        deliverydiscount,
        amountfromwallet,
        deliveryCharge,

        totalamount,

        customerId,

        adminId,

        selectedaddress,

        deleveryinstruction,

        paymentMethod,

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

          discountAmount:
            discountAmount || 0,

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
              storeBlock.items

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
        'Order Update',

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
        'Order Update',

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
        'Order Update',

      message:
        notifications.DeliveryBoy.message,

      relatedOrderId:
        order._id

    });

  }

  // ==========================================
  // STORE
  // ==========================================

  if (notifications.Store) {

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
          'Order Update',

        message:
          notifications.Store.message,

        relatedOrderId:
          order._id

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

        actionById,

        actionByType

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
      // UPDATE STATUS
      // ==========================================

      await updateSubOrderStatus({

        subOrder,

        statuskey,

        actionById,

        actionByType

      });

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
 


module.exports = router;
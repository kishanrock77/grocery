const express = require("express");
const router = express.Router();

const Order = require("../models/Ordermain");
const Store = require("../models/Store");
const DeliveryBoy = require("../models/DeliveryBoy");
const OrderLog = require("../models/OrderLog");

const sendNotification = require("../utils/sendNotification");


/* --------------------------------
SAVE ORDER LOG
-------------------------------- */

async function saveLog(orderId, action, message, userId, userType) {

  await OrderLog.create({

    orderId,
    action,
    message,
    actionById: userId,
    actionByType: userType

  });

}


/* --------------------------------
FIND NEAREST DELIVERY BOY
-------------------------------- */

async function findNearestBoy(lat, lng) {

  return await DeliveryBoy.findOne({

    status: true,
    isAvailable: true,

    location: {
      $near: {
        $geometry: {
          type: "Point",
          coordinates: [lng, lat]
        },
        $maxDistance: 5000
      }

    }

  });

}


/* --------------------------------
CREATE ORDER (Customer)
-------------------------------- */

router.post("/create", async (req, res) => {
  try {
    const { customerId, storeId, deliveryAddress, latitude, longitude, items } = req.body;

    const store = await Store.findById(storeId);
    if (!store) return res.status(404).json({ msg: "Store not found" });

    // Calculate total orderAmount
    let totalAmount = 0;
    const orderItems = items.map(item => {
      let addOnTotal = 0;
      if (item.addOns && item.addOns.length > 0) {
        addOnTotal = item.addOns.reduce((sum, a) => sum + a.price, 0);
      }
      const itemTotal = item.price * item.quantity + addOnTotal;
      totalAmount += itemTotal;

      return {
        productId: item.productId,
        mainProductId: item.mainProductId,
        name: item.name,
        variantName: item.variantName,
        quantity: item.quantity,
        price: item.price,
        addOns: item.addOns || []
      };
    });

    const order = new Order({
      orderNumber: "ORD" + Date.now(),
      customerId,
      storeId,
      orderItems,
      orderAmount: totalAmount,
      deliveryAddress,
      userLocation: { type: "Point", coordinates: [parseFloat(longitude), parseFloat(latitude)] },
      orderStatus: "pending"
    });

    await order.save();

    // Log
    await saveLog(order._id, "order_created", "Order placed by customer", customerId, "user");

    res.json({ msg: "Order created", order });

  } catch (err) {
    console.log(err);
    res.status(500).send(err);
  }
});
router.post("/payment-success", async (req, res) => {

  await Order.findByIdAndUpdate(

    req.body.orderId,

    {
      paymentStatus: "paid",
      paymentId: req.body.paymentId,
      paymentGateway: "razorpay"
    }

  );

  res.json({ msg: "Payment updated" });

});
router.post("/cod-payment", async (req, res) => {

  try {

    const order = await Order.findById(req.body.orderId);

    if (!order) {
      return res.json({ msg: "Order not found" });
    }

    if (order.paymentMethod !== "cod") {
      return res.json({ msg: "Not a COD order" });
    }

    order.paymentStatus = "paid";
    order.paymentGateway = "cash";
    order.paymentId = "COD-" + Date.now();

    await order.save();

    await saveLog(

      order._id,
      "payment_collected",
      "Cash collected by delivery boy",
      req.body.deliveryBoyId,
      "deliveryboy"

    );

    res.json({ msg: "COD payment confirmed" });

  } catch (err) {
    res.status(500).send(err);
  }

});
/* --------------------------------
STORE ACCEPT ORDER
-------------------------------- */

router.post("/store-accept", async (req, res) => {

  try {

    const order = await Order.findById(req.body.orderId);

    order.orderStatus = "store_accepted";

    await order.save();


    await saveLog(

      order._id,
      "store_accepted",
      "Store accepted the order",
      req.body.storeId,
      "store"

    );


    /* FIND NEAREST BOY */

    const store = await Store.findById(order.storeId);

    const storeLat = store.location.coordinates[1];
    const storeLng = store.location.coordinates[0];

    const boy = await findNearestBoy(storeLat, storeLng);


    if (boy) {

      order.deliveryBoyId = boy._id;
      order.orderStatus = "assigned";
      order.assignTime = new Date();

      await order.save();


      await saveLog(

        order._id,
        "boy_auto_assigned",
        "Delivery boy auto assigned",
        boy._id,
        "system"

      );


      /* DELIVERY BOY NOTIFICATION */

      await sendNotification(

        boy._id,
        "deliveryboy",

        "New Order Assigned",

        "You have received a new delivery order",

        order._id

      );

    }
    else {

      /* SEND NOTIFICATION TO ALL BOYS */

      const boys = await DeliveryBoy.find({ status: true });

      for (const b of boys) {

        await sendNotification(

          b._id,
          "deliveryboy",

          "New Order Available",

          "Please accept delivery order",

          order._id

        );

      }

    }

    res.json({ msg: "Store accepted order" });

  } catch (err) {

    res.status(500).send(err);

  }

});


/* --------------------------------
STORE REJECT ORDER
-------------------------------- */

router.post("/store-reject", async (req, res) => {

  try {

    const order = await Order.findById(req.body.orderId);

    order.orderStatus = "store_rejected";

    await order.save();


    await saveLog(

      order._id,
      "store_rejected",
      "Store rejected the order",
      req.body.storeId,
      "store"

    );


    /* CUSTOMER NOTIFICATION */

    await sendNotification(

      order.customerId,
      "user",

      "Order Rejected",

      "Store rejected your order",

      order._id

    );


    /* IF DELIVERY BOY ASSIGNED */

    if (order.deliveryBoyId) {

      await sendNotification(

        order.deliveryBoyId,
        "deliveryboy",

        "Order Cancelled",

        "Order cancelled by store",

        order._id

      );

      order.deliveryBoyId = null;

      await order.save();

    }

    res.json({ msg: "Order rejected by store" });

  } catch (err) {

    res.status(500).send(err);

  }

});


/* --------------------------------
DELIVERY BOY ACCEPT
-------------------------------- */

router.post("/boy-accept", async (req, res) => {

  try {

    const order = await Order.findOneAndUpdate(

      {
        _id: req.body.orderId,
        deliveryBoyId: req.body.deliveryBoyId,
        orderStatus: "assigned"
      },

      {
        $set: {
          orderStatus: "boy_accepted"
        }
      },

      { new: true }

    );


    if (!order) {

      return res.json({

        success: false,
        msg: "Order already accepted by another delivery boy"

      });

    }


    /* ORDER LOG */

    await saveLog(

      order._id,
      "boy_accepted",
      "Delivery boy accepted order",
      req.body.deliveryBoyId,
      "deliveryboy"

    );

    res.json({

      success: true,
      msg: "Order accepted"

    });

  } catch (err) {

    res.status(500).send(err);

  }

});

/* --------------------------------
DELIVERY BOY REJECT
-------------------------------- */

router.post("/boy-reject", async (req, res) => {

  try {

    const order = await Order.findOneAndUpdate(

      {
        _id: req.body.orderId,
        deliveryBoyId: req.body.deliveryBoyId,
        orderStatus: "assigned"
      },

      {
        $set: {
          orderStatus: "boy_rejected",
          deliveryBoyId: null
        }
      },

      { new: true }

    );

    if (!order) {

      return res.json({

        success: false,
        msg: "Order already processed"

      });

    }


    /* LOG */

    await saveLog(

      order._id,
      "boy_rejected",
      "Delivery boy rejected order",
      req.body.deliveryBoyId,
      "deliveryboy"

    );

    res.json({

      success: true,
      msg: "Order rejected"

    });

  } catch (err) {

    res.status(500).send(err);

  }

});

/* --------------------------------
CUSTOMER CANCEL ORDER
-------------------------------- */

router.post("/cancel-by-customer", async (req, res) => {

  try {

    const order = await Order.findById(req.body.orderId);

    if (order.orderStatus === "packed") {

      return res.json({ msg: "Order cannot be cancelled now" });

    }

    order.orderStatus = "cancelled_by_customer";

    await order.save();


    await saveLog(

      order._id,
      "cancelled_by_customer",
      "Order cancelled by customer",
      req.body.customerId,
      "user"

    );


    /* STORE NOTIFICATION */

    await sendNotification(

      order.storeId,
      "store",

      "Order Cancelled",

      "Customer cancelled the order",

      order._id

    );


    /* DELIVERY BOY NOTIFICATION */

    if (order.deliveryBoyId) {

      await sendNotification(

        order.deliveryBoyId,
        "deliveryboy",

        "Order Cancelled",

        "Customer cancelled order",

        order._id

      );

    }

    res.json({ msg: "Order cancelled" });

  } catch (err) {

    res.status(500).send(err);

  }

});


/* --------------------------------
ORDER LIST
-------------------------------- */

router.get("/list", async (req, res) => {

  const orders = await Order.find({ status: true })

    .populate("storeId")
    .populate("deliveryBoyId")

    .sort({ createdAt: -1 });

  res.json(orders);

});


/* --------------------------------
ORDER LOGS
-------------------------------- */

router.get("/logs/:orderId", async (req, res) => {

  const logs = await OrderLog.find({

    orderId: req.params.orderId,
    status: true

  }).sort({ createdAt: 1 });

  res.json(logs);

});
router.get("/store/:storeId", async (req, res) => {

  try {

    const orders = await Order.find({

      storeId: req.params.storeId,
      status: true

    })

      .populate("deliveryBoyId")

      .sort({ createdAt: -1 });

    res.json(orders);

  } catch (err) {

    res.status(500).send(err);

  }

});
router.get("/deliveryboy/:boyId", async (req, res) => {

  try {

    const orders = await Order.find({

      deliveryBoyId: req.params.boyId,
      status: true

    })

      .populate("storeId")

      .sort({ createdAt: -1 });

    res.json(orders);

  } catch (err) {

    res.status(500).send(err);

  }

});
router.get("/customer/:customerId", async (req, res) => {

  try {

    const orders = await Order.find({

      customerId: req.params.customerId,
      status: true

    })

      .populate("storeId")

      .sort({ createdAt: -1 });

    res.json(orders);

  } catch (err) {

    res.status(500).send(err);

  }

});
router.get("/admin", async (req, res) => {

  try {

    const orders = await Order.find({ status: true })

      .populate("storeId")
      .populate("deliveryBoyId")

      .sort({ createdAt: -1 });

    res.json(orders);

  } catch (err) {

    res.status(500).send(err);

  }

});
router.get("/filter", async (req, res) => {

  try {

    let query = { status: true };


    /* ORDER STATUS */

    if (req.query.status) {

      query.orderStatus = req.query.status;

    }


    /* STORE WISE */

    if (req.query.storeId) {

      query.storeId = req.query.storeId;

    }


    /* DATE FILTER */

    if (req.query.startDate && req.query.endDate) {

      query.createdAt = {

        $gte: new Date(req.query.startDate),
        $lte: new Date(req.query.endDate)

      };

    }


    /* TODAY ORDERS */

    if (req.query.type === "today") {

      const start = new Date();
      start.setHours(0, 0, 0, 0);

      const end = new Date();
      end.setHours(23, 59, 59, 999);

      query.createdAt = { $gte: start, $lte: end };

    }


    /* LAST 7 DAYS */

    if (req.query.type === "last7days") {

      const start = new Date();
      start.setDate(start.getDate() - 7);

      query.createdAt = { $gte: start };

    }


    let orders = await Order.find(query)

      .populate("storeId")
      .populate("deliveryBoyId")

      .sort({ createdAt: -1 });


    /* CITY FILTER (store city) */

    if (req.query.city) {

      orders = orders.filter(o =>

        o.storeId && o.storeId.city &&
        o.storeId.city.toLowerCase() === req.query.city.toLowerCase()

      );

    }


    res.json(orders);

  } catch (err) {

    res.status(500).send(err);

  }

});
router.get("/revenue-stats", async (req, res) => {

  try {

    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    const todayEnd = new Date();
    todayEnd.setHours(23, 59, 59, 999);

    const last7days = new Date();
    last7days.setDate(last7days.getDate() - 7);

    const monthStart = new Date();
    monthStart.setDate(1);
    monthStart.setHours(0, 0, 0, 0);


    /* TOTAL REVENUE */

    const totalRevenue = await Order.aggregate([
      {
        $match: {
          status: true,
          orderStatus: "delivered"
        }
      },
      {
        $group: {
          _id: null,
          total: { $sum: "$orderAmount" }
        }
      }
    ]);


    /* TODAY REVENUE */

    const todayRevenue = await Order.aggregate([
      {
        $match: {
          status: true,
          orderStatus: "delivered",
          createdAt: { $gte: todayStart, $lte: todayEnd }
        }
      },
      {
        $group: {
          _id: null,
          total: { $sum: "$orderAmount" }
        }
      }
    ]);


    /* LAST 7 DAYS */

    const last7Revenue = await Order.aggregate([
      {
        $match: {
          status: true,
          orderStatus: "delivered",
          createdAt: { $gte: last7days }
        }
      },
      {
        $group: {
          _id: null,
          total: { $sum: "$orderAmount" }
        }
      }
    ]);


    /* MONTHLY */

    const monthRevenue = await Order.aggregate([
      {
        $match: {
          status: true,
          orderStatus: "delivered",
          createdAt: { $gte: monthStart }
        }
      },
      {
        $group: {
          _id: null,
          total: { $sum: "$orderAmount" }
        }
      }
    ]);


    /* STORE WISE */

    const storeRevenue = await Order.aggregate([
      {
        $match: {
          status: true,
          orderStatus: "delivered"
        }
      },
      {
        $group: {
          _id: "$storeId",
          totalRevenue: { $sum: "$orderAmount" },
          orders: { $sum: 1 }
        }
      },
      {
        $sort: { totalRevenue: -1 }
      },
      {
        $limit: 10
      }
    ]);


    res.json({

      totalRevenue: totalRevenue[0]?.total || 0,
      todayRevenue: todayRevenue[0]?.total || 0,
      last7Revenue: last7Revenue[0]?.total || 0,
      monthlyRevenue: monthRevenue[0]?.total || 0,
      topStores: storeRevenue

    });

  } catch (err) {

    res.status(500).send(err);

  }

});
router.get("/detail/:orderId", async (req, res) => {
  try {
    const order = await Order.findById(req.params.orderId)
      .populate("customerId", "name email mobile")
      .populate("storeId", "name city")
      .populate("deliveryBoyId", "name email mobile")
      .lean(); // lean() for easier manipulation

    if (!order) return res.status(404).json({ msg: "Order not found" });

    // Populate each order item product info (name, images)
    for (let i = 0; i < order.orderItems.length; i++) {
      const item = order.orderItems[i];
      const product = await Product.findById(item.productId).lean();
      if (product) {
        item.productImages = product.images || [];
        item.productDescription = product.description || "";
      }

      // If mainProductId exists, fetch main product info
      if (item.mainProductId) {
        const mainProduct = await Product.findById(item.mainProductId).lean();
        if (mainProduct) {
          item.mainProductName = mainProduct.name;
          item.mainProductImages = mainProduct.images || [];
        }
      }
    }

    res.json(order);
  } catch (err) {
    console.log(err);
    res.status(500).send(err);
  }
});
// store_pending
// store_accepted
// store_rejected
// assigned
// boy_accepted
// boy_rejected
// cancelled_by_customer
// packed
// delivered
module.exports = router;
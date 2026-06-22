const cron = require("node-cron");

const Order = require("../models/Ordermain");
const Notification = require("../models/Notification");
const OrderLog = require("../models/OrderLog");

async function saveLog(orderId, action, message) {
    await OrderLog.create({
        orderId: orderId,
        action: action,
        message: message,
        actionByType: "system"
    });
}

/*
CHECK EVERY 1 MINUTE
*/

// Store cron job in a variable
const task = cron.schedule("* * * * *", async () => {
    try {
        const tenMinAgo = new Date(Date.now() - 10 * 60 * 1000);

        const orders = await Order.find({
            orderStatus: "assigned",
            assignTime: { $lte: tenMinAgo }
        });

        for (const order of orders) {
            // notification for admin
            await Notification.create({
                userId: order.adminId,
                userType: "admin",
                title: "Order Not Accepted",
                message: "Delivery boy did not accept order within 10 minutes",
                relatedOrderId: order._id
            });

            // log entry
            await saveLog(
                order._id,
                "timeout",
                "Delivery boy did not accept order within 10 minutes"
            );

            // order status change
            order.orderStatus = "not_accepted";
            await order.save();
        }
    } catch (err) {
        console.log("Cron error", err);
    }
});

// STOP THE CRON JOB TEMPORARILY
task.stop();  // ← Abhi ye cron job run nahi karega

// Agar dubara start karna ho
// task.start();













// git add  backend/routes/auth.js
//        git add   backend/routes/category.js
//         git add    backend/routes/customer.js
//        git add   backend/routes/deliveryArea.js
//       git add    backend/routes/deliveryboy.js
//         git add    backend/routes/home.js
//         git add    backend/routes/item.js
//         git add    backend/routes/notification.js
//         git add    backend/routes/order.js
//         git add    backend/routes/product.js
//         git add    backend/routes/store.js
//         git add    backend/routes/wallet.js
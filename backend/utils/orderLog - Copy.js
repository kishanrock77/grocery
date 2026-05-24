const Notification = require("../models/Notification");

const { getIO } = require("../socket");

async function sendNotification(userId, userType, title, message, orderId) {

    const noti = await Notification.create({

        userId: userId,
        userType: userType,

        title: title,
        message: message,

        relatedOrderId: orderId

    });


    const io = getIO();

    if (io) {

        io.to(userId.toString()).emit("newNotification", {

            title: title,
            message: message,
            orderId: orderId

        });

    }

    return noti;

}

module.exports = sendNotification;
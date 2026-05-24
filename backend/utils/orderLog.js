const OrderLog = require("../models/OrderLog");

async function saveLog(orderId,action,message,userId,userType){

await OrderLog.create({

orderId:orderId,
action:action,
message:message,
actionById:userId,
actionByType:userType

});

}

module.exports = saveLog;
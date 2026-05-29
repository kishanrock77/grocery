let objectstatusjson = {

  orderplacedbycustomer: {
    whenwillhappen: "When order is placed by customer",
    iscancellable: true,
    actionby: "Customer",
    nextactionby: ["Admin","Any_DeliveryBoy"],
    notificationto: {
      "Admin": { "message": "New order placed. Please assign a delivery boy." },
      "All_Online_DeliveryBoys": { "message": "A new order has been placed." }
    },
    orderlogmessage: "Order Placed by Customer",
    keyvalueforfrontend: "Pending",
    textmessageofstatus: "Waiting for delivery boy assignment",
    nextactionkey: ['orderacceptedbydeliveryboy', 'cancelledbycustomer'],
    prevousactionkey: null

  },
  orderacceptedbydeliveryboy: {
    whenwillhappen: "When delivery boy     accepts the order",
    iscancellable: true,
    actionby: "DeliveryBoy",
    nextactionby: ["Admin", "DeliveryBoy", "Store"],
    notificationto: {
      "Admin": { "message": "Order accepted by delivery boy." },
      "Customer": { "message": "Your order has been accepted by the delivery boy. Waiting for store acceptance." },
      "Store": { "message": "Order accepted by delivery boy. Please accept or reject the order." }
    },
    orderlogmessage: "Order Accepted by Delivery Boy",
    keyvalueforfrontend: "Pending",
    textmessageofstatus: "Waiting for store acceptance",
    nextactionkey: ['orderrejectedbydeliveryboy', 'orderacceptedbystore', 'orderrejectedbystore','cancelledbycustomer'],
    prevousactionkey: ['orderplacedbycustomer']
  },
  orderrejectedbydeliveryboy: {
    whenwillhappen: "When delivery boy rejects the order",
    iscancellable: true,
    actionby: "DeliveryBoy",
    nextactionby: ["Automatic"],
    notificationto: {
      "Admin": { "message": "Order rejected by delivery boy. Please assign another delivery boy." },
      "All_Online_DeliveryBoys": { "message": "A new order has been placed." },
      "Customer": { "message": "Your order has been rejected by the delivery boy. We are assigning another delivery boy to your order." }
    },
    orderlogmessage: "Order Rejected by Delivery Boy",
    keyvalueforfrontend: "Pending",
    textmessageofstatus: "Waiting for delivery boy assignment again",
    nextactionkey: ['orderacceptedbydeliveryboy', 'cancelledbycustomer'],
    prevousactionkey: ['orderacceptedbydeliveryboy']
  },
  orderacceptedbystore: {
    whenwillhappen: "When store accepts the order",
    iscancellable: true,
    actionby: "Store",
    nextactionby: ["Store"],
    notificationto: {
      "Admin": { "message": "Order accepted by store." },
      "DeliveryBoy": { "message": "Order accepted by store. Please proceed to pack and deliver." },
      "Customer": { "message": "Your order has been accepted by the store. It is being prepared for delivery." }
    },
    orderlogmessage: "Order Accepted by Store",
    keyvalueforfrontend: "Pending",
    textmessageofstatus: "Store has accepted the order and waiting for start of preparation",
    nextactionkey: ['orderrejectedbystore', 'underpreparation', 'cancelledbycustomer'],
    prevousactionkey: ['orderacceptedbydeliveryboy']
  },
  orderrejectedbystore: {
    whenwillhappen: "When store rejects the order",
    iscancellable: false,  ///ek bar order cancel karde tab koi kuch nahi kar sakta
    actionby: "Store",
    nextactionby: ["Automatic"],
    notificationto: {
      "Admin": { "message": "Order rejected by store. Please ask customer to create a new order." },
      "DeliveryBoy": { "message": "Order rejected by store.  Please ask customer to create a new order." },
      "Customer": { "message": "Your order has been rejected by the store. Please create a new order." }
    },
    orderlogmessage: "Order Rejected by Store",
    keyvalueforfrontend: "Cancelled",
    textmessageofstatus: "Your order has been rejected by the store. Please create a new order.",
    nextactionkey: [],
    prevousactionkey: ['packedorder', 'underpreparation', 'orderacceptedbystore']
  },
  cancelledbycustomer: {
    whenwillhappen: "When customer cancels the order",
    iscancellable: false,
    /// After cancellation by customer no more cancellation allowed because order is already cancelled. So false.
    actionby: "Customer",
    nextactionby: null,
    notificationto: {
      "Admin": { "message": "Order cancelled by customer." },
      "DeliveryBoy": { "message": "Order cancelled by customer." },
      "Store": {
        "message": "Order cancelled by customer. Do not proceed.",
         condtionofifactionisinorpassedbelewkeys: [
          'orderacceptedbystore'
        ]
      }
    },
    orderlogmessage: "Order Cancelled by Customer",
    keyvalueforfrontend: "Cancelled",
    textmessageofstatus: "Order has been cancelled by the customer",
    nextactionkey: [],
    prevousactionkey: ['orderplacedbycustomer', 'orderacceptedbydeliveryboy',
      'orderrejectedbydeliveryboy', 'orderacceptedbystore']
  },
  underpreparation: {
    whenwillhappen: "When store starts preparing the order",
    iscancellable: false, //no cancel after preparation starts because order is already under preparation. So false.
    // After order is under preparation, only store can take action like packed or cancelled by store. Customer cannot cancel the order after preparation starts because it is already under preparation. So false.
    actionby: "Store",
    nextactionby: ["Store"],
    notificationto: {
      "Admin": { "message": "Order is under preparation." },
      "DeliveryBoy": { "message": "Order is under preparation. Please wait for packing." },
      "Customer": { "message": "Your order is under preparation. It will be ready soon." }
    },
    orderlogmessage: "Order Under Preparation",
    keyvalueforfrontend: "Pending",
    textmessageofstatus: "Store is preparing the order",
    nextactionkey: ['packedorder', 'orderrejectedbystore'],
    prevousactionkey: ['orderacceptedbystore']
  },
  packedorder: {
    whenwillhappen: "When store packs the order",
    iscancellable: false, //no cancel after order is packed because order is already packed. So false.
    actionby: "Store",
    nextactionby: ["DeliveryBoy"],
    notificationto: {
      "Admin": { "message": "Order is packed and ready for delivery." },
      "DeliveryBoy": { "message": "Order is packed and ready for delivery. Please proceed to deliver." },
      "Customer": { "message": "Your order is packed and ready for delivery. The delivery boy is on the way." }
    },
    orderlogmessage: "Order Packed",
    keyvalueforfrontend: "Pending",
    textmessageofstatus: "Store has packed the order",
    nextactionkey: ['pickedorder', 'orderrejectedbystore'],
    prevousactionkey: ['underpreparation']
  },
  pickedorder: {
    whenwillhappen: "When delivery boy picks the order from store",
    iscancellable: false, //no cancel after order is picked because order is already picked. So false.
    actionby: "DeliveryBoy",
    nextactionby: ["DeliveryBoy"],
    notificationto: {
      "Admin": { "message": "Order is picked by delivery boy from store." },
      "Store": { "message": "Order is picked by delivery boy from your store." },
      "Customer": { "message": "Your order is picked by the delivery boy. It is on the way." }
    },
    orderlogmessage: "Order Picked by Delivery Boy",
    keyvalueforfrontend: "Pending",
    textmessageofstatus: "Order has been picked by the delivery boy",
    nextactionkey: ['delivered', 'orderrejectedbystore'],
    prevousactionkey: ['packedorder']
  },
  delivered: {
    whenwillhappen: "When delivery boy delivers the order",
    iscancellable: false,
    actionby: "DeliveryBoy",
    nextactionby: null,
    notificationto: {
      "Admin": { "message": "Order delivered successfully." },
      "Customer": { "message": "Your order has been delivered. Enjoy your meal!" },
      "Store": { "message": "Order delivered successfully." }
    },
    orderlogmessage: "Order Delivered",
    keyvalueforfrontend: "Delivered",
    textmessageofstatus: "Order has been delivered to the customer",
    nextactionkey: [],
    prevousactionkey: ['packedorder']
  }

}

module.exports =
  objectstatusjson;
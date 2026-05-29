// models/suborder.model.js

const mongoose = require('mongoose');

const subOrderSchema = new mongoose.Schema(
  {
    // MAIN ORDER LINK 
    orderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Order',
      required: true
    },
    adminId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "AdminUser"
    },
    mainorderid: {
      type: String,
      required: true,
      trim: true
    },

    // UNIQUE SUB ORDER ID
    suborderid: {
      type: String,
      required: true,
      unique: true,
      trim: true
    },

    // CUSTOMER
    customerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Customer',
      required: true
    },

    // STORE
    storeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Store',
      required: true
    },
    //final  STORE aasign value bewlo once store accepts the order and if store rejects the order
    //  then finalstoreid will be null because order will be assigned to another store if there is any other store in order items list or else order will be cancelled. So finalstoreid will be null in case of order rejection by store.
    finalstoreId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Store',
    },
    // DELIVERY BOY
    deliveryBoyId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Deliveryboy',
      default: null
    },
    deliveryBoyName: {
      type: String, 
      default: null
    },
    // STORE TOTAL
    storeTotal: {
      type: Number,
      required: true,
      default: 0
    },
    storeTotaltoshowtostore: {
      type: Number,
      required: true,
      default: 0
    },
    currentstatuskey: {
      type: String,
    },

    iscancellable: {
      type: Boolean,
      default: true
    },


    statustext: {
      type: String,
    },
    // STATUS
    suborderstatus: {
      type: String,
      default: 'Pending'
    },

    // STORE DATA
    storeInfo: {
      type: Object,
      required: true
    },

    // ONLY THIS STORE ITEMS
    items: {
      type: Array,
      required: true,
      default: []
    }
  },
  {
    timestamps: true
  }
);
subOrderSchema.index({
  deliveryBoyId: 1
});

subOrderSchema.index({
  storeId: 1
});

subOrderSchema.index({
  finalstoreId: 1
});

subOrderSchema.index({
  adminId: 1
});

subOrderSchema.index({
  suborderstatus: 1
});

subOrderSchema.index({
  orderId: 1
});
module.exports =
  mongoose.models.SubOrder ||
  mongoose.model('SubOrder', subOrderSchema);
const mongoose = require("mongoose");


const BannerSchema = new mongoose.Schema({

    adminId:{
        type:mongoose.Schema.Types.ObjectId,
        ref:"User",
        required:true
    },


    image:{
        type:String,
        required:true
    },


    url:{
        type:String,
        default:""
    }


},{
    timestamps:true
});


module.exports =
mongoose.model("Banner",BannerSchema);
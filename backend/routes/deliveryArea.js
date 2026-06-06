const express = require("express");
const router = express.Router();
const DeliveryArea = require("../models/DeliveryArea");
router.get("/list", async (req, res) => {
    try {

        const { adminId } = req.query;

        if (!adminId) {
            return res.status(400).json({
                success: false,
                message: "adminId is required"
            });
        }
        let areas;

if(adminId=='69ef67a741c55c6dbffd2a94'){

          areas = await DeliveryArea.find({
            
            status: true
        })
            .sort({ createdAt: -1 });
}else{

 
          areas = await DeliveryArea.find({
            adminId: adminId,
            status: true
        })
            .sort({ createdAt: -1 });
    }

        res.json({
            success: true,
            data: areas
        });

    } catch (err) {
        res.status(500).json({
            success: false,
            message: err.message
        });
    }
});
// CREATE
router.post("/create", async (req, res) => {
    try {
        const { cityName, areaName, adminId } = req.body;

        if (!cityName || !areaName) {
            return res.status(400).json({
                success: false,
                message: "City and Area are required"
            });
        }

        const newArea = new DeliveryArea({
            cityName,
            areaName,
            stateName: "Uttar Pradesh",
            adminId
        });

        await newArea.save();

        res.json({
            success: true,
            message: "Delivery Area Created",
            data: newArea
        });

    } catch (err) {

        // ✅ Duplicate Error Handle
        if (err.code === 11000) {
            return res.status(400).json({
                success: false,
                message: "This City + Area already exists"
            });
        }

        res.status(500).json({
            success: false,
            message: err.message
        });
    }
});router.put("/update/:id", async (req, res) => {
    try {

        const { cityName, areaName } = req.body;

        const updated = await DeliveryArea.findByIdAndUpdate(
            req.params.id,
            { cityName, areaName },
            { new: true, runValidators: true }
        );

        res.json({
            success: true,
            data: updated
        });

    } catch (err) {

        if (err.code === 11000) {
            return res.status(400).json({
                success: false,
                message: "City + Area already exists"
            });
        }

        res.status(500).json({
            success: false,
            message: err.message
        });
    }
});
router.delete("/delete/:id", async (req, res) => {
    try {

        await DeliveryArea.findByIdAndDelete(req.params.id);

        res.json({
            success: true,
            message: "Deleted successfully"
        });

    } catch (err) {
        res.status(500).json({
            success: false,
            message: err.message
        });
    }
});
module.exports = router;
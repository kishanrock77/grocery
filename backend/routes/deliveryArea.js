const express = require("express");
const router = express.Router();

const DeliveryArea = require("../models/DeliveryArea");
router.post("/add", async (req, res) => {

    try {

        const existing = await DeliveryArea.findOne({
            areaName: req.body.areaName,
            status: true
        });

        if (existing) {
            return res.json({ msg: "Area already exists" });
        }

        const area = new DeliveryArea({

            areaName: req.body.areaName,

            areaType: req.body.areaType,

            adminId: req.body.adminId

        });

        await area.save();

        res.json({
            msg: "Area added successfully"
        });

    } catch (err) {

        res.status(500).send(err);

    }

});
router.get("/list", async (req, res) => {

    try {

        const areas = await DeliveryArea.find({
            status: true
        })
            .populate("adminId", "name email");

        res.json(areas);

    } catch (err) {

        res.status(500).send(err);

    }

});
router.get("/detail/:id", async (req, res) => {

    try {

        const area = await DeliveryArea.findById(req.params.id);

        res.json(area);

    } catch (err) {

        res.status(500).send(err);

    }

});
router.delete("/delete/:id", async (req, res) => {

    try {

        await DeliveryArea.findByIdAndUpdate(
            req.params.id,
            { status: false }
        );

        res.json({
            msg: "Area deleted"
        });

    } catch (err) {

        res.status(500).send(err);

    }

});
module.exports = router;
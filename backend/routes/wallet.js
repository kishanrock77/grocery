const express = require("express");
const router = express.Router();

const Wallet = require("../models/Wallet");

router.post("/wallet-history", async (req, res) => {

    try {

        const { customerId } = req.body;

        if (!customerId) {
            return res.status(400).json({
                success: false,
                message: "customerId is required"
            });
        }

        const walletList = await Wallet.find({
            customerId
        })
        .sort({ datetime: -1 });

        let balanceAmount = 0;

        walletList.forEach(item => {

            if (item.amountType === "credit") {
                balanceAmount += Number(item.amount || 0);
            }

            if (item.amountType === "debit") {
                balanceAmount -= Number(item.amount || 0);
            }

        });

        return res.json({
            success: true,
            balanceAmount,
            totalTransactions: walletList.length,
            walletList
        });

    } catch (error) {

        console.error(error);

        return res.status(500).json({
            success: false,
            message: "Server error"
        });

    }

});

module.exports = router;
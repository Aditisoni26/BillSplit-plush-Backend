//routes//settlement.routes.js
const express = require("express");
const Expense = require("../models/Expense");
const calculateSettlement = require("../utils/calculateSettlement");
const auth = require("../middleware/auth");
const router = express.Router();
const SettlementPayment = require("../models/SettlementPayment");
const createNotification = require("../utils/createNotification");
const Group = require("../models/Group");
const History = require("../models/History");






router.get("/payments/:groupId", auth, async(req, res) => {
    const payments = await SettlementPayment.find({
        groupId: req.params.groupId
    });

    res.json(payments);
});


router.post("/pay", auth, async(req, res) => {
    console.log("PAY BODY:", req.body);
    console.log("REQ USER:", req.user);

    try {
        const { groupId, from, to, amount } = req.body;

        if (String(from) !== String(req.user)) {
            return res.status(403).json({ message: "Only payer can mark as paid" });
        }

        const payment = await SettlementPayment.create({
            groupId,
            from,
            to,
            amount,
            status: "paid"
        });
        await createNotification(to, {
            group: groupId,
            message: "A payment was marked as paid",
            type: "settlement",
        });


        res.json(payment);
    } catch (err) {
        console.error("PAY ERROR:", err);
        res.status(500).json({ message: "Server error" });
    }
});


router.post("/confirm/:paymentId", auth, async(req, res) => {
    try {
        const payment = await SettlementPayment.findById(req.params.paymentId);
        if (!payment) {
            return res.status(404).json({ message: "Payment not found" });
        }

        if (String(payment.to) !== String(req.user)) {
            return res.status(403).json({ message: "Not allowed" });
        }

        payment.status = "confirmed";
        payment.confirmedAt = new Date();
        await payment.save();

        await createNotification(payment.from, {
            group: payment.groupId,
            message: `Payment of ₹${payment.amount} confirmed`,
            type: "settlement",
        });
        await History.create({
            user: req.user,
            group: payment.groupId,
            action: "Payment confirmed",
            meta: { amount: payment.amount },
        });

        const groupId = payment.groupId;
        const expenses = await Expense.find({ groupId });
        const settlements = calculateSettlement(expenses);

        const confirmedPayments = await SettlementPayment.find({
            groupId,
            status: "confirmed"
        });

        const allSettled = settlements.every(s =>
            confirmedPayments.some(p =>
                String(p.from) === String(s.from) &&
                String(p.to) === String(s.to) &&
                Number(p.amount) === Number(s.amount)
            )
        );

        if (allSettled) {
            await Expense.deleteMany({ groupId });
            await SettlementPayment.deleteMany({ groupId });

            const group = await Group.findById(groupId);

            for (const memberId of group.members) {
                await createNotification(payment.from, {
                    group: payment.groupId,
                    message: `Payment of ₹${payment.amount} confirmed`,
                    type: "settlement",
                });

            }
        }

        res.json({ payment, allSettled });

    } catch (err) {
        console.error("CONFIRM SETTLEMENT ERROR:", err);
        res.status(500).json({ message: "Server error" });
    }
});



// 🔹 GET ALL PAYMENTS FOR A GROUP


router.get("/:groupId", auth, async(req, res) => {
    const expenses = await Expense.find({
        groupId: req.params.groupId
    });

    const settlements = calculateSettlement(expenses);

    const payments = await SettlementPayment.find({
        groupId: req.params.groupId,
        status: "confirmed"
    });

    const remaining = settlements.filter(s => {
        const isConfirmed = payments.some(p =>
            p.from.toString() === s.from &&
            p.to.toString() === s.to &&
            Number(p.amount) === Number(s.amount)
        );
        return !isConfirmed;
    });

    res.json(remaining);
});



module.exports = router;
//routes//expense.routes.js
const express = require("express");
const Expense = require("../models/Expense");
const Group = require("../models/Group");
const auth = require("../middleware/auth");
const createNotification = require("../utils/createNotification");
const History = require("../models/History");



const router = express.Router();

// Add expense
router.post("/", auth, async(req, res) => {
    try {
        const { groupId, amount, description, paidBy, splitType = "equal", splits } = req.body;

        const group = await Group.findById(groupId);
        if (!group) {
            return res.status(404).json({ message: "Group not found" });
        }

        let finalSplits = [];

        if (splitType === "equal") {
            const share = amount / group.members.length;

            finalSplits = group.members.map((m) => ({
                userId: m,
                amount: Number(share.toFixed(2)),
            }));
        }

        if (splitType === "unequal") {
            const total = splits.reduce((s, x) => s + x.amount, 0);
            if (total !== amount) {
                return res.status(400).json({ message: "Split total mismatch" });
            }

            finalSplits = splits.map((s) => ({
                userId: s.userId,
                amount: s.amount,
            }));
        }

        if (splitType === "percentage") {
            const total = splits.reduce((s, x) => s + x.amount, 0);
            if (total !== 100) {
                return res.status(400).json({ message: "Percentage must be 100" });
            }

            finalSplits = splits.map((s) => ({
                userId: s.userId,
                amount: Number(((amount * s.amount) / 100).toFixed(2)),
            }));
        }

        const expense = await Expense.create({
            groupId,
            paidBy,
            amount,
            description,
            splitType,
            splits: finalSplits,
        });
        await History.create({
            user: paidBy,
            group: groupId,
            action: "Expense added",
            meta: {
                description,
                amount
            }
        });

        res.json(expense);
    } catch (err) {
        console.error("ADD EXPENSE ERROR:", err);
        res.status(500).json({ message: "Failed to add expense" });
    }
});


// Get expenses of group
router.get("/group/:groupId", auth, async(req, res) => {
    const expenses = await Expense.find({ groupId: req.params.groupId })
        .populate("paidBy", "name")
        .populate("splits.userId", "name");

    res.json(expenses);
});

router.delete("/:expenseId", auth, async(req, res) => {
    try {
        const expense = await Expense.findById(req.params.expenseId);

        if (!expense) {
            return res.status(404).json({ message: "Expense not found" });
        }

        // ✅ FETCH GROUP FIRST
        const group = await Group.findById(expense.groupId);

        if (!group) {
            return res.status(404).json({ message: "Group not found" });
        }

        // ✅ ONLY GROUP CREATOR CAN DELETE
        if (String(group.createdBy) !== String(req.user)) {
            return res.status(403).json({ message: "Only group creator can delete expenses" });
        }

        await expense.deleteOne();
        await History.create({
            user: req.user,
            group: expense.groupId,
            action: "Expense deleted",
            meta: {
                description: expense.description,
                amount: expense.amount,
            },
        });


        res.json({ message: "Expense deleted successfully" });

    } catch (err) {
        console.error("DELETE EXPENSE ERROR:", err);
        res.status(500).json({ message: "Server error" });
    }
});



module.exports = router;
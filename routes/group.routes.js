const express = require("express");
const router = express.Router();

const Group = require("../models/Group");
const User = require("../models/User");
const Expense = require("../models/Expense");
const SettlementPayment = require("../models/SettlementPayment");
const History = require("../models/History");

const auth = require("../middleware/auth");
const calculateSettlement = require("../utils/calculateSettlement");
const createNotification = require("../utils/createNotification");

/* ======================
   CREATE GROUP
====================== */
router.post("/", auth, async(req, res) => {
    try {
        const group = await Group.create({
            name: req.body.name,
            createdBy: req.user,
            members: [req.user],
        });

        res.json(group);
    } catch (err) {
        res.status(500).json({ message: "Failed to create group" });
    }
});

/* ======================
   ADD MEMBER
====================== */
router.post("/:groupId/members", auth, async(req, res) => {
    try {
        const { username } = req.body;
        if (!username) {
            return res.status(400).json({ message: "Username required" });
        }

        const userToAdd = await User.findOne({ username });
        if (!userToAdd) {
            return res.status(404).json({ message: "User not found" });
        }

        const group = await Group.findById(req.params.groupId);
        if (!group) {
            return res.status(404).json({ message: "Group not found" });
        }

        const alreadyMember = group.members.some(
            (m) => String(m) === String(userToAdd._id)
        );

        if (!alreadyMember) {
            group.members.push(userToAdd._id);
            await group.save();
        }

        // 🔔 Notifications (non-blocking)
        try {
            await createNotification(userToAdd._id, {
                group: group._id,
                message: `You were added to group "${group.name}"`,
                type: "group",
            });
            await History.create({
                user: req.user,
                group: group._id,
                action: "Member added",
                meta: { username: userToAdd.username },
            });

            if (String(group.createdBy) !== String(userToAdd._id)) {
                await createNotification(group.createdBy, {
                    group: group._id,
                    message: `${userToAdd.name} was added to "${group.name}"`,
                    type: "group",
                });
            }
        } catch (_) {}

        const updated = await Group.findById(group._id).populate(
            "members",
            "name username"
        );

        res.json(updated);
    } catch (err) {
        res.status(500).json({ message: "Failed to add member" });
    }
});

/* ======================
   MY GROUPS
====================== */
router.get("/my", auth, async(req, res) => {
    try {
        const groups = await Group.find({ members: req.user })
            .populate("members", "name email")
            .populate("createdBy", "name email");

        res.json(groups);
    } catch (err) {
        res.status(500).json({ message: "Server error" });
    }
});

/* ======================
   GET GROUP
====================== */
router.get("/:groupId", auth, async(req, res) => {
    const group = await Group.findById(req.params.groupId).populate(
        "members",
        "name email"
    );

    if (!group) {
        return res.status(404).json({ message: "Group not found" });
    }

    res.json(group);
});

/* ======================
   REMOVE MEMBER
====================== */
router.delete("/:groupId/members/:memberId", auth, async(req, res) => {
    try {
        const { groupId, memberId } = req.params;

        const group = await Group.findById(groupId);
        if (!group) {
            return res.status(404).json({ message: "Group not found" });
        }

        if (String(group.createdBy) !== String(req.user)) {
            return res.status(403).json({ message: "Only admin can remove members" });
        }

        if (String(memberId) === String(group.createdBy)) {
            return res
                .status(400)
                .json({ message: "Cannot remove group creator" });
        }

        const expenses = await Expense.find({ groupId });
        const settlements = calculateSettlement(expenses);

        const hasUnsettled = settlements.some(
            (s) =>
            String(s.from) === String(memberId) ||
            String(s.to) === String(memberId)
        );

        if (hasUnsettled) {
            return res
                .status(400)
                .json({ message: "Member has unsettled balance" });
        }

        group.members = group.members.filter(
            (m) => String(m) !== String(memberId)
        );
        await group.save();

        // 🔔 Notifications (safe)
        try {
            await createNotification(memberId, {
                group: group._id,
                message: `You were removed from group "${group.name}"`,
                type: "group",
            });
            await History.create({
                user: req.user,
                group: group._id,
                action: "Member removed",
                meta: { memberId },
            });


            await createNotification(group.createdBy, {
                group: group._id,
                message: `A member was removed from "${group.name}"`,
                type: "group",
            });
        } catch (_) {}

        const updated = await Group.findById(group._id).populate("members", "name");
        res.json(updated);
    } catch (err) {
        res.status(500).json({ message: "Failed to remove member" });
    }
});

/* ======================
   DELETE GROUP
====================== */
router.delete("/:groupId", auth, async(req, res) => {
    try {
        const group = await Group.findById(req.params.groupId);
        if (!group) {
            return res.status(404).json({ message: "Group not found" });
        }

        if (String(group.createdBy) !== String(req.user)) {
            return res.status(403).json({ message: "Only admin can delete group" });
        }

        const membersToNotify = group.members.filter(
            (m) => String(m) !== String(req.user)
        );

        try {
            await createNotification(membersToNotify, {
                group: group._id,
                message: `Group "${group.name}" was deleted`,
                type: "group",
            });
            await History.create({
                user: req.user,
                group: payment.groupId,
                action: "Payment confirmed",
                meta: { amount: payment.amount },
            });

        } catch (_) {}

        await Expense.deleteMany({ groupId: group._id });
        await SettlementPayment.deleteMany({ groupId: group._id });
        await Group.deleteOne({ _id: group._id });

        res.json({ message: "Group deleted successfully" });
    } catch (err) {
        res.status(500).json({ message: "Failed to delete group" });
    }
});

module.exports = router;
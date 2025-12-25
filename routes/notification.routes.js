const express = require("express");
const Notification = require("../models/Notification");
const auth = require("../middleware/auth");

const router = express.Router();

// get my notifications
router.get("/", auth, async(req, res) => {
    const notifications = await Notification.find({ user: req.user })
        .populate("group", "name")
        .sort({ createdAt: -1 })
        .limit(20);

    res.json(notifications);
});

// mark as read
router.post("/:id/read", auth, async(req, res) => {
    await Notification.findByIdAndUpdate(req.params.id, { read: true });
    res.json({ success: true });
});

router.delete("/:id", auth, async(req, res) => {
    await Notification.deleteOne({ _id: req.params.id, user: req.user });
    res.json({ message: "Notification deleted" });
});


module.exports = router;
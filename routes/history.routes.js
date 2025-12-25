const express = require("express");
const router = express.Router();
const History = require("../models/History");
const auth = require("../middleware/auth");

// last 7 days history for a group

router.get("/", auth, async(req, res) => {
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const history = await History.find({
            user: req.user,
            createdAt: { $gte: sevenDaysAgo }
        })
        .sort({ createdAt: -1 })
        .populate("group", "name");

    res.json(history);
});

router.get("/:groupId", auth, async(req, res) => {
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const history = await History.find({
            group: req.params.groupId,
            createdAt: { $gte: sevenDaysAgo },
        })
        .sort({ createdAt: -1 })
        .populate("user", "name");

    res.json(history);
});

module.exports = router;
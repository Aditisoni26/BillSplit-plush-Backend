//routes//auth.routes.js
const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../models/User");
const auth = require("../middleware/auth");


const router = express.Router();

router.post("/register", async(req, res) => {
    const { name, username, email, password } = req.body;

    if (!username) {
        return res.status(400).json({ message: "Username required" });
    }

    const existing = await User.findOne({
        $or: [{ email }, { username }]
    });
    if (existing) {
        return res.status(400).json({ message: "User already exists" });
    }

    const hashed = await bcrypt.hash(password, 10);

    await User.create({
        name,
        username,
        email,
        password: hashed
    });

    res.json({ message: "Registered" });
});


router.post("/login", async(req, res) => {
    const { email, password } = req.body;
    console.log(process.env.PORT);

    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ message: "Invalid credentials" });

    const ok = await bcrypt.compare(password, user.password);
    if (!ok) return res.status(400).json({ message: "Invalid credentials" });

    const token = jwt.sign({ id: user._id },
        process.env.JWT_SECRET, { expiresIn: "7d" }
    );

    res.json({ token });
});

router.get("/me", auth, async(req, res) => {
    const user = await User.findById(req.user).select("-password");
    res.json(user);
});


module.exports = router;
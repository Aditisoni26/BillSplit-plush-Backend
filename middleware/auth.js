const jwt = require("jsonwebtoken");

module.exports = function(req, res, next) {
    const authHeader = req.header("Authorization");

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
        return res.status(401).json({ message: "No token" });
    }

    const token = authHeader.replace("Bearer ", "");

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        // ✅ IMPORTANT FIX
        req.user = decoded.id;

        next();
    } catch (err) {
        return res.status(401).json({ message: "Invalid token" });
    }
};
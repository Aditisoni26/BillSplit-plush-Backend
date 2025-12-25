const Notification = require("../models/Notification");

module.exports = async function createNotification(users, payload) {
    if (!users || !payload || !payload.message || !payload.type) {
        throw new Error("Invalid notification payload");
    }

    const userList = Array.isArray(users) ? users : [users];

    const notifications = userList.map((userId) => ({
        user: userId,
        group: payload.group || null,
        message: payload.message,
        type: payload.type,
        read: false,
    }));

    await Notification.insertMany(notifications);
};
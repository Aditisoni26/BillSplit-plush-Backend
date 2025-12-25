const mongoose = require("mongoose");

const historySchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
    },
    group: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Group",
        required: true,
    },
    action: {
        type: String,
        required: true,
    },
    meta: {
        type: Object,
        default: {},
    },
}, { timestamps: true });

module.exports = mongoose.model("History", historySchema);
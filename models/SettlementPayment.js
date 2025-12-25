const mongoose = require("mongoose");

const settlementPaymentSchema = new mongoose.Schema({
    groupId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Group",
        required: true
    },
    from: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true
    },
    to: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true
    },
    amount: {
        type: Number,
        required: true
    },
    status: {
        type: String,
        enum: ["paid", "confirmed"],
        default: "paid"
    },
    confirmedAt: Date
}, { timestamps: true });

module.exports = mongoose.model("SettlementPayment", settlementPaymentSchema);
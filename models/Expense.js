const mongoose = require("mongoose");

const expenseSchema = new mongoose.Schema({
    groupId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Group",
        required: true
    },
    paidBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true
    },
    amount: {
        type: Number,
        required: true
    },
    splitType: {
        type: String,
        enum: ["equal", "unequal", "percentage"],
        default: "equal"
    },
    splits: [{
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true
        },
        amount: {
            type: Number,
            required: true
        }
    }],
    description: String
}, { timestamps: true });

module.exports = mongoose.model("Expense", expenseSchema);
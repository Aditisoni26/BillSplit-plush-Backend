module.exports = function calculateSettlement(expenses) {
    const balances = {}; // ✅ THIS WAS MISSING

    // STEP 1: build balance sheet
    expenses.forEach(exp => {
        const paidBy = exp.paidBy.toString();

        if (!balances[paidBy]) balances[paidBy] = 0;
        balances[paidBy] += exp.amount;

        exp.splits.forEach(split => {
            const userId = split.userId.toString();

            if (!balances[userId]) balances[userId] = 0;
            balances[userId] -= split.amount;
        });
    });

    // STEP 2: separate creditors and debtors
    const creditors = [];
    const debtors = [];

    for (const userId in balances) {
        const amount = Number(balances[userId].toFixed(2));

        if (amount > 0) {
            creditors.push({ userId, amount });
        } else if (amount < 0) {
            debtors.push({ userId, amount: -amount });
        }
    }

    // STEP 3: greedy settlement
    const settlements = [];
    let i = 0,
        j = 0;

    while (i < debtors.length && j < creditors.length) {
        const pay = Math.min(debtors[i].amount, creditors[j].amount);

        settlements.push({
            from: debtors[i].userId,
            to: creditors[j].userId,
            amount: Number(pay.toFixed(2))
        });

        debtors[i].amount -= pay;
        creditors[j].amount -= pay;

        if (debtors[i].amount === 0) i++;
        if (creditors[j].amount === 0) j++;
    }

    return settlements;
};
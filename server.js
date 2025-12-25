//server.js
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
require("dotenv").config();

const app = express();

app.use(
    cors({
        origin: "https://bill-split-plush-frontend.vercel.app/api",
        credentials: true,
        allowedHeaders: ["Content-Type", "Authorization"]
    })
);


app.use(express.json());

mongoose
    .connect(process.env.MONGO_URI)
    .then(() => console.log("MongoDB connected"))
    .catch(err => console.error(err));

app.use("/api/auth", require("./routes/auth.routes"));
app.use("/api/settlement", require("./routes/settlement.routes"));
app.use("/api/groups", require("./routes/group.routes"));
app.use("/api/expenses", require("./routes/expense.routes"));
app.use("/api/notifications", require("./routes/notification.routes"));
app.use("/api/history", require("./routes/history.routes"));


const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on ${PORT}`));
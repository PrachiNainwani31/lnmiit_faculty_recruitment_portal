require("dotenv").config();
const express = require("express");
const cors = require("cors");
const path = require("path");


const connectDB = require("./config/db");
connectDB();

const app = express();
app.use(cors());
app.use(express.json());
app.use("/uploads",express.static(path.join(__dirname, "uploads")));
/* ROUTES */
app.use("/api/auth", require("./routes/auth.routes"));
app.use("/api/hod", require("./routes/hod.routes"));
app.use("/api/cycle", require("./routes/cycle.routes"));
app.use("/api/notifications", require("./routes/notification.routes"));
app.use("/api/dofa", require("./routes/dofa.routes"));
app.use("/api/comments", require("./routes/comment.routes"));
app.use("/api/email", require("./routes/email.routes"));
app.use("/api/candidate", require("./routes/candidate.routes"));
app.use("/api/referee", require("./routes/referee.routes"));

app.listen(5000, () =>
  console.log("Server running on port 5000")
);
// console.log("JWT_SECRET loaded:", !!process.env.JWT_SECRET);


require("dotenv").config();
const express = require("express");
const cors = require("cors");
const path = require("path");
const mongoose = require("mongoose");


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
app.use("/api/expert-travel", require("./routes/Experttravel.routes"));

app.listen(5000, () =>
  console.log("Server running on port 5000")
);
mongoose.connection.once("open", async () => {
  try {
    await mongoose.connection.collection("recruitmentcycles").dropIndex("cycle_1");
    console.log("Dropped old cycle_1 index");
  } catch (e) {
    // Index doesn't exist — ignore
  }

  try {
    await mongoose.connection.collection("candidatestats").dropIndex("cycle_1");
    console.log("Dropped old candidatestats cycle_1 index");
  } catch (e) {}

  try {
    await mongoose.connection.collection("experts").dropIndex("email_1");
    console.log("Dropped old experts email_1 index");
  } catch (e) {}
  try {
  await mongoose.connection.collection("experts").dropIndex("email_1_cycle_1_uploadedBy_1");
} catch(e) {}
try {
  await mongoose.connection.collection("experts").dropIndex("email_1_cycle_1_uplodedBy_1");
} catch(e) {}
  try {
    await mongoose.connection.collection("candidates").dropIndex("cycle_1_srNo_1");
    console.log("Dropped old candidates index");
  } catch (e) {}
});
// console.log("JWT_SECRET loaded:", !!process.env.JWT_SECRET);


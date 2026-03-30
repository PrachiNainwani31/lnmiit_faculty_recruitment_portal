require("dotenv").config();
const express = require("express");
const cors = require("cors");
const path = require("path");

const db = require("./models");
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
app.use("/api/director",            require("./routes/director.routes"));
app.use("/api/selected-candidates", require("./routes/selectedCandidates.routes"));
app.use("/api/establishment",       require("./routes/establishment.routes"));
app.use("/api/onboarding",          require("./routes/estate_lucs.routes"));
app.use("/api/interview-logs", require("./routes/interviewLog.routes"));

async function startServer() {
  try {
    // ✅ Connect MySQL
    await db.sequelize.authenticate();
    console.log("✅ MySQL Connected");

    // ✅ Sync DB (DEV ONLY)
    await db.sequelize.sync({ alter: true });
    console.log("✅ Tables Synced");

    app.listen(5000, () => {
      console.log("Server running on port 5000");
    });

  } catch (error) {
    console.error("❌ DB Connection Error:", error);
  }
}

startServer();
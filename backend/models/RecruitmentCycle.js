const mongoose = require("mongoose");

const recruitmentCycleSchema = new mongoose.Schema({
  cycle: {
    type: String,
    required: true,
    unique: true,
  },

  status: {
    type: String,
    enum: ["DRAFT", "SUBMITTED", "QUERY", "APPROVED"],
    default: "DRAFT",
  },

  isFrozen: {
    type: Boolean,
    default: false,
  },

  dofaComment: String,
  resumesZip: {
      type: String, // e.g. /uploads/resumes/2025-26-CSE.zip
    },
    resumeCount: Number,
});

module.exports = mongoose.model("RecruitmentCycle", recruitmentCycleSchema);

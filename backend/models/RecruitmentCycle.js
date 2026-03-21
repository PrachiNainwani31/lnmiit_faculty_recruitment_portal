const mongoose = require("mongoose");

const recruitmentCycleSchema = new mongoose.Schema({
  cycle: {
    type: String,
    required: true,
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
  hod:{
    type:mongoose.Schema.Types.ObjectId,
    ref:"User"
  },

  dofaComment: String,
  resumesZip: {
      type: String, // e.g. /uploads/resumes/2025-26-CSE.zip
    },
    resumeCount: Number,
  
});

recruitmentCycleSchema.index({ cycle: 1, hod: 1 }, { unique: true });

module.exports = mongoose.model("RecruitmentCycle", recruitmentCycleSchema);

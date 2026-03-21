const mongoose = require("mongoose");

const candidateStatsSchema = new mongoose.Schema(
  {
    cycle: { type: String, required: true },

    totalApplications: { type: Number, required: true },
    dlscShortlisted: { type: Number, required: true },
    ilscShortlisted: { type: Number, required: true },
    hod: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  },
  { timestamps: true }
);
candidateStatsSchema.index({ cycle: 1, hod: 1 }, { unique: true });
module.exports = mongoose.model("CandidateStats", candidateStatsSchema);

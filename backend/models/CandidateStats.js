const mongoose = require("mongoose");

const candidateStatsSchema = new mongoose.Schema(
  {
    cycle: { type: String, required: true, unique: true },

    totalApplications: { type: Number, required: true },
    dlscShortlisted: { type: Number, required: true },
    ilscShortlisted: { type: Number, required: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model("CandidateStats", candidateStatsSchema);

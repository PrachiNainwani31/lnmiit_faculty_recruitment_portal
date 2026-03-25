const mongoose = require("mongoose");

const selectedCandidateSchema = new mongoose.Schema({
  candidate:   { type: mongoose.Schema.Types.ObjectId, ref: "Candidate", required: true },
  cycle:       { type: String, required: true },
  department:  String,
  hodId:       { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  selectedBy:  { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  selectedAt:  { type: Date, default: Date.now },
  status:      { type: String, enum: ["SELECTED", "WAITLISTED", "REJECTED"], default: "SELECTED" },
  interviewComplete: { type: Boolean, default: false },
  interviewCompletedAt: Date,
}, { timestamps: true });

selectedCandidateSchema.index({ candidate: 1, cycle: 1 }, { unique: true });

module.exports = mongoose.model("SelectedCandidate", selectedCandidateSchema);
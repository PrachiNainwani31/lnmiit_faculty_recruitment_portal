const mongoose = require("mongoose");

const onboardingSchema = new mongoose.Schema({
  candidate:   { type: mongoose.Schema.Types.ObjectId, ref: "Candidate", required: true },
  cycle:       { type: String, required: true },
  department:  String,
  hodId:       { type: mongoose.Schema.Types.ObjectId, ref: "User" },

  /* ── Establishment: Offer Letter ── */
  offerLetterPath:     String,
  offerLetterUploadedAt: Date,
  offerLetterSentToCandidate: { type: Boolean, default: false },

  /* ── Establishment: Joining ── */
  joiningDate:         Date,
  joiningLetterPath:   String,
  joiningLetterUploadedAt: Date,

  /* ── DOFA Office: Room Allocation ── */
  roomBuilding:        String,
  roomNumber:          String,
  roomNotes:           String,
  roomAllottedAt:      Date,
  roomAllottedBy:      { type: mongoose.Schema.Types.ObjectId, ref: "User" },

  /* ── Estate: Room Handover ── */
  roomHandedOver:      { type: Boolean, default: false },
  roomHandoverDate:    Date,
  roomHandoverNotes:   String,

  /* ── LUCS: IT Assets ── */
  lucs: {
    emailAssigned:     { type: Boolean, default: false },
    emailId:           String,
    itAssetsIssued:    { type: Boolean, default: false },
    wifiProvided:      { type: Boolean, default: false },
    portalLoginDone:   { type: Boolean, default: false },
    confirmedAt:       Date,
    confirmedBy:       { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  },

  /* ── Overall status ── */
  onboardingComplete:  { type: Boolean, default: false },
  onboardingCompletedAt: Date,

}, { timestamps: true });

onboardingSchema.index({ candidate: 1, cycle: 1 }, { unique: true });

module.exports = mongoose.model("OnboardingRecord", onboardingSchema);
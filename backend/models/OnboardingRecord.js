// models/OnboardingRecord.js
const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");

const OnboardingRecord = sequelize.define(
  "OnboardingRecord",
  {
    id: { type: DataTypes.INTEGER.UNSIGNED, autoIncrement: true, primaryKey: true },

    candidateId: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false },
    cycle:       { type: DataTypes.STRING(20), allowNull: false },
    department:  { type: DataTypes.STRING(150) },
    hodId:       { type: DataTypes.INTEGER.UNSIGNED },

    // ── Offer Letter ────────────────────────────────────────
    offerLetterPath:            { type: DataTypes.STRING(500) },
    offerLetterUploadedAt:      { type: DataTypes.DATE },
    offerLetterSentToCandidate: { type: DataTypes.BOOLEAN, defaultValue: false },

    // ── Joining ──────────────────────────────────────────────
    joiningDate:             { type: DataTypes.DATEONLY },
    joiningLetterPath:       { type: DataTypes.STRING(500) },
    joiningLetterUploadedAt: { type: DataTypes.DATE },

    // ── MIS Login ─────────────────────────────────────────────
    // ✅ NEW: establishment assigns MIS login after joining letter
    misLoginDone: { type: DataTypes.BOOLEAN, defaultValue: false },
    misLoginNote: { type: DataTypes.TEXT,    allowNull: true },   // e.g. login URL / username

    // ── Library Card ──────────────────────────────────────────
    // ✅ NEW: establishment provides library membership details
    libraryDone:    { type: DataTypes.BOOLEAN, defaultValue: false },
    libraryDetails: { type: DataTypes.TEXT,    allowNull: true },  // membership ID / instructions

    // ── RFID Card ─────────────────────────────────────────────
    // ✅ NEW: establishment uploads RFID card PDF and sends to candidate
    rfidDone:            { type: DataTypes.BOOLEAN, defaultValue: false },
    rfidPath:            { type: DataTypes.STRING(500), allowNull: true },
    rfidSentToCandidate: { type: DataTypes.BOOLEAN, defaultValue: false },
    rfidSentAt:          { type: DataTypes.DATE,    allowNull: true },

    // ── Room Allocation ───────────────────────────────────────
    roomBuilding:     { type: DataTypes.STRING(200) },
    roomNumber:       { type: DataTypes.STRING(50) },
    roomNotes:        { type: DataTypes.TEXT },
    roomAllottedAt:   { type: DataTypes.DATE },
    roomAllottedById: { type: DataTypes.INTEGER.UNSIGNED },

    // ── Room Handover ─────────────────────────────────────────
    roomHandedOver:    { type: DataTypes.BOOLEAN, defaultValue: false },
    roomHandoverDate:  { type: DataTypes.DATE },
    roomHandoverNotes: { type: DataTypes.TEXT },

    // ── LUCS ──────────────────────────────────────────────────
    lucsEmailAssigned:    { type: DataTypes.BOOLEAN, defaultValue: false },
    lucsEmailId:          { type: DataTypes.STRING(255) },
    lucsItAssetsIssued:   { type: DataTypes.BOOLEAN, defaultValue: false },
    lucsItAssetsNote:     { type: DataTypes.TEXT,    allowNull: true },
    lucsWifiProvided:     { type: DataTypes.BOOLEAN, defaultValue: false },
    lucsWebsiteLogin:     { type: DataTypes.BOOLEAN, defaultValue: false },
    lucsWebsiteLoginNote: { type: DataTypes.TEXT,    allowNull: true },
    lucsOtherDone:        { type: DataTypes.BOOLEAN, defaultValue: false },
    lucsOtherNote:        { type: DataTypes.TEXT,    allowNull: true },
    lucsConfirmedAt:      { type: DataTypes.DATE },
    lucsConfirmedById:    { type: DataTypes.INTEGER.UNSIGNED },

    // ── Overall ──────────────────────────────────────────────
    onboardingComplete:    { type: DataTypes.BOOLEAN, defaultValue: false },
    onboardingCompletedAt: { type: DataTypes.DATE },
  },
  {
    tableName: "onboarding_records",
    indexes: [
      {
        unique: true,
        fields: ["candidateId", "cycle"],
        name:   "uq_onboarding_candidate_cycle",
      },
    ],
  }
);

module.exports = OnboardingRecord;
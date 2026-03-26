// models/OnboardingRecord.js
//
// The nested `lucs` Mongoose object is flattened into lucs_* columns.
//
const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");

const OnboardingRecord = sequelize.define(
  "OnboardingRecord",
  {
    id: { type: DataTypes.INTEGER.UNSIGNED, autoIncrement: true, primaryKey: true },

    candidateId: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false }, // FK → Candidate
    cycle:       { type: DataTypes.STRING(20),        allowNull: false },
    department:  { type: DataTypes.STRING(150) },
    hodId:       { type: DataTypes.INTEGER.UNSIGNED }, // FK → User

    // ── Offer Letter ─────────────────────────────────────────────────────
    offerLetterPath:              { type: DataTypes.STRING(500) },
    offerLetterUploadedAt:        { type: DataTypes.DATE },
    offerLetterSentToCandidate:   { type: DataTypes.BOOLEAN, defaultValue: false },

    // ── Joining ───────────────────────────────────────────────────────────
    joiningDate:            { type: DataTypes.DATEONLY },
    joiningLetterPath:      { type: DataTypes.STRING(500) },
    joiningLetterUploadedAt:{ type: DataTypes.DATE },

    // ── Room Allocation ───────────────────────────────────────────────────
    roomBuilding:    { type: DataTypes.STRING(200) },
    roomNumber:      { type: DataTypes.STRING(50) },
    roomNotes:       { type: DataTypes.TEXT },
    roomAllottedAt:  { type: DataTypes.DATE },
    roomAllottedById:{ type: DataTypes.INTEGER.UNSIGNED }, // FK → User

    // ── Room Handover ─────────────────────────────────────────────────────
    roomHandedOver:    { type: DataTypes.BOOLEAN, defaultValue: false },
    roomHandoverDate:  { type: DataTypes.DATE },
    roomHandoverNotes: { type: DataTypes.TEXT },

    // ── LUCS (flattened from nested object) ───────────────────────────────
    lucsEmailAssigned:  { type: DataTypes.BOOLEAN, defaultValue: false },
    lucsEmailId:        { type: DataTypes.STRING(255) },
    lucsItAssetsIssued: { type: DataTypes.BOOLEAN, defaultValue: false },
    lucsWifiProvided:   { type: DataTypes.BOOLEAN, defaultValue: false },
    lucsPortalLoginDone:{ type: DataTypes.BOOLEAN, defaultValue: false },
    lucsConfirmedAt:    { type: DataTypes.DATE },
    lucsConfirmedById:  { type: DataTypes.INTEGER.UNSIGNED }, // FK → User

    // ── Overall ──────────────────────────────────────────────────────────
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
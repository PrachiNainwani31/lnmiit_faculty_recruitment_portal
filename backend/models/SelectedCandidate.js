// models/SelectedCandidate.js
const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");

const SelectedCandidate = sequelize.define(
  "SelectedCandidate",
  {
    id: { type: DataTypes.INTEGER.UNSIGNED, autoIncrement: true, primaryKey: true },

    candidateId:  { type: DataTypes.INTEGER.UNSIGNED, allowNull: false }, // FK → Candidate
    cycle:        { type: DataTypes.STRING(20),        allowNull: false },
    department:   { type: DataTypes.STRING(150) },
    hodId:        { type: DataTypes.INTEGER.UNSIGNED },                    // FK → User
    selectedById: { type: DataTypes.INTEGER.UNSIGNED },                    // FK → User (was "selectedBy" — fixed)

    selectedAt: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },

    // FIX: added NOT_SELECTED — controller sends this for unchecked candidates
    status: {
      type: DataTypes.ENUM("SELECTED", "NOT_SELECTED", "WAITLISTED", "REJECTED"),
      defaultValue: "SELECTED",
    },

    // FIX: added designation + employmentType — set by DOFA Office during selection
    designation:    { type: DataTypes.STRING(200), defaultValue: "" },
    employmentType: { type: DataTypes.STRING(100), defaultValue: "" },
    waitlistPriority: { type: DataTypes.INTEGER, allowNull: true, defaultValue: null },
    interviewComplete:    { type: DataTypes.BOOLEAN, defaultValue: false },
    interviewCompletedAt: { type: DataTypes.DATE },
  },
  {
    tableName: "selected_candidates",
    indexes: [
      {
        unique: true,
        fields: ["candidateId", "cycle"],
        name:   "uq_selected_candidate_cycle",
      },
    ],
  }
);

module.exports = SelectedCandidate;
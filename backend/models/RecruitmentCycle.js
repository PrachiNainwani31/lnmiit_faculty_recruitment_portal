// models/RecruitmentCycle.js
const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");

const RecruitmentCycle = sequelize.define(
  "RecruitmentCycle",
  {
    id: { type: DataTypes.INTEGER.UNSIGNED, autoIncrement: true, primaryKey: true },

    cycle:  { type: DataTypes.STRING(20), allowNull: false },

    // ✅ FIX: added INTERVIEW_SET and APPEARED_SUBMITTED to ENUM
    // INTERVIEW_SET     → DOFA set the interview date; HOD can now mark appeared (unfrozen)
    // APPEARED_SUBMITTED → HOD submitted appeared data; cycle is frozen again
    status: {
      type: DataTypes.ENUM(
        "DRAFT",
        "SUBMITTED",
        "QUERY",
        "APPROVED",
        "INTERVIEW_SET",       // ← NEW
        "APPEARED_SUBMITTED"   // ← NEW
      ),
      defaultValue: "DRAFT",
    },

    isFrozen:    { type: DataTypes.BOOLEAN, defaultValue: false },
    hodId:       { type: DataTypes.INTEGER.UNSIGNED },
    dofaComment: { type: DataTypes.TEXT },
    resumesZip:  { type: DataTypes.STRING(500) },
    resumeCount: { type: DataTypes.INTEGER.UNSIGNED },

    teachingInteractionDate: {
      type:      DataTypes.DATEONLY,
      allowNull: true,
    },
    interviewDate: {
      type:      DataTypes.DATEONLY,
      allowNull: true,
    },
  },
  {
    tableName: "recruitment_cycles",
    indexes: [
      {
        unique: true,
        fields: ["cycle", "hodId"],
        name:   "uq_recruitment_cycle_hod",
      },
    ],
  }
);

module.exports = RecruitmentCycle;
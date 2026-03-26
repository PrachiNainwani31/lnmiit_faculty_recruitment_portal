// models/RecruitmentCycle.js
const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");

const RecruitmentCycle = sequelize.define(
  "RecruitmentCycle",
  {
    id: { type: DataTypes.INTEGER.UNSIGNED, autoIncrement: true, primaryKey: true },
    cycle:       { type: DataTypes.STRING(20), allowNull: false },
    status: {
      type: DataTypes.ENUM("DRAFT", "SUBMITTED", "QUERY", "APPROVED"),
      defaultValue: "DRAFT",
    },
    isFrozen:    { type: DataTypes.BOOLEAN, defaultValue: false },
    hodId:       { type: DataTypes.INTEGER.UNSIGNED }, // FK → User
    dofaComment: { type: DataTypes.TEXT },
    resumesZip:  { type: DataTypes.STRING(500) },
    resumeCount: { type: DataTypes.INTEGER.UNSIGNED },
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
// models/CandidateStats.js
const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");

const CandidateStats = sequelize.define(
  "CandidateStats",
  {
    id: { type: DataTypes.INTEGER.UNSIGNED, autoIncrement: true, primaryKey: true },
    cycle:              { type: DataTypes.STRING(20),          allowNull: false },
    totalApplications:  { type: DataTypes.INTEGER.UNSIGNED,   allowNull: false },
    dlscShortlisted:    { type: DataTypes.INTEGER.UNSIGNED,   allowNull: false },
    ilscShortlisted:    { type: DataTypes.INTEGER.UNSIGNED,   allowNull: false },
    hodId:              { type: DataTypes.INTEGER.UNSIGNED },   // FK → User
  },
  {
    tableName: "candidate_stats",
    indexes: [{ unique: true, fields: ["cycle", "hodId"], name: "uq_stats_cycle_hod" }],
  }
);

module.exports = CandidateStats;


// ─────────────────────────────────────────────────────────────────────────────
// models/Comment.js
// ─────────────────────────────────────────────────────────────────────────────
// const Comment = sequelize.define( ...
// Exported separately below — kept in same file for brevity but you can split.
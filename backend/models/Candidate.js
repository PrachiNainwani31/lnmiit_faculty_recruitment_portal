// models/Candidate.js
const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");

const Candidate = sequelize.define(
  "Candidate",
  {
    id: {
      type:          DataTypes.INTEGER.UNSIGNED,
      autoIncrement: true,
      primaryKey:    true,
    },
    cycle: {
      type:      DataTypes.STRING(20),
      allowNull: false,
    },
    srNo: {
      type:      DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
    },
    // userId → FK to User (ref: "User" — the candidate user)
    userId: {
      type:      DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
    },
    fullName: {
      type:      DataTypes.STRING(200),
      allowNull: false,
    },
    email: {
      type:      DataTypes.STRING(255),
      allowNull: false,
      set(val) { this.setDataValue("email", val.toLowerCase().trim()); },
    },
    phone: {
      type:      DataTypes.STRING(30),
      allowNull: false,
    },
    qualification: {
      type:      DataTypes.STRING(200),
      allowNull: false,
    },
    specialization: {
      type:      DataTypes.STRING(200),
      allowNull: false,
    },
    reviewerObservation: {
      type:      DataTypes.TEXT,
      allowNull: true,
    },
    ilscComments: {
      type:      DataTypes.TEXT,
      allowNull: true,
    },
    // hodId → FK to User (ref: "User" — the HOD)
    hodId: {
      type:      DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
    },
  },
  {
    tableName: "candidates",
    indexes: [
      {
        unique: true,
        fields: ["cycle", "srNo", "hodId", "email"],
        name:   "uq_candidate_cycle_srno_hod_email",
      },
    ],
  }
);

module.exports = Candidate;
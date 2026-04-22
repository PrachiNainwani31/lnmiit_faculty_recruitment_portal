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
    // FK → User (the candidate's own user account)
    userId: {
      type:      DataTypes.INTEGER.UNSIGNED,
      allowNull: true,
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

    // ── NEW: optional secondary / alternate email ──────────────────
    secondaryEmail: {
      type:      DataTypes.STRING(255),
      allowNull: true,
      set(val) {
        this.setDataValue(
          "secondaryEmail",
          val ? val.toLowerCase().trim() : null
        );
      },
    },

    phone: {
      type:      DataTypes.STRING(30),
      allowNull: true,
    },
    qualification: {
      type:      DataTypes.STRING(200),
      allowNull: false,
    },
    specialization: {
      type:      DataTypes.STRING(200),
      allowNull: false,
    },

    // ── NEW: position the candidate applied for ────────────────────
    appliedPosition: {
      type:      DataTypes.STRING(200),
      allowNull: true,
    },

    // ── NEW: position HOD recommends this candidate for ───────────
    recommendedPosition: {
      type:      DataTypes.STRING(200),
      allowNull: true,
    },

    dlscRecommendation: {
      type:      DataTypes.STRING(200),
      allowNull: true,
    },
    dlscRemarks: {
      type:      DataTypes.TEXT,
      allowNull: true,
    },
    ilscRecommendation: {
      type:      DataTypes.STRING(200),
      allowNull: true,
    },
    ilscRemarks: {
      type:      DataTypes.TEXT,
      allowNull: true,
    },

    // FK → User (the HOD)
    hodId: {
      type:      DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
    },

    // ── NEW: HOD marks which candidates actually appeared ─────────
    //    Reflected on DOFA page and DOFA Office page
    appearedInInterview: {
      type:         DataTypes.BOOLEAN,
      defaultValue: false,
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
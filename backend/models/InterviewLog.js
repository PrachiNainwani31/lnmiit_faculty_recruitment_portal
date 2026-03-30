// models/InterviewLog.js
const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");

const InterviewLog = sequelize.define(
  "InterviewLog",
  {
    id:    { type: DataTypes.INTEGER.UNSIGNED, autoIncrement: true, primaryKey: true },
    cycle: { type: DataTypes.STRING(20), allowNull: false },
    hodId: { type: DataTypes.INTEGER.UNSIGNED },

    interviewDate: { type: DataTypes.DATEONLY },
    department:    { type: DataTypes.STRING(150) },
    forThePostOf:  { type: DataTypes.STRING(200), defaultValue: "Assistant Professor" },

    noOfApplications:          { type: DataTypes.INTEGER.UNSIGNED },
    noOfEligibleShortlisted:   { type: DataTypes.INTEGER.UNSIGNED },
    noForTeachingPresentation: { type: DataTypes.INTEGER.UNSIGNED },
    noShortlistedForInterview: { type: DataTypes.INTEGER.UNSIGNED },
    noForPersonalInterview:    { type: DataTypes.INTEGER.UNSIGNED },

    expert1Name:   { type: DataTypes.STRING(300) },
    expert1Detail: { type: DataTypes.STRING(400) },
    expert2Name:   { type: DataTypes.STRING(300) },
    expert2Detail: { type: DataTypes.STRING(400) },
    expert3Name:   { type: DataTypes.STRING(300) },
    expert3Detail: { type: DataTypes.STRING(400) },

    selectedCandidateName:   { type: DataTypes.TEXT },
    waitlistedCandidateName: { type: DataTypes.TEXT },

    // ✅ NEW: replaces totalExpFrom/totalExpTo scalar fields
    // Stores per-candidate, per-experience-type breakdown.
    // Shape: [
    //   {
    //     candidateId, candidateName, status ("SELECTED"|"WAITLISTED"),
    //     experiences: [
    //       { type:"Research"|"Teaching"|"Industry", organization, fromDate, toDate,
    //         editedToDate: <DOFA-editable, persisted here> }
    //     ]
    //   }
    // ]
    candidateExperiences: {
      type:         DataTypes.JSON,
      defaultValue: [],
    },

    evaluationSheetLink: { type: DataTypes.STRING(500) },
    advCopyDate:         { type: DataTypes.DATEONLY },
    advCopyLink:         { type: DataTypes.STRING(500) },
    committeeLink:       { type: DataTypes.STRING(500) },

    remark: { type: DataTypes.TEXT },
  },
  {
    tableName: "interview_logs",
    indexes: [{
      unique: true,
      fields: ["cycle","hodId"],
      name:   "uq_interview_log_cycle_hod",
    }],
  }
);

module.exports = InterviewLog;
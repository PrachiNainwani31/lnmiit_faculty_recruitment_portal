// models/CandidateApplication.js
const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");

// ─── Main Application ─────────────────────────────────────────────────────────
const CandidateApplication = sequelize.define(
  "CandidateApplication",
  {
    id: {
      type:          DataTypes.INTEGER.UNSIGNED,
      autoIncrement: true,
      primaryKey:    true,
    },
    // FK → User  (candidate user)
    candidateUserId: {
      type:      DataTypes.INTEGER.UNSIGNED,
      allowNull: true,
    },
    name:        { type: DataTypes.STRING(200) },
    email:       { type: DataTypes.STRING(255) },
    countryCode: { type: DataTypes.STRING(10), allowNull: true, defaultValue: "+91" },
    phone:       { type: DataTypes.STRING(30) },
    department:  { type: DataTypes.STRING(150) },
    acceptance:  { type: DataTypes.BOOLEAN },
    accommodation: { type: DataTypes.BOOLEAN },

    // ── Documents (single-file paths stored as VARCHAR) ────────────────────
    docCv:                { type: DataTypes.STRING(500) },
    docTeachingStatement: { type: DataTypes.STRING(500) },
    docResearchStatement: { type: DataTypes.STRING(500) },
    docMarks10:           { type: DataTypes.STRING(500) },
    docMarks12:           { type: DataTypes.STRING(500) },
    docGraduation:        { type: DataTypes.STRING(500) },
    docPostGraduation:    { type: DataTypes.STRING(500) },
    docPhdCourseWork:     { type: DataTypes.STRING(500) },
    docPhdProvisional:    { type: DataTypes.STRING(500) },
    docPhdDegree:         { type: DataTypes.STRING(500) },
    docDateOfDefense:     { type: DataTypes.STRING(50)  },
    docThesisSubmission: { type: DataTypes.STRING(500) },
    phdStatus: { type: DataTypes.STRING(30), defaultValue: "" },

    // ── Documents (multi-file — stored as JSON arrays) ─────────────────────
    docResearchExpCerts:  { type: DataTypes.JSON, defaultValue: [] },
    docTeachingExpCerts:  { type: DataTypes.JSON, defaultValue: [] },
    docIndustryExpCerts:  { type: DataTypes.JSON, defaultValue: [] },
    docBestPapers:        { type: DataTypes.JSON, defaultValue: [] },
    docPostDocDocs:       { type: DataTypes.JSON, defaultValue: [] },
    docSalarySlips:       { type: DataTypes.JSON, defaultValue: [] },
    // [{ name, file }] array
    docOtherDocs:         { type: DataTypes.JSON, defaultValue: [] },

    // ── Experience type flags ───────────────────────────────────────────────
    expResearch:   { type: DataTypes.BOOLEAN, defaultValue: false },
    expTeaching:   { type: DataTypes.BOOLEAN, defaultValue: false },
    expIndustrial: { type: DataTypes.BOOLEAN, defaultValue: false },

    // ── Publications (array of strings → JSON) ──────────────────────────────
    publications: { type: DataTypes.JSON, defaultValue: [] },

    status:   { type: DataTypes.STRING(30), defaultValue: "DRAFT" },
    verdicts: { type: DataTypes.JSON },    // Mixed → JSON
  },
  {
    tableName: "candidate_applications",
  }
);


// ─── Referee (child table) ────────────────────────────────────────────────────
const CandidateReferee = sequelize.define(
  "CandidateReferee",
  {
    id: {
      type:          DataTypes.INTEGER.UNSIGNED,
      autoIncrement: true,
      primaryKey:    true,
    },
    applicationId: {
      type:      DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
    },
    salutation:   { type: DataTypes.STRING(20) },
    name:         { type: DataTypes.STRING(200) },
    designation:  { type: DataTypes.STRING(200) },
    department:   { type: DataTypes.STRING(150) },
    institute:    { type: DataTypes.STRING(300) },
    email:        { type: DataTypes.STRING(255) },
    status:       { type: DataTypes.STRING(30), defaultValue: "PENDING" },
    letter:       { type: DataTypes.STRING(500) },
    signedName:   { type: DataTypes.TEXT(200) },
    submittedAt:  { type: DataTypes.DATE },
    captchaCode: { type: DataTypes.STRING(10), allowNull: true },
  },
  {
    tableName:  "candidate_referees",
    timestamps: false,   // no createdAt/updatedAt needed on this child
  }
);


// ─── Experience (child table) ─────────────────────────────────────────────────
const CandidateExperience = sequelize.define(
  "CandidateExperience",
  {
    id: {
      type:          DataTypes.INTEGER.UNSIGNED,
      autoIncrement: true,
      primaryKey:    true,
    },
    applicationId: {
      type:      DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
    },
    type:         { type: DataTypes.STRING(50) },  // Research | Teaching | Industrial
    organization: { type: DataTypes.STRING(300) },
    designation:  { type: DataTypes.STRING(200) },
    department:   { type: DataTypes.STRING(150) },
    fromDate:     { type: DataTypes.DATE },
    toDate:       { type: DataTypes.DATE },
    certificate:  { type: DataTypes.STRING(500) },
    natureOfWork: { type: DataTypes.TEXT },
  },
  {
    tableName:  "candidate_experiences",
    timestamps: false,
  }
);

CandidateApplication.hasMany(CandidateReferee, {
  foreignKey: "applicationId",
  as: "referees",
  onDelete: "CASCADE",
});
CandidateReferee.belongsTo(CandidateApplication, {
  foreignKey: "applicationId",
});

CandidateApplication.hasMany(CandidateExperience, {
  foreignKey: "applicationId",
  as: "experiences",
  onDelete: "CASCADE",
});
CandidateExperience.belongsTo(CandidateApplication, {
  foreignKey: "applicationId",
});

module.exports = { CandidateApplication, CandidateReferee, CandidateExperience };
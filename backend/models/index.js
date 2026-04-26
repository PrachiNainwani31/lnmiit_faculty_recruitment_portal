// models/index.js
// ─────────────────────────────────────────────────────────────────────────────
// Central file: imports every model, declares all FK associations, and syncs.
// Usage in app.js / server.js:
//   const db = require("./models");
//   await db.sequelize.authenticate();
//   await db.sequelize.sync({ alter: true }); // dev only
// ─────────────────────────────────────────────────────────────────────────────

const sequelize = require("../config/database");

const User               = require("./User");
const Candidate          = require("./Candidate");
const { CandidateApplication,
        CandidateReferee,
        CandidateExperience } = require("./CandidateApplication");
const CandidateStats     = require("./CandidateStats");
const Comment            = require("./Comment");
const Expert             = require("./Expert");
const ExpertTravel       = require("./Experttravel");
const InterviewLog       = require("./InterviewLog");
const Notification       = require("./Notification");
const OnboardingRecord   = require("./OnboardingRecord");
const RecruitmentCycle   = require("./RecruitmentCycle");
const SelectedCandidate  = require("./SelectedCandidate");
const ActivityLog= require("./ActivityLog");
const PortalDeadline = require("./PortalDeadline");

// ─── Associations ─────────────────────────────────────────────────────────────

// Candidate ↔ User
Candidate.belongsTo(User, { as: "user",  foreignKey: "userId" });
Candidate.belongsTo(User, { as: "hod",   foreignKey: "hodId"  });
User.hasMany(Candidate,   { as: "candidatesAsUser", foreignKey: "userId" });
User.hasMany(Candidate,   { as: "candidatesAsHod",  foreignKey: "hodId"  });

// CandidateApplication ↔ User
CandidateApplication.belongsTo(User, { as: "candidateUser", foreignKey: "candidateUserId" });
User.hasMany(CandidateApplication,   { as: "applications",  foreignKey: "candidateUserId" });

// CandidateStats ↔ User (HoD)
CandidateStats.belongsTo(User, { as: "hod", foreignKey: "hodId" });
User.hasMany(CandidateStats,   { as: "stats", foreignKey: "hodId" });

// Expert ↔ User (uploader)
Expert.belongsTo(User, { as: "uploadedBy", foreignKey: "uploadedById" });
User.hasMany(Expert,   { as: "uploadedExperts", foreignKey: "uploadedById" });

// ExpertTravel ↔ Expert
ExpertTravel.belongsTo(Expert, { as: "expert", foreignKey: "expertId" });
Expert.hasOne(ExpertTravel,    { as: "travel",  foreignKey: "expertId" });


InterviewLog.belongsTo(User, { as: "hod", foreignKey: "hodId" });
User.hasMany(InterviewLog,   { as: "interviewLogs", foreignKey: "hodId" });

// OnboardingRecord ↔ Candidate, User
OnboardingRecord.belongsTo(Candidate, { as: "candidate",    foreignKey: "candidateId" });
OnboardingRecord.belongsTo(User,      { as: "hod",          foreignKey: "hodId" });
OnboardingRecord.belongsTo(User,      { as: "roomAllottedBy", foreignKey: "roomAllottedById" });
OnboardingRecord.belongsTo(User,      { as: "lucsConfirmedBy", foreignKey: "lucsConfirmedById" });
Candidate.hasOne(OnboardingRecord,    { as: "onboarding",   foreignKey: "candidateId" });

// RecruitmentCycle ↔ User (HoD)
RecruitmentCycle.belongsTo(User, { as: "hod", foreignKey: "hodId" });
User.hasMany(RecruitmentCycle,   { as: "recruitmentCycles", foreignKey: "hodId" });

// SelectedCandidate ↔ Candidate, User
SelectedCandidate.belongsTo(Candidate, { as: "candidate",  foreignKey: "candidateId" });
SelectedCandidate.belongsTo(User,      { as: "hod",        foreignKey: "hodId" });
SelectedCandidate.belongsTo(User,      { as: "selectedBy", foreignKey: "selectedById" });
Candidate.hasOne(SelectedCandidate,    { as: "selection",  foreignKey: "candidateId" });

// ─── Exports ──────────────────────────────────────────────────────────────────
module.exports = {
  sequelize,
  User,
  Candidate,
  CandidateApplication,
  CandidateReferee,
  CandidateExperience,
  CandidateStats,
  Comment,
  Expert,
  ExpertTravel,
  InterviewLog,
  Notification,
  OnboardingRecord,
  RecruitmentCycle,
  SelectedCandidate,
  ActivityLog,
  PortalDeadline,
};
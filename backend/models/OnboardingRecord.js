const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");

const OnboardingRecord = sequelize.define("OnboardingRecord", {
  id:          { type: DataTypes.INTEGER.UNSIGNED, autoIncrement: true, primaryKey: true },
  candidateId: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false },
  cycle:       { type: DataTypes.STRING(20),        allowNull: false },
  department:  { type: DataTypes.STRING(100),       allowNull: true  },
  hodId:       { type: DataTypes.INTEGER.UNSIGNED,  allowNull: true  },

  // Offer letter
  offerLetterPath:       { type: DataTypes.STRING(500), allowNull: true },
  offerLetterUploadedAt: { type: DataTypes.DATE,        allowNull: true },

  // Joining letter (internal — not sent to candidate)
  joiningLetterPath: { type: DataTypes.STRING(500), allowNull: true },

  // Joining date — establishment sets joiningDate only
  joiningDate:                    { type: DataTypes.DATEONLY, allowNull: true  },
  candidatePreferredJoiningDate:  { type: DataTypes.DATEONLY, allowNull: true  },
  joiningDateProposedByCandidate: { type: DataTypes.BOOLEAN,  defaultValue: false },
  joiningDateConfirmedByEst:      { type: DataTypes.BOOLEAN,  defaultValue: false },

  // Room
  roomNumber:      { type: DataTypes.STRING(50),         allowNull: true  },
  roomAllottedAt:  { type: DataTypes.DATE,               allowNull: true  },
  roomAllottedById:{ type: DataTypes.INTEGER.UNSIGNED,   allowNull: true  },
  roomHandedOver:  { type: DataTypes.BOOLEAN,            defaultValue: false },
  roomHandoverDate:{ type: DataTypes.DATE,               allowNull: true  },

  // MIS
  misUsername:   { type: DataTypes.STRING(200), allowNull: true },
  misPassword:   { type: DataTypes.STRING(200), allowNull: true },
  misProvidedAt: { type: DataTypes.DATE,        allowNull: true },

  // Library
  libraryMemberId: { type: DataTypes.STRING(100), allowNull: true },
  libraryDoneAt:   { type: DataTypes.DATE,        allowNull: true },

  // RFID
  rfidPath:            { type: DataTypes.STRING(500), allowNull: true  },
  rfidCardNumber:      { type: DataTypes.STRING(100), allowNull: true  },
  rfidSentToCandidate: { type: DataTypes.BOOLEAN,     defaultValue: false },
  rfidDoneAt:          { type: DataTypes.DATE,        allowNull: true  },

  // LUCS
  lucsConfirmedById: { type: DataTypes.INTEGER.UNSIGNED, allowNull: true },
  lucsEmailAssigned:    { type: DataTypes.BOOLEAN,      defaultValue: false },
lucsEmailId:          { type: DataTypes.STRING(200),  allowNull: true },
lucsItAssetsIssued:   { type: DataTypes.BOOLEAN,      defaultValue: false },
lucsItAssetsNote:     { type: DataTypes.TEXT,          allowNull: true },
lucsWifiProvided:     { type: DataTypes.BOOLEAN,      defaultValue: false },
lucsWebsiteLogin:     { type: DataTypes.BOOLEAN,      defaultValue: false },
lucsWebsiteLoginNote: { type: DataTypes.TEXT,          allowNull: true },
lucsOtherDone:        { type: DataTypes.BOOLEAN,      defaultValue: false },
lucsOtherNote:        { type: DataTypes.TEXT,          allowNull: true },
lucsConfirmedAt:      { type: DataTypes.DATE,          allowNull: true },
lucsConfirmedById:    { type: DataTypes.INTEGER.UNSIGNED, allowNull: true },
onboardingComplete:   { type: DataTypes.BOOLEAN,      defaultValue: false },
onboardingCompletedAt:{ type: DataTypes.DATE,          allowNull: true },
// also missing from model:
roomBuilding:         { type: DataTypes.STRING(100),  allowNull: true },
roomNotes:            { type: DataTypes.TEXT,          allowNull: true },
roomHandoverNotes:    { type: DataTypes.TEXT,          allowNull: true },
  // Resignation
  resignationRequired: { type: DataTypes.BOOLEAN, defaultValue: false },
  resignationDoneAt:   { type: DataTypes.DATE,    allowNull: true     },

  // Joining complete (freezes record)
  joiningComplete:    { type: DataTypes.BOOLEAN, defaultValue: false },
  joiningCompletedAt: { type: DataTypes.DATE,    allowNull: true     },
  notJoined:       { type: DataTypes.BOOLEAN,     defaultValue: false },
  notJoinedReason: { type: DataTypes.STRING(500), allowNull: true     },
}, { tableName: "onboarding_records" });

module.exports = OnboardingRecord;
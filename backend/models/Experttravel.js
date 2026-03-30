// models/ExpertTravel.js
const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");

const ExpertTravel = sequelize.define(
  "ExpertTravel",
  {
    id:       { type: DataTypes.INTEGER.UNSIGNED, autoIncrement: true, primaryKey: true },
    expertId: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false },
    cycle:    { type: DataTypes.STRING(20), allowNull: false },

    confirmed:      { type: DataTypes.BOOLEAN, defaultValue: false },
    contactNumber:  { type: DataTypes.STRING(30) },
    presenceStatus: {
      type: DataTypes.ENUM("Online", "Offline", "Pending"),
      defaultValue: "Pending",
    },
    onlineLink:   { type: DataTypes.STRING(500) },
    modeOfTravel: { type: DataTypes.ENUM("Rail", "Air", "Own Vehicle") },

    // ── Traveller flat columns ────────────────────────────────────────────
    travellerName:           { type: DataTypes.STRING(200) },
    travellerGender:         { type: DataTypes.STRING(20) },
    travellerAge:            { type: DataTypes.TINYINT.UNSIGNED },
    travellerMealPreference: { type: DataTypes.STRING(100) },
    travellerPreferredSeat:  { type: DataTypes.STRING(50) },
    travellerJourneyType: {
      type: DataTypes.ENUM("Direct", "Connecting"),
      defaultValue: "Direct",
    },
    // Onward
    travellerOnwardFrom:     { type: DataTypes.DATE },
    travellerOnwardTime:     { type: DataTypes.STRING(20) },
    travellerOnwardFromCity: { type: DataTypes.STRING(200) },   // NEW
    travellerOnwardToCity:   { type: DataTypes.STRING(200) },   // NEW
    travellerOnwardFlightNo: { type: DataTypes.STRING(100) },   // NEW (flight / train no.)
    // Return
    travellerReturnFrom:     { type: DataTypes.DATE },
    travellerReturnTime:     { type: DataTypes.STRING(20) },
    travellerReturnFromCity: { type: DataTypes.STRING(200) },   // NEW
    travellerReturnToCity:   { type: DataTypes.STRING(200) },   // NEW
    travellerReturnFlightNo: { type: DataTypes.STRING(100) },   // NEW
    // Connecting legs (JSON arrays of legs)
    travellerConnections:       { type: DataTypes.JSON, defaultValue: [] },
    travellerReturnConnections: { type: DataTypes.JSON, defaultValue: [] },

    // ── Quote flat columns ────────────────────────────────────────────────
    quoteAmount:       { type: DataTypes.DECIMAL(12, 2) },
    quoteVendor:       { type: DataTypes.STRING(200) },
    quoteRemarks:      { type: DataTypes.TEXT },
    quoteStatus: {
      type: DataTypes.ENUM("PENDING", "APPROVED", "REJECTED"),
      defaultValue: "PENDING",
    },
    quoteSubmittedAt:   { type: DataTypes.DATE },
    quoteApprovedAt:    { type: DataTypes.DATE },
    quoteApprovedBy:    { type: DataTypes.STRING(200) },
    quoteRejectionNote: { type: DataTypes.TEXT },

    // ── Ticket / Invoice ──────────────────────────────────────────────────
    ticketPath:        { type: DataTypes.STRING(500) },
    ticketUploadedAt:  { type: DataTypes.DATE },
    invoicePath:       { type: DataTypes.STRING(500) },
    invoiceUploadedAt: { type: DataTypes.DATE },

    // ── Pickup / Drop flat columns ────────────────────────────────────────
    pickupLocation: { type: DataTypes.STRING(300) },
    pickupTime:     { type: DataTypes.STRING(50) },
    dropLocation:   { type: DataTypes.STRING(300) },
    dropTime:       { type: DataTypes.STRING(50) },
    enteredByDofa:  { type: DataTypes.BOOLEAN, defaultValue: false },
    driverName:     { type: DataTypes.STRING(200) },
    driverContact:  { type: DataTypes.STRING(30) },
  },
  {
    tableName: "expert_travels",
    indexes: [
      { unique: true, fields: ["expertId", "cycle"], name: "uq_expert_travel_expert_cycle" },
    ],
  }
);

module.exports = ExpertTravel;
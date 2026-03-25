const mongoose = require("mongoose");

const connectionLegSchema = new mongoose.Schema({
  from: String,
  to:   String,
  date: String,
  time: String,
}, { _id: false });

const travellerSchema = new mongoose.Schema({
  name:              String,
  gender:            String,
  age:               Number,
  mealPreference:    String,
  preferredSeat:     String,

  // Journey type
  journeyType:       { type: String, enum: ["Direct", "Connecting"], default: "Direct" },

  // Direct journey fields
  onwardFrom:        Date,
  onwardTime:        String,
  returnFrom:        Date,
  returnTime:        String,

  // Connecting journey fields
  connections:       [connectionLegSchema],  // onward legs
  returnConnections: [connectionLegSchema],  // return legs

  // Legacy fields (keep for backward compat)
  onwardTo:          Date,
  returnTo:          Date,
}, { _id: false });

const expertTravelSchema = new mongoose.Schema({
  expert: {
    type: mongoose.Schema.Types.ObjectId,
    ref:  "Expert",
    required: true,
  },

  confirmed:      { type: Boolean, default: false },
  contactNumber:  String,
  presenceStatus: { type: String, enum: ["Online", "Offline", "Pending"], default: "Pending" },
  onlineLink:     String,
  modeOfTravel:   { type: String, enum: ["Rail", "Air", "Own Vehicle"] },

  traveller: travellerSchema,

  quote: {
    amount:        Number,
    vendor:        String,
    remarks:       String,
    status:        { type: String, enum: ["PENDING", "APPROVED", "REJECTED"], default: "PENDING" },
    submittedAt:   Date,
    approvedAt:    Date,
    approvedBy:    String,
    rejectionNote: String,
  },

  ticketPath:        String,
  ticketUploadedAt:  Date,
  invoicePath:       String,
  invoiceUploadedAt: Date,

  pickupDrop: {
    pickupLocation:  String,
    pickupTime:      String,
    dropLocation:    String,
    dropTime:        String,
    enteredByDofa:   { type: Boolean, default: false },
    driverName:      String,
    driverContact:   String,
  },
  cycle:{
    type:String,
    reuired:true,
  }

}, { timestamps: true });
expertTravelSchema.index({ expert: 1, cycle: 1 }, { unique: true });

module.exports = mongoose.model("ExpertTravel", expertTravelSchema);
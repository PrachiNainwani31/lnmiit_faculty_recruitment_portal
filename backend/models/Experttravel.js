const mongoose = require("mongoose");

const travellerSchema = new mongoose.Schema({
  name:          String,
  gender:        String,
  age:           Number,          // rail only
  mealPreference:{ type: String, enum: ["Veg", "Non-veg"], default: "Veg" },
  preferredSeat: String,
  onwardFrom:    Date,
  onwardTo:      Date,
  returnFrom:    Date,
  returnTo:      Date,
});

const pickupDropSchema = new mongoose.Schema({
  pickupLocation:  String,
  pickupTime:      String,
  dropLocation:    String,
  dropTime:        String,
  enteredByDofa:   { type: Boolean, default: false },
  // Ramswaroop fills these after DOFA enters above
  driverName:      String,
  driverContact:   String,
});

const quoteSchema = new mongoose.Schema({
  amount:       Number,
  vendor:       String,
  remarks:      String,
  submittedAt:  Date,
  approvedAt:   Date,
  approvedBy:   String,          // "DOFA" | "ADOFA"
  status:       { type: String, enum: ["PENDING", "APPROVED", "REJECTED"], default: "PENDING" },
  rejectionNote:String,
});

const expertTravelSchema = new mongoose.Schema({
  expert: {
    type: mongoose.Schema.Types.ObjectId,
    ref:  "Expert",
    required: true,
    unique: true,
  },
  cycle: { type: String, required: true },

  /* ── Confirmation ── */
  confirmed:      { type: Boolean, default: false },
  contactNumber:  String,
  presenceStatus: { type: String, enum: ["Online", "Offline", "Pending"], default: "Pending" },
  onlineLink:     String,        // if Online

  /* ── Offline travel ── */
  modeOfTravel:   { type: String, enum: ["Rail", "Air", "Own Vehicle"] },
  traveller:      travellerSchema,

  /* ── Quote → Ticket → Invoice workflow ── */
  quote:          quoteSchema,
  ticketPath:     String,        // uploaded ticket file path
  ticketUploadedAt: Date,
  invoicePath:    String,
  invoiceUploadedAt: Date,

  /* ── Pickup / Drop ── */
  pickupDrop:     pickupDropSchema,

}, { timestamps: true });

module.exports = mongoose.model("ExpertTravel", expertTravelSchema);
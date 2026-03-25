const mongoose = require("mongoose");

const officeOrderSchema = new mongoose.Schema({
  orderNumber: { type: String, required: true },
  orderDate:   { type: Date,   required: true },
  pdfPath:     { type: String, required: true },
  cycle:       { type: String, required: true },
  uploadedBy:  { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  locked:      { type: Boolean, default: true },
}, { timestamps: true });

module.exports = mongoose.model("OfficeOrder", officeOrderSchema);
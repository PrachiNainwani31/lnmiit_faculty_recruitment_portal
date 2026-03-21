// models/Expert.js
const mongoose = require("mongoose");

const expertSchema = new mongoose.Schema(
  {
    cycle: {
      type: String,
      required: true,
      index: true,
    },

    fullName: {
      type: String,
      required: true,
      trim: true,
    },

    email: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
    },

    designation: {
      type: String,
      required: true,
      trim: true,
    },

    department: {
      type: String,
      required: true,
      trim: true,
    },

    institute: {
      type: String,
      required: true,
      trim: true,
    },

    specialization: {
      type: String,
      trim: true,
    },

    uploadedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
  },
  { timestamps: true }
);

/* Prevent duplicate expert per cycle */
expertSchema.index({ email: 1, cycle: 1,uplodedBy:1 }, { unique: true });

module.exports = mongoose.model("Expert", expertSchema);

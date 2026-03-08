const mongoose = require("mongoose");

const candidateSchema = new mongoose.Schema(
  {
    cycle: {
      type: String,
      required: true,
      index: true, // fast queries by cycle
    },

    srNo: {
      type: Number,
      required: true,
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

    phone: {
      type: String,
      required: true,
      trim: true,
    },

    qualification: {
      type: String,
      required: true,
      trim: true,
    },

    specialization: {
      type: String,
      required: true,
      trim: true,
    },

    reviewerObservation: {
      type: String,
      trim: true,
    },

    ilscComments: {
      type: String,
      trim: true,
    },
    hod: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
  },
  {
    timestamps: true, // createdAt, updatedAt
  }
);

/**
 * 🔒 Prevent duplicate SR No per cycle
 * (Very important for CSV uploads)
 */
candidateSchema.index(
  { cycle: 1, srNo: 1 },
  { unique: true }
);

module.exports = mongoose.model("Candidate", candidateSchema);
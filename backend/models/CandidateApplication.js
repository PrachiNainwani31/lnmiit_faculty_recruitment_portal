const mongoose = require("mongoose");

const refereeSchema = new mongoose.Schema({
  salutation: String,
  name: String,
  designation: String,
  department: String,
  institute: String,
  email: String,
  status: {
    type: String,
    default: "PENDING"
  },
  letter: String
});

const experienceSchema = new mongoose.Schema({
  type: String,
  organization: String,
  designation: String,
  department: String,
  fromDate: Date,
  toDate: Date,
  certificate: String,
  natureOfWork: String
});

const candidateApplicationSchema = new mongoose.Schema({

  candidate: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Candidate"
  },

  name: String,
  email: String,
  phone: String,

  acceptance: Boolean,

  documents: {
    cv: String,
    teachingStatement: String,
    researchStatement: String,
    marks10: String,
    marks12: String,
    graduation: String,
    postGraduation: String,
    phdMarksheet: String,
    phdProvisional: String,
    otherDocs: [
      {
        name: String,
        file: String
      }
    ]
  },

  publications: [String],

  experiences: [experienceSchema],

  referees: [refereeSchema],

  accommodation: Boolean,

  status: {
    type: String,
    default: "DRAFT"
  },

  verdicts: {
  cv: {
    status: { type: String, default: "Pending" },
    remark: String
  },
  teachingStatement: {
    status: { type: String, default: "Pending" },
    remark: String
  },
  researchStatement: {
    status: { type: String, default: "Pending" },
    remark: String
  },
  marks10: {
    status: { type: String, default: "Pending" },
    remark: String
  },
  marks12: {
    status: { type: String, default: "Pending" },
    remark: String
  },
  graduation: {
    status: { type: String, default: "Pending" },
    remark: String
  },
  postGraduation: {
    status: { type: String, default: "Pending" },
    remark: String
  },
  phdMarksheet: {
    status: { type: String, default: "Pending" },
    remark: String
  },
  phdProvisional: {
    status: { type: String, default: "Pending" },
    remark: String
  }
}

}, { timestamps: true });

module.exports = mongoose.model(
  "CandidateApplication",
  candidateApplicationSchema
);
const mongoose = require("mongoose");

const refereeSchema = new mongoose.Schema({
  salutation:  String,
  name:        String,
  designation: String,
  department:  String,
  institute:   String,
  email:       String,
  status:      { type: String, default: "PENDING" },
  letter:      String,
  signedName:  String,
  submittedAt: Date,
});

const experienceSchema = new mongoose.Schema({
  type:         String,   // "Research" | "Teaching" | "Industrial"
  organization: String,
  designation:  String,
  department:   String,
  fromDate:     Date,
  toDate:       Date,
  certificate:  String,
  natureOfWork: String,
});

const candidateApplicationSchema = new mongoose.Schema({

  candidate: {
    type: mongoose.Schema.Types.ObjectId,
    ref:  "User",
  },

  name:        String,
  email:       String,
  phone:       String,
  department:  String,
  acceptance:  Boolean,
  accommodation: Boolean,

  /* ── Documents ── */
  documents: {
    cv:                String,
    teachingStatement: String,
    researchStatement: String,

    // Academic
    marks10:           String,   // 10th marksheet (single PDF)
    marks12:           String,   // 12th marksheet (single PDF)
    graduation:        String,   // Graduation certificate (single PDF)
    postGraduation:    String,   // PG certificate (single PDF)

    // PhD
    phdCourseWork:     String,   // PhD course work certificate
    phdProvisional:    String,   // Provisional PhD degree
    phdDegree:         String,   // PhD degree certificate
    dateOfDefense:     String,   // Date of PhD defense (stored as string date)

    // Multi-file documents (arrays of paths)
    researchExpCerts:  [String], // Up to 5 research exp certificates
    teachingExpCerts:  [String], // Up to 5 teaching exp certificates
    industryExpCerts:  [String], // Up to 5 industry exp certificates
    bestPapers:        [String], // Up to 5 best papers (PDF, 100MB each)
    postDocDocs:       [String], // Up to 5 post-doc documents
    salarySlips:       [String], // Current/previous month salary slips

    otherDocs: [{
      name: String,
      file: String,
    }],
  },

  /* ── Experience types selected ── */
  experienceTypes: {
    research:   { type: Boolean, default: false },
    teaching:   { type: Boolean, default: false },
    industrial: { type: Boolean, default: false },
  },

  publications: [String],
  experiences:  [experienceSchema],
  referees:     [refereeSchema],

  status: {
    type:    String,
    default: "DRAFT",
  },

  verdicts: mongoose.Schema.Types.Mixed,

}, { timestamps: true });

module.exports = mongoose.model("CandidateApplication", candidateApplicationSchema);
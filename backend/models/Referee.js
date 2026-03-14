// In CandidateApplication.js — update refereeSchema to add these 2 fields:

const refereeSchema = new mongoose.Schema({
  salutation:  String,
  name:        String,
  designation: String,
  department:  String,
  institute:   String,
  email:       String,
  status: {
    type:    String,
    default: "PENDING",
  },
  letter:      String,
  signedName:  String,   // ← ADD: referee's full name signature
  submittedAt: Date,     // ← ADD: timestamp of when they submitted
});
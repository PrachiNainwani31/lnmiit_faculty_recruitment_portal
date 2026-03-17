const mongoose = require("mongoose");
const bcrypt   = require("bcryptjs");

const userSchema = new mongoose.Schema(
  {
    name: {
      type:     String,
      required: true,
      trim:     true,
    },
    email: {
      type:      String,
      required:  true,
      unique:    true,
      lowercase: true,
      trim:      true,
    },
    password: {
      type:     String,
      required: true,
    },
    role: {
      type: String,
      enum: [
        "ADMIN",
        "HOD",
        "DOFA",
        "ADOFA",
        "DOFA_OFFICE",    // ← New: DOFA Office staff
        "ESTABLISHMENT",  // ← Ramswaroop Sharma (travel)
        "CANDIDATE",
        "REFEREE",
      ],
      required: true,
    },
    department: {
      type: String, // only for HOD
    },
    active: {
      type:    Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

userSchema.pre("save", async function () {
  if (!this.isModified("password")) return;
  this.password = await bcrypt.hash(this.password, 10);
});

userSchema.methods.comparePassword = function (plain) {
  return bcrypt.compare(plain, this.password);
};

module.exports = mongoose.model("User", userSchema);
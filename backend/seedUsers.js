const mongoose = require("mongoose");
require("dotenv").config({ path: "./.env" });
const User = require("./models/User");

async function seed() {
  console.log("Connecting to:", process.env.MONGO_URI);
  await mongoose.connect(process.env.MONGO_URI);

  await User.deleteMany({});

  await User.create([
    /* ── HOD ── */
    {
      name:       "HOD",
      email:      "23ucs668@lnmiit.ac.in",
      password:   "123",
      role:       "HOD",
      department: "CSE",
      active:     true,
    },

    {
      name:       "HOD",
      email:      "vares73126@lxbeta.com",
      password:   "123",
      role:       "HOD",
      department: "CCE",
      active:     true,
    },

    /* ── DOFA ── */
    {
      name:     "DOFA",
      email:    "prachinainwnai31@gmail.com",
      password: "123",
      role:     "DOFA",
      active:   true,
    },

    /* ── DOFA Office ── */
    {
      name:     "DOFA Office",
      email:    "23ucs667@lnmiit.ac.in",
      password: "123",
      role:     "DOFA_OFFICE",
      active:   true,
    },

    /* ── Ramswaroop Sharma (Travel / Establishment) ── */
    {
      name:     "Ramswaroop Sharma",
      email:    "bigav56562@paylaar.com",
      password: "123",
      role:     "ESTABLISHMENT",
      active:   true,
    },

    /* ── Candidates ── */
    {
      name:     "Candidate 1",
      email:    "candidate1@gmail.com",
      password: "123",
      role:     "CANDIDATE",
      active:   true,
    },
    {
      name:     "prachi nainwani",
      email:    "pnainwani8@gmail.com",
      password: "123",
      role:     "CANDIDATE",
      active:   true,
    },
  ]);

  console.log("✅ Users seeded:", mongoose.connection.name);
  process.exit(0);
}

seed().catch(err => {
  console.error(err);
  process.exit(1);
});
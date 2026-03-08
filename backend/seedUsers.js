const mongoose = require("mongoose");
require("dotenv").config({ path: "./.env" });
const User = require("./models/User");

async function seed() {
  console.log("Connecting to:", process.env.MONGO_URI);

  await mongoose.connect(process.env.MONGO_URI);

  await User.deleteMany({});

  await User.create([
    {
      name: "HOD",
      email: "23ucs668@lnmiit.ac.in",
      password: "prachi123",
      role: "HOD",
      department: "CSE",
      active: true,
    },
    {
      name: "DOFA",
      email: "prachinainwnai31@gmail.com",
      password: "prachi1234",
      role: "DOFA",
      active: true,
    },
  ]);

  console.log("✅ Users seeded into DB:", mongoose.connection.name);
  process.exit(0);
}

seed().catch(err => {
  console.error(err);
  process.exit(1);
});



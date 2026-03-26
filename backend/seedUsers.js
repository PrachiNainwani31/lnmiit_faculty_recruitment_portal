require("dotenv").config({ path: "./.env" });
const db = require("./models");
const bcrypt = require("bcryptjs");

async function seed() {
  try {
    await db.sequelize.authenticate();
    console.log("DB PASS:", process.env.DB_PASS);
    console.log("✅ MySQL connected");

    // ❌ Mongo deleteMany → ✅ Sequelize destroy
    await db.User.destroy({ where: {} });

    const users = [
      {
        name: "HOD",
        email: "23ucs668@lnmiit.ac.in",
        password: "123",
        role: "HOD",
        department: "CSE",
        active: true,
      },
      {
        name: "HOD",
        email: "vares73126@lxbeta.com",
        password: "123",
        role: "HOD",
        department: "CCE",
        active: true,
      },
      {
        name: "DOFA",
        email: "prachinainwnai31@gmail.com",
        password: "123",
        role: "DOFA",
        active: true,
      },
      {
        name: "DOFA Office",
        email: "23ucs667@lnmiit.ac.in",
        password: "123",
        role: "DOFA_OFFICE",
        active: true,
      },
      {
        name: "Ramswaroop Sharma",
        email: "bigav56562@paylaar.com",
        password: "123",
        role: "TRAVEL",
        active: true,
      },
      {
        name: "Candidate 1",
        email: "candidate1@gmail.com",
        password: "123",
        role: "CANDIDATE",
        active: true,
      },
      {
        name: "prachi nainwani",
        email: "pnainwani8@gmail.com",
        password: "123",
        role: "CANDIDATE",
        active: true,
      },
      {
        name: "Director",
        email: "director@gmail.com",
        password: "123",
        role: "DIRECTOR",
        active: true,
      },
      {
        name: "Estate",
        email: "estate@gmail.com",
        password: "123",
        role: "ESTATE",
        active: true,
      },
      {
        name: "LUCS",
        email: "lucs@gmail.com",
        password: "123",
        role: "LUCS",
        active: true,
      },
      {
        name: "establishment",
        email: "establishment@gmail.com",
        password: "123",
        role: "ESTABLISHMENT",
        active: true,
      },
    ];

    // 🔐 Hash passwords (VERY IMPORTANT)
    const hashedUsers = await Promise.all(
      users.map(async (user) => ({
        ...user,
        password: await bcrypt.hash(user.password, 10),
      }))
    );

    // ❌ create → ✅ bulkCreate
    await db.User.bulkCreate(hashedUsers);

    console.log("✅ Users seeded successfully");
    process.exit(0);

  } catch (err) {
    console.error("❌ Seed error:", err);
    process.exit(1);
  }
}

seed();
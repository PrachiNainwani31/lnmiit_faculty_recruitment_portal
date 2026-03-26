const { Candidate, CandidateStats, User } = require("../models");
const parseCSV = require("../utils/csvParser");
const { createNotification } = require("../utils/notify");
const { Parser } = require("json2csv");
const CYCLE = require("../config/activeCycle");
const fs = require("fs");
const path = require("path");
const { notifyDofaUpload } = require("./email.controller");

/* =====================================================
   UPLOAD CANDIDATES CSV
===================================================== */
exports.uploadCandidates = async (req, res) => {
  try {
    if (!req.file)
      return res.status(400).json({ message: "CSV file missing" });

    const rows = await parseCSV(req.file.path);
    console.log("ROW COUNT:", rows.length);        // ← here
console.log("FIRST ROW:", JSON.stringify(rows[0]));
    const hodId = req.user.id;

    const validRows = rows.filter(
      r =>
        r.fullName &&
        r.email &&
        r.phone &&
        r.qualification &&
        r.specialization
    );

    const stats = await CandidateStats.findOne({
      where: { cycle: CYCLE, hodId }
    });

    if (!stats)
      return res.status(400).json({
        message: "Please enter ILSC count before uploading CSV",
      });

    if (validRows.length !== stats.ilscShortlisted) {
      return res.status(400).json({
        message: `Upload exactly ${stats.ilscShortlisted} candidates`,
      });
    }

    // DELETE old
    await Candidate.destroy({
      where: { cycle: CYCLE, hodId }
    });

    const formatted = [];

    for (let r of validRows) {
      let user = await User.findOne({
        where: { email: r.email }
      });

      if (!user) {
        user = await User.create({
          name: r.fullName,
          email: r.email,
          password: "123",
          role: "CANDIDATE",
          active: true
        });
      }

      formatted.push({
        cycle: CYCLE,
        srNo: r.srNo,
        fullName: r.fullName,
        email: r.email,
        phone: r.phone,
        qualification: r.qualification,
        specialization: r.specialization,
        reviewerObservation: r.reviewerObservation || "",
        ilscComments: r.ilscComments || "",
        hodId: hodId,
        userId: user.id
      });
    }

    await Candidate.bulkCreate(formatted);

    const hod = await User.findByPk(hodId);

    notifyDofaUpload({
      department: hod.department,
      hodName: hod.name,
    }).catch(console.error);

    await createNotification({
      cycle: CYCLE,
      role: "DOFA",
      title: "Candidate List Updated",
      message: "HOD uploaded candidate list",
      type: "UPLOAD",
    });

    res.json({ success: true, count: formatted.length });

  } catch (err) {
  console.error("UPLOAD ERROR NAME:", err.name);
  console.error("UPLOAD ERROR MSG:", err.message);
  console.error("UPLOAD ERROR STACK:", err.stack);
  res.status(500).json({ message: err.message }); // ← send actual error to frontend too
}
};

/* =====================================================
   GET CANDIDATES
===================================================== */
exports.getCandidatesByCycle = async (req, res) => {
  const where = { cycle: CYCLE };

  if (req.user.role === "HOD") {
    where.hodId = req.user.id;
  }

  const candidates = await Candidate.findAll({
    where,
    include: [
      {
        model: User,
        as: "hod",
        attributes: ["department"]
      }
    ],
    order: [["srNo", "ASC"]]
  });

  const result = candidates.map(c => ({
    ...c.toJSON(),
    department: c.hod?.department || "Unknown"
  }));

  res.json(result);
};

/* =====================================================
   DELETE SINGLE
===================================================== */
exports.deleteCandidate = async (req, res) => {
  await Candidate.destroy({
    where: { id: req.params.id }
  });
  res.json({ success: true });
};

/* =====================================================
   CLEAR
===================================================== */
exports.clearCandidateStats = async (req, res) => {
  await CandidateStats.destroy({
    where: { cycle: CYCLE, hodId: req.user.id }
  });

  await Candidate.destroy({
    where: { cycle: CYCLE, hodId: req.user.id }
  });

  res.json({ success: true });
};

/* =====================================================
   SAVE STATS
===================================================== */
exports.saveCandidateStats = async (req, res) => {
  const { totalApplications, dlscShortlisted, ilscShortlisted } = req.body;

  await CandidateStats.upsert({
    cycle: CYCLE,
    hodId: req.user.id,
    totalApplications,
    dlscShortlisted,
    ilscShortlisted
  });

  const stats = await CandidateStats.findOne({
    where: { cycle: CYCLE, hodId: req.user.id }
  });

  res.json(stats);
};

exports.getCandidateStats = async (req, res) => {
  const stats = await CandidateStats.findOne({
    where: { cycle: CYCLE, hodId: req.user.id }
  });
  res.json(stats);
};

/* =====================================================
   STATUS
===================================================== */
exports.getCandidateStatus = async (req, res) => {
  const stats = await CandidateStats.findOne({
    where: { cycle: CYCLE, hodId: req.user.id }
  });

  const uploadedCount = await Candidate.count({
    where: { cycle: CYCLE, hodId: req.user.id }
  });

  res.json({
    statsEntered: !!stats,
    ilscCount: stats?.ilscShortlisted || 0,
    uploadedCount,
  });
};

/* =====================================================
   DOWNLOAD TEMPLATE
===================================================== */
exports.downloadTemplate = async (req, res) => {
  const stats = await CandidateStats.findOne({
    where: { cycle: CYCLE }
  });

  if (!stats)
    return res.status(400).json({ message: "Stats not found" });

  const fields = [
    "srNo", "fullName", "email", "phone",
    "qualification", "specialization",
    "reviewerObservation", "ilscComments",
  ];

  const rows = Array.from({ length: stats.ilscShortlisted }).map((_, i) => ({
    srNo: i + 1,
    fullName: "",
    email: "",
    phone: "",
    qualification: "",
    specialization: "",
    reviewerObservation: "",
    ilscComments: "",
  }));

  const parser = new Parser({ fields });
  const csv = parser.parse(rows);

  res.header("Content-Type", "text/csv");
  res.attachment(`ILSC_Candidates_${CYCLE}.csv`);
  res.send(csv);
};

/* =====================================================
   OTHER APIs (no DB change needed)
===================================================== */
exports.uploadResumes = async (req, res) => {
  if (!req.file)
    return res.status(400).json({ message: "ZIP file required" });

  res.json({ message: "Resume ZIP uploaded successfully" });
};

exports.getCandidatesByDepartment = async (req, res) => {
  if (req.user.role !== "DOFA")
    return res.status(403).json({ message: "Access denied" });

  const { department } = req.params;

  const hod = await User.findOne({
    where: { role: "HOD", department }
  });

  if (!hod)
    return res.status(404).json({ message: "HOD not found" });

  const candidates = await Candidate.findAll({
    where: { hodId: hod.id, cycle: CYCLE },
    order: [["srNo", "ASC"]]
  });

  res.json(candidates);
};

exports.getUploadedResumes = async (req, res) => {
  const department = req.user.department;

  const filePath = path.join(
    __dirname,
    "../uploads/resumes",
    CYCLE,
    department,
    "resumes.zip"
  );

  if (!fs.existsSync(filePath)) return res.json([]);

  res.json([
    {
      name: "resumes.zip",
      url: `/uploads/resumes/${CYCLE}/${department}/resumes.zip`,
    },
  ]);
};
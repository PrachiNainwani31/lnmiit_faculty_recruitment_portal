const { Candidate, CandidateStats, User, RecruitmentCycle } = require("../models");
const parseCSV = require("../utils/csvParser");
const { createNotification } = require("../utils/notify");
const { Parser } = require("json2csv");
const CYCLE = require("../config/activeCycle");
const fs   = require("fs");
const path = require("path");
const { notifyDofaUpload } = require("./email.controller");

// ── Flexible header normalization ─────────────────────────────────────
const normalizeHeader = (h) => h.toLowerCase().replace(/[\s_\-]+/g, "");

const COLUMN_MAP = {
  srno:                   "srNo",
  fullname:               "fullName",
  email:                  "email",
  secondaryemail:         "secondaryEmail",
  phone:                  "phone",
  qualification:          "qualification",
  specialization:         "specialization",
  appliedposition:        "appliedPosition",
  recommendedposition:    "recommendedPosition",
  recommendedforposition: "recommendedPosition",
  reviewerobservation:    "reviewerObservation",
  ilsccomments:           "ilscComments",
};

/* =====================================================
   UPLOAD CANDIDATES CSV
===================================================== */
exports.uploadCandidates = async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ message: "CSV file missing" });

    const rawRows = await parseCSV(req.file.path);
    const hodId   = req.user.id;

    // Map raw CSV headers → model field names
    const rows = rawRows.map(raw => {
      const mapped = {};
      Object.entries(raw).forEach(([key, val]) => {
        const field = COLUMN_MAP[normalizeHeader(key)];
        if (field) mapped[field] = val?.toString().trim() ?? "";
      });
      return mapped;
    });

    const validRows = rows.filter(
      r => r.fullName && r.email && r.phone && r.qualification && r.specialization
    );

    const stats = await CandidateStats.findOne({ where: { cycle: CYCLE, hodId } });

    if (!stats)
      return res.status(400).json({ message: "Please enter ILSC count before uploading CSV" });

    if (validRows.length !== stats.ilscShortlisted)
      return res.status(400).json({
        message: `Upload exactly ${stats.ilscShortlisted} candidates (found ${validRows.length} valid rows)`,
      });

    await Candidate.destroy({ where: { cycle: CYCLE, hodId } });

    const formatted = [];

    for (const r of validRows) {
      let user = await User.findOne({ where: { email: r.email } });

      if (!user) {
        user = await User.create({
          name: r.fullName, email: r.email,
          password: "123", role: "CANDIDATE", active: true,
        });
      }

      formatted.push({
        cycle:               CYCLE,
        srNo:                Number(r.srNo) || (formatted.length + 1),
        fullName:            r.fullName,
        email:               r.email,
        secondaryEmail:      r.secondaryEmail     || null,
        phone:               r.phone,
        qualification:       r.qualification,
        specialization:      r.specialization,
        appliedPosition:     r.appliedPosition     || null,
        recommendedPosition: r.recommendedPosition || null,
        reviewerObservation: r.reviewerObservation || "",
        ilscComments:        r.ilscComments        || "",
        hodId,
        userId:              user.id,
        appearedInInterview: false,
      });
    }

    await Candidate.bulkCreate(formatted);

    const hod = await User.findByPk(hodId);
    notifyDofaUpload({ department: hod.department, hodName: hod.name }).catch(console.error);

    await createNotification({
      cycle: CYCLE, role: "DOFA",
      title: "Candidate List Updated",
      message: `HOD (${hod.department}) uploaded ${formatted.length} candidates`,
      type: "UPLOAD",
    });

    res.json({ success: true, count: formatted.length });

  } catch (err) {
    console.error("UPLOAD ERROR:", err.message);
    res.status(500).json({ message: err.message });
  }
};

/* =====================================================
   GET CANDIDATES — returns { candidates, interviewDate }
   so frontend can gate the appeared toggle
===================================================== */
exports.getCandidatesByCycle = async (req, res) => {
  try {
    const where = { cycle: CYCLE };
    if (req.user.role === "HOD") where.hodId = req.user.id;

    const candidates = await Candidate.findAll({
      where,
      include: [{ model: User, as: "hod", attributes: ["department"] }],
      order: [["srNo", "ASC"]],
    });

    let interviewDate = null;
    if (req.user.role === "HOD") {
      const rc = await RecruitmentCycle.findOne({
        where: { cycle: CYCLE, hodId: req.user.id },
      });
      interviewDate = rc?.interviewDate || null;
    }

    const result = candidates.map(c => ({
      ...c.toJSON(),
      department: c.hod?.department || "Unknown",
    }));

    res.json({ candidates: result, interviewDate });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: err.message });
  }
};

/* =====================================================
   MARK APPEARED — gated by interview date
===================================================== */
exports.markAppeared = async (req, res) => {
  try {
    const { id }       = req.params;
    const { appeared } = req.body;

    const candidate = await Candidate.findOne({
      where: { id, hodId: req.user.id, cycle: CYCLE },
    });

    if (!candidate)
      return res.status(404).json({ message: "Candidate not found" });

    // Gate: interview date must be set by DOFA
    const rc = await RecruitmentCycle.findOne({
      where: { cycle: CYCLE, hodId: req.user.id },
    });

    if (!rc?.interviewDate) {
      return res.status(403).json({
        message: "Interview date not yet set by DOFA.",
        gated: true,
      });
    }

    await Candidate.update(
      { appearedInInterview: !!appeared },
      { where: { id } }
    );

    res.json({ success: true, appeared: !!appeared });

  } catch (err) {
    console.error("markAppeared error:", err.message);
    res.status(500).json({ message: "Failed to update" });
  }
};

/* =====================================================
   DELETE / CLEAR / STATS
===================================================== */
exports.deleteCandidate = async (req, res) => {
  await Candidate.destroy({ where: { id: req.params.id } });
  res.json({ success: true });
};

exports.clearCandidateStats = async (req, res) => {
  await CandidateStats.destroy({ where: { cycle: CYCLE, hodId: req.user.id } });
  await Candidate.destroy(    { where: { cycle: CYCLE, hodId: req.user.id } });
  res.json({ success: true });
};

exports.saveCandidateStats = async (req, res) => {
  const { totalApplications, dlscShortlisted, ilscShortlisted } = req.body;
  await CandidateStats.upsert({
    cycle: CYCLE, hodId: req.user.id,
    totalApplications, dlscShortlisted, ilscShortlisted,
  });
  const stats = await CandidateStats.findOne({
    where: { cycle: CYCLE, hodId: req.user.id },
  });
  res.json(stats);
};

exports.getCandidateStats = async (req, res) => {
  const stats = await CandidateStats.findOne({
    where: { cycle: CYCLE, hodId: req.user.id },
  });
  res.json(stats);
};

exports.getCandidateStatus = async (req, res) => {
  const stats         = await CandidateStats.findOne({ where: { cycle: CYCLE, hodId: req.user.id } });
  const uploadedCount = await Candidate.count({ where: { cycle: CYCLE, hodId: req.user.id } });
  res.json({
    statsEntered: !!stats,
    ilscCount:    stats?.ilscShortlisted || 0,
    uploadedCount,
  });
};

/* =====================================================
   DOWNLOAD TEMPLATE — updated with new fields
===================================================== */
exports.downloadTemplate = async (req, res) => {
  const stats = await CandidateStats.findOne({ where: { cycle: CYCLE } });
  if (!stats) return res.status(400).json({ message: "Stats not found" });

  const fields = [
    "srNo","fullName","email","secondaryEmail","phone",
    "qualification","specialization",
    "appliedPosition","recommendedPosition",
    "reviewerObservation","ilscComments",
  ];

  const rows = Array.from({ length: stats.ilscShortlisted }).map((_, i) => ({
    srNo: i + 1, fullName: "", email: "", secondaryEmail: "", phone: "",
    qualification: "", specialization: "",
    appliedPosition: "", recommendedPosition: "",
    reviewerObservation: "", ilscComments: "",
  }));

  const parser = new Parser({ fields });
  const csv    = parser.parse(rows);

  res.header("Content-Type", "text/csv");
  res.attachment(`ILSC_Candidates_${CYCLE}.csv`);
  res.send(csv);
};

/* =====================================================
   OTHER APIs
===================================================== */
exports.uploadResumes = async (req, res) => {
  if (!req.file) return res.status(400).json({ message: "ZIP file required" });
  res.json({ message: "Resume ZIP uploaded successfully" });
};

exports.getCandidatesByDepartment = async (req, res) => {
  if (req.user.role !== "DOFA")
    return res.status(403).json({ message: "Access denied" });

  const hod = await User.findOne({
    where: { role: "HOD", department: req.params.department },
  });
  if (!hod) return res.status(404).json({ message: "HOD not found" });

  const candidates = await Candidate.findAll({
    where: { hodId: hod.id, cycle: CYCLE },
    order: [["srNo", "ASC"]],
  });

  res.json(candidates);
};

exports.getUploadedResumes = async (req, res) => {
  const filePath = path.join(
    __dirname, "../uploads/resumes", CYCLE, req.user.department, "resumes.zip"
  );
  if (!fs.existsSync(filePath)) return res.json([]);
  res.json([{
    name: "resumes.zip",
    url:  `/uploads/resumes/${CYCLE}/${req.user.department}/resumes.zip`,
  }]);
};
const { Candidate, CandidateStats, User, RecruitmentCycle } = require("../models");
const parseCSV = require("../utils/csvParser");
const { createNotification } = require("../utils/notify");
const { Parser } = require("json2csv");
const getCurrentCycle = require("../utils/getCurrentCycle");
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
    const cycle = await getCurrentCycle(req.user.id);

      if (!cycle) {
        return res.status(404).json({ message: "No active cycle found" });
      }

    const stats = await CandidateStats.findOne({ where: { cycle: cycle.cycle, hodId } });

    if (!stats)
      return res.status(400).json({ message: "Please enter ILSC count before uploading CSV" });

    if (validRows.length !== stats.ilscShortlisted)
      return res.status(400).json({
        message: `Upload exactly ${stats.ilscShortlisted} candidates (found ${validRows.length} valid rows)`,
      });

    await Candidate.destroy({ where: { cycle: cycle.cycle, hodId } });

    const formatted = [];

    for (const r of validRows) {
      formatted.push({
        cycle:               cycle.cycle,
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
        appearedInInterview: false,
      });
    }

    await Candidate.bulkCreate(formatted);

    const hod = await User.findByPk(hodId);
    notifyDofaUpload({ department: hod.department, hodName: hod.name }).catch(console.error);

    await createNotification({
      cycle: cycle.cycle, role: "DOFA",
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
    if (req.user.role === "HOD") {
      const cycle = await getCurrentCycle(req.user.id);
      if (!cycle) return res.status(404).json({ message: "No active cycle found" });

      const candidates = await Candidate.findAll({
        where: { hodId: req.user.id, cycle: cycle.cycle },
        include: [{ model: User, as: "hod", attributes: ["department"] }],
        order: [["srNo", "ASC"]],
      });

      const rc = await RecruitmentCycle.findOne({
        where: { cycle: cycle.cycle, hodId: req.user.id },
      });

      const result = candidates.map(c => ({
        ...c.toJSON(),
        department: c.hod?.department || "Unknown",
      }));

      return res.json({ candidates: result, interviewDate: rc?.interviewDate || null });
    }

    // DOFA / DOFA_OFFICE — fetch latest cycle per HOD
    const { Op } = require("sequelize");
    const hods = await User.findAll({ where: { role: "HOD" }, attributes: ["id"] });

    if (!hods.length) return res.json({ candidates: [], interviewDate: null });

    const cyclePerHod = await Promise.all(
      hods.map(h => RecruitmentCycle.findOne({
        where: { hodId: h.id },
        order: [["createdAt", "DESC"]],
      }))
    );

    const conditions = [];
    hods.forEach((h, i) => {
      if (cyclePerHod[i]) {
        conditions.push({ hodId: h.id, cycle: cyclePerHod[i].cycle });
      }
    });

    if (!conditions.length) return res.json({ candidates: [], interviewDate: null });

    const candidates = await Candidate.findAll({
      where: { [Op.or]: conditions },
      include: [{ model: User, as: "hod", attributes: ["department"] }],
      order: [["srNo", "ASC"]],
    });

    const result = candidates.map(c => ({
      ...c.toJSON(),
      department: c.hod?.department || "Unknown",
    }));

    return res.json({ candidates: result, interviewDate: null });

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
    const cycle = await getCurrentCycle(req.user.id);

    if (!cycle) {
      return res.status(404).json({ message: "No active cycle found" });
    }
    const candidate = await Candidate.findOne({
      where: { id, hodId: req.user.id, cycle: cycle.cycle },
    });

    if (!candidate)
      return res.status(404).json({ message: "Candidate not found" });

    // Gate: interview date must be set by DOFA
    const rc = await RecruitmentCycle.findOne({
      where: { cycle: cycle.cycle, hodId: req.user.id },
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
  const cycle = await getCurrentCycle(req.user.id);
  if (!cycle) {
    return res.status(400).json({ message: "No active cycle found" });
  }
  await CandidateStats.destroy({ where: { cycle: cycle.cycle, hodId: req.user.id } });
  await Candidate.destroy(    { where: { cycle: cycle.cycle, hodId: req.user.id } });
  res.json({ success: true });
};

exports.saveCandidateStats = async (req, res) => {
  const cycle = await getCurrentCycle(req.user.id);
  if (!cycle) {
    return res.status(400).json({ message: "No active cycle found" });
  }
  const { totalApplications, dlscShortlisted, ilscShortlisted } = req.body;
  await CandidateStats.upsert({
    cycle: cycle.cycle, hodId: req.user.id,
    totalApplications, dlscShortlisted, ilscShortlisted,
  });
  const stats = await CandidateStats.findOne({
    where: { cycle: cycle.cycle, hodId: req.user.id },
  });
  res.json(stats);
};

exports.getCandidateStats = async (req, res) => {
  const cycle = await getCurrentCycle(req.user.id);
  if (!cycle) {
    return res.status(400).json({ message: "No active cycle found" });
  }
  const stats = await CandidateStats.findOne({
    where: { cycle: cycle.cycle, hodId: req.user.id },
  });
  res.json(stats);
};

exports.getCandidateStatus = async (req, res) => {
  const cycle = await getCurrentCycle(req.user.id);
  if (!cycle) {
    return res.status(400).json({ message: "No active cycle found" });
  }
  const stats         = await CandidateStats.findOne({ where: { cycle: cycle.cycle, hodId: req.user.id } });
  const uploadedCount = await Candidate.count({ where: { cycle: cycle.cycle, hodId: req.user.id } });
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
  try{
  const cycleString =req.params.cycle;
  if (!cycleString) {
    return res.status(400).json({ message: "cycle required." });
  }
  if (!req.user?.id) return res.status(401).json({ message: "Unauthorized" });
  const stats = await CandidateStats.findOne({ where: { cycle: cycleString, hodId: req.user.id }, });
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
  res.attachment(`ILSC_Candidates_${cycleString}.csv`);
  res.send(csv);
}catch(err){
  console.error("downloadTemplate error:", err);
  res.status(500).json({ message: "Failed to generate template" });
}};

exports.getCandidatesByDepartment = async (req, res) => {
  try {
    if (req.user.role !== "DOFA")
      return res.status(403).json({ message: "Access denied" });

    const hod = await User.findOne({
      where: {
        role: "HOD",
        department: req.params.department,
      },
    });

    if (!hod) {
      return res.status(404).json({ message: "HOD not found" });
    }
     const latestCycle = await RecruitmentCycle.findOne({
      where:{hodId:hod.id},
      order: [["createdAt", "DESC"]],
    });
    
    if (!latestCycle) {
      return res.status(400).json({ message: "No cycle found" });
    }
    const candidates = await Candidate.findAll({
      where: {
        hodId: hod.id,
        cycle: latestCycle.cycle,
      },
      order: [["srNo", "ASC"]],
    });

    res.json(candidates);

  } catch (err) {
    console.error("getCandidatesByDepartment error:", err);
    res.status(500).json({ message: err.message });
  }
};

exports.uploadResumes = async (req, res) => {
  try {
    const cycle = await getCurrentCycle(req.user.id);
    if (!cycle) {
      return res.status(400).json({ message: "No active cycle found" });
    }
    if (!req.file)
      return res.status(400).json({ message: "ZIP file required" });
 
    const { User } = require("../models");
    const hod  = await User.findByPk(req.user.id);
    const dept = (hod?.department || "UNKNOWN").toUpperCase().replace(/\s+/g, "_");
  
    const destDir  = path.join(__dirname, "../uploads/resumes", cycle.cycle, dept);
    const destFile = path.join(destDir, "resumes.zip");
 
    // Ensure directory exists
    fs.mkdirSync(destDir, { recursive: true });
 
    // Move uploaded temp file → correct location
    fs.renameSync(req.file.path, destFile);

    await RecruitmentCycle.update(
      {
        resumesZip: `uploads/resumes/${cycle.cycle}/${dept}/resumes.zip`
      },
      {
        where: { cycle: cycle.cycle, hodId: req.user.id }
      }
    );
    res.json({ message: "Resume ZIP uploaded successfully", path: destFile });
  } catch (err) {
    console.error("uploadResumes error:", err);
    res.status(500).json({ message: "Upload failed" });
  }
};
 
/* ── Get uploaded ZIP — checks the dept-specific path ── */
exports.getUploadedResumes = async (req, res) => {
  try {
    const cycle = await getCurrentCycle(req.user.id);
    if (!cycle) {
      return res.status(400).json({ message: "No active cycle found" });
    }
    const { User } = require("../models");
    const hod  = await User.findByPk(req.user.id);
    const dept = (hod?.department || "UNKNOWN").toUpperCase().replace(/\s+/g, "_");

    // Reconstruct the exact path where the file is saved
    const filePath = path.join(__dirname, "../uploads/resumes", cycle.cycle, dept, "resumes.zip");

    // FIX: Physically check the server's hard drive. No database queries needed!
    if (fs.existsSync(filePath)) {
      return res.json([{
        name: "resumes.zip",
        url: `/uploads/resumes/${cycle.cycle}/${dept}/resumes.zip` 
      }]);
    }

    // File not found on disk
    return res.json([]);

  } catch (err) {
    console.error("Error fetching resumes:", err);
    return res.json([]);
  }
};
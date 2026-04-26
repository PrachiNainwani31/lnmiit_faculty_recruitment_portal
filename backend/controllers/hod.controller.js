  const { Candidate, Expert, RecruitmentCycle, User } = require("../models");
  const { createNotification } = require("../utils/notify");
  const getCurrentCycle = require("../utils/getCurrentCycle");
  const parseCSV = require("../utils/csvParser");
  const { notifyDofaUpload } = require("./email.controller");
  const { Op } = require("sequelize");
  
  /* =========================================================
    ADD EXPERT
  ========================================================= */
  exports.addExpert = async (req, res) => {
    try {
      const hodCycle = await getCurrentCycle(req.user.id);
      if (!hodCycle) return res.status(400).json({ message: "No active cycle. Please initiate a cycle first." });
      const rc = await RecruitmentCycle.findOne({
        where: { cycle: hodCycle.cycle }
      });
  
      if (rc?.isFrozen) {
        return res.status(403).json({
          message: "Cycle is frozen. Cannot add experts.",
        });
      }
  
      const expert = await Expert.create({
        ...req.body,
        department: req.body.department.toUpperCase(),
        cycle: hodCycle.cycle,
        uploadedById: req.user.id,
        uploadedByDept: req.user.department || null,
      });
  
      res.json(expert);
  
    } catch (err) {
      res.status(400).json({ message: err.message });
    }
  };
  
  /* =========================================================
    GET EXPERTS (HoD)
  ========================================================= */
  exports.getExperts = async (req, res) => {
    const hodCycle = await getCurrentCycle(req.user.id);
    if (!hodCycle) return res.status(400).json({ message: "No active cycle. Please initiate a cycle first." });
    const experts = await Expert.findAll({
      where: {
        cycle: hodCycle.cycle,
        uploadedById: req.user.id
      },
      order: [["createdAt", "ASC"]]
    });
  
    res.json(experts);
  };
  
  /* =========================================================
    DELETE ALL EXPERTS
  ========================================================= */
  exports.clearExperts = async (req, res) => {
    try {
      const hodCycle = await getCurrentCycle(req.user.id);
      if (!hodCycle) return res.status(400).json({ message: "No active cycle. Please initiate a cycle first." });
      const rc = await RecruitmentCycle.findOne({
        where: { cycle: hodCycle.cycle, hodId: req.user.id }
      });
  
      if (rc?.isFrozen) {
        return res.status(403).json({
          message: "Cycle is frozen. Cannot delete experts.",
        });
      }

  
      await Expert.destroy({
        where: { cycle: hodCycle.cycle, uploadedById: req.user.id }
      });
  
      res.json({ message: "All experts deleted successfully" });
  
    } catch (err) {
      res.status(500).json({ message: "Failed to delete experts" });
    }
  };
  
  /* =========================================================
    HoD COUNTS
  ========================================================= */
  exports.getHodCounts = async (req, res) => {
    const hodCycle = await getCurrentCycle(req.user.id);
  
    if (!hodCycle) return res.json({ candidates: 0, experts: 0 });
  
    const cycleStr = hodCycle.cycle;
    const candidateCount = await Candidate.count({ where: { cycle: cycleStr, hodId: req.user.id } });
    const expertCount    = await Expert.count({    where: { cycle: cycleStr, uploadedById: req.user.id } });
    res.json({ candidates: candidateCount, experts: expertCount });
  };
  
  /* =========================================================
    GET ALL EXPERTS (DoFA / DoFA_OFFICE)
    
    Rules:
    - Only experts from currently active (non-closed) cycles
    - Deduplicate by (email + uploadedById): same HoD cannot list
      the same expert twice across C1/C2 of the same year
    - Different HoDs CAN list the same expert — they appear as
      separate rows with their own department/cycle column
  ========================================================= */
  exports.getAllExperts = async (req, res) => {
    try {
      const activeCycles = await RecruitmentCycle.findAll({
        where: { [Op.or]: [{ isClosed: false }, { isClosed: null }, { isClosed: 0 }] },
        order: [["createdAt", "DESC"]],
      });
      if (!activeCycles.length) return res.json([]);
  
      const activeCycleStrings = [...new Set(activeCycles.map(c => c.cycle))];
  
      const activeHodIds = [...new Set(activeCycles.map(c => c.hodId).filter(Boolean))];
      const dofaUsers = await User.findAll({
        where: { role: { [Op.in]: ["DoFA", "ADoFA", "DoFA_OFFICE"] } },
        attributes: ["id"],
      });
      const dofaUserIds = dofaUsers.map(u => u.id);
      const experts = await Expert.findAll({
        where: {
          cycle: { [Op.in]: activeCycleStrings },
            uploadedById: {
          [Op.in]: [...activeHodIds, ...dofaUserIds],
        },
      },
        include: [{ model: User, as: "uploadedBy", attributes: ["id", "department", "role"] }],
        order: [["createdAt", "ASC"]],
      });
  
      // Deduplicate by (email + uploadedById):
      //   - Same HoD uploading same expert across multiple cycles → keep once
      //   - CSE HoD and CCE HoD both uploading same expert → keep both (different uploadedById)
      const seen = new Set();
      const unique = experts.filter(e => {
        if (!e.email) return true;
        const key = `${e.email.toLowerCase()}::${e.uploadedById}::${e.cycle}`;
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
      });
  
      res.json(unique);
    } catch (err) {
      console.error("getAllExperts error:", err.message);
      res.status(500).json({ message: "Server error" });
    }
  };
  
  /* =========================================================
    UPLOAD EXPERTS CSV (HoD)
  ========================================================= */
  exports.uploadExpertsCSV = async (req, res) => {
    try {
      if (!req.file)
        return res.status(400).json({ message: "CSV file required" });
  
      const experts = await parseCSV(req.file.path);
  
      if (!experts.length)
        return res.status(400).json({ message: "CSV is empty" });
  
      const hodId = req.user.id;
      const hodCycle = await getCurrentCycle(hodId);
      if (!hodCycle) return res.status(200).json({ candidates: 0, experts: 0 });
      const hod = await User.findByPk(hodId);
      if (!hod) return res.status(404).json({ message: "HoD not found" });

      const formattedExperts = experts.map(row => ({
        cycle:          hodCycle.cycle,
        fullName:       row["Full Name (with Salutation)"]?.trim(),
        designation:    row["Designation"]?.trim(),
        department:     row["Department"]?.trim()?.toUpperCase(),
        institute:      row["Institute"]?.trim(),
        email:          row["Email"]?.trim()?.toLowerCase(),
        specialization: row["Specialization"]?.trim(),
        mobileNo:       row["Mobile No. (Optional)"]?.trim() || null,
        uploadedById:   hodId,
        uploadedByDept: hod.department || null,
      }));

      await Expert.bulkCreate(formattedExperts);
  
      notifyDofaUpload({
        department: hod.department,
        hodName: hod.name,
      }).catch(console.error);
  
      res.json({
        message: "Experts uploaded successfully",
        count: formattedExperts.length
      });
  
    } catch (err) {
      res.status(500).json({ message: err.message });
    }
  };
  
  /* =========================================================
    UPLOAD EXPERTS CSV FOR A SPECIFIC HoD (DoFA / ADoFA)
    
    Body: { hodId }  — which HoD's active cycle to upload into
    The uploading user (DoFA) becomes the uploadedById so these
    rows are identifiable as DoFA-uploaded in the UI.
  ========================================================= */
  exports.uploadExpertsCSVForHod = async (req, res) => {
    try {
      if (!req.file) return res.status(400).json({ message: "CSV file required" });
  
      const { hodId } = req.body;
      if (!hodId) return res.status(400).json({ message: "hodId is required" });
  
      const experts = await parseCSV(req.file.path);
      if (!experts.length) return res.status(400).json({ message: "CSV is empty" });
  
      // Find the latest active cycle for the target HoD
      const hodCycle = await RecruitmentCycle.findOne({
        where: {
          hodId,
          [Op.or]: [{ isClosed: false }, { isClosed: null }, { isClosed: 0 }],
        },
        order: [["createdAt", "DESC"]],
      });
      if (!hodCycle) return res.status(404).json({ message: "No active cycle found for this HoD" });
  
      const targetHod = await User.findByPk(hodId, { attributes: ["id", "department"] });

      const formatted = experts.map(row => ({
        cycle:          hodCycle.cycle,
        fullName:       row["Full Name (with Salutation)"]?.trim(),
        designation:    row["Designation"]?.trim(),
        department:     row["Department"]?.trim()?.toUpperCase(),
        institute:      row["Institute"]?.trim(),
        email:          row["Email"]?.trim()?.toLowerCase(),
        specialization: row["Specialization"]?.trim(),
        mobileNo:       row["Mobile No. (Optional)"]?.trim() || null,
        uploadedById:   req.user.id,
        uploadedByDept: targetHod?.department || null,
      }));

      await Expert.bulkCreate(formatted);
  
      res.json({ message: "Experts uploaded for HoD cycle", count: formatted.length, cycle: hodCycle.cycle });
    } catch (err) {
      console.error("uploadExpertsCSVForHod error:", err.message);
      res.status(500).json({ message: err.message });
    }
  };
  
  /* =========================================================
    GET EXPERTS BY HoD (DoFA viewing a specific dept)
    
    Deduplicates by email within the same HoD — one HoD should
    not show the same expert twice across multiple cycles.
  ========================================================= */
  exports.getExpertsByHod = async (req, res) => {
    try {
      const hodId = req.params.hodId;
  
      const activeCycle = await RecruitmentCycle.findOne({
        where: { hodId, [Op.or]: [{ isClosed: false }, { isClosed: null }, { isClosed: 0 }] },
        order: [["createdAt", "DESC"]],
      });
      if (!activeCycle) return res.json([]);
  
      const hodCycles = await RecruitmentCycle.findAll({
        where: { hodId, academicYear: activeCycle.academicYear },
      });
      const cycleStrings = hodCycles.map(c => c.cycle);
  
      const experts = await Expert.findAll({
        where: { cycle: { [Op.in]: cycleStrings }, uploadedById: hodId },
        include: [{ model: User, as: "uploadedBy", attributes: ["id", "department", "role"] }],
        order: [["createdAt", "ASC"]],
      });
  
      // Within the same HoD: deduplicate by email
      const seen = new Set();
      const unique = experts.filter(e => {
        if (!e.email || seen.has(e.email.toLowerCase())) return false;
        seen.add(e.email.toLowerCase());
        return true;
      });
  
      res.json(unique);
    } catch (err) {
      console.error("getExpertsByHod error:", err.message);
      res.status(500).json({ message: "Server error" });
    }
  };
  
  exports.getHodLogs = async (req, res) => {
    try {
      const hodId = req.user.id;
  
      const cycles = await RecruitmentCycle.findAll({
        where: {
          hodId,
          [Op.or]: [
            { isClosed: true },
            { joiningComplete: true },
            { status: "CLOSED" },
          ],
        },
        order: [["createdAt", "DESC"]],
      });
  
      const logs = await Promise.all(cycles.map(async (rc) => {
        const [candidates, experts] = await Promise.all([
          Candidate.findAll({ where: { cycle: rc.cycle, hodId } }),
          Expert.findAll({ where: { cycle: rc.cycle, uploadedById: hodId } }),
        ]);
        return {
          id:              rc.id,
          academicYear:    rc.academicYear,
          cycleNumber:     rc.cycleNumber,
          cycle:           rc.cycle,
          status:          rc.status,
          isClosed:        rc.isClosed,
          joiningComplete: rc.joiningComplete,
          candidates,
          experts,
        };
      }));
  
      res.json(logs);
    } catch (err) {
      res.status(500).json({ message: err.message });
    }
  };
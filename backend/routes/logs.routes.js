const express = require("express");
const router  = express.Router();
const auth    = require("../middlewares/auth");

router.get("/", auth(["DOFA", "DOFA_OFFICE"]), async (req, res) => {
  try {
    const { RecruitmentCycle, Candidate, Expert, CandidateReferee,
            CandidateApplication, SelectedCandidate, User } = require("../models");
    const { Op } = require("sequelize");

    // Filters from query
    const { academicYear, cycleNumber, department } = req.query;

    const cycleWhere = { isClosed: true };
    if (academicYear) cycleWhere.academicYear = academicYear;
    if (cycleNumber)  cycleWhere.cycleNumber  = parseInt(cycleNumber);

    const cycles = await RecruitmentCycle.findAll({
      where: cycleWhere,
      include: [{ model: User, as: "hod", attributes: ["department", "name", "email"] }],
      order: [["createdAt", "DESC"]],
    });

    const logs = await Promise.all(cycles.map(async (rc) => {
      if (department && rc.hod?.department !== department) return null;

      const [candidates, experts, selected] = await Promise.all([
        Candidate.findAll({ where: { cycle: rc.cycle, hodId: rc.hodId } }),
        Expert.findAll({ where: { cycle: rc.cycle } }),
        SelectedCandidate.findAll({ where: { cycle: rc.cycle } }),
      ]);

      const selMap = {};
      selected.forEach(s => { selMap[s.candidateId] = s; });

      // Get referees for this cycle's candidates
      const candidateUserIds = candidates.map(c => c.userId).filter(Boolean);
      const apps = candidateUserIds.length
        ? await CandidateApplication.findAll({
            where: { candidateUserId: { [Op.in]: candidateUserIds } },
            include: [{ model: require("../models").CandidateReferee, as: "referees", required: false }],
          })
        : [];

      return {
        id:           rc.id,
        academicYear: rc.academicYear,
        cycleNumber:  rc.cycleNumber,
        cycle:        rc.cycle,
        closedAt:     rc.closedAt,
        department:   rc.hod?.department,
        hodName:      rc.hod?.name,
        candidates:   candidates.map(c => ({
          ...c.toJSON(),
          selectionStatus: selMap[c.id]?.status || "NOT_SELECTED",
          designation:     selMap[c.id]?.designation || "",
          employmentType:  selMap[c.id]?.employmentType || "",
        })),
        experts,
        referees: apps.flatMap(a => a.referees || []),
      };
    }));

    res.json(logs.filter(Boolean));
  } catch (err) {
    console.error("logs error:", err);
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
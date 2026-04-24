const { PortalDeadline, CandidateApplication, User,RecruitmentCycle,Candidate } = require("../models");
const { sendEmail } = require("../utils/emailSender");
const { log } = require("../utils/activityLogger");
const { Op }        = require("sequelize");
const FRONTEND_URL = process.env.FRONTEND_URL;
async function getAppsForCycle(cycle, hodId) {
  const candidates = await Candidate.findAll({
    where: { cycle, hodId },
    attributes: ["email"],
  });
  const emails = candidates.map(c => c.email).filter(Boolean);
  if (!emails.length) return [];
  return CandidateApplication.findAll({
    where: { email: emails },
  });
}
exports.setDeadline = async (req, res) => {
  try {
    const { cycle, deadlineAt, hodId } = req.body;
    if (!cycle || !deadlineAt || !hodId)
      return res.status(400).json({ message: "cycle, hodId and deadlineAt required" });

    const existing = await PortalDeadline.findOne({ where: { cycle, hodId } }); // ✅ scoped

    if (existing) {
      await PortalDeadline.update({
        previousDeadline: existing.deadlineAt,
        deadlineAt:       new Date(deadlineAt),
        extendedAt:       new Date(),
        extendedById:     req.user.id,
      }, { where: { cycle, hodId } });

      await log({
        user: req.user, action: "DEADLINE_EXTENDED",
        entity: "PortalDeadline", entityId: cycle,
        description: `Deadline extended from ${existing.deadlineAt} to ${deadlineAt}`, req,
      });

      // Email all candidates belonging to this HOD's cycle only
      const apps = await getAppsForCycle(cycle, hodId);

      for (const app of apps) {
        if (!app.email) continue;
        const emails = [app.email];
        const candidateDoc = await Candidate.findOne({ where: { email: app.email } });
        if (candidateDoc?.secondaryEmail) emails.push(candidateDoc.secondaryEmail);

        const html = `
          <div style="font-family:Arial,sans-serif;max-width:600px;margin:auto;padding:30px">
            <div style="background:#8b0000;color:#fff;padding:15px 20px;border-radius:6px 6px 0 0">
              <h2 style="margin:0;font-size:18px">LNMIIT Faculty Recruitment and Onboarding Portal</h2>
            </div>
            <div style="border:1px solid #ddd;border-top:none;padding:25px;border-radius:0 0 6px 6px;line-height:1.7;color:#333">
              <p>Dear ${app.name || "Applicant"},</p>
              <p>The application deadline has been extended. The new deadline is:</p>
              <div style="background:#fff8e1;border:1px solid #f59e0b;padding:14px 18px;border-radius:6px;margin:15px 0;text-align:center">
                <p style="margin:0 0 4px;font-size:13px;color:#92400e;font-weight:bold">📅 New Deadline</p>
                <p style="margin:0;font-size:18px;font-weight:bold;color:#92400e">
                  ${new Date(deadlineAt).toLocaleString("en-GB", {
                    day: "numeric", month: "long", year: "numeric",
                    hour: "2-digit", minute: "2-digit",
                  })}
                </p>
              </div>
              <p>If you have already submitted, no action is needed.</p>
              <div style="margin:20px 0">
                <a href="${FRONTEND_URL}/candidate"
                  style="background:#8b0000;color:#fff;padding:10px 24px;border-radius:5px;text-decoration:none;font-weight:bold">
                  Go to Portal
                </a>
              </div>
              <p>Regards,<br><strong>DOFA Office, LNMIIT</strong></p>
            </div>
          </div>`;

        for (const email of emails) {
          await sendEmail(email, `Application Deadline Extended — LNMIIT Faculty Recruitment`, html)
            .catch(console.error);
        }
      }

    } else {
      await PortalDeadline.create({
        cycle,
        hodId,                              // scoped
        deadlineAt: new Date(deadlineAt),
        createdById: req.user.id,
      });

      const apps = await getAppsForCycle(cycle, hodId);
      for (const app of apps) {
        if (!app.email) continue;
        await sendEmail(
          app.email,
          `Application Deadline Set — LNMIIT Faculty Recruitment`,
          `<div style="font-family:Arial,sans-serif;max-width:600px;margin:auto;padding:30px">
            <div style="background:#8b0000;color:#fff;padding:15px 20px;border-radius:6px 6px 0 0">
              <h2 style="margin:0">LNMIIT Faculty Recruitment and Onboarding Portal</h2>
            </div>
            <div style="border:1px solid #ddd;border-top:none;padding:25px;border-radius:0 0 6px 6px">
              <p>Dear ${app.name || "Applicant"},</p>
              <p>The deadline to submit your application is
              <strong>${new Date(deadlineAt).toLocaleString("en-GB")}</strong>.</p>
              <div style="margin:20px 0">
                <a href="${FRONTEND_URL}/candidate"
                  style="background:#8b0000;color:#fff;padding:10px 24px;border-radius:5px;text-decoration:none;font-weight:bold">
                  Go to Portal
                </a>
              </div>
              <p>Regards,<br><strong>DOFA Office, LNMIIT</strong></p>
            </div>
          </div>`
        ).catch(console.error);
      }

      await log({
        user: req.user, action: "DEADLINE_SET",
        entity: "PortalDeadline", entityId: cycle,
        description: `Deadline set to ${deadlineAt} for hodId ${hodId}`, req,
      });
    }

    res.json({ success: true });
  } catch (err) {
    console.error("setDeadline error:", err);
    res.status(500).json({ message: "Failed to set deadline" });
  }
};

exports.getDeadline = async (req, res) => {
  try {
    const { cycle } = req.params;
    const { hodId }  = req.query; 
    if (!hodId) return res.json(null);
    const deadline = await PortalDeadline.findOne({ where: { cycle,hodId } });
    res.json(deadline || null);
  } catch (err) {
    res.status(500).json({ message: "Failed" });
  }
};

exports.getActiveDeadline = async (req, res) => {
  try {
    const { RecruitmentCycle } = require("../models");
    // Get all active (non-closed) cycles
    const activeCycles = await RecruitmentCycle.findAll({
      where: { isClosed: false },
      attributes: ["cycle"],
      order: [["createdAt", "DESC"]],
    });
    if (!activeCycles.length) return res.json(null);

    const cycleStrings = activeCycles.map(c => c.cycle);
    // Find deadline for any active cycle
    const deadline = await PortalDeadline.findOne({
      where: { cycle: cycleStrings },
      order: [["createdAt", "DESC"]],
    });
    res.json(deadline || null);
  } catch (err) {
    res.status(500).json({ message: "Failed" });
  }
};
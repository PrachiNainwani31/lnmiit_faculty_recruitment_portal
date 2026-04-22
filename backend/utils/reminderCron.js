const cron = require("node-cron");
const { PortalDeadline, CandidateApplication, CandidateReferee } = require("../models");
const { sendEmail } = require("./emailSender");
const FRONTEND_URL = process.env.FRONTEND_URL || "http://localhost:5173";

// Runs every day at 9am
cron.schedule("0 9 * * *", async () => {
  try {
    const deadlines = await PortalDeadline.findAll();
    const now = new Date();

    for (const dl of deadlines) {
      const deadline = new Date(dl.deadlineAt);
      if (now > deadline) continue; // already passed

      const daysLeft = Math.ceil((deadline - now) / (1000 * 60 * 60 * 24));

      // Send reminders at 4 days and 1 day before
      if (daysLeft !== 4 && daysLeft !== 1) continue;

      const label = daysLeft === 1 ? "tomorrow" : "in 4 days";

      // Remind DRAFT candidates
      const drafts = await CandidateApplication.findAll({
        where: { status: ["DRAFT", "QUERY"] },
      });
      for (const app of drafts) {
        if (!app.email) continue;
        await sendEmail(
          app.email,
          `Reminder — Application Deadline ${daysLeft === 1 ? "Tomorrow" : "in 4 Days"}`,
          `<div style="font-family:Arial,sans-serif;max-width:600px;margin:auto;padding:30px">
            <div style="background:#8b0000;color:#fff;padding:15px 20px;border-radius:6px 6px 0 0">
              <h2 style="margin:0">LNMIIT Faculty Recruitment and Onboarding Portal</h2>
            </div>
            <div style="border:1px solid #ddd;border-top:none;padding:25px;border-radius:0 0 6px 6px">
              <p>Dear ${app.name || "Applicant"},</p>
              <p>This is a reminder that the faculty application deadline is 
              <strong>${label}</strong> (${deadline.toLocaleString("en-GB")}).</p>
              <p>Your application is currently <strong>not yet submitted</strong>. 
              Please complete and submit it before the deadline.</p>
              <div style="margin:20px 0">
                <a href="${FRONTEND_URL}/candidate"
                  style="background:#8b0000;color:#fff;padding:10px 24px;border-radius:5px;text-decoration:none;font-weight:bold">
                  Complete Application
                </a>
              </div>
              <p>Regards,<br><strong>DOFA Office, LNMIIT</strong></p>
            </div>
          </div>`
        ).catch(console.error);
      }

      // Remind PENDING referees
      const pendingRefs = await CandidateReferee.findAll({
        where: { status: "PENDING" },
      });
      for (const ref of pendingRefs) {
        if (!ref.email) continue;
        const portalLink = `${FRONTEND_URL}/referee/${ref.id}`;
        await sendEmail(
          ref.email,
          `Reminder — Reference Letter Deadline ${daysLeft === 1 ? "Tomorrow" : "in 4 Days"}`,
          `<div style="font-family:Arial,sans-serif;max-width:600px;margin:auto;padding:30px">
          <div style="background:#8b0000;color:#fff;padding:15px 20px;border-radius:6px 6px 0 0">
            <h2 style="margin:0">LNMIIT Faculty Recruitment and Onboarding Portal</h2>
          </div>
          <div style="border:1px solid #ddd;border-top:none;padding:25px;border-radius:0 0 6px 6px">
            <p>Dear ${app.name || "Applicant"},</p>
            <p>This is a reminder that the faculty application deadline is 
            <strong>${label}</strong> — closing on <strong>${deadline.toLocaleString("en-GB")}</strong>.</p>
            ${app.status === "SUBMITTED"
              ? `<p style="color:green;font-weight:bold">You have already submitted your application. No action needed — you may ignore this email.</p>`
              : `<p>Your application is currently <strong>not yet submitted</strong> (${app.status === "QUERY" ? "corrections required" : "draft in progress"}). 
                Please complete and submit it before the deadline — <strong>${daysLeft} day${daysLeft>1?"s":""} remaining</strong>.</p>
                <div style="margin:20px 0">
                  <a href="${FRONTEND_URL}/candidate"
                    style="background:#8b0000;color:#fff;padding:10px 24px;border-radius:5px;text-decoration:none;font-weight:bold">
                    Complete Application
                  </a>
                </div>`
            }
            <p>Regards,<br><strong>DOFA Office, LNMIIT</strong></p>
          </div>
        </div>`
        ).catch(console.error);
      }

      console.log(`Sent ${daysLeft}-day reminders for cycle ${dl.cycle}`);
    }
  } catch (err) {
    console.error("Reminder cron error:", err.message);
  }
});
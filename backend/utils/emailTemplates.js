/**
 * emailTemplates.js
 *
 * Each function returns { subject, html } — the base defaults that your
 * system pre-fills into the edit/preview dialog.
 *
 * All placeholders use {{VARIABLE}} format so your frontend dialog can
 * find & replace them before sending, or display them as editable fields.
 *
 * Usage example (in a controller):
 *   const { candidateUploadTemplate } = require("../utils/emailTemplates");
 *   const { subject, html } = candidateUploadTemplate({ hodName: hod.name, department: hod.department });
 *   await sendEmail(dofa.email, subject, html);
 *
 *  — OR if going through the dialog system —
 *   return res.json(candidateUploadTemplate({ hodName, department }));
 *   // Frontend opens dialog pre-filled, user edits, clicks Send
 */

/* ─── Shared wrapper ──────────────────────────────────────────────────────── */
const wrap = (body) => `
<div style="font-family:Arial,sans-serif;max-width:640px;margin:auto;border:1px solid #e0e0e0;border-radius:8px;overflow:hidden;">
  <div style="background:#8b0000;padding:18px 24px;text-align:center;">
    <h2 style="margin:0;color:#fff;font-size:20px;letter-spacing:0.5px;">LNMIIT Recruitment Portal</h2>
  </div>
  <div style="padding:28px 24px;color:#333;line-height:1.7;">
    ${body}
  </div>
  <div style="background:#f5f5f5;padding:14px 24px;text-align:center;font-size:12px;color:#888;">
    This is an automated message from LNMIIT Recruitment Portal. Do not reply to this email.
  </div>
</div>`;

const date = () =>
  new Date().toLocaleDateString("en-GB", {
    day: "numeric", month: "long", year: "numeric",
  });

/* ═══════════════════════════════════════════════════════════════════════════
   1. HOD → DOFA  :  Candidate list uploaded
═══════════════════════════════════════════════════════════════════════════ */
exports.candidateUploadTemplate = ({ hodName = "{{HOD_NAME}}", department = "{{DEPARTMENT}}" } = {}) => ({
  subject: `Candidate List Uploaded — ${department}`,
  html: wrap(`
    <p>Date: ${date()}</p>
    <p>Dear DOFA Team,</p>
    <p>
      HOD <strong>${hodName}</strong> from the <strong>${department}</strong> department
      has uploaded the ILSC candidate list on the portal.
    </p>
    <p>Please log in to the portal to review and take necessary action.</p>
    <br>
    <p>Regards,<br><strong>LNMIIT Recruitment System</strong></p>
  `),
});

/* ═══════════════════════════════════════════════════════════════════════════
   2. HOD → DOFA  :  Expert list uploaded
═══════════════════════════════════════════════════════════════════════════ */
exports.expertUploadTemplate = ({ hodName = "{{HOD_NAME}}", department = "{{DEPARTMENT}}" } = {}) => ({
  subject: `Expert List Uploaded — ${department}`,
  html: wrap(`
    <p>Date: ${date()}</p>
    <p>Dear DOFA Team,</p>
    <p>
      HOD <strong>${hodName}</strong> from <strong>${department}</strong>
      has uploaded the expert panel list for the current recruitment cycle.
    </p>
    <p>Please log in to review the expert list.</p>
    <br>
    <p>Regards,<br><strong>LNMIIT Recruitment System</strong></p>
  `),
});

/* ═══════════════════════════════════════════════════════════════════════════
   3. DOFA → HOD  :  Query / Comment raised
═══════════════════════════════════════════════════════════════════════════ */
exports.dofaQueryTemplate = ({ hodName = "{{HOD_NAME}}", comment = "{{COMMENT}}" } = {}) => ({
  subject: `Query Raised by DOFA — Action Required`,
  html: wrap(`
    <p>Date: ${date()}</p>
    <p>Dear <strong>${hodName}</strong>,</p>
    <p>The DOFA office has raised a query regarding your submitted data:</p>
    <blockquote style="border-left:4px solid #8b0000;margin:12px 0;padding:10px 16px;background:#fdf4f4;color:#555;">
      ${comment}
    </blockquote>
    <p>Please log in to the portal, review the comment, and resubmit your data.</p>
    <br>
    <p>Regards,<br><strong>DOFA Office, LNMIIT</strong></p>
  `),
});

/* ═══════════════════════════════════════════════════════════════════════════
   4. Candidate  :  Document upload reminder / correction required
═══════════════════════════════════════════════════════════════════════════ */
exports.documentReminderTemplate = ({
  candidateName = "{{CANDIDATE_NAME}}",
  issues = [],           // array of strings like ["• Degree Certificate — Missing"]
  portalUrl = process.env.FRONTEND_URL || "{{PORTAL_URL}}",
} = {}) => {
  const issueBlock = issues.length
    ? `<p>The following document(s) require your attention:</p>
       <ul style="color:#8b0000;padding-left:20px;">
         ${issues.map(i => `<li>${i}</li>`).join("")}
       </ul>`
    : `<p>Please ensure all required documents are uploaded correctly on the portal.</p>`;

  return {
    subject: `Action Required — Document Submission / Correction`,
    html: wrap(`
      <p>Date: ${date()}</p>
      <p>Dear <strong>${candidateName}</strong>,</p>
      ${issueBlock}
      <p>
        Please log in to the portal and take action at the earliest:
        <a href="${portalUrl}" style="color:#8b0000;">${portalUrl}</a>
      </p>
      <br>
      <p>Regards,<br><strong>DOFA Office, LNMIIT</strong></p>
    `),
  };
};

/* ═══════════════════════════════════════════════════════════════════════════
   5. Candidate  :  General recruitment update
═══════════════════════════════════════════════════════════════════════════ */
exports.recruitmentUpdateTemplate = ({
  candidateName = "{{CANDIDATE_NAME}}",
  portalUrl = process.env.FRONTEND_URL || "{{PORTAL_URL}}",
} = {}) => ({
  subject: `Recruitment Update — LNMIIT`,
  html: wrap(`
    <p>Date: ${date()}</p>
    <p>Dear <strong>${candidateName}</strong>,</p>
    <p>
      We have an update regarding your application. Please log in to the
      recruitment portal to view details and upload any required documents.
    </p>
    <p>
      <a href="${portalUrl}" style="display:inline-block;padding:10px 20px;background:#8b0000;color:#fff;border-radius:5px;text-decoration:none;">
        Visit Portal
      </a>
    </p>
    <br>
    <p>Regards,<br><strong>DOFA Office, LNMIIT</strong></p>
  `),
});

/* ═══════════════════════════════════════════════════════════════════════════
   6. Expert  :  Interview invitation
═══════════════════════════════════════════════════════════════════════════ */
exports.expertInvitationTemplate = ({
  expertName = "{{EXPERT_NAME}}",
  department = "{{DEPARTMENT}}",
  interviewDate = "{{INTERVIEW_DATE}}",
  portalUrl = process.env.FRONTEND_URL || "{{PORTAL_URL}}",
} = {}) => ({
  subject: `Interview Panel Invitation — LNMIIT`,
  html: wrap(`
    <p>Date: ${date()}</p>
    <p>Dear <strong>${expertName}</strong>,</p>
    <p>
      You are cordially invited to serve on the Selection Committee for the
      recruitment of faculty in the <strong>${department}</strong> department at LNMIIT.
    </p>
    ${interviewDate !== "{{INTERVIEW_DATE}}"
      ? `<p><strong>Interview Date:</strong> ${interviewDate}</p>`
      : ""}
    <p>
      Please confirm your participation and travel preferences on the portal:
      <a href="${portalUrl}" style="color:#8b0000;">${portalUrl}</a>
    </p>
    <br>
    <p>Regards,<br><strong>DOFA Office, LNMIIT</strong></p>
  `),
});

/* ═══════════════════════════════════════════════════════════════════════════
   7. Referee  :  Reference letter request
═══════════════════════════════════════════════════════════════════════════ */
exports.refereeRequestTemplate = ({
  refereeName = "{{REFEREE_NAME}}",
  candidateName = "{{CANDIDATE_NAME}}",
  portalLink = "{{PORTAL_LINK}}",
} = {}) => ({
  subject: `Reference Letter Request — ${candidateName}`,
  html: wrap(`
    <p>Date: ${date()}</p>
    <p>Dear <strong>${refereeName}</strong>,</p>
    <p>
      <strong>${candidateName}</strong> has applied for a faculty position at LNMIIT and
      has listed you as a referee. We kindly request you to submit a reference letter
      through the link below.
    </p>
    <p>
      <a href="${portalLink}" style="display:inline-block;padding:10px 20px;background:#8b0000;color:#fff;border-radius:5px;text-decoration:none;">
        Submit Reference Letter
      </a>
    </p>
    <p style="font-size:12px;color:#888;">Link: ${portalLink}</p>
    <br>
    <p>Regards,<br><strong>DOFA Office, LNMIIT</strong></p>
  `),
});

/* ═══════════════════════════════════════════════════════════════════════════
   8. Referee  :  Reminder
═══════════════════════════════════════════════════════════════════════════ */
exports.refereeReminderTemplate = ({
  refereeName = "{{REFEREE_NAME}}",
  candidateName = "{{CANDIDATE_NAME}}",
  portalLink = "{{PORTAL_LINK}}",
} = {}) => ({
  subject: `Reminder — Reference Letter Pending for ${candidateName}`,
  html: wrap(`
    <p>Date: ${date()}</p>
    <p>Dear <strong>${refereeName}</strong>,</p>
    <p>
      This is a gentle reminder that the reference letter for
      <strong>${candidateName}</strong> is still pending.
    </p>
    <p>
      <a href="${portalLink}" style="display:inline-block;padding:10px 20px;background:#8b0000;color:#fff;border-radius:5px;text-decoration:none;">
        Submit Reference Letter
      </a>
    </p>
    <br>
    <p>Regards,<br><strong>DOFA Office, LNMIIT</strong></p>
  `),
});

/* ═══════════════════════════════════════════════════════════════════════════
   9. Candidate  :  Offer letter uploaded
═══════════════════════════════════════════════════════════════════════════ */
exports.offerLetterTemplate = ({
  candidateName = "{{CANDIDATE_NAME}}",
  portalUrl = process.env.FRONTEND_URL || "{{PORTAL_URL}}",
} = {}) => ({
  subject: `Offer Letter — LNMIIT`,
  html: wrap(`
    <p>Date: ${date()}</p>
    <p>Dear <strong>${candidateName}</strong>,</p>
    <p>
      We are pleased to inform you that your offer letter has been uploaded
      on the recruitment portal. Please log in to view and download it.
    </p>
    <p>
      <a href="${portalUrl}" style="display:inline-block;padding:10px 20px;background:#8b0000;color:#fff;border-radius:5px;text-decoration:none;">
        View Offer Letter
      </a>
    </p>
    <br>
    <p>Regards,<br><strong>Establishment Section, LNMIIT</strong></p>
  `),
});

/* ═══════════════════════════════════════════════════════════════════════════
   10. Candidate  :  Joining letter + date
═══════════════════════════════════════════════════════════════════════════ */
exports.joiningLetterTemplate = ({
  candidateName = "{{CANDIDATE_NAME}}",
  joiningDate = "{{JOINING_DATE}}",
  portalUrl = process.env.FRONTEND_URL || "{{PORTAL_URL}}",
} = {}) => ({
  subject: `Joining Letter — LNMIIT`,
  html: wrap(`
    <p>Date: ${date()}</p>
    <p>Dear <strong>${candidateName}</strong>,</p>
    <p>
      Your joining letter has been issued. Your joining date is
      <strong>${joiningDate}</strong>.
    </p>
    <p>
      Please log in to the portal to download your joining letter and complete
      any pending formalities.
    </p>
    <p>
      <a href="${portalUrl}" style="display:inline-block;padding:10px 20px;background:#8b0000;color:#fff;border-radius:5px;text-decoration:none;">
        View Joining Letter
      </a>
    </p>
    <br>
    <p>Regards,<br><strong>Establishment Section, LNMIIT</strong></p>
  `),
});

/* ═══════════════════════════════════════════════════════════════════════════
   11. Candidate  :  Room allotment
═══════════════════════════════════════════════════════════════════════════ */
exports.roomAllotmentTemplate = ({
  candidateName = "{{CANDIDATE_NAME}}",
  roomNumber = "{{ROOM_NUMBER}}",
  roomBuilding = "{{ROOM_BUILDING}}",
} = {}) => ({
  subject: `Accommodation Allotted — LNMIIT`,
  html: wrap(`
    <p>Date: ${date()}</p>
    <p>Dear <strong>${candidateName}</strong>,</p>
    <p>
      Your accommodation has been arranged. Details are as follows:
    </p>
    <table style="border-collapse:collapse;margin:12px 0;">
      <tr>
        <td style="padding:6px 16px 6px 0;font-weight:bold;color:#555;">Building</td>
        <td style="padding:6px 0;">${roomBuilding}</td>
      </tr>
      <tr>
        <td style="padding:6px 16px 6px 0;font-weight:bold;color:#555;">Room No.</td>
        <td style="padding:6px 0;">${roomNumber}</td>
      </tr>
    </table>
    <p>Please contact the Estate Office for key handover formalities.</p>
    <br>
    <p>Regards,<br><strong>Estate Office, LNMIIT</strong></p>
  `),
});

/* ═══════════════════════════════════════════════════════════════════════════
   12. DOFA/HOD  :  Office order uploaded (Director)
═══════════════════════════════════════════════════════════════════════════ */
exports.officeOrderTemplate = ({
  cycle = "{{CYCLE}}",
  orderNumber = "{{ORDER_NUMBER}}",
  portalUrl = process.env.FRONTEND_URL || "{{PORTAL_URL}}",
} = {}) => ({
  subject: `Interview Panel Office Order Uploaded — ${cycle}`,
  html: wrap(`
    <p>Date: ${date()}</p>
    <p>Dear Team,</p>
    <p>
      The Interview Panel Office Order <strong>(${orderNumber})</strong> for
      recruitment cycle <strong>${cycle}</strong> has been uploaded.
    </p>
    <p>Please log in to the portal to view the order.</p>
    <p>
      <a href="${portalUrl}" style="display:inline-block;padding:10px 20px;background:#8b0000;color:#fff;border-radius:5px;text-decoration:none;">
        View Office Order
      </a>
    </p>
    <br>
    <p>Regards,<br><strong>Director's Office, LNMIIT</strong></p>
  `),
});

/* ═══════════════════════════════════════════════════════════════════════════
   13. Travel  :  Quote submitted (Ramswaroop / Transport)
═══════════════════════════════════════════════════════════════════════════ */
exports.travelQuoteTemplate = ({
  expertName = "{{EXPERT_NAME}}",
  amount = "{{AMOUNT}}",
  vendor = "{{VENDOR}}",
} = {}) => ({
  subject: `Travel Quote Submitted — ${expertName}`,
  html: wrap(`
    <p>Date: ${date()}</p>
    <p>Dear DOFA Team,</p>
    <p>A travel quote has been submitted for expert <strong>${expertName}</strong>.</p>
    <table style="border-collapse:collapse;margin:12px 0;">
      <tr>
        <td style="padding:6px 16px 6px 0;font-weight:bold;color:#555;">Amount</td>
        <td>₹${amount}</td>
      </tr>
      <tr>
        <td style="padding:6px 16px 6px 0;font-weight:bold;color:#555;">Vendor</td>
        <td>${vendor}</td>
      </tr>
    </table>
    <p>Please log in to approve or reject the quote.</p>
    <br>
    <p>Regards,<br><strong>LNMIIT Recruitment System</strong></p>
  `),
});
const PORTAL_URL = process.env.FRONTEND_URL || "http://localhost:5173";
const FROM_NAME  = process.env.EMAIL_FROM_NAME || "LNMIIT Recruitment Portal";

const wrap = (body) => `
<div style="font-family:Arial,sans-serif;max-width:640px;margin:auto;padding:30px">
  <div style="background:#8b0000;color:#fff;padding:15px 20px;border-radius:6px 6px 0 0">
    <h2 style="margin:0;font-size:18px">LNMIIT Faculty Recruitment Portal</h2>
  </div>
  <div style="border:1px solid #ddd;border-top:none;padding:25px;border-radius:0 0 6px 6px;line-height:1.7;color:#333">
    ${body}
  </div>
  <p style="font-size:11px;color:#aaa;text-align:center;margin-top:12px">
    This is an automated message from the LNMIIT Recruitment Portal. Do not reply directly to this email.
  </p>
</div>`;

const btn = (label, url) =>
  `<table cellpadding="0" cellspacing="0" border="0" style="margin:20px 0">
    <tr>
      <td align="center" bgcolor="#8b0000" style="border-radius:5px">
        <a href="${url}"
          target="_blank"
          style="display:inline-block;background:#8b0000;color:#ffffff;font-family:Arial,sans-serif;font-size:14px;font-weight:bold;text-decoration:none;padding:12px 24px;border-radius:5px;mso-padding-alt:0;border:1px solid #8b0000">
          ${label}
        </a>
      </td>
    </tr>
  </table>`;

/* ══════════════════════════════════════════════
   1. HOD submits candidates + experts to DOFA
══════════════════════════════════════════════ */
exports.hodSubmittedToDofa = ({ department, candidateCount, expertCount }) => ({
  subject: `Request to Schedule Interview — ${department} Department`,
  html: wrap(`
    <p>Dear DOFA Team,</p>
    <p>The <strong>${department}</strong> department HOD has submitted their recruitment data for the current cycle.</p>
    <table style="border-collapse:collapse;width:100%;margin:15px 0">
      <tr><td style="padding:8px;border:1px solid #ddd;color:#666">Candidates submitted</td>
          <td style="padding:8px;border:1px solid #ddd;font-weight:bold">${candidateCount}</td></tr>
      <tr><td style="padding:8px;border:1px solid #ddd;color:#666">Experts submitted</td>
          <td style="padding:8px;border:1px solid #ddd;font-weight:bold">${expertCount}</td></tr>
    </table>
    <p>Please review the submission and schedule the interview at the earliest.</p>
    ${btn("Review on Portal", `${PORTAL_URL}/dofa/dashboard`)}
    <p>Regards,<br><strong>LNMIIT Recruitment Portal</strong></p>
  `),
});

/* ══════════════════════════════════════════════
   2. DOFA raises query to HOD
══════════════════════════════════════════════ */
exports.dofaQueryToHod = ({ hodName, department, comment }) => ({
  subject: `Notification for Request for Change/Comments — ${department}`,
  html: wrap(`
    <p>Dear ${hodName || "HOD"},</p>
    <p>The DOFA team has reviewed your submission for the <strong>${department}</strong> department 
    and has raised a query that requires your attention.</p>
    <div style="background:#fff8e1;border-left:4px solid #f59e0b;padding:12px 16px;margin:15px 0;border-radius:0 6px 6px 0">
      <p style="margin:0;font-style:italic;color:#92400e">"${comment}"</p>
    </div>
    <p>Please log in to the portal, address the comments, and resubmit.</p>
    ${btn("Go to Portal", `${PORTAL_URL}/hod/dashboard`)}
    <p>Regards,<br><strong>DOFA Office, LNMIIT</strong></p>
  `),
});

/* ══════════════════════════════════════════════
   3. HOD resubmits after query
══════════════════════════════════════════════ */
exports.hodResubmittedToDofa = ({ department }) => ({
  subject: `Notification for Changes Requested — ${department} Department`,
  html: wrap(`
    <p>Dear DOFA Team,</p>
    <p>The HOD of <strong>${department}</strong> department has addressed your query 
    and resubmitted their recruitment data for review.</p>
    ${btn("Review Updated Submission", `${PORTAL_URL}/dofa/dashboard`)}
    <p>Regards,<br><strong>LNMIIT Recruitment Portal</strong></p>
  `),
});

/* ══════════════════════════════════════════════
   4. HOD adds expert — email to DOFA + expert
   (built in HOD portal, editable before send)
══════════════════════════════════════════════ */
exports.expertInvitationToDofa = ({ expertName, department, expertEmail }) => ({
  subject: `Expert Added for Interview — ${department}`,
  html: wrap(`
    <p>Dear DOFA Team,</p>
    <p>The <strong>${department}</strong> HOD has added an expert for the upcoming interview panel.</p>
    <table style="border-collapse:collapse;width:100%;margin:15px 0">
      <tr><td style="padding:8px;border:1px solid #ddd;color:#666">Expert Name</td>
          <td style="padding:8px;border:1px solid #ddd;font-weight:bold">${expertName}</td></tr>
      <tr><td style="padding:8px;border:1px solid #ddd;color:#666">Expert Email</td>
          <td style="padding:8px;border:1px solid #ddd">${expertEmail}</td></tr>
      <tr><td style="padding:8px;border:1px solid #ddd;color:#666">Department</td>
          <td style="padding:8px;border:1px solid #ddd">${department}</td></tr>
    </table>
    ${btn("View Experts", `${PORTAL_URL}/dofa/experts`)}
    <p>Regards,<br><strong>LNMIIT Recruitment Portal</strong></p>
  `),
});

exports.expertInvitationToExpert = ({ expertName, department, interviewDate, portalLink, customMessage }) => ({
  subject: `Invitation to Interview Panel — ${department}, LNMIIT`,
  html: wrap(`
    <p>Dear ${expertName},</p>
    ${customMessage
      ? `<p>${customMessage}</p>`
      : `<p>You have been invited to serve as an expert on the interview panel for faculty recruitment 
         in the <strong>${department}</strong> department at LNMIIT.</p>`
    }
    ${interviewDate ? `<p><strong>Interview Date:</strong> ${interviewDate}</p>` : ""}
    <p>Please confirm your availability and travel preferences via the portal link below.</p>
    ${btn("Confirm Participation", portalLink || PORTAL_URL)}
    <p>Regards,<br><strong>DOFA Office, LNMIIT</strong></p>
  `),
});

/* ══════════════════════════════════════════════
   5. Candidate submits application — email to DOFA Office
══════════════════════════════════════════════ */
exports.candidateApplicationSubmitted = ({ candidateName, department, email }) => ({
  subject: `New Application Received — ${candidateName} (${department})`,
  html: wrap(`
    <p>Dear DOFA Office Team,</p>
    <p>A new faculty application has been submitted and is ready for document verification.</p>
    <table style="border-collapse:collapse;width:100%;margin:15px 0">
      <tr><td style="padding:8px;border:1px solid #ddd;color:#666">Candidate Name</td>
          <td style="padding:8px;border:1px solid #ddd;font-weight:bold">${candidateName}</td></tr>
      <tr><td style="padding:8px;border:1px solid #ddd;color:#666">Department Applied</td>
          <td style="padding:8px;border:1px solid #ddd">${department || "Not specified"}</td></tr>
      <tr><td style="padding:8px;border:1px solid #ddd;color:#666">Email</td>
          <td style="padding:8px;border:1px solid #ddd">${email}</td></tr>
    </table>
    ${btn("Review Documents", `${PORTAL_URL}/dofa-office/document-tracking`)}
    <p>Regards,<br><strong>LNMIIT Recruitment Portal</strong></p>
  `),
});

/* ══════════════════════════════════════════════
   6. DOFA Office sends document remark to candidate
══════════════════════════════════════════════ */
exports.documentRemarkToCandidate = ({ candidateName, issues }) => ({
  subject: `Action Required — Document Submission / Correction`,
  html: wrap(`
    <p>Dear <strong>${candidateName}</strong>,</p>
    <p>The DOFA Office has reviewed your application documents and found the following issue(s) 
    that require your immediate attention:</p>
    ${issues.length > 0
      ? `<ul style="margin:15px 0;padding-left:20px">
           ${issues.map(i =>
             `<li style="margin:6px 0"><strong>${i.doc}</strong> — 
              <span style="color:#8b0000">${i.status}</span>
              ${i.remark ? ` &mdash; <em>${i.remark}</em>` : ""}</li>`
           ).join("")}
         </ul>`
      : `<p>Please ensure all required documents are uploaded correctly.</p>`
    }
    <p>Please log in to the portal, make the necessary corrections, and resubmit your application.</p>
    ${btn("Update My Application", `${PORTAL_URL}/candidate`)}
    <p>Regards,<br><strong>DOFA Office, LNMIIT</strong></p>
  `),
});

/* ══════════════════════════════════════════════
   7. Candidate resubmits after remark — email to DOFA Office
══════════════════════════════════════════════ */
exports.candidateResubmitted = ({ candidateName, department }) => ({
  subject: `Remarks Response — ${candidateName} Resubmitted Application`,
  html: wrap(`
    <p>Dear DOFA Office Team,</p>
    <p><strong>${candidateName}</strong> (${department || "—"}) has addressed your document remarks 
    and resubmitted their application for review.</p>
    ${btn("Review Updated Documents", `${PORTAL_URL}/dofa-office/document-tracking`)}
    <p>Regards,<br><strong>LNMIIT Recruitment Portal</strong></p>
  `),
});

/* ══════════════════════════════════════════════
   8a. Referee invitation when candidate adds referee
══════════════════════════════════════════════ */
exports.refereeInvitation = ({ refereeName, candidateName, portalLink }) => ({
  subject: `Reference Letter Request — ${candidateName}, LNMIIT`,
  html: wrap(`
    <p>Dear ${refereeName},</p>
    <p><strong>${candidateName}</strong> has applied for a faculty position at LNMIIT and has 
    listed you as a referee.</p>
    <p>We request you to kindly submit your reference letter through the secure portal link below.</p>
    ${btn("Submit Reference Letter", portalLink)}
    <p>This link is unique to you. Please do not share it.</p>
    <p>Regards,<br><strong>DOFA Office, LNMIIT</strong></p>
  `),
});

/* ══════════════════════════════════════════════
   8b. Referee reminder
══════════════════════════════════════════════ */
exports.refereeReminder = ({ refereeName, candidateName, portalLink }) => ({
  subject: `Reminder — Reference Letter Pending for ${candidateName}`,
  html: wrap(`
    <p>Dear ${refereeName},</p>
    <p>This is a gentle reminder that your reference letter for <strong>${candidateName}</strong>'s 
    faculty application at LNMIIT is still pending.</p>
    <p>We would appreciate if you could submit it at the earliest convenience.</p>
    ${btn("Submit Reference Letter", portalLink)}
    <p>Regards,<br><strong>DOFA Office, LNMIIT</strong></p>
  `),
});

/* ══════════════════════════════════════════════
   9. Referee submits letter — email to DOFA Office
══════════════════════════════════════════════ */
exports.refereeSubmitted = ({ refereeName, candidateName, department }) => ({
  subject: `Reference Letter Submitted — ${candidateName}`,
  html: wrap(`
    <p>Dear DOFA Office Team,</p>
    <p>A reference letter has been submitted for candidate <strong>${candidateName}</strong> 
    (${department || "—"}).</p>
    <table style="border-collapse:collapse;width:100%;margin:15px 0">
      <tr><td style="padding:8px;border:1px solid #ddd;color:#666">Referee</td>
          <td style="padding:8px;border:1px solid #ddd;font-weight:bold">${refereeName}</td></tr>
      <tr><td style="padding:8px;border:1px solid #ddd;color:#666">Candidate</td>
          <td style="padding:8px;border:1px solid #ddd">${candidateName}</td></tr>
    </table>
    ${btn("View Reference Letters", `${PORTAL_URL}/dofa-office/document-tracking`)}
    <p>Regards,<br><strong>LNMIIT Recruitment Portal</strong></p>
  `),
});

/* ══════════════════════════════════════════════
   10. Expert travel email chain
   All emails use same subject pattern for threading
══════════════════════════════════════════════ */
const expertTravelSubject = (expertName, expertId) =>
  `Expert Travel Coordination — ${expertName} [Ref: EXP-${expertId}]`;

exports.travelDetailsToTravel = ({ expertName, expertId, department, travelDetails }) => ({
  subject: expertTravelSubject(expertName, expertId),
  html: wrap(`
    <p>Dear Travel Team,</p>
    <p>Please arrange travel for the following expert invited for the LNMIIT faculty interview panel.</p>
    <table style="border-collapse:collapse;width:100%;margin:15px 0">
      <tr><td style="padding:8px;border:1px solid #ddd;color:#666">Expert Name</td>
          <td style="padding:8px;border:1px solid #ddd;font-weight:bold">${expertName}</td></tr>
      <tr><td style="padding:8px;border:1px solid #ddd;color:#666">Department</td>
          <td style="padding:8px;border:1px solid #ddd">${department}</td></tr>
      <tr><td style="padding:8px;border:1px solid #ddd;color:#666">Mode of Travel</td>
          <td style="padding:8px;border:1px solid #ddd">${travelDetails.mode || "—"}</td></tr>
      <tr><td style="padding:8px;border:1px solid #ddd;color:#666">From</td>
          <td style="padding:8px;border:1px solid #ddd">${travelDetails.from || "—"}</td></tr>
      <tr><td style="padding:8px;border:1px solid #ddd;color:#666">Interview Date</td>
          <td style="padding:8px;border:1px solid #ddd">${travelDetails.interviewDate || "—"}</td></tr>
      <tr><td style="padding:8px;border:1px solid #ddd;color:#666">Presence</td>
          <td style="padding:8px;border:1px solid #ddd">${travelDetails.presenceStatus || "Offline"}</td></tr>
    </table>
    <p>Please provide a quote for the travel arrangement.</p>
    ${btn("Update on Portal", `${PORTAL_URL}/travel`)}
    <p>Regards,<br><strong>DOFA Office, LNMIIT</strong></p>
  `),
});

exports.travelQuoteToDofa = ({ expertName, expertId, quoteAmount, quoteDetails }) => ({
  subject: expertTravelSubject(expertName, expertId),
  html: wrap(`
    <p>Dear DOFA Team,</p>
    <p>Travel team has submitted a quote for expert <strong>${expertName}</strong>.</p>
    <table style="border-collapse:collapse;width:100%;margin:15px 0">
      <tr><td style="padding:8px;border:1px solid #ddd;color:#666">Quote Amount</td>
          <td style="padding:8px;border:1px solid #ddd;font-weight:bold">₹${quoteAmount}</td></tr>
      <tr><td style="padding:8px;border:1px solid #ddd;color:#666">Details</td>
          <td style="padding:8px;border:1px solid #ddd">${quoteDetails || "—"}</td></tr>
    </table>
    <p>Please review and approve/reject the quote.</p>
    ${btn("Approve Quote", `${PORTAL_URL}/dofa/experts`)}
    <p>Regards,<br><strong>LNMIIT Recruitment Portal</strong></p>
  `),
});

exports.quoteApprovedToTravel = ({ expertName, expertId, quoteAmount }) => ({
  subject: expertTravelSubject(expertName, expertId),
  html: wrap(`
    <p>Dear Travel Team,</p>
    <p>DOFA has <strong style="color:green">approved</strong> the travel quote of 
    <strong>₹${quoteAmount}</strong> for expert <strong>${expertName}</strong>.</p>
    <p>Please proceed with booking the tickets and update the details on the portal.</p>
    ${btn("Update Ticket Details", `${PORTAL_URL}/travel`)}
    <p>Regards,<br><strong>DOFA Office, LNMIIT</strong></p>
  `),
});

exports.ticketUpdatedToDofaOffice = ({ expertName, expertId, ticketDetails }) => ({
  subject: expertTravelSubject(expertName, expertId),
  html: wrap(`
    <p>Dear DOFA Office Team,</p>
    <p>Travel team has updated ticket details for expert <strong>${expertName}</strong>.</p>
    <div style="background:#f0f9ff;border:1px solid #bae6fd;padding:12px 16px;border-radius:6px;margin:15px 0">
      <p style="margin:0">${ticketDetails || "Ticket booked. Please check the portal for full details."}</p>
    </div>
    ${btn("View Expert Travel", `${PORTAL_URL}/dofa-office/experts`)}
    <p>Regards,<br><strong>LNMIIT Recruitment Portal</strong></p>
  `),
});

exports.pickupDetailsToTravel = ({ expertName, expertId, pickupDetails }) => ({
  subject: expertTravelSubject(expertName, expertId),
  html: wrap(`
    <p>Dear Travel Team,</p>
    <p>DOFA Office has entered pickup/drop-off details for expert <strong>${expertName}</strong>.</p>
    <table style="border-collapse:collapse;width:100%;margin:15px 0">
      <tr><td style="padding:8px;border:1px solid #ddd;color:#666">Pickup Location</td>
          <td style="padding:8px;border:1px solid #ddd">${pickupDetails.pickupLocation || "—"}</td></tr>
      <tr><td style="padding:8px;border:1px solid #ddd;color:#666">Pickup Time</td>
          <td style="padding:8px;border:1px solid #ddd">${pickupDetails.pickupTime || "—"}</td></tr>
      <tr><td style="padding:8px;border:1px solid #ddd;color:#666">Drop Location</td>
          <td style="padding:8px;border:1px solid #ddd">${pickupDetails.dropLocation || "—"}</td></tr>
    </table>
    <p>Please arrange driver/vehicle and update driver details on the portal.</p>
    ${btn("Update Driver Details", `${PORTAL_URL}/travel`)}
    <p>Regards,<br><strong>DOFA Office, LNMIIT</strong></p>
  `),
});

exports.driverDetailsToDofaOffice = ({ expertName, expertId, driverDetails }) => ({
  subject: expertTravelSubject(expertName, expertId),
  html: wrap(`
    <p>Dear DOFA Office Team,</p>
    <p>Driver/vehicle details have been updated for expert <strong>${expertName}</strong>.</p>
    <table style="border-collapse:collapse;width:100%;margin:15px 0">
      <tr><td style="padding:8px;border:1px solid #ddd;color:#666">Driver Name</td>
          <td style="padding:8px;border:1px solid #ddd;font-weight:bold">${driverDetails.driverName || "—"}</td></tr>
      <tr><td style="padding:8px;border:1px solid #ddd;color:#666">Vehicle No.</td>
          <td style="padding:8px;border:1px solid #ddd">${driverDetails.vehicleNumber || "—"}</td></tr>
      <tr><td style="padding:8px;border:1px solid #ddd;color:#666">Contact</td>
          <td style="padding:8px;border:1px solid #ddd">${driverDetails.driverContact || "—"}</td></tr>
    </table>
    ${btn("View Expert Details", `${PORTAL_URL}/dofa-office/experts`)}
    <p>Regards,<br><strong>LNMIIT Recruitment Portal</strong></p>
  `),
});

/* ══════════════════════════════════════════════
   11. DOFA Office publishes selection — email to Establishment
══════════════════════════════════════════════ */
exports.selectionPublishedToEstablishment = ({ selectedCount, waitlistedCount }) => ({
  subject: `Faculty Selection Published — Action Required`,
  html: wrap(`
    <p>Dear Establishment Team,</p>
    <p>DOFA Office has published the final selection list for the current recruitment cycle.</p>
    <table style="border-collapse:collapse;width:100%;margin:15px 0">
      <tr><td style="padding:8px;border:1px solid #ddd;color:#666">Selected Candidates</td>
          <td style="padding:8px;border:1px solid #ddd;font-weight:bold;color:green">${selectedCount}</td></tr>
      <tr><td style="padding:8px;border:1px solid #ddd;color:#666">Waitlisted Candidates</td>
          <td style="padding:8px;border:1px solid #ddd;font-weight:bold;color:orange">${waitlistedCount}</td></tr>
    </table>
    <p>Please proceed with issuing offer letters to the selected candidates.</p>
    ${btn("Go to Establishment Portal", `${PORTAL_URL}/establishment`)}
    <p>Regards,<br><strong>DOFA Office, LNMIIT</strong></p>
  `),
});

/* ══════════════════════════════════════════════
   12. Establishment sets joining date
══════════════════════════════════════════════ */
exports.joiningDateSetEmail = ({ candidateName, joiningDate, department, recipientName }) => ({
  subject: `Joining Date Confirmed — ${candidateName}`,
  html: wrap(`
    <p>Dear ${recipientName || "Team"},</p>
    <p>The joining date has been confirmed for <strong>${candidateName}</strong> 
    (${department || "—"}) by the Establishment Section.</p>
    <div style="background:#f0fdf4;border:1px solid #86efac;padding:15px;border-radius:6px;margin:15px 0;text-align:center">
      <p style="margin:0;font-size:20px;font-weight:bold;color:#166534">${joiningDate}</p>
      <p style="margin:4px 0 0;color:#166534;font-size:13px">Confirmed Joining Date</p>
    </div>
    ${btn("View on Portal", `${PORTAL_URL}/establishment`)}
    <p>Regards,<br><strong>Establishment Section, LNMIIT</strong></p>
  `),
});

/* ══════════════════════════════════════════════
   13. DOFA Office adds room allotment — email to Estate
══════════════════════════════════════════════ */
exports.roomAllotmentToEstate = ({ candidateName, roomNumber, building }) => ({
  subject: `Room Allotment — ${candidateName}`,
  html: wrap(`
    <p>Dear Estate Section,</p>
    <p>A room has been allotted to the following candidate. Please proceed with handing over the keys.</p>
    <table style="border-collapse:collapse;width:100%;margin:15px 0">
      <tr><td style="padding:8px;border:1px solid #ddd;color:#666">Candidate Name</td>
          <td style="padding:8px;border:1px solid #ddd;font-weight:bold">${candidateName}</td></tr>
      <tr><td style="padding:8px;border:1px solid #ddd;color:#666">Room Number</td>
          <td style="padding:8px;border:1px solid #ddd;font-weight:bold">${roomNumber}</td></tr>
      ${building ? `<tr><td style="padding:8px;border:1px solid #ddd;color:#666">Building</td>
          <td style="padding:8px;border:1px solid #ddd">${building}</td></tr>` : ""}
    </table>
    ${btn("Update Handover Status", `${PORTAL_URL}/estate`)}
    <p>Regards,<br><strong>DOFA Office, LNMIIT</strong></p>
  `),
});

/* ══════════════════════════════════════════════
   14. Establishment uploads joining letter — email to LUCS
══════════════════════════════════════════════ */
exports.joiningLetterToLucs = ({ candidateName, department, joiningDate }) => ({
  subject: `Joining Letter Ready — IT Setup Required for ${candidateName}`,
  html: wrap(`
    <p>Dear LUCS Team,</p>
    <p>The joining letter for <strong>${candidateName}</strong> (${department || "—"}) 
    has been uploaded. Please proceed with IT asset provisioning.</p>
    <table style="border-collapse:collapse;width:100%;margin:15px 0">
      <tr><td style="padding:8px;border:1px solid #ddd;color:#666">Candidate</td>
          <td style="padding:8px;border:1px solid #ddd;font-weight:bold">${candidateName}</td></tr>
      <tr><td style="padding:8px;border:1px solid #ddd;color:#666">Department</td>
          <td style="padding:8px;border:1px solid #ddd">${department || "—"}</td></tr>
      ${joiningDate ? `<tr><td style="padding:8px;border:1px solid #ddd;color:#666">Joining Date</td>
          <td style="padding:8px;border:1px solid #ddd">${joiningDate}</td></tr>` : ""}
    </table>
    <p>Please set up email account, IT assets, and update the portal accordingly.</p>
    ${btn("Go to LUCS Portal", `${PORTAL_URL}/lucs`)}
    <p>Regards,<br><strong>Establishment Section, LNMIIT</strong></p>
  `),
});

/* ══════════════════════════════════════════════
   15. Joining complete — email to HOD + DOFA Office + DOFA
══════════════════════════════════════════════ */
exports.joiningCompleteEmail = ({ candidateName, department, joiningDate, recipientName }) => ({
  subject: `Joining Complete — ${candidateName} Has Joined LNMIIT`,
  html: wrap(`
    <p>Dear ${recipientName || "Team"},</p>
    <p>This is to inform you that <strong>${candidateName}</strong> from the 
    <strong>${department}</strong> department has successfully completed the joining process.</p>
    <table style="border-collapse:collapse;width:100%;margin:15px 0">
      <tr><td style="padding:8px;border:1px solid #ddd;color:#666">Candidate</td>
          <td style="padding:8px;border:1px solid #ddd;font-weight:bold">${candidateName}</td></tr>
      <tr><td style="padding:8px;border:1px solid #ddd;color:#666">Department</td>
          <td style="padding:8px;border:1px solid #ddd">${department}</td></tr>
      ${joiningDate ? `<tr><td style="padding:8px;border:1px solid #ddd;color:#666">Date of Joining</td>
          <td style="padding:8px;border:1px solid #ddd">${joiningDate}</td></tr>` : ""}
    </table>
    <p>All onboarding steps have been completed and the record is now frozen.</p>
    ${btn("View Onboarding Status", `${PORTAL_URL}/dofa-office`)}
    <p>Regards,<br><strong>Establishment Section, LNMIIT</strong></p>
  `),
});
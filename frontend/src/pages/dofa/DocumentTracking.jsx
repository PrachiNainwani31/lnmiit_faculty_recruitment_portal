import { useEffect, useState, useCallback } from "react";
import API from "../../api/api";

const DOCS = [
  { key: "cv",                 label: "CV" },
  { key: "teachingStatement",  label: "Teaching Statement" },
  { key: "researchStatement",  label: "Research Statement" },
  { key: "marks10",            label: "10th Marksheet" },
  { key: "marks12",            label: "12th Marksheet" },
  { key: "graduation",         label: "Graduation Certificate" },
  { key: "postGraduation",     label: "Post Graduation Certificate" },
  { key: "phdCourseWork",      label: "PhD Course Work Certificate" },
  { key: "phdProvisional",     label: "PhD Provisional Certificate" },
  { key: "phdDegree",          label: "PhD Degree Certificate" },
  { key: "thesisSubmission",   label: "Thesis Submission Certificate" },
];

// Multi-file docs shown separately
const MULTI_DOCS = [
  { key: "bestPapers",       label: "Five Best Papers"              },
  { key: "postDocDocs",      label: "Post-Doc Documents"            },
  { key: "salarySlips",      label: "Salary Slips"                  },
  { key: "researchExpCerts", label: "Research Experience Certs"     },
  { key: "teachingExpCerts", label: "Teaching Experience Certs"     },
  { key: "industryExpCerts", label: "Industry Experience Certs"     },
  { key: "otherDocs",        label: "Other Documents"           },
];
// Referee fields shown in the tracking table
const REFEREE_FIELDS = ["name", "designation", "department", "institute", "email"];

const VERDICT_CONFIG = {
  Correct:   { icon: "✔", bg: "bg-green-100",  text: "text-green-700",  border: "border-green-200"  },
  Incorrect: { icon: "✗", bg: "bg-red-100",    text: "text-red-700",    border: "border-red-200"    },
  Missing:   { icon: "⚠", bg: "bg-yellow-100", text: "text-yellow-700", border: "border-yellow-200" },
  Pending:   { icon: "⏳", bg: "bg-blue-50",   text: "text-blue-600",   border: "border-blue-200"   },
};

function getCounts(verdicts = {}) {
  const counts = { correct: 0, incorrect: 0, missing: 0, pending: 0 };
  DOCS.forEach(({ key }) => {
    const status = verdicts?.[key]?.status;
    if      (status === "Correct")   counts.correct++;
    else if (status === "Incorrect") counts.incorrect++;
    else if (status === "Missing")   counts.missing++;
    else                             counts.pending++;
  });
  return counts;
}

function Badge({ count, label, colorClass }) {
  if (count === 0) return null;
  return (
    <span className={`inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full border ${colorClass}`}>
      {count} {label}
    </span>
  );
}

/* ── Reminder Modal ─────────────────────────────────────── */
function ReminderModal({ candidate, onClose, onSend }) {
  const issues = DOCS.filter(d => {
    const s = candidate.verdicts?.[d.key]?.status;
    return s === "Incorrect" || s === "Missing";
  });

  const dateStr = new Date().toLocaleDateString("en-GB", {
    day: "numeric", month: "long", year: "numeric",
  });

  const [emailBody, setEmailBody] = useState(
`Date: ${dateStr}

To,
${candidate.name}

Subject: Action Required — Document Submission / Correction

Dear ${candidate.name?.split(" ")[0]},

We noticed that the following document(s) require your attention:

${issues.map(d => `• ${d.label} — ${candidate.verdicts?.[d.key]?.status}`).join("\n")}

Please rectify the above at the earliest on the LNMIIT Recruitment Portal.

Best regards,
DOFA Office
LNMIIT`
  );

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-2xl shadow-2xl w-[560px] max-h-[90vh] overflow-y-auto">

        <div className="flex items-center gap-3 p-6 border-b">
          <span className="text-2xl">📨</span>
          <h3 className="text-lg font-bold text-gray-800">Send Gentle Reminder</h3>
          <button onClick={onClose} className="ml-auto text-gray-400 hover:text-gray-600 text-xl leading-none">✕</button>
        </div>

        <div className="mx-6 mt-5 bg-gray-50 rounded-xl p-4">
          <p className="font-semibold text-blue-700">{candidate.name}</p>
          <p className="text-sm text-gray-500 mt-0.5">
            {candidate.email}
            {candidate.phone && <> &nbsp;|&nbsp; 📞 {candidate.phone}</>}
          </p>
        </div>

        <div className="px-6 mt-4">
          <p className="text-sm font-medium text-gray-600 mb-2">
            {issues.length} document issue(s) found for this candidate:
          </p>
          {issues.length === 0 ? (
            <p className="text-sm text-green-600">✔ No issues found.</p>
          ) : (
            <div className="space-y-2">
              {issues.map(d => {
                const status = candidate.verdicts?.[d.key]?.status;
                const cfg = VERDICT_CONFIG[status] || VERDICT_CONFIG.Pending;
                return (
                  <div key={d.key}
                    className={`flex items-center gap-2 px-3 py-2 rounded-lg border text-sm ${cfg.bg} ${cfg.border}`}>
                    <span className={`font-bold ${cfg.text}`}>{cfg.icon} {status?.toUpperCase()}</span>
                    <span className="text-gray-700">— {d.label}</span>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div className="px-6 mt-5">
      <p className="text-sm font-semibold text-gray-600 mb-2">Reminder letter (editable):</p>
      <textarea
        rows={12}
        value={emailBody}
        onChange={e => setEmailBody(e.target.value)}
        className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-700 leading-relaxed font-mono focus:outline-none focus:ring-1 focus:ring-indigo-300 resize-none"
      />
    </div>

        <div className="flex justify-end gap-3 p-6">
          <button onClick={onClose}
            className="px-5 py-2 rounded-lg border text-sm font-medium text-gray-600 hover:bg-gray-50">
            Cancel
          </button>
          <button onClick={() => onSend(candidate.id,emailBody)}
            className="px-5 py-2 rounded-lg bg-yellow-500 hover:bg-yellow-600 text-white text-sm font-medium flex items-center gap-2">
            📨 Send Reminder
          </button>
        </div>
      </div>
    </div>
  );
}

/* ── Candidate Row (collapsible) ────────────────────────── */
const BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

function CandidateRow({ candidate, onVerdictChange, onReminderClick }) {
  const [open, setOpen]           = useState(false);
  const [localRemarks, setLocalRemarks] = useState({});
  const [toast, setToast]         = useState(null);
  const [downloading, setDownloading] = useState(false);

  const handleDownloadZip = async (e) => {
    e.stopPropagation(); // don't toggle open
    try {
      setDownloading(true);
      const res = await fetch(`${BASE_URL}/api/dofa/candidate-docs/${candidate.id}/download`, {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
      });
      if (!res.ok) throw new Error("Download failed");
      const blob = await res.blob();
      const url  = window.URL.createObjectURL(blob);
      const a    = document.createElement("a");
      a.href     = url;
      a.download = `${candidate.name || "candidate"}_Documents.zip`;
      a.click();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      alert("Failed to download documents ZIP");
    } finally {
      setDownloading(false);
    }
  };

  const counts = getCounts(candidate.verdicts);

  const showToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(null), 2500);
  };

  const handleVerdictChange = async (docKey, value) => {
    await onVerdictChange(candidate.id, docKey, value, localRemarks[docKey] || "");
    showToast(`Document status updated to "${value}"`);
  };

  const handleRemarkBlur = async (docKey, value) => {
    const currentStatus = candidate.verdicts?.[docKey]?.status || "Pending";
    await onVerdictChange(candidate.id, docKey, currentStatus, value);
  };

  return (
    <div className="border-b last:border-b-0">

      {/* Summary row */}
      <div
        className="flex items-center gap-4 px-6 py-4 cursor-pointer hover:bg-gray-50 transition select-none"
        onClick={() => setOpen(o => !o)}
      >
        <span className="text-sm font-semibold text-gray-500 w-6 shrink-0">{candidate.srNo}.</span>

        <div className="flex-1 min-w-0">
          <p className="font-semibold text-gray-800">{candidate.name}</p>
          {candidate.acceptance === false && (
            <span className="text-xs bg-red-100 text-red-600 border border-red-200 px-2 py-0.5 rounded-full font-medium ml-2">
              Declined Interview
            </span>
          )}
          <p className="text-xs text-gray-400 mt-0.5">
            {candidate.email}
            {candidate.phone && <> · {candidate.phone}</>}
          </p>
        </div>

        <div className="flex flex-wrap gap-1.5">
          <Badge count={counts.correct}   label="Correct"         colorClass="bg-green-100 text-green-700 border-green-200" />
          <Badge count={counts.incorrect} label="Incorrect"       colorClass="bg-red-100 text-red-700 border-red-200" />
          <Badge count={counts.missing}   label="Missing"         colorClass="bg-yellow-100 text-yellow-700 border-yellow-200" />
          <Badge count={counts.pending}   label="Awaiting Review" colorClass="bg-blue-50 text-blue-600 border-blue-200" />
        </div>

        <button
          onClick={handleDownloadZip}
          disabled={downloading}
          title="Download all documents as ZIP"
          className="shrink-0 flex items-center gap-1.5 text-xs border border-indigo-200 text-indigo-700 bg-indigo-50 hover:bg-indigo-100 px-3 py-1.5 rounded-lg font-medium transition disabled:opacity-60"
        >
          {downloading ? "…" : "↓ ZIP"}
        </button>
        <span className="text-gray-400 text-sm ml-2">{open ? "▲" : "›"}</span>
      </div>

      {/* Expanded document table */}
      {open && (
        <div className="px-6 pb-6 bg-gray-50 border-t border-gray-100">

          {toast && (
            <div className="mt-3 mb-1 inline-flex items-center gap-2 bg-orange-50 border border-orange-200 text-orange-700 text-xs px-3 py-1.5 rounded-lg">
              ⚠ {toast}
            </div>
          )}

          <table className="w-full text-sm mt-3 border-collapse">
            <thead>
              <tr className="text-left text-xs font-semibold text-gray-400 uppercase tracking-wide border-b border-gray-200">
                <th className="pb-2 pr-4 w-8">#</th>
                <th className="pb-2 pr-4">Document</th>
                <th className="pb-2 pr-4">Uploaded File</th>
                <th className="pb-2 pr-4 w-48">DOFA Verdict</th>
                <th className="pb-2">Remark</th>
              </tr>
            </thead>

            <tbody>
              {DOCS.map((doc, i) => {
                const file          = candidate.documents?.[doc.key];
                const currentStatus = candidate.verdicts?.[doc.key]?.status || "Pending";
                const cfg           = VERDICT_CONFIG[currentStatus] || VERDICT_CONFIG.Pending;

                return (
                  <tr key={doc.key} className="border-b border-gray-100 last:border-0">
                    <td className="py-3 pr-4 text-gray-400 text-xs align-middle">{i + 1}</td>

                    <td className="py-3 pr-4 font-medium text-gray-700 align-middle">{doc.label}</td>

                    <td className="py-3 pr-4 align-middle">
                      {file ? (
                        <a
                          href={`${import.meta.env.VITE_API_URL || "http://localhost:5000"}/${file}`}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-white border border-gray-200 rounded-lg text-blue-600 text-xs hover:border-blue-400 transition"
                        >
                          📄 {file.split(/[/\\]/).pop()}
                        </a>
                      ) : (
                        <span className="text-xs text-gray-400 italic">Not uploaded</span>
                      )}
                    </td>

                    <td className="py-3 pr-4 align-middle">
                      <div className={`inline-flex items-center gap-1 border rounded-lg px-2 py-1 ${cfg.bg} ${cfg.border}`}>
                        <span className={`text-xs font-bold ${cfg.text}`}>{cfg.icon}</span>
                        <select
                          value={currentStatus}
                          onChange={e => handleVerdictChange(doc.key, e.target.value)}
                          className={`text-xs font-medium bg-transparent border-none outline-none cursor-pointer ${cfg.text}`}
                        >
                          <option value="Pending">Awaiting Review</option>
                          <option value="Correct">Correct</option>
                          <option value="Incorrect">Incorrect</option>
                          <option value="Missing">Missing</option>
                        </select>
                      </div>
                    </td>

                    <td className="py-3 align-middle">
                      <input
                        className="w-full border border-gray-200 rounded-lg px-3 py-1.5 text-xs text-gray-600 placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-indigo-300 bg-white"
                        placeholder="Add remark..."
                        defaultValue={candidate.verdicts?.[doc.key]?.remark || ""}
                        onChange={e => setLocalRemarks(r => ({ ...r, [doc.key]: e.target.value }))}
                        onBlur={e => handleRemarkBlur(doc.key, e.target.value)}
                      />
                    </td>
                  </tr>
                );
              })}
              {candidate.documents?.dateOfDefense && (
                <tr className="border-b border-gray-100">
                  <td className="py-3 pr-4 text-gray-400 text-xs align-middle">
                    {DOCS.length + 1}
                  </td>
                  <td className="py-3 pr-4 font-medium text-gray-700 align-middle">
                    Date of Defense
                  </td>
                  <td className="py-3 pr-4 align-middle">
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-white border border-gray-200 rounded-lg text-gray-700 text-xs">
                      📅 {new Date(candidate.documents.dateOfDefense).toLocaleDateString("en-GB", {
                        day: "numeric", month: "short", year: "numeric"
                      })}
                    </span>
                  </td>
                  <td className="py-3 pr-4 align-middle">
                    <span className="text-xs text-gray-400 italic">— (date field)</span>
                  </td>
                  <td className="py-3 align-middle"></td>
                </tr>
              )}
            </tbody>
          </table>
          {/* ── Multi-file documents ── */}
          {MULTI_DOCS.map(doc => {
            const files = candidate.documents?.[doc.key];
            if (!files?.length) return null;
            return (
              <div key={doc.key} className="mt-3">
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">
                  {doc.label} ({files.length} files)
                </p>
                <div className="flex flex-wrap gap-2">
                  {files.map((f, i) => {
                    // handle both string paths and {file, name} objects
                    const filePath = typeof f === "string" ? f : f?.file;
                    const fileName = typeof f === "object" && f?.name ? f.name : `File ${i + 1}`;
                    if (!filePath) return null;
                    return (
                      <a key={i}
                        href={`${import.meta.env.VITE_API_URL || "http://localhost:5000"}/${filePath}`}
                        target="_blank" rel="noreferrer"
                        className="text-xs text-blue-600 hover:underline border border-blue-200 bg-blue-50 px-2 py-1 rounded">
                        📄 {fileName}
                      </a>
                    );
                  })}
                </div>
              </div>
            );
          })}

          {/* ── Post-PhD Experience ── */}
          {candidate.experiences?.length > 0 && (
            <div className="mt-4">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
                Post-PhD Experience ({candidate.experiences.length})
              </p>
              <div className="space-y-2">
                {candidate.experiences.map((exp, i) => (
                  <div key={i} className="bg-white border border-gray-200 rounded-lg px-4 py-2 text-sm grid grid-cols-3 gap-2">
                    <span><span className="text-gray-400">Type: </span>{exp.type || "—"}</span>
                    <span><span className="text-gray-400">Org: </span>{exp.organization || "—"}</span>
                    <span><span className="text-gray-400">Designation: </span>{exp.designation || "—"}</span>
                    <span><span className="text-gray-400">From: </span>{exp.fromDate ? new Date(exp.fromDate).toLocaleDateString("en-GB") : "—"}</span>
                    <span>
                      <span className="text-gray-400">To: </span>
                      {exp.toDate 
                        ? new Date(exp.toDate).toLocaleDateString("en-GB")
                        : candidate.submittedAt
                          ? new Date(candidate.submittedAt).toLocaleDateString("en-GB")
                          : "—"}
                    </span>
                    <span><span className="text-gray-400">Nature: </span>{exp.natureOfWork || "—"}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ── Referees section ── */}
          {candidate.referees && candidate.referees.length > 0 && (
            <div className="mt-6">
              <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">
                Referee Details ({candidate.referees.length})
              </h4>
              <div className="space-y-2">
                {candidate.referees.map((r, i) => (
                  <div key={i} className={`flex flex-wrap gap-x-6 gap-y-1 border rounded-lg px-4 py-3 text-sm ${
                    r.status === "SUBMITTED"
                      ? "bg-green-50 border-green-200"
                      : "bg-white border-gray-200"
                  }`}>
                    <span className="font-medium text-indigo-600 w-full text-xs">Referee {i + 1}</span>

                    {r.name        && <span><span className="text-gray-400">Name: </span><strong>{r.name}</strong></span>}
                    {r.designation && <span><span className="text-gray-400">Designation: </span>{r.designation}</span>}
                    {r.department  && <span><span className="text-gray-400">Dept: </span>{r.department}</span>}
                    {r.institute   && <span><span className="text-gray-400">Institute: </span>{r.institute}</span>}
                    {r.email       && (
                      <span>
                        <span className="text-gray-400">Email: </span>
                        <a href={`mailto:${r.email}`} className="text-blue-600 hover:underline">{r.email}</a>
                      </span>
                    )}

                    <div className="w-full flex items-center gap-3 mt-1">
                      {/* Status badge */}
                      <span className={`text-xs font-semibold px-2.5 py-1 rounded-full border ${
                        r.status === "SUBMITTED"
                          ? "bg-green-100 text-green-700 border-green-200"
                          : "bg-yellow-100 text-yellow-700 border-yellow-200"
                      }`}>
                        {r.status === "SUBMITTED" ? "✔ Letter Submitted" : "⏳ Pending"}
                      </span>

                      {/* Submitted date */}
                      {r.submittedAt && (
                        <span className="text-xs text-gray-400">
                          on {new Date(r.submittedAt).toLocaleDateString("en-GB", {
                            day: "numeric", month: "short", year: "numeric"
                          })}
                        </span>
                      )}

                      {/* View letter link — only if submitted */}
                      {r.status === "SUBMITTED" && r.letter && (
                        <a
                          href={`${import.meta.env.VITE_API_URL || "http://localhost:5000"}/${r.letter}`}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1 text-xs text-blue-600 hover:underline font-medium"
                        >
                          📄 View Letter
                        </a>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Footer: overall remark + send reminder */}
          <div className="mt-5 flex justify-end">
            <button
              onClick={() => onReminderClick(candidate)}
              className="bg-yellow-500 hover:bg-yellow-600 text-white px-5 py-2.5 rounded-lg text-sm font-medium flex items-center gap-2 transition"
            >
              Send Reminder
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

/* ── Main Page ──────────────────────────────────────────── */
export default function DocumentTracking() {
  const [departments, setDepartments]         = useState([]);
  const [loading, setLoading]                 = useState(true);
  const [reminderCandidate, setReminderCandidate] = useState(null);

  const load = useCallback(async () => {
    try {
      const res = await API.get("/dofa/document-tracking");
      setDepartments(res.data);
    } catch (err) {
      console.error("Failed to load document tracking:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleVerdictChange = async (appId, doc, status, remark) => {
    try {
      await API.post("/dofa/document-verdict", { appId, doc, status, remark });
      await load();
    } catch (err) {
      console.error("Verdict update failed:", err);
    }
  };

  const handleSendReminder = async (candidateId,emailBody) => {
    try {
      await API.post("/dofa/document-reminder", { candidateId,emailBody });
      setReminderCandidate(null);
      alert("Reminder sent successfully.");
    } catch {
      alert("Failed to send reminder.");
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64 text-gray-400">
        <p className="text-lg">Loading document tracking...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">

      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-gray-800">Document Tracking</h2>
        <p className="text-sm text-gray-500 mt-1">
          Review uploaded documents for each candidate. Click a file to preview its contents,
          set a verdict (Correct / Incorrect / Missing), add remarks, and send a reminder for any issues found.
        </p>
      </div>

      {departments.length === 0 && (
        <div className="bg-white rounded-xl shadow p-12 text-center text-gray-400">
          <p className="text-5xl mb-4">📂</p>
          <p className="text-lg font-medium">No documents submitted yet</p>
        </div>
      )}

      {/* Department cards */}
      {departments.map(dept => (
        <div key={dept.department} className="bg-white rounded-xl shadow-md overflow-hidden">

          {/* Dept header */}
          <div className="bg-gradient-to-r from-indigo-600 to-violet-600 px-6 py-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="text-yellow-300 text-xl">📁</span>
              <div>
                <h3 className="text-white font-bold text-lg leading-tight">{dept.department}</h3>
                {dept.hodName && <p className="text-indigo-200 text-xs mt-0.5">— {dept.hodName}</p>}
              </div>
            </div>
            <div className="text-right text-indigo-200 text-sm">
              {dept.position && <span>{dept.position} &nbsp;|&nbsp;</span>}
              <span>{dept.candidates?.length || 0} candidates</span>
            </div>
          </div>

          {/* Candidate rows */}
          {(dept.candidates || []).map((c, ci) => (
            <CandidateRow
              key={c.id}
              candidate={{ ...c, srNo: ci + 1 }}
              onVerdictChange={handleVerdictChange}
              onReminderClick={setReminderCandidate}
            />
          ))}

          {(!dept.candidates || dept.candidates.length === 0) && (
            <p className="px-6 py-4 text-sm text-gray-400 italic">No candidates in this department.</p>
          )}
        </div>
      ))}

      {/* Reminder Modal */}
      {reminderCandidate && (
        <ReminderModal
          candidate={reminderCandidate}
          onClose={() => setReminderCandidate(null)}
          onSend={handleSendReminder}
        />
      )}
    </div>
  );
}
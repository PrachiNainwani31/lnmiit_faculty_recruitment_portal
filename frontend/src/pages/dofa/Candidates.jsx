// pages/dofa/Candidates.jsx
import { useEffect, useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { getCandidatesByDepartment } from "../../api/dofaApi";
import API from "../../api/api";
import { downloadAsCSV } from "../../components/DownloadCSVButton";

const STORAGE_KEY     = "dofa_email_template";
const DEFAULT_SUBJECT = "Interview Invitation — Assistant Professor Position | LNMIIT";
const DEFAULT_BODY    = `Dear $name,

Greetings from the LNM Institute of Information Technology, Jaipur.

Based on your application for the faculty position, we are pleased to inform you that you have been shortlisted for an interview for the Assistant Professor position in physical mode scheduled for April 6-7, 2026.

With Regards,
DOFA
The LNM Institute of Information Technology, Jaipur`;

// ── FIX: DEPARTMENTS must be outside DEFAULT_BODY (was incorrectly inside the template string) ──
const DEPARTMENTS = [
  "Computer Science and Engineering",
  "Electronics and Communication Engineering",
  "Communication and Computer Engineering",
  "Mechanical-Mechatronics Engineering",
  "Physics",
  "Mathematics",
  "Humanities and Social Sciences",
  "Artificial Intelligence and Data Science",
];

function loadTemplate() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) return JSON.parse(saved);
  } catch {}
  return { subject: DEFAULT_SUBJECT, body: DEFAULT_BODY };
}

function applyVariables(text, c) {
  return text
    .replace(/\$name/g,  c?.fullName    || "Candidate")
    .replace(/\$email/g, c?.email       || "")
    .replace(/\$dept/g,  c?.department  || "");
}

/* ── Email Modal ── */
function EmailModal({ candidate, allCandidates, onClose, activeCycle, existingDeadline }) {
  const [template, setTemplate] = useState(loadTemplate);
  const [preview,  setPreview]  = useState(false);
  const [sending,  setSending]  = useState(false);
  const [showExtend,    setShowExtend]    = useState(false);
  const [deadlineInput, setDeadlineInput] = useState(() => {
    if (existingDeadline?.deadlineAt) {
      const d = new Date(existingDeadline.deadlineAt);
      return new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
    }
    return "";
  });
  const [deadlineSaving, setDeadlineSaving] = useState(false);

  const hasDeadline    = !!existingDeadline?.deadlineAt;
  const deadlinePassed = hasDeadline && new Date() > new Date(existingDeadline.deadlineAt);

  const update = (key, val) => {
    const updated = { ...template, [key]: val };
    setTemplate(updated);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  };

  const targets    = candidate ? [candidate] : allCandidates;
  const previewFor = candidate || allCandidates?.[0];

  const handleSend = async () => {
    if (!targets?.length) return;
    if (!window.confirm(`Send email to ${targets.length} candidate(s)?`)) return;
    try {
      setSending(true);

      if (deadlineInput && activeCycle) {
        setDeadlineSaving(true);
        await API.post("/deadline", {
          cycle:      activeCycle,
          deadlineAt: new Date(deadlineInput).toISOString(),
        }).catch(console.error);
        setDeadlineSaving(false);
      }

      for (const c of targets) {
        await API.post("/email/send-interview-invite", {
          candidateId: c.id,
          subject:     applyVariables(template.subject, c),
          body:        applyVariables(template.body, c),
          deadlineAt:  (!hasDeadline || showExtend) ? (deadlineInput || null) : null,
        });
      }
      alert(`Email sent to ${targets.length} candidate(s).`);
      onClose();
    } catch {
      alert("Failed to send email");
    } finally {
      setSending(false);
      setDeadlineSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden shadow-2xl">
        <div className="flex items-center justify-between px-6 py-4 border-b">
          <div>
            <h3 className="font-semibold text-gray-800">Send Interview Invitation</h3>
            <p className="text-xs text-gray-400 mt-0.5">
              To: {candidate ? `${candidate.fullName} <${candidate.email}>` : `All ${allCandidates?.length} candidates`}
            </p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xl">✕</button>
        </div>

        <div className="flex gap-2 px-6 pt-3">
          {["edit", "preview"].map(m => (
            <button key={m} onClick={() => setPreview(m === "preview")}
              className={`text-xs px-4 py-1.5 rounded-lg border transition ${
                (m === "preview") === preview
                  ? "bg-gray-800 text-white border-gray-800"
                  : "text-gray-600 border-gray-200 hover:bg-gray-50"
              }`}>
              {m.charAt(0).toUpperCase() + m.slice(1)}
            </button>
          ))}
          <button
            onClick={() => setTemplate({ subject: DEFAULT_SUBJECT, body: DEFAULT_BODY })}
            className="ml-auto text-xs text-gray-400 hover:underline"
          >
            Reset
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-3 space-y-3">
          <div>
            <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">Subject</label>
            {preview
              ? <p className="mt-1 text-sm bg-gray-50 rounded-lg px-3 py-2">{applyVariables(template.subject, previewFor)}</p>
              : <input value={template.subject} onChange={e => update("subject", e.target.value)}
                  className="mt-1 w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-300" />
            }
          </div>

          <div>
            <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">
              Body {preview && previewFor && <span className="text-blue-500 normal-case ml-1">Preview: {previewFor.fullName}</span>}
            </label>
            {preview
              ? <pre className="mt-1 bg-gray-50 rounded-lg px-4 py-3 text-sm whitespace-pre-wrap max-h-48 overflow-y-auto font-sans">{applyVariables(template.body, previewFor)}</pre>
              : <textarea rows={8} value={template.body} onChange={e => update("body", e.target.value)}
                  className="mt-1 w-full border border-gray-200 rounded-lg px-3 py-2 text-sm font-mono focus:outline-none focus:ring-1 focus:ring-blue-300 resize-none" />
            }
          </div>

          {/* Deadline section */}
          <div className={`rounded-xl border p-4 space-y-3 ${
            deadlinePassed ? "bg-red-50 border-red-200" :
            hasDeadline    ? "bg-amber-50 border-amber-200" :
                             "bg-blue-50 border-blue-100"
          }`}>
            <div className="flex items-center justify-between flex-wrap gap-2">
              <label className="text-xs font-semibold text-gray-700 uppercase tracking-wide">
                📅 Application Deadline
              </label>

              {hasDeadline ? (
                <div className="flex items-center gap-2 flex-wrap">
                  <span className={`text-xs font-bold px-2 py-1 rounded-full ${
                    deadlinePassed ? "bg-red-100 text-red-700" : "bg-green-100 text-green-700"
                  }`}>
                    {deadlinePassed ? "⛔ Expired" : "✓ Active"}:{" "}
                    {new Date(existingDeadline.deadlineAt).toLocaleString("en-GB", {
                      day: "numeric", month: "short", year: "numeric",
                      hour: "2-digit", minute: "2-digit",
                    })}
                  </span>
                  <button
                    type="button"
                    onClick={() => setShowExtend(v => !v)}
                    className="text-xs text-amber-700 border border-amber-300 bg-amber-100 hover:bg-amber-200 px-3 py-1 rounded-lg font-medium transition"
                  >
                    {showExtend ? "▲ Cancel" : "✏ Extend Deadline & Re-email"}
                  </button>
                </div>
              ) : (
                <span className="text-xs text-blue-600">Not set — portal open indefinitely</span>
              )}
            </div>

            {(!hasDeadline || showExtend) && (
              <div className="space-y-2">
                <label className="text-xs text-gray-600">
                  {hasDeadline ? "New deadline (must be after current)" : "Set deadline (optional)"}
                </label>
                <input
                  type="datetime-local"
                  value={deadlineInput}
                  min={hasDeadline ? new Date(existingDeadline.deadlineAt).toISOString().slice(0, 16) : undefined}
                  onChange={e => setDeadlineInput(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300 bg-white"
                />
                {hasDeadline && deadlineInput && (
                  <p className="text-xs text-amber-700">
                    ⚠ A separate deadline-extension email will be sent to all candidates.
                  </p>
                )}
                {!hasDeadline && (
                  <p className="text-xs text-gray-500">
                    If set, the deadline will appear in the email body and portal will auto-close after it passes.
                  </p>
                )}
              </div>
            )}
          </div>
        </div>

        <div className="flex justify-end gap-3 px-6 py-4 border-t">
          <button onClick={onClose} className="px-4 py-2 text-sm border border-gray-200 rounded-lg text-gray-600 hover:bg-gray-50">Cancel</button>
          <button onClick={handleSend} disabled={sending || deadlineSaving}
            className="px-5 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 font-medium">
            {sending || deadlineSaving ? "Sending…" : "Send Email"}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ── Main page ── */
export default function DofaCandidates() {
  const [params]  = useSearchParams();
  const navigate  = useNavigate();                       // FIX: was missing
  const deptParam = params.get("dept");                  // FIX: was called `dept` below

  // FIX: remove duplicate state declarations — each declared exactly once
  const [allDepts,      setAllDepts]      = useState([]);
  const [selectedYear,  setSelectedYear]  = useState("");
  const [selectedCycle, setSelectedCycle] = useState("");
  const [selectedDept,  setSelectedDept]  = useState(deptParam || "");
  const [candidates,    setCandidates]    = useState([]);
  const [modal,         setModal]         = useState(null);
  const [deadline,      setDeadline]      = useState(null);
  const [activeCycle,   setActiveCycle]   = useState(null);

  const loadDeadline = (cycle) => {
    API.get(`/deadline/${cycle}`)
      .then(r => setDeadline(r.data))
      .catch(() => setDeadline(null));
  };

  // Load available years/cycles/depts for dropdowns
  useEffect(() => {
    API.get("/cycle/dofa-dashboard")
      .then(r => {
        const depts = r.data?.departments || [];
        setAllDepts(depts);
        const yrs = [...new Set(depts.map(d => d.academicYear).filter(Boolean))].sort().reverse();
        if (yrs.length) setSelectedYear(yrs[0]);
      })
      .catch(console.error);
  }, []);

  // FIX: derive years/cycles/depts from allDepts — not re-declared as state
  const years = [...new Set(allDepts.map(d => d.academicYear).filter(Boolean))].sort().reverse();
  const cyclesForYear = [...new Set(
    allDepts.filter(d => d.academicYear === selectedYear).map(d => d.cycleNumber).filter(Boolean)
  )].sort();
  const deptsForYearCycle = allDepts
    .filter(d => d.academicYear === selectedYear && String(d.cycleNumber) === String(selectedCycle))
    .map(d => d.department)
    .filter(Boolean);

  useEffect(() => {
    if (cyclesForYear.length && !selectedCycle) setSelectedCycle(String(cyclesForYear[0]));
  }, [selectedYear]);

  // Fetch candidates when dept selected
  useEffect(() => {
    if (!selectedDept) { setCandidates([]); return; }
    getCandidatesByDepartment(selectedDept)
      .then(res => {
        const data = Array.isArray(res.data) ? res.data : [];
        setCandidates(data);
        const cycle = data[0]?.cycle;
        if (cycle) { setActiveCycle(cycle); loadDeadline(cycle); }
      })
      .catch(() => setCandidates([]));
  }, [selectedDept]);

  const deadlinePassed = deadline?.deadlineAt && new Date() > new Date(deadline.deadlineAt);
  const appeared = candidates.filter(c => c.appearedInInterview).length;

  return (
    <div className="space-y-6">
      {/* ── Filter bar ── */}
      <div className="bg-white rounded-xl border border-gray-200 px-5 py-4 shadow-sm">
        <div className="flex items-end gap-4 flex-wrap">
          <div className="flex-1 min-w-[160px]">
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">
              Academic Year
            </label>
            <select
              value={selectedYear}
              onChange={e => setSelectedYear(e.target.value)}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-300 appearance-none cursor-pointer"
            >
              <option value="">All Years</option>
              {years.map(y => <option key={y} value={y}>{y}</option>)}
            </select>
          </div>

          <div className="flex-1 min-w-[140px]">
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">
              Cycle
            </label>
            <select
              value={selectedCycle}
              onChange={e => setSelectedCycle(e.target.value)}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-300 appearance-none cursor-pointer"
            >
              <option value="">All Cycles</option>
              {[1,2,3,4,5,6,7,8].map(n => (
                <option key={n} value={String(n)}>Cycle {n}</option>
              ))}
            </select>
          </div>

          <div className="flex-1 min-w-[200px]">
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">
              Department
            </label>
            <select
              value={selectedDept}
              onChange={e => {
                setSelectedDept(e.target.value);
                navigate(`/dofa/candidates?dept=${e.target.value}`);
              }}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-300 appearance-none cursor-pointer"
            >
              <option value="">All Departments</option>
              {DEPARTMENTS.map(d => <option key={d} value={d}>{d}</option>)}
            </select>
          </div>
        </div>

        {/* Active filter summary */}
        {(selectedDept || selectedYear) && (
          <div className="flex items-center gap-2 mt-3 pt-3 border-t border-gray-100 flex-wrap">
            <span className="text-xs text-gray-400">Showing:</span>
            {selectedYear && (
              <span className="text-xs bg-blue-50 text-blue-700 border border-blue-200 px-2.5 py-1 rounded-full font-medium">
                {selectedYear}
              </span>
            )}
            {selectedCycle && (
              <span className="text-xs bg-purple-50 text-purple-700 border border-purple-200 px-2.5 py-1 rounded-full font-medium">
                Cycle {selectedCycle}
              </span>
            )}
            {selectedDept && (
              <span className="text-xs bg-indigo-50 text-indigo-700 border border-indigo-200 px-2.5 py-1 rounded-full font-medium">
                {selectedDept}
              </span>
            )}
            {candidates.length > 0 && (
              <span className="text-xs text-gray-400 ml-auto">
                {candidates.length} candidates
                {appeared > 0 && <span className="ml-1 text-green-600 font-medium">· {appeared} appeared</span>}
              </span>
            )}
          </div>
        )}
      </div>

      {/* ── Action row: deadline badge + CSV + email ── */}
      <div className="flex gap-2 flex-wrap items-center">
        {deadline?.deadlineAt && (
          <span className={`text-xs px-3 py-1.5 rounded-full border font-medium ${
            deadlinePassed
              ? "bg-red-100 text-red-700 border-red-200"
              : "bg-blue-100 text-blue-700 border-blue-200"
          }`}>
            📅 Deadline: {new Date(deadline.deadlineAt).toLocaleString("en-GB", {
              day: "numeric", month: "short", year: "numeric",
              hour: "2-digit", minute: "2-digit",
            })}
            {deadlinePassed && " ⛔"}
          </span>
        )}

        {candidates.length > 0 && (
          <>
            <button
              onClick={() => downloadAsCSV(
                candidates.map(c => ({
                  srNo:                c.srNo,
                  fullName:            c.fullName,
                  email:               c.email,
                  secondaryEmail:      c.secondaryEmail       || "",
                  phone:               c.phone,
                  qualification:       c.qualification,
                  specialization:      c.specialization,
                  appliedPosition:     c.appliedPosition      || "",
                  recommendedPosition: c.recommendedPosition  || "",
                  dlscRemarks:         c.dlscRemarks          || "",
                  ilscRemarks:         c.ilscRemarks          || "",
                  appearedInInterview: c.appearedInInterview ? "Yes" : "No",
                })),
                `candidates_${selectedDept || "all"}.csv`  // FIX: was `selectedDeptept`
              )}
              className="flex items-center gap-2 text-xs border border-green-300 text-green-700 bg-green-50 hover:bg-green-100 px-4 py-2 rounded-lg font-medium transition"
            >
              ↓ Download CSV
            </button>
            <button
              onClick={() => setModal({ mode: "all" })}
              className="text-xs bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 font-medium transition"
            >
              ✉ Send Email to All
            </button>
          </>
        )}
      </div>

      {/* ── Table ── */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-x-auto shadow-sm">
        <table className="min-w-full text-sm">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-100">
              {[
                "Sr", "Name", "Email", "Secondary Email", "Phone",
                "Qualification", "Specialization",
                "Applied Position", "Recommended Position",
                "DLSC Remarks", "ILSC Remarks",
                "Appeared", "Action",
              ].map(h => (
                <th key={h} className="px-3 py-3 text-left text-xs font-semibold text-gray-500 whitespace-nowrap">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {candidates.map((c, i) => (
              <tr key={c.id} className="border-b border-gray-50 last:border-0 hover:bg-gray-50/50 transition">
                <td className="px-3 py-2.5 text-gray-400 text-xs">{i + 1}</td>
                <td className="px-3 py-2.5 font-medium text-gray-800 whitespace-nowrap">{c.fullName}</td>
                <td className="px-3 py-2.5 text-blue-600 text-xs">{c.email}</td>
                <td className="px-3 py-2.5 text-gray-400 text-xs">{c.secondaryEmail || "—"}</td>
                <td className="px-3 py-2.5 text-gray-600 text-xs whitespace-nowrap">{c.phone}</td>
                <td className="px-3 py-2.5 text-gray-600 text-xs">{c.qualification}</td>
                <td className="px-3 py-2.5 text-gray-600 text-xs">{c.specialization}</td>
                <td className="px-3 py-2.5 text-gray-600 text-xs">{c.appliedPosition || "—"}</td>
                <td className="px-3 py-2.5 text-gray-600 text-xs">{c.recommendedPosition || "—"}</td>
                <td className="px-3 py-2.5 text-xs text-gray-600 max-w-[150px]">
                  <span className="line-clamp-2" title={c.dlscRemarks}>{c.dlscRemarks || "—"}</span>
                </td>
                <td className="px-3 py-2.5 text-xs text-gray-600 max-w-[130px]">
                  <span className="line-clamp-2" title={c.ilscRemarks}>{c.ilscRemarks || "—"}</span>
                </td>
                <td className="px-3 py-2.5 text-center">
                  {c.appearedInInterview
                    ? <span className="text-xs bg-green-100 text-green-700 border border-green-200 px-2 py-0.5 rounded-full font-medium">✓ Appeared</span>
                    : <span className="text-xs text-gray-400">—</span>
                  }
                </td>
                <td className="px-3 py-2.5 text-center">
                  <button
                    onClick={() => setModal({ mode: "single", candidate: c })}
                    className="text-xs bg-blue-600 text-white px-3 py-1.5 rounded-lg hover:bg-blue-700 transition"
                  >
                    Send Email
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {candidates.length === 0 && (
          <div className="py-12 text-center text-gray-400 text-sm">
            {selectedDept ? "No candidates for this department" : "Select a department to view candidates"}
          </div>
        )}
      </div>

      {modal && (
        <EmailModal
          candidate={modal.mode === "single" ? modal.candidate : null}
          allCandidates={modal.mode === "all" ? candidates : null}
          activeCycle={activeCycle}
          existingDeadline={deadline}
          onClose={() => {
            setModal(null);
            if (activeCycle) loadDeadline(activeCycle);
          }}
        />
      )}
    </div>
  );
}
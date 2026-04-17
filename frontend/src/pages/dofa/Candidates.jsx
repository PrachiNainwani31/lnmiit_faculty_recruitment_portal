// pages/dofa/Candidates.jsx
import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { getCandidatesByDepartment } from "../../api/dofaApi";
import API from "../../api/api";
import { downloadAsCSV } from "../../components/DownloadCSVButton";

const STORAGE_KEY    = "dofa_email_template";
const DEFAULT_SUBJECT = "Interview Invitation — Assistant Professor Position | LNMIIT";
const DEFAULT_BODY    = `Dear $name,

Greetings from the LNM Institute of Information Technology, Jaipur.

Based on your application for the faculty position, we are pleased to inform you that you have been shortlisted for an interview for the Assistant Professor position in physical mode scheduled for April 6-7, 2026.

With Regards,
DOFA
The LNM Institute of Information Technology, Jaipur`;

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
function EmailModal({ candidate, allCandidates, onClose,activeCycle,existingDeadline }) {
  const [template, setTemplate] = useState(loadTemplate);
  const [preview,  setPreview]  = useState(false);
  const [sending,  setSending]  = useState(false);
  const [showExtend,      setShowExtend]      = useState(false); 
  const [deadlineInput,   setDeadlineInput]   = useState(() => {
    if (existingDeadline?.deadlineAt) {
      const d = new Date(existingDeadline.deadlineAt);
      return new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
    }
    return "";
  });
  const [deadlineSaving, setDeadlineSaving] = useState(false);
  const [deadlineSet,    setDeadlineSet]    = useState(!!existingDeadline?.deadlineAt);
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

      // Set deadline only if user explicitly entered one
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
          // ✅ Only include deadline on first send OR if extending
          deadlineAt:  (!hasDeadline || showExtend) ? (deadlineInput || null) : null,
        });
      }
      alert(`Email sent to ${targets.length} candidate(s).`);
      onClose();
    } catch { alert("Failed to send email"); }
    finally { setSending(false); setDeadlineSaving(false); }
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
          {["edit","preview"].map(m => (
            <button key={m} onClick={() => setPreview(m === "preview")}
              className={`text-xs px-4 py-1.5 rounded-lg border transition ${
                (m === "preview") === preview
                  ? "bg-gray-800 text-white border-gray-800"
                  : "text-gray-600 border-gray-200 hover:bg-gray-50"
              }`}>
              {m.charAt(0).toUpperCase() + m.slice(1)}
            </button>
          ))}
          <button onClick={() => setTemplate({ subject: DEFAULT_SUBJECT, body: DEFAULT_BODY })}
            className="ml-auto text-xs text-gray-400 hover:underline">Reset</button>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-3 space-y-3">
          {/* Subject */}
          <div>
            <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">Subject</label>
            {preview
              ? <p className="mt-1 text-sm bg-gray-50 rounded-lg px-3 py-2">{applyVariables(template.subject, previewFor)}</p>
              : <input value={template.subject} onChange={e => update("subject", e.target.value)}
                  className="mt-1 w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-300" />
            }
          </div>

          {/* Body */}
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

          {/* ✅ Deadline section */}
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
                  {/* ✅ Show current deadline prominently */}
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

            {/* Input — show always for first time, or when extend clicked */}
            {(!hasDeadline || showExtend) && (
              <div className="space-y-2">
                <label className="text-xs text-gray-600">
                  {hasDeadline ? "New deadline (must be after current)" : "Set deadline (optional)"}
                </label>
                <input
                  type="datetime-local"
                  value={deadlineInput}
                  min={hasDeadline ? new Date(existingDeadline.deadlineAt).toISOString().slice(0,16) : undefined}
                  onChange={e => setDeadlineInput(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300 bg-white"
                />
                {hasDeadline && deadlineInput && (
                  <p className="text-xs text-amber-700">
                    ⚠ A separate deadline-extension email will be sent to all candidates.
                    The main email will also include the new deadline.
                  </p>
                )}
                {!hasDeadline && (
                  <p className="text-xs text-gray-500">
                    If set, the deadline will appear in the email body and portal will auto-close after it passes.
                    Reminders sent 4 days and 1 day before.
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
  const [params]     = useSearchParams();
  const dept         = params.get("dept");
  const [candidates, setCandidates] = useState([]);
  const [modal,      setModal]      = useState(null);
  const [deadline,        setDeadline]        = useState(null);
  const [activeCycle,     setActiveCycle]     = useState(null);
  const loadDeadline = (cycle) => {
    API.get(`/deadline/${cycle}`)
      .then(r => setDeadline(r.data))
      .catch(() => setDeadline(null));
  };
  useEffect(() => {
    if (!dept) { setCandidates([]); return; }
    getCandidatesByDepartment(dept)
      .then(res => {
        setCandidates(res.data);
        // Get cycle from first candidate
        const cycle = res.data[0]?.cycle;
        if (cycle) {
          setActiveCycle(cycle);
          loadDeadline(cycle);
        }
      })
      .catch(console.error);
  }, [dept]);

  
  const deadlinePassed = deadline?.deadlineAt && new Date() > new Date(deadline.deadlineAt);
  const appeared = candidates.filter(c => c.appearedInInterview).length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-start flex-wrap gap-3">
        <div>
          <h2 className="text-xl font-bold text-gray-800">
            Candidates {dept ? `— ${dept}` : ""}
          </h2>
          {candidates.length > 0 && (
            <p className="text-xs text-gray-400 mt-1">
              {candidates.length} total
              {appeared > 0 && <span className="ml-2 text-green-600 font-medium">· {appeared} appeared in interview</span>}
            </p>
          )}
        </div>

        <div className="flex gap-2 flex-wrap items-center">
          {/* ✅ Deadline badge — visible on DOFA page */}
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
          </div>


        {candidates.length > 0 && (
          <div className="flex gap-2 flex-wrap">
            <button
              onClick={() => downloadAsCSV(
                candidates.map(c => ({
                  srNo:                c.srNo,
                  fullName:            c.fullName,
                  email:               c.email,
                  secondaryEmail:      c.secondaryEmail      || "",
                  phone:               c.phone,
                  qualification:       c.qualification,
                  specialization:      c.specialization,
                  appliedPosition:     c.appliedPosition      || "",
                  recommendedPosition: c.recommendedPosition  || "",
                  reviewerObservation: c.reviewerObservation  || "",
                  ilscComments:        c.ilscComments         || "",
                  appearedInInterview: c.appearedInInterview ? "Yes" : "No",
                })),
                `candidates_${dept || "all"}.csv`
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
          </div>
        )}
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-x-auto shadow-sm">
        <table className="min-w-full text-sm">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-100">
              {[
                "Sr", "Name", "Email", "Secondary Email", "Phone",
                "Qualification", "Specialization",
                "Applied Position", "Recommended Position",
                "Reviewer Observation", "ILSC Comments",
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
                  <span className="line-clamp-2" title={c.reviewerObservation}>{c.reviewerObservation || "—"}</span>
                </td>
                <td className="px-3 py-2.5 text-xs text-gray-600 max-w-[130px]">
                  <span className="line-clamp-2" title={c.ilscComments}>{c.ilscComments || "—"}</span>
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
            <p className="text-3xl mb-2">🎓</p>
            {dept ? "No candidates for this department" : "Select a department from the dashboard"}
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
            if (activeCycle) {
              loadDeadline(activeCycle);
            }
          }}
        />
      )}
    </div>
  );
}
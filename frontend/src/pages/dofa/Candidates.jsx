import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { getCandidatesByDepartment } from "../../api/dofaApi";
import API from "../../api/api";
import { downloadAsCSV } from "../../components/DownloadCSVButton";

/* ── Default template stored in localStorage key ── */
const STORAGE_KEY = "dofa_email_template";

const DEFAULT_SUBJECT = "Interview Invitation — Assistant Professor Position | LNMIIT";

const DEFAULT_BODY = `Dear $name,

Greetings from the LNM Institute of Information Technology, Jaipur.

Based on your application for the faculty position, we are pleased to inform you that you have been shortlisted for an interview for the Assistant Professor position in physical mode scheduled for April 6-7, 2026. You are requested to report to the institute at 9:00 AM on April 6 (Monday) for the teaching presentation, for which the details shall be shared by the HoD, CCE Department, in a separate email. This would be followed by the interview with the selection panel, starting from 9:00 AM on April 7 (Tuesday).

You need to present your research work (research presentation), highlighting the main contributions in your PhD work and post-doctoral work, if any. Kindly note that you have only 15-20 minutes for the research presentation.

You are requested to do the following:

1. Fill the form and upload the required documents on the following link: https://forms.gle/Bxbsdw4vdJ5cEjG77. Deadline: March 13, 2026.

2. Kindly arrange to send three letters of reference directly from your referees to asst-dean.faculty@lnmiit.ac.in by March 15, 2026.

3. You would be reimbursed for train fare by the AC-III tier from the place of your residence/work to Jaipur and back by the shortest route.

With Regards,
DOFA
The LNM Institute of Information Technology, Jaipur`;

/* ── Load saved template or use default ── */
function loadTemplate() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) return JSON.parse(saved);
  } catch {}
  return { subject: DEFAULT_SUBJECT, body: DEFAULT_BODY };
}

/* ── Replace $name and other variables ── */
function applyVariables(text, candidate) {
  return text
    .replace(/\$name/g, candidate?.fullName || "Candidate")
    .replace(/\$email/g, candidate?.email || "")
    .replace(/\$dept/g, candidate?.department || "");
}

/* ══════════════════════════════════════════
   EMAIL MODAL
══════════════════════════════════════════ */
function EmailModal({ candidate, allCandidates, onClose }) {
  const [template, setTemplate] = useState(loadTemplate);
  const [preview,  setPreview]  = useState(false);
  const [sending,  setSending]  = useState(false);
  const [mode,     setMode]     = useState(candidate ? "single" : "all");

  /* Save template to localStorage on every change */
  const updateSubject = (val) => {
    const updated = { ...template, subject: val };
    setTemplate(updated);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  };

  const updateBody = (val) => {
    const updated = { ...template, body: val };
    setTemplate(updated);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  };

  const resetToDefault = () => {
    const def = { subject: DEFAULT_SUBJECT, body: DEFAULT_BODY };
    setTemplate(def);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(def));
  };

  const previewFor = candidate || allCandidates?.[0];

  const handleSend = async () => {
    const targets = mode === "single" ? [candidate] : allCandidates;
    if (!targets?.length) return;

    if (!window.confirm(`Send email to ${targets.length} candidate(s)?`)) return;

    try {
      setSending(true);
      for (const c of targets) {
        await API.post(`/email/send-interview-invite`, {
          candidateId: c.id,
          subject:     applyVariables(template.subject, c),
          body:        applyVariables(template.body, c),
        });
      }
      alert(`Email sent to ${targets.length} candidate(s) successfully`);
      onClose();
    } catch {
      alert("Failed to send email. Please try again.");
    } finally {
      setSending(false);
    }
  };

  return (
    <div style={{
      position:"fixed", inset:0,
      background:"rgba(0,0,0,0.5)",
      display:"flex", alignItems:"center", justifyContent:"center",
      zIndex:1000, padding:"16px"
    }}>
      <div style={{
        background:"white", borderRadius:"12px",
        width:"100%", maxWidth:"760px",
        maxHeight:"90vh", display:"flex", flexDirection:"column",
        overflow:"hidden"
      }}>

        {/* Header */}
        <div style={{
          padding:"16px 20px", borderBottom:"0.5px solid #e5e7eb",
          display:"flex", alignItems:"center", justifyContent:"space-between"
        }}>
          <div>
            <h3 style={{fontSize:"15px", fontWeight:500, margin:0}}>
              Send Interview Invitation
            </h3>
            <p style={{fontSize:"12px", color:"#6b7280", margin:"2px 0 0"}}>
              Use <code style={{background:"#f3f4f6",padding:"1px 5px",borderRadius:"4px"}}>$name</code> to auto-insert candidate name
            </p>
          </div>
          <button onClick={onClose} style={{
            background:"none", border:"none", fontSize:"20px",
            cursor:"pointer", color:"#6b7280", lineHeight:1
          }}>✕</button>
        </div>

        {/* Send mode tabs (only for "all") */}
        {allCandidates && (
          <div style={{padding:"10px 20px", borderBottom:"0.5px solid #f3f4f6", display:"flex", gap:"8px"}}>
            <button
              onClick={() => setMode("all")}
              style={{
                fontSize:"12px", padding:"5px 14px", borderRadius:"20px", cursor:"pointer",
                border:"0.5px solid",
                background: mode==="all" ? "#1e40af" : "white",
                color: mode==="all" ? "white" : "#374151",
                borderColor: mode==="all" ? "#1e40af" : "#d1d5db"
              }}>
              Send to All ({allCandidates.length})
            </button>
          </div>
        )}

        {/* Edit / Preview toggle */}
        <div style={{padding:"10px 20px 0", display:"flex", gap:"8px"}}>
          {["edit","preview"].map(m => (
            <button key={m} onClick={() => setPreview(m==="preview")}
              style={{
                fontSize:"12px", padding:"5px 14px", borderRadius:"6px", cursor:"pointer",
                border:"0.5px solid",
                background: (m==="preview") === preview ? "#111827" : "white",
                color: (m==="preview") === preview ? "white" : "#374151",
                borderColor: (m==="preview") === preview ? "#111827" : "#d1d5db"
              }}>
              {m.charAt(0).toUpperCase() + m.slice(1)}
            </button>
          ))}
          <button onClick={resetToDefault} style={{
            marginLeft:"auto", fontSize:"11px", color:"#6b7280",
            background:"none", border:"none", cursor:"pointer", textDecoration:"underline"
          }}>
            Reset to default
          </button>
        </div>

        {/* Body */}
        <div style={{flex:1, overflowY:"auto", padding:"12px 20px"}}>

          {/* To field */}
          <div style={{marginBottom:"10px"}}>
            <label style={{fontSize:"11px",fontWeight:500,color:"#6b7280",textTransform:"uppercase",letterSpacing:"0.05em"}}>To</label>
            <div style={{
              marginTop:"4px", padding:"8px 12px",
              background:"#f9fafb", border:"0.5px solid #e5e7eb",
              borderRadius:"6px", fontSize:"13px", color:"#374151"
            }}>
              {mode === "single" && candidate
                ? `${candidate.fullName} <${candidate.email}>`
                : `All ${allCandidates?.length} candidates in this department`
              }
            </div>
          </div>

          {/* Subject */}
          <div style={{marginBottom:"10px"}}>
            <label style={{fontSize:"11px",fontWeight:500,color:"#6b7280",textTransform:"uppercase",letterSpacing:"0.05em"}}>Subject</label>
            {preview ? (
              <div style={{
                marginTop:"4px", padding:"8px 12px",
                background:"#f9fafb", border:"0.5px solid #e5e7eb",
                borderRadius:"6px", fontSize:"13px"
              }}>
                {applyVariables(template.subject, previewFor)}
              </div>
            ) : (
              <input value={template.subject} onChange={e => updateSubject(e.target.value)}
                style={{
                  marginTop:"4px", width:"100%", padding:"8px 12px",
                  border:"0.5px solid #d1d5db", borderRadius:"6px",
                  fontSize:"13px", outline:"none"
                }} />
            )}
          </div>

          {/* Body */}
          <div>
            <label style={{fontSize:"11px",fontWeight:500,color:"#6b7280",textTransform:"uppercase",letterSpacing:"0.05em"}}>
              Email Body
              {preview && previewFor && (
                <span style={{marginLeft:"8px",color:"#3b82f6",textTransform:"none",fontSize:"11px"}}>
                  Preview for: {previewFor.fullName}
                </span>
              )}
            </label>
            {preview ? (
              <pre style={{
                marginTop:"4px", padding:"12px 14px",
                background:"#f9fafb", border:"0.5px solid #e5e7eb",
                borderRadius:"6px", fontSize:"13px", lineHeight:1.7,
                whiteSpace:"pre-wrap", fontFamily:"inherit",
                maxHeight:"320px", overflowY:"auto"
              }}>
                {applyVariables(template.body, previewFor)}
              </pre>
            ) : (
              <textarea value={template.body} onChange={e => updateBody(e.target.value)}
                rows={16}
                style={{
                  marginTop:"4px", width:"100%", padding:"10px 12px",
                  border:"0.5px solid #d1d5db", borderRadius:"6px",
                  fontSize:"13px", lineHeight:1.7, fontFamily:"monospace",
                  outline:"none", resize:"vertical"
                }} />
            )}
          </div>
        </div>

        {/* Footer */}
        <div style={{
          padding:"14px 20px", borderTop:"0.5px solid #e5e7eb",
          display:"flex", justifyContent:"flex-end", gap:"10px"
        }}>
          <button onClick={onClose} style={{
            padding:"8px 18px", border:"0.5px solid #d1d5db",
            borderRadius:"8px", background:"white", cursor:"pointer", fontSize:"13px"
          }}>
            Cancel
          </button>
          <button onClick={handleSend} disabled={sending} style={{
            padding:"8px 20px", background: sending ? "#93c5fd" : "#1d4ed8",
            color:"white", border:"none", borderRadius:"8px",
            cursor: sending ? "not-allowed" : "pointer", fontSize:"13px", fontWeight:500
          }}>
            {sending ? "Sending..." : `Send Email`}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════
   MAIN PAGE
══════════════════════════════════════════ */
export default function DofaCandidates() {
  const [params]     = useSearchParams();
  const dept         = params.get("dept");
  const [candidates, setCandidates] = useState([]);
  const [modal,      setModal]      = useState(null); // null | { mode:"single"|"all", candidate? }

  useEffect(() => {
    if (!dept) { setCandidates([]); return; }
    getCandidatesByDepartment(dept)
      .then(res => setCandidates(res.data))
      .catch(console.error);
  }, [dept]);

  return (
    <div className="space-y-6">

      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold">
          Candidates {dept ? `– ${dept}` : ""}
        </h2>

        {candidates.length > 0 && (
          <div className="flex gap-3">
            <button
              onClick={() => downloadAsCSV(
                candidates.map(c => ({
                  srNo: c.srNo, fullName: c.fullName, email: c.email,
                  phone: c.phone, qualification: c.qualification,
                  specialization: c.specialization,
                  reviewerObservation: c.reviewerObservation,
                  ilscComments: c.ilscComments,
                })),
                `candidates_${dept || "all"}.csv`
              )}
              className="flex items-center gap-2 text-sm border border-green-300 text-green-700 bg-green-50 hover:bg-green-100 px-4 py-2 rounded-lg font-medium"
            >
              Download CSV
            </button>
            <button
              onClick={() => setModal({ mode:"all" })}
              className="bg-green-600 text-white px-4 py-2 rounded text-sm hover:bg-green-700"
            >
              Send Email to All
            </button>
          </div>
        )}
      </div>

      <div className="bg-white rounded shadow overflow-x-auto">
        <table className="min-w-full border text-sm">
          <thead className="bg-gray-100">
            <tr>
              <th className="border p-2">Sr</th>
              <th className="border p-2">Name</th>
              <th className="border p-2">Email</th>
              <th className="border p-2">Qualification</th>
              <th className="border p-2">Specialization</th>
              <th className="border p-2">Action</th>
            </tr>
          </thead>
          <tbody>
            {candidates.map((c, i) => (
              <tr key={c.id}>
                <td className="border p-2">{i + 1}</td>
                <td className="border p-2">{c.fullName}</td>
                <td className="border p-2">{c.email}</td>
                <td className="border p-2">{c.qualification}</td>
                <td className="border p-2">{c.specialization}</td>
                <td className="border p-2 text-center">
                  <button
                    onClick={() => setModal({ mode:"single", candidate: c })}
                    className="bg-blue-600 text-white px-3 py-1 rounded text-xs hover:bg-blue-700"
                  >
                    Send Email
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {candidates.length === 0 && (
          <p className="p-4 text-center text-gray-500">No candidates uploaded</p>
        )}
      </div>

      {/* Email Modal */}
      {modal && (
        <EmailModal
          candidate={modal.mode === "single" ? modal.candidate : null}
          allCandidates={modal.mode === "all" ? candidates : null}
          onClose={() => setModal(null)}
        />
      )}
    </div>
  );
}
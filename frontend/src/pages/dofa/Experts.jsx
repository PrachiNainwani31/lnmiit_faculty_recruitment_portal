import { useEffect, useState } from "react";
import { getAllExperts } from "../../api/dofaApi";
import API from "../../api/api";
import { downloadAsCSV } from "../../components/DownloadCSVButton";

const STORAGE_KEY = "dofa_expert_email_template";

const DEFAULT_SUBJECT = "Interview Invitation – Faculty Recruitment | LNMIIT";

const DEFAULT_BODY = `Dear $name,

We wish to invite you as an expert for the upcoming faculty recruitment interview process at The LNM Institute of Information Technology, Jaipur.

The interview is scheduled for April 6-7, 2026. Your participation as an expert panel member would be greatly valued.

Kindly reply to this email confirming whether you will be able to attend the interview, and whether you prefer to attend in person or online.

For online participation, a meeting link will be shared separately.
For in-person participation, travel reimbursement will be arranged as per institute norms.

With Regards,
Webmaster LNMIIT
webmaster@lnmiit.ac.in`;

function loadTemplate() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) return JSON.parse(saved);
  } catch {}
  return { subject: DEFAULT_SUBJECT, body: DEFAULT_BODY };
}

function applyVariables(text, expert = {}) {
  return text
    .replace(/\$name/g,        expert?.fullName     || "Expert")
    .replace(/\$email/g,       expert?.email        || "")
    .replace(/\$designation/g, expert?.designation  || "")
    .replace(/\$institute/g,   expert?.institute    || "")
    .replace(/\$department/g,  expert?.department   || "");
}

/* ── Email Modal ── */
function EmailModal({ expert, allExperts, onClose }) {
  const [template, setTemplate] = useState(loadTemplate);
  const [preview,  setPreview]  = useState(false);
  const [sending,  setSending]  = useState(false);

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

  const previewFor = expert || allExperts?.[0];
  const targets    = expert ? [expert] : allExperts;

  const handleSend = async () => {
    if (!targets?.length) return;
    if (!window.confirm(`Send email to ${targets.length} expert(s)?`)) return;

    try {
      setSending(true);
      for (const e of targets) {
        await API.post("/email/send-expert-invite", {
          expertId: e.id,
          subject:  applyVariables(template.subject, e),
          body:     applyVariables(template.body,    e),
        });
      }
      alert(`Email sent to ${targets.length} expert(s) successfully`);
      onClose();
    } catch {
      alert("Failed to send email. Please try again.");
    } finally {
      setSending(false);
    }
  };

  return (
    <div style={{
      position:"fixed", inset:0, background:"rgba(0,0,0,0.5)",
      display:"flex", alignItems:"center", justifyContent:"center",
      zIndex:1000, padding:"16px"
    }}>
      <div style={{
        background:"white", borderRadius:"12px",
        width:"100%", maxWidth:"760px",
        maxHeight:"90vh", display:"flex", flexDirection:"column", overflow:"hidden"
      }}>

        {/* Header */}
        <div style={{
          padding:"16px 20px", borderBottom:"0.5px solid #e5e7eb",
          display:"flex", alignItems:"center", justifyContent:"space-between"
        }}>
          <div>
            <h3 style={{fontSize:"15px", fontWeight:500, margin:0}}>Send Expert Invitation</h3>
            <p style={{fontSize:"12px", color:"#6b7280", margin:"2px 0 0"}}>
              Use{" "}
              {["$name","$designation","$institute","$department"].map(v => (
                <code key={v} style={{background:"#f3f4f6",padding:"1px 5px",borderRadius:"4px",marginRight:"4px"}}>{v}</code>
              ))}
              for personalization
            </p>
          </div>
          <button onClick={onClose} style={{
            background:"none", border:"none", fontSize:"20px",
            cursor:"pointer", color:"#6b7280", lineHeight:1
          }}>✕</button>
        </div>

        {/* Edit/Preview toggle */}
        <div style={{padding:"10px 20px 0", display:"flex", gap:"8px", alignItems:"center"}}>
          {["edit","preview"].map(m => (
            <button key={m} onClick={() => setPreview(m==="preview")}
              style={{
                fontSize:"12px", padding:"5px 14px", borderRadius:"6px", cursor:"pointer",
                border:"0.5px solid",
                background: (m==="preview") === preview ? "#111827" : "white",
                color:      (m==="preview") === preview ? "white"   : "#374151",
                borderColor:(m==="preview") === preview ? "#111827" : "#d1d5db"
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

          {/* To */}
          <div style={{marginBottom:"10px"}}>
            <label style={{fontSize:"11px",fontWeight:500,color:"#6b7280",textTransform:"uppercase",letterSpacing:"0.05em"}}>To</label>
            <div style={{
              marginTop:"4px", padding:"8px 12px",
              background:"#f9fafb", border:"0.5px solid #e5e7eb",
              borderRadius:"6px", fontSize:"13px", color:"#374151"
            }}>
              {expert
                ? `${expert.fullName} <${expert.email}>`
                : `All ${allExperts?.length} experts`}
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
                  fontSize:"13px", outline:"none", boxSizing:"border-box"
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
                rows={14}
                style={{
                  marginTop:"4px", width:"100%", padding:"10px 12px",
                  border:"0.5px solid #d1d5db", borderRadius:"6px",
                  fontSize:"13px", lineHeight:1.7, fontFamily:"monospace",
                  outline:"none", resize:"vertical", boxSizing:"border-box"
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
            padding:"8px 20px",
            background: sending ? "#93c5fd" : "#1d4ed8",
            color:"white", border:"none", borderRadius:"8px",
            cursor: sending ? "not-allowed" : "pointer",
            fontSize:"13px", fontWeight:500
          }}>
            {sending ? "Sending..." : `Send Email`}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ── Main Page ── */
export default function DofaExperts() {
  const [groupedExperts, setGroupedExperts] = useState({});
  const [modal,          setModal]          = useState(null);

  useEffect(() => {
    getAllExperts().then(res => {
      const grouped = {};
      res.data.forEach(e => {
        if (!e.uploadedBy) return;
        const hodId = e.uploadedBy.id;
        if (!grouped[hodId]) {
          grouped[hodId] = {
            hodName:    e.uploadedBy.name,
            department: e.uploadedBy.department,
            experts:    [],
          };
        }
        grouped[hodId].experts.push(e);
      });
      setGroupedExperts(grouped);
    });
  }, []);

  return (
    <div className="space-y-8">
      <h2 className="text-xl font-semibold">Experts Uploaded by HODs</h2>

      {Object.keys(groupedExperts).map(hodId => (
        <div key={hodId} className="bg-white rounded shadow p-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold">
              {groupedExperts[hodId].department} HOD
            </h3>
            <div className="flex gap-3">
              <button
                onClick={() => downloadAsCSV(
                  groupedExperts[hodId].experts.map(e => ({
                    fullName: e.fullName, email: e.email,
                    designation: e.designation, department: e.department,
                    institute: e.institute, specialization: e.specialization,
                  })),
                  `experts_${groupedExperts[hodId].department}.csv`
                )}
                className="flex items-center gap-2 text-sm border border-green-300 text-green-700 bg-green-50 hover:bg-green-100 px-4 py-2 rounded-lg font-medium"
              >
                Download CSV
              </button>
              <button
                onClick={() => setModal({ allExperts: groupedExperts[hodId].experts })}
                className="bg-green-600 text-white px-4 py-2 rounded text-sm hover:bg-green-700"
              >
                Send Email to All
              </button>
            </div>
          </div>

          <table className="min-w-full border text-sm">
            <thead className="bg-gray-100">
              <tr>
                <th className="border p-2">Sr</th>
                <th className="border p-2">Name</th>
                <th className="border p-2">Email</th>
                <th className="border p-2">Designation</th>
                <th className="border p-2">Department</th>
                <th className="border p-2">Action</th>
              </tr>
            </thead>
            <tbody>
              {groupedExperts[hodId].experts.map((e, i) => (
                <tr key={e.id}>
                  <td className="border p-2">{i + 1}</td>
                  <td className="border p-2">{e.fullName}</td>
                  <td className="border p-2">{e.email}</td>
                  <td className="border p-2">{e.designation}</td>
                  <td className="border p-2">{e.department}</td>
                  <td className="border p-2 text-center">
                    <button
                      onClick={() => setModal({ expert: e })}
                      className="bg-blue-600 text-white px-3 py-1 rounded text-xs hover:bg-blue-700"
                    >
                      Send Email
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ))}

      {Object.keys(groupedExperts).length === 0 && (
        <p className="text-center text-gray-500">No experts uploaded</p>
      )}

      {modal && (
        <EmailModal
          expert={modal.expert || null}
          allExperts={modal.allExperts || null}
          onClose={() => setModal(null)}
        />
      )}
    </div>
  );
}
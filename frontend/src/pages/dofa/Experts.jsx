// pages/dofa/Experts.jsx
import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { getAllExperts } from "../../api/dofaApi";
import API from "../../api/api";
import { downloadAsCSV } from "../../components/DownloadCSVButton";

const STORAGE_KEY     = "dofa_expert_email_template";
const DEFAULT_SUBJECT = "Interview Invitation – Faculty Recruitment | LNMIIT";
const DEFAULT_BODY    = `Dear $name,

We wish to invite you as an expert for the upcoming faculty recruitment interview process at The LNM Institute of Information Technology, Jaipur.

The interview is scheduled for April 6-7, 2026. Your participation as an expert panel member would be greatly valued.

Kindly reply to this email confirming whether you will be able to attend the interview, and whether you prefer to attend in person or online.

For online participation, a meeting link will be shared separately.
For in-person participation, travel reimbursement will be arranged as per institute norms.

With Regards,
Webmaster LNMIIT
webmaster@lnmiit.ac.in`;

const DEPT_OPTIONS = [
  { label: "Communication and Computer Engineering",  code: "CCE"       },
  { label: "Computer Science and Engineering",        code: "CSE"       },
  { label: "Electronics and Communication Engineering", code: "ECE"     },
  { label: "Mechanical-Mechatronics Engineering",     code: "MME"       },
  { label: "Physics",                                 code: "PHYSICS"   },
  { label: "Mathematics",                             code: "MATHEMATICS"},
  { label: "Humanities and Social Sciences",          code: "HSS"       },
];

const loadTemplate = () => {
  try {
    const s = localStorage.getItem(STORAGE_KEY);
    if (s) return JSON.parse(s);
  } catch {}
  return { subject: DEFAULT_SUBJECT, body: DEFAULT_BODY };
};

const applyVars = (text, e = {}) =>
  text
    .replace(/\$name/g,        e.fullName    || "Expert")
    .replace(/\$email/g,       e.email       || "")
    .replace(/\$designation/g, e.designation || "")
    .replace(/\$institute/g,   e.institute   || "")
    .replace(/\$department/g,  e.department  || "");

/* ── Email Modal ── */
function EmailModal({ expert, allExperts, onClose }) {
  const [tpl,     setTpl]     = useState(loadTemplate);
  const [preview, setPreview] = useState(false);
  const [sending, setSending] = useState(false);

  const save = (key, val) => {
    const u = { ...tpl, [key]: val };
    setTpl(u);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(u));
  };

  const targets    = expert ? [expert] : allExperts;
  const previewFor = expert || allExperts?.[0];

  const handleSend = async () => {
    if (!targets?.length) return;
    if (!window.confirm(`Send email to ${targets.length} expert(s)?`)) return;
    try {
      setSending(true);
      for (const e of targets) {
        await API.post("/email/send-expert-invite", {
          expertId: e.id,
          subject:  applyVars(tpl.subject, e),
          body:     applyVars(tpl.body,    e),
        });
      }
      alert(`Email sent to ${targets.length} expert(s)`);
      onClose();
    } catch { alert("Failed to send email"); }
    finally  { setSending(false); }
  };

  const inputCls = "w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-300";

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden shadow-2xl">
        <div className="flex items-center justify-between px-6 py-4 border-b">
          <div>
            <h3 className="font-semibold text-gray-800 text-sm">Send Expert Invitation</h3>
            <p className="text-xs text-gray-400 mt-0.5">
              To:{" "}
              {expert
                ? `${expert.fullName} <${expert.email}>`
                : `All ${allExperts?.length} experts`}
            </p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xl leading-none">✕</button>
        </div>

        <div className="flex gap-2 px-6 pt-3 items-center">
          {["edit", "preview"].map(m => (
            <button key={m} onClick={() => setPreview(m === "preview")}
              className={`text-xs px-4 py-1.5 rounded-lg border transition ${
                (m === "preview") === preview
                  ? "bg-gray-800 text-white border-gray-800"
                  : "text-gray-600 border-gray-200 hover:bg-gray-50"
              }`}>
              {m === "edit" ? "Edit" : "Preview"}
            </button>
          ))}
          <button
            onClick={() => { setTpl({ subject: DEFAULT_SUBJECT, body: DEFAULT_BODY }); localStorage.removeItem(STORAGE_KEY); }}
            className="ml-auto text-xs text-gray-400 hover:underline"
          >
            Reset
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-3 space-y-3">
          <div>
            <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">Subject</label>
            {preview
              ? <p className="mt-1 text-sm bg-gray-50 rounded-lg px-3 py-2">{applyVars(tpl.subject, previewFor)}</p>
              : <input className={`mt-1 ${inputCls}`} value={tpl.subject} onChange={e => save("subject", e.target.value)} />}
          </div>
          <div>
            <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">
              Body
              {preview && previewFor && <span className="text-blue-500 normal-case ml-1">Preview: {previewFor.fullName}</span>}
            </label>
            {preview
              ? <pre className="mt-1 bg-gray-50 rounded-lg px-4 py-3 text-sm whitespace-pre-wrap max-h-72 overflow-y-auto font-sans">
                  {applyVars(tpl.body, previewFor)}
                </pre>
              : <textarea rows={12} className={`mt-1 font-mono resize-none ${inputCls}`}
                  value={tpl.body} onChange={e => save("body", e.target.value)} />}
          </div>
        </div>

        <div className="flex justify-end gap-3 px-6 py-4 border-t">
          <button onClick={onClose} className="px-4 py-2 text-sm border border-gray-200 rounded-lg text-gray-600 hover:bg-gray-50">Cancel</button>
          <button onClick={handleSend} disabled={sending}
            className="px-5 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 font-medium">
            {sending ? "Sending…" : "Send Email"}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ── Add Expert Manually — inline collapsible panel ── */
function AddExpertPanel({ onAdded }) {
  const [open,   setOpen]   = useState(false);
  const [form,   setForm]   = useState({
    fullName:"", designation:"", department:"",
    institute:"", email:"", phone:"", specialization:""
  });
  const [saving, setSaving] = useState(false);
 
  const inputCls = "w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-red-300";
  const lbl      = "text-xs font-medium text-gray-500 uppercase tracking-wide block mb-1";
 
  const handleAdd = async () => {
    if (!form.fullName || !form.email) return alert("Full name and email are required");
    try {
      setSaving(true);
      // ✅ department code (e.g. "CSE") is sent — backend maps to HOD by exact match
      await API.post("/selected-candidates/manual-expert", form);
      alert(`Expert ${form.fullName} added under ${form.department}`);
      setForm({ fullName:"", designation:"", department:"", institute:"", email:"", phone:"", specialization:"" });
      setOpen(false);
      onAdded();
    } catch (err) {
      alert(err.response?.data?.message || "Failed to add expert");
    } finally {
      setSaving(false); }
  };
 
  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
      <button onClick={() => setOpen(v => !v)}
        className="w-full flex items-center justify-between px-5 py-4 hover:bg-gray-50 transition text-left">
        <div className="flex items-center gap-3">
          <span className="w-8 h-8 rounded-lg bg-red-100 flex items-center justify-center text-red-700 font-bold text-base">+</span>
          <div>
            <p className="text-sm font-semibold text-gray-800">Add Expert Manually</p>
            <p className="text-xs text-gray-400 mt-0.5">Add an expert not uploaded via CSV</p>
          </div>
        </div>
        <span className="text-gray-400 text-sm">{open ? "▲" : "▼"}</span>
      </button>
 
      {open && (
        <div className="border-t border-gray-100 px-5 py-5 bg-gray-50">
          <div className="grid grid-cols-2 gap-3">
            {/* Full Name — full width */}
            <div className="col-span-2">
              <label className={lbl}>Full Name (with Salutation)</label>
              <input className={inputCls} placeholder="e.g. Prof. Rajesh Kumar"
                value={form.fullName}
                onChange={e => setForm(f => ({ ...f, fullName: e.target.value }))} />
            </div>
            <div>
              <label className={lbl}>Designation</label>
              <input className={inputCls} placeholder="e.g. Professor"
                value={form.designation}
                onChange={e => setForm(f => ({ ...f, designation: e.target.value }))} />
            </div>
            {/* ✅ FIX: Department is now a dropdown with code mapping */}
            <div>
              <label className={lbl}>Department (of the Expert)</label>
              <input className={inputCls} placeholder="e.g. CSE, Physics, IIT Delhi Dept..."
                value={form.department}
                onChange={e => setForm(f => ({ ...f, department: e.target.value }))} />
              <p className="text-xs text-gray-400 mt-0.5">External expert's own department — not necessarily from this institute</p>
            </div>
            <div>
              <label className={lbl}>Institute</label>
              <input className={inputCls} placeholder="e.g. IIT Delhi"
                value={form.institute}
                onChange={e => setForm(f => ({ ...f, institute: e.target.value }))} />
            </div>
            <div>
              <label className={lbl}>Email</label>
              <input className={inputCls} type="email" placeholder="expert@iit.ac.in"
                value={form.email}
                onChange={e => setForm(f => ({ ...f, email: e.target.value }))} />
            </div>
            <div>
              <label className={lbl}>Phone</label>
              <input className={inputCls} placeholder="Contact number"
                value={form.phone}
                onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} />
            </div>
            <div>
              <label className={lbl}>Specialization</label>
              <input className={inputCls} placeholder="e.g. Artificial Intelligence"
                value={form.specialization}
                onChange={e => setForm(f => ({ ...f, specialization: e.target.value }))} />
            </div>
          </div>
          <div className="flex justify-end gap-3 mt-4">
            <button onClick={() => setOpen(false)}
              className="px-4 py-2 text-sm border border-gray-200 rounded-lg text-gray-600 hover:bg-gray-100 transition">
              Cancel
            </button>
            <button onClick={handleAdd} disabled={saving}
              className="px-5 py-2 text-sm bg-red-700 hover:bg-red-800 text-white rounded-lg font-medium disabled:opacity-60 transition">
              {saving ? "Adding…" : "Add Expert"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

/* ── Department card ── */
function DeptCard({ department, experts, onEmail }) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
      <div className="flex items-center justify-between px-5 py-3 bg-gradient-to-r from-gray-700 to-gray-800">
        <div>
          <h3 className="text-white font-semibold text-sm">{department}</h3>
          <p className="text-white/50 text-xs mt-0.5">{experts.length} expert{experts.length !== 1 ? "s" : ""}</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => downloadAsCSV(
              experts.map(e => ({
                fullName:e.fullName, email:e.email, designation:e.designation,
                department:e.department, institute:e.institute, specialization:e.specialization||"",
              })),
              `experts_${department}.csv`
            )}
            className="text-xs border border-white/30 text-white/80 hover:text-white hover:bg-white/10 px-3 py-1.5 rounded-lg transition font-medium"
          >
            ↓ CSV
          </button>
          <button
            onClick={() => onEmail({ allExperts: experts })}
            className="text-xs bg-green-600 hover:bg-green-700 text-white px-3 py-1.5 rounded-lg transition font-medium"
          >
            Email All
          </button>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full text-sm">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-100">
              {["Sr","Name","Email","Designation","Department","Institute","Specialization","Action"].map(h => (
                <th key={h} className="px-3 py-3 text-left text-xs font-semibold text-gray-500 whitespace-nowrap">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {experts.map((e, i) => (
              <tr key={e.id} className="border-b border-gray-50 last:border-0 hover:bg-gray-50/60 transition">
                <td className="px-3 py-2.5 text-gray-400 text-xs">{i + 1}</td>
                <td className="px-3 py-2.5 font-medium text-gray-800 whitespace-nowrap">{e.fullName}</td>
                <td className="px-3 py-2.5 text-blue-600 text-xs">{e.email}</td>
                <td className="px-3 py-2.5 text-gray-600 text-xs">{e.designation}</td>
                <td className="px-3 py-2.5 text-gray-600 text-xs">{e.department}</td>
                <td className="px-3 py-2.5 text-gray-500 text-xs">{e.institute}</td>
                <td className="px-3 py-2.5 text-gray-500 text-xs">{e.specialization || "—"}</td>
                <td className="px-3 py-2.5">
                  <button
                    onClick={() => onEmail({ expert: e })}
                    className="text-xs bg-blue-600 hover:bg-blue-700 text-white px-3 py-1.5 rounded-lg transition"
                  >
                    Send Email
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

/* ── Main Page ── */
export default function DofaExperts() {
  const [searchParams] = useSearchParams();
  const deptFilter     = searchParams.get("dept")?.toUpperCase() || null;

  const [allExperts, setAllExperts] = useState([]);
  const [modal,      setModal]      = useState(null);
  const [loading,    setLoading]    = useState(true);

  const load = () => {
    setLoading(true);
    getAllExperts()
      .then(res => setAllExperts(Array.isArray(res.data) ? res.data : []))
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);
//   useEffect(() => {
//   API.get("/hod/experts/all")
//     .then(res => setAllExperts(Array.isArray(res.data) ? res.data : []))
//     .catch(console.error);
// }, []);

  // Show all experts flat — filter by dept param only if present
  const visible = deptFilter
    ? allExperts.filter(e => e.uploadedBy?.department === deptFilter)
    : allExperts;

  if (loading) return <p className="text-gray-400 text-sm p-6">Loading experts…</p>;

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-xl font-bold text-gray-800">Experts</h2>
          <p className="text-xs text-gray-400 mt-1">{allExperts.length} total across all departments</p>
          <p className="text-sm text-gray-400 mt-0.5">
            {visible.length} expert{visible.length !== 1 ? "s" : ""}
            {deptFilter && (
              <a href="/dofa/experts" className="ml-3 text-blue-500 hover:underline text-xs">
                ← All experts
              </a>
            )}
          </p>
        </div>
        {visible.length > 0 && (
          <div className="flex gap-2">
            <button
              onClick={() => downloadAsCSV(
                visible.map(e => ({
                  fullName: e.fullName, email: e.email,
                  designation: e.designation, department: e.department,
                  institute: e.institute, specialization: e.specialization || "",
                  uploadedByDept: e.uploadedBy?.department || "",
                })),
                `all_experts.csv`
              )}
              className="text-xs border border-gray-300 text-gray-600 hover:bg-gray-50 px-4 py-1.5 rounded-lg transition font-medium"
            >
              ↓ Download All CSV
            </button>
            <button
              onClick={() => setModal({ allExperts: visible })}
              className="text-xs bg-green-600 hover:bg-green-700 text-white px-4 py-1.5 rounded-lg transition font-medium"
            >
              Email All
            </button>
          </div>
        )}
      </div>

      <AddExpertPanel onAdded={load} />

      {/* Single flat table — no grouping by HOD dept */}
      {visible.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100">
                  {["Sr", "Name", "Email", "Designation", "Department", "Institute", "Specialization", "Action","Uploaded by"].map(h => (
                    <th key={h} className="px-3 py-3 text-left text-xs font-semibold text-gray-500 whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {visible.map((e, i) => (
                  <tr key={e.id} className="border-b border-gray-50 last:border-0 hover:bg-gray-50/60 transition">
                    <td className="px-3 py-2.5 text-gray-400 text-xs">{i + 1}</td>
                    <td className="px-3 py-2.5 font-medium text-gray-800 whitespace-nowrap">{e.fullName}</td>
                    <td className="px-3 py-2.5 text-blue-600 text-xs">{e.email}</td>
                    <td className="px-3 py-2.5 text-gray-600 text-xs">{e.designation}</td>
                    <td className="px-3 py-2.5 text-gray-600 text-xs">{e.department}</td>
                    <td className="px-3 py-2.5 text-gray-500 text-xs">{e.institute}</td>
                    <td className="px-3 py-2.5 text-gray-500 text-xs">{e.specialization || "—"}</td>
                    <td className="px-3 py-2.5 text-xs text-gray-600">{e.department || "—"}</td>
                    <td className="px-3 py-2.5 text-xs">
                      <span className="bg-indigo-50 text-indigo-600 border border-indigo-100 px-2 py-0.5 rounded-full text-xs">
                        {e.uploadedBy?.department || "Manual"}
                      </span>
                    </td>
                    <td className="px-3 py-2.5">
                      <button
                        onClick={() => setModal({ expert: e })}
                        className="text-xs bg-blue-600 hover:bg-blue-700 text-white px-3 py-1.5 rounded-lg transition"
                      >
                        Send Email
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {visible.length === 0 && (
        <div className="bg-white rounded-xl border p-14 text-center text-gray-400">
          <p>{deptFilter ? `No experts for ${deptFilter} yet` : "No experts uploaded yet"}</p>
        </div>
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
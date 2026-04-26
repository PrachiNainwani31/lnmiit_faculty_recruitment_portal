// pages/dofa/Experts.jsx
import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { getAllExperts } from "../../api/dofaApi";
import API from "../../api/api";
import { downloadAsCSV } from "../../components/DownloadCSVButton";

const STORAGE_KEY     = "dofa_expert_email_template";
const DEFAULT_SUBJECT = "Interview Invitation - Faculty Recruitment | LNMIIT";
const DEFAULT_BODY    = `Dear $name,

We wish to invite you as an expert for the upcoming faculty recruitment interview process at The LNM Institute of Information Technology, Jaipur.

The interview is scheduled for April 6-7, 2026. Your participation as an expert panel member would be greatly valued.

Kindly reply to this email confirming whether you will be able to attend the interview, and whether you prefer to attend in person or online.

For online participation, a meeting link will be shared separately.
For in-person participation, travel reimbursement will be arranged as per institute norms.

With Regards,
Webmaster LNMIIT
webmaster@lnmiit.ac.in`;

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
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xl leading-none">x</button>
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
            {sending ? "Sending..." : "Send Email"}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ── Add Expert Manually ── */
function AddExpertPanel({ onAdded }) {
  const [open,    setOpen]    = useState(false);
  const [hods,    setHods]    = useState([]);   // list of active HoD cycles
  const [form,    setForm]    = useState({
    fullName:"", designation:"", department:"",
    institute:"", email:"", phone:"", specialization:"",
    hodId: "",   // ← NEW: which HoD's cycle to assign
  });
  const [saving,  setSaving]  = useState(false);
  const [formErrors, setFormErrors] = useState({});

  const validateForm = () => {
    const errs = {};
    if (!form.fullName.trim())    errs.fullName    = "Full name is required";
    if (!form.email.trim())       errs.email       = "Email is required";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim()))
                                  errs.email       = "Enter a valid email address";
    if (!form.hodId)              errs.hodId       = "Please select a target department / cycle";
    if (!form.designation.trim()) errs.designation = "Designation is required";
    if (!form.institute.trim())   errs.institute   = "Institute is required";
    if (!form.department.trim())  errs.department  = "Expert's department is required";
    if (form.phone && !/^\+?[\d\s\-().]{7,15}$/.test(form.phone.trim()))
                                  errs.phone       = "Enter a valid phone number";
    setFormErrors(errs);
    return Object.keys(errs).length === 0;
  };
 
  // Load active HoD cycles when panel opens
  useEffect(() => {
    if (!open) return;
    API.get("/cycle/dofa-dashboard")
      .then(r => setHods(r.data?.departments || []))
      .catch(console.error);
  }, [open]);
 
  const inputCls = "w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-red-300";
  const lbl      = "text-xs font-medium text-gray-500 uppercase tracking-wide block mb-1";
 
   const handleAdd = async () => {
    if (!validateForm()) return;
    try {
      setSaving(true);
      await API.post("/selected-candidates/manual-expert", form);
      alert(`Expert ${form.fullName} added`);
      setForm({
        fullName:"", designation:"", department:"",
        institute:"", email:"", phone:"", specialization:"", hodId:"",
      });
      setFormErrors({});
      setOpen(false);
      onAdded();
    } catch (err) {
      alert(err.response?.data?.message || "Failed to add expert");
    } finally {
      setSaving(false);
    }
  };
 
  // When a HoD is selected, auto-fill department field hint
  const selectedHod = hods.find(h => String(h.hodId) === String(form.hodId));
 
  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
      <button
        onClick={() => setOpen(v => !v)}
        className="w-full flex items-center justify-between px-5 py-4 hover:bg-gray-50 transition text-left"
      >
        <div className="flex items-center gap-3">
          <span className="w-8 h-8 rounded-lg bg-red-100 flex items-center justify-center text-red-700 font-bold text-base">
            +
          </span>
          <div>
            <p className="text-sm font-semibold text-gray-800">Add Expert Manually</p>
            <p className="text-xs text-gray-400 mt-0.5">Add a single expert not uploaded via CSV</p>
          </div>
        </div>
        <span className="text-gray-400 text-sm">{open ? "▲" : "▼"}</span>
      </button>
 
      {open && (
        <div className="border-t border-gray-100 px-5 py-5 bg-gray-50">
          <div className="grid grid-cols-2 gap-3">
 
            {/* ── NEW: Cycle / Department picker ── */}
            <div className="col-span-2">
              <label className={lbl}>Target Department / Cycle <span className="text-red-500">*</span></label>
              <select
                className={formErrors.hodId ? `${inputCls} border-red-300 bg-red-50` : inputCls}
                value={form.hodId}
                onChange={e => { setForm(f => ({ ...f, hodId: e.target.value })); setFormErrors(er => ({ ...er, hodId: null })); }}
              >
                <option value="">-- Select department & cycle --</option>
                {hods.map(d => (
                  <option key={d.hodId} value={d.hodId}>
                    {d.department} — {d.academicYear} · Cycle {d.cycleNumber}
                  </option>
                ))}
              </select>
              {formErrors.hodId && <p className="text-xs text-red-500 mt-0.5">{formErrors.hodId}</p>}
              {selectedHod && !formErrors.hodId && (
                <p className="text-xs text-indigo-600 mt-1">
                  Cycle: <span className="font-mono font-semibold">{selectedHod.academicYear}-C{selectedHod.cycleNumber}</span>
                </p>
              )}
            </div>

            {/* ── Full Name ── */}
            <div className="col-span-2">
              <label className={lbl}>Full Name (with Salutation) <span className="text-red-500">*</span></label>
              <input
                className={formErrors.fullName ? `${inputCls} border-red-300 bg-red-50` : inputCls}
                placeholder="e.g. Prof. Rajesh Kumar"
                value={form.fullName}
                onChange={e => { setForm(f => ({ ...f, fullName: e.target.value })); setFormErrors(er => ({ ...er, fullName: null })); }}
              />
              {formErrors.fullName && <p className="text-xs text-red-500 mt-0.5">{formErrors.fullName}</p>}
            </div>

            {/* ── Designation ── */}
            <div>
              <label className={lbl}>Designation <span className="text-red-500">*</span></label>
              <input
                className={formErrors.designation ? `${inputCls} border-red-300 bg-red-50` : inputCls}
                placeholder="e.g. Professor"
                value={form.designation}
                onChange={e => { setForm(f => ({ ...f, designation: e.target.value })); setFormErrors(er => ({ ...er, designation: null })); }}
              />
              {formErrors.designation && <p className="text-xs text-red-500 mt-0.5">{formErrors.designation}</p>}
            </div>

            {/* ── Expert's Department ── */}
            <div>
              <label className={lbl}>Expert's Own Department <span className="text-red-500">*</span></label>
              <input
                className={formErrors.department ? `${inputCls} border-red-300 bg-red-50` : inputCls}
                placeholder="e.g. CSE, Physics…"
                value={form.department}
                onChange={e => { setForm(f => ({ ...f, department: e.target.value })); setFormErrors(er => ({ ...er, department: null })); }}
              />
              {formErrors.department && <p className="text-xs text-red-500 mt-0.5">{formErrors.department}</p>}
            </div>

            {/* ── Institute ── */}
            <div>
              <label className={lbl}>Institute <span className="text-red-500">*</span></label>
              <input
                className={formErrors.institute ? `${inputCls} border-red-300 bg-red-50` : inputCls}
                placeholder="e.g. IIT Delhi"
                value={form.institute}
                onChange={e => { setForm(f => ({ ...f, institute: e.target.value })); setFormErrors(er => ({ ...er, institute: null })); }}
              />
              {formErrors.institute && <p className="text-xs text-red-500 mt-0.5">{formErrors.institute}</p>}
            </div>

            {/* ── Email ── */}
            <div>
              <label className={lbl}>Email <span className="text-red-500">*</span></label>
              <input
                className={formErrors.email ? `${inputCls} border-red-300 bg-red-50` : inputCls}
                type="email"
                placeholder="expert@iit.ac.in"
                value={form.email}
                onChange={e => { setForm(f => ({ ...f, email: e.target.value })); setFormErrors(er => ({ ...er, email: null })); }}
              />
              {formErrors.email && <p className="text-xs text-red-500 mt-0.5">{formErrors.email}</p>}
            </div>

            {/* ── Phone ── */}
            <div>
              <label className={lbl}>Phone</label>
              <input
                className={formErrors.phone ? `${inputCls} border-red-300 bg-red-50` : inputCls}
                placeholder="Contact number"
                value={form.phone}
                onChange={e => { setForm(f => ({ ...f, phone: e.target.value })); setFormErrors(er => ({ ...er, phone: null })); }}
              />
              {formErrors.phone && <p className="text-xs text-red-500 mt-0.5">{formErrors.phone}</p>}
            </div>

            {/* ── Specialization ── */}
            <div>
              <label className={lbl}>Specialization</label>
              <input
                className={inputCls}
                placeholder="e.g. Artificial Intelligence"
                value={form.specialization}
                onChange={e => setForm(f => ({ ...f, specialization: e.target.value }))}
              />
            </div>
          </div>
 
          <div className="flex justify-end gap-3 mt-4">
            <button
              onClick={() => setOpen(false)}
              className="px-4 py-2 text-sm border border-gray-200 rounded-lg text-gray-600 hover:bg-gray-100 transition"
            >
              Cancel
            </button>
            <button
              onClick={handleAdd}
              disabled={saving}
              className="px-5 py-2 text-sm bg-red-700 hover:bg-red-800 text-white rounded-lg font-medium disabled:opacity-60 transition"
            >
              {saving ? "Adding…" : "Add Expert"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}


/* ── Upload Experts CSV for a HoD's Cycle (DoFA) ── */
function UploadCSVForHodPanel({ onUploaded }) {
  const [open,    setOpen]    = useState(false);
  const [hods,    setHods]    = useState([]);
  const [hodId,   setHodId]   = useState("");
  const [file,    setFile]    = useState(null);
  const [saving,  setSaving]  = useState(false);

  // Load active HoDs from DoFA dashboard on open
  useEffect(() => {
    if (!open) return;
    API.get("/cycle/dofa-dashboard")
      .then(r => setHods(r.data?.departments || []))
      .catch(console.error);
  }, [open]);

  const handleUpload = async () => {
    if (!file)  return alert("Please select a CSV file");
    if (!hodId) return alert("Please select a department / HoD");
    try {
      setSaving(true);
      const fd = new FormData();
      fd.append("file", file);
      fd.append("hodId", hodId);
      const res = await API.post("/hod/upload-experts-for-hod", fd, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      alert(`${res.data.count} experts uploaded for cycle ${res.data.cycle}`);
      setFile(null);
      setHodId("");
      setOpen(false);
      onUploaded();
    } catch (err) {
      alert(err.response?.data?.message || "Upload failed");
    } finally {
      setSaving(false);
    }
  };

  const inputCls = "w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-indigo-300";

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
      <button onClick={() => setOpen(v => !v)}
        className="w-full flex items-center justify-between px-5 py-4 hover:bg-gray-50 transition text-left">
        <div className="flex items-center gap-3">
          <span className="w-8 h-8 rounded-lg bg-indigo-100 flex items-center justify-center text-indigo-700 font-bold text-sm">CSV</span>
          <div>
            <p className="text-sm font-semibold text-gray-800">Upload Experts CSV for Department</p>
            <p className="text-xs text-gray-400 mt-0.5">
              Upload a CSV into a specific department's active cycle — same email allowed if used in a prior closed cycle
            </p>
          </div>
        </div>
        <span className="text-gray-400 text-sm">{open ? "^" : "v"}</span>
      </button>

      {open && (
        <div className="border-t border-gray-100 px-5 py-5 bg-gray-50 space-y-4">
          <div>
            <label className="text-xs font-medium text-gray-500 uppercase tracking-wide block mb-1">
              Target Department / Cycle
            </label>
            <select
              className={inputCls}
              value={hodId}
              onChange={e => setHodId(e.target.value)}
            >
              <option value="">-- Select department --</option>
              {hods.map(d => (
                <option key={d.hodId} value={d.hodId}>
                  {d.department} — {d.academicYear} Cycle {d.cycleNumber}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-xs font-medium text-gray-500 uppercase tracking-wide block mb-1">
              CSV File
            </label>
            <input
              type="file"
              accept=".csv"
              onChange={e => setFile(e.target.files[0])}
              className="w-full text-sm text-gray-600 file:mr-3 file:py-1.5 file:px-4 file:rounded-lg file:border-0 file:bg-indigo-100 file:text-indigo-700 file:text-xs file:font-medium hover:file:bg-indigo-200 cursor-pointer"
            />
            <p className="text-xs text-gray-400 mt-1">
              Columns: Full Name (with Salutation), Designation, Department, Institute, Email, Specialization, Mobile No. (Optional)
            </p>
          </div>

          <div className="flex justify-end gap-3">
            <button onClick={() => setOpen(false)}
              className="px-4 py-2 text-sm border border-gray-200 rounded-lg text-gray-600 hover:bg-gray-100 transition">
              Cancel
            </button>
            <button onClick={handleUpload} disabled={saving}
              className="px-5 py-2 text-sm bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-medium disabled:opacity-60 transition">
              {saving ? "Uploading..." : "Upload CSV"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

/* ── Main Page ── */
export default function DofaExperts() {
  const [searchParams] = useSearchParams();
  const hodFilter  = searchParams.get("hodId") || null;

  const [allExperts, setAllExperts] = useState([]);
  const [loading,    setLoading]    = useState(true);
  const [modal,      setModal]      = useState(null);

  const load = () => {
    setLoading(true);
    const endpoint = hodFilter
      ? API.get(`/hod/experts/by-hod/${hodFilter}`)
      : getAllExperts();

    endpoint
      .then(res => setAllExperts(Array.isArray(res.data) ? res.data : []))
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, [hodFilter]);

  if (loading) return <p className="text-gray-400 text-sm p-6">Loading experts...</p>;

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-xl font-bold text-gray-800">Experts</h2>
          <p className="text-xs text-gray-400 mt-1">
            {allExperts.length} total across all departments
            {hodFilter && (
              <a href="/dofa/experts" className="ml-3 text-blue-500 hover:underline text-xs">
                All experts
              </a>
            )}
          </p>
          <p className="text-xs text-gray-400 mt-0.5">
            Same expert invited by multiple departments appears as separate rows. Same HoD cannot list the same expert twice.
          </p>
        </div>
        {allExperts.length > 0 && (
          <div className="flex gap-2">
            <button
              onClick={() => downloadAsCSV(
                allExperts.map(e => ({
                  fullName:        e.fullName,
                  email:           e.email,
                  designation:     e.designation,
                  department:      e.department,
                  institute:       e.institute,
                  specialization:  e.specialization || "",
                  cycle:           e.cycle || "",
                  uploadedByDept:  e.uploadedBy?.department || "Manual",
                })),
                `all_experts.csv`
              )}
              className="text-xs border border-gray-300 text-gray-600 hover:bg-gray-50 px-4 py-1.5 rounded-lg transition font-medium"
            >
              Download All CSV
            </button>
            <button
              onClick={() => setModal({ allExperts })}
              className="text-xs bg-green-600 hover:bg-green-700 text-white px-4 py-1.5 rounded-lg transition font-medium"
            >
              Email All
            </button>
          </div>
        )}
      </div>

      {/* Action panels */}
      <AddExpertPanel onAdded={load} />
      {!hodFilter && <UploadCSVForHodPanel onUploaded={load} />}

      {/* Experts table */}
      {allExperts.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100">
                  {["Sr", "Name", "Email", "Designation", "Department", "Institute", "Specialization","Phone", "Cycle", "Uploaded by", "Action"].map(h => (
                    <th key={h} className="px-3 py-3 text-left text-xs font-semibold text-gray-500 whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {allExperts.map((e, i) => (
                  <tr key={e.id} className="border-b border-gray-50 last:border-0 hover:bg-gray-50/60 transition">
                    <td className="px-3 py-2.5 text-gray-400 text-xs">{i + 1}</td>
                    <td className="px-3 py-2.5 font-medium text-gray-800 whitespace-nowrap">{e.fullName}</td>
                    <td className="px-3 py-2.5 text-blue-600 text-xs">{e.email}</td>
                    <td className="px-3 py-2.5 text-gray-600 text-xs">{e.designation}</td>
                    <td className="px-3 py-2.5 text-gray-600 text-xs">{e.department}</td>
                    <td className="px-3 py-2.5 text-gray-500 text-xs">{e.institute}</td>
                    <td className="px-3 py-2.5 text-gray-500 text-xs">{e.specialization || "—"}</td>
                    <td className="px-3 py-2.5 text-gray-500 text-xs">{e.phone}</td>
                    <td className="px-3 py-2.5 text-xs">
                      <div className="flex flex-col gap-1">
                        <span className="bg-gray-100 text-gray-600 border border-gray-200 px-2 py-0.5 rounded-full font-mono text-xs whitespace-nowrap">
                          {e.cycle || "—"}
                        </span>
                        <span className="bg-purple-50 text-purple-600 border border-purple-100 px-2 py-0.5 rounded-full text-xs whitespace-nowrap">
                          {e.uploadedByDept||e.uploadedBy?.department || "—"}
                        </span>
                      </div>
                    </td>
                    <td className="px-3 py-2.5 text-xs">
                      {(e.uploadedByDepts || [e.uploadedBy?.department || "Manual"]).map(d => (
                        <span key={d} className="bg-indigo-50 text-indigo-600 border border-indigo-100 px-2 py-0.5 rounded-full text-xs mr-1">
                          {d}
                        </span>
                      ))}
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

      {allExperts.length === 0 && (
        <div className="bg-white rounded-xl border p-14 text-center text-gray-400">
          <p>{hodFilter ? "No experts for this HoD yet" : "No experts uploaded yet"}</p>
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
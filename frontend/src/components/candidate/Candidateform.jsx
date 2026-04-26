// components/candidate/CandidateForm.jsx
import { useRef,useState } from "react";
import FileUpload      from "../FileUpload";
import MultiFileUpload from "../MultiFileUpload";
import RefereeStatus   from "../RefereeStatus";
import ExperienceEntry from "./Experienceentry";
import API             from "../../api/api";

const BASE_URL = import.meta.env.VITE_API_URL;
/* ── Validators ── */
const validateEmail = (v) => v && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v)
  ? "Please enter a valid email address" : null;

const validatePhone = (v) => v && !/^\d{10}$/.test(v.replace(/\s/g, ""))
  ? "Phone must be exactly 10 digits" : null;

const validateName = (v) => v && /\d/.test(v)
  ? "Name should not contain numbers" : null;

function FieldError({ msg }) {
  if (!msg) return null;
  return <p className="text-red-500 text-xs mt-1">{msg}</p>;
}

/* ── Experience duration helpers ── */
export function calcExperience(experiences) {
  const byType = { research: 0, teaching: 0, industrial: 0 };
  experiences.forEach(exp => {
    if (!exp.fromDate) return;
    const from = new Date(exp.fromDate);
    const to   = exp.ongoing ? new Date() : (exp.toDate ? new Date(exp.toDate) : null);
    if (!to || to <= from) return;
    const months = (to.getFullYear() - from.getFullYear()) * 12 + (to.getMonth() - from.getMonth());
    const t = (exp.type || "").toLowerCase();
    if (t in byType) byType[t] += Math.max(0, months);
  });
  return byType;
}

export function fmtDuration(months) {
  if (!months) return "—";
  const y = Math.floor(months / 12);
  const m = months % 12;
  return [y > 0 ? `${y}y` : null, m > 0 ? `${m}m` : null].filter(Boolean).join(" ") || "—";
}

const EMPTY_REFEREE = { name:"", designation:"", department:"", institute:"", email:"" };
export default function Candidateform({
  application, setApplication,
  files, setFiles,
  expTypes, setExpTypes,
  publications, setPublications,
  experiences, setExperiences,
  referees, setReferees,
  isReadOnly,
  isQuery,
  onBack,
  onSaveDraft,
  onSubmit,
  buildPayload,
  saveNow,
}) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const personalRef = useRef(null);
  const docsRef     = useRef(null);
  const expRef      = useRef(null);
  const refRef      = useRef(null);
  const otherRef    = useRef(null);
  const accRef      = useRef(null);

  const scrollTo = (ref) => ref.current?.scrollIntoView({ behavior:"smooth" });

  const inputCls = `border p-2 rounded w-full text-sm focus:outline-none focus:ring-1 focus:ring-red-300 ${isReadOnly ? "bg-gray-50 text-gray-500" : ""}`;
  const labelCls = "block text-sm font-medium text-gray-700 mb-1";

  /* ── File uploads ── */
  const handleUpload = async (file, type) => {
    const fd = new FormData();
    fd.append("file", file);
    fd.append("type", type);
    const res = await API.post("/candidate/upload", fd);
    const updated = { ...files, [type]: res.data.path };
    setFiles(updated);
    await API.post("/candidate/save", buildPayload({ documents: updated }));
  };

  const handleMultiUpload = async (selectedFiles, type) => {
    if (!selectedFiles.length) return;
    const paths = [];
    for (const file of selectedFiles) {
      const fd = new FormData();
      fd.append("file", file); fd.append("type", type);
      const res = await API.post("/candidate/upload-multi", fd);
      paths.push(res.data.path);
    }
    const existing = files[type] || [];
    const updated  = { ...files, [type]: [...existing, ...paths] };
    setFiles(updated);
    await API.post("/candidate/save", buildPayload({ documents: updated }));
  };

  /* ── Experience ── */
  const EMPTY_EXP = { type:"", organization:"", designation:"", department:"",
    fromDate:"", toDate:"", natureOfWork:"", ongoing:false, certificate:"" };

  const handleExpChange = (i, field, value) => {
    setExperiences(prev => prev.map((e, idx) => idx === i ? { ...e, [field]: value } : e));
  };
  const handleExpBlur  = () => saveNow();
  const addExperience  = () => setExperiences(prev => [...prev, { ...EMPTY_EXP }]);
  const removeExperience = (i) => {
    if (experiences.length <= 1) { alert("At least 1 experience entry is required."); return; }
    const updated = experiences.filter((_, idx) => idx !== i);
    setExperiences(updated);
    saveNow({ experiences: updated });
  };

  const handleCertUpload = async (index, file) => {
    if (!file) return;
    const saved = await saveNow();
    const freshExps = saved?.experiences || experiences;
    const localExp = experiences[index];
    const exp = freshExps.find(e =>
      e.type         === localExp.type &&
      e.organization === localExp.organization &&
      e.designation  === localExp.designation
    ) || freshExps[index];

    if (!exp?.id) {
      alert("Could not save experience. Please try again.");
      return;
    }

    const fd = new FormData();
    fd.append("file", file);
    try {
      const res = await API.post(`/candidate/experience/${exp.id}/certificate`, fd);
      setExperiences(prev => prev.map((e, i) =>
        i === index ? { ...e, id: exp.id, certificate: res.data.path } : e
      ));
    } catch {
      alert("Certificate upload failed");
    }
  };

  /* ── Referee ── */
  const handleRefereeChange = (i, field, value) => {
    setReferees(prev => prev.map((r, idx) => idx === i ? { ...r, [field]: value } : r));
  };

  /* ── Experience totals ── */
  const expByType = calcExperience(experiences);
  const expTotal  = expByType.research + expByType.teaching + expByType.industrial;

  const sections = [
    { label:"Personal Info",  ref: personalRef },
    { label:"Documents",      ref: docsRef     },
    { label:"Experience",     ref: expRef      },
    { label:"Referees",       ref: refRef      },
    { label:"Other Docs",     ref: otherRef    },
    { label:"Accommodation",  ref: accRef      },
  ];

  return (
    <div className="p-8 space-y-8 pb-16">

      {/* Back */}
      <button onClick={onBack}
        className="text-sm text-gray-500 hover:text-red-600 flex items-center gap-1 transition">
        ← Back to Dashboard
      </button>

      {/* Read-only banner */}
      {isReadOnly && (
        <div className="bg-green-50 border border-green-200 rounded-xl px-5 py-4 flex items-center gap-3">
          <span className="text-green-600 text-xl">✓</span>
          <div>
            <p className="text-sm font-semibold text-green-800">Application Submitted</p>
            <p className="text-xs text-green-600 mt-0.5">
              Your application has been submitted and is under review. It cannot be edited.
            </p>
          </div>
        </div>
      )}

      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-800">Candidate Application</h1>
      </div>

      {/* ── PERSONAL INFO ── */}
      <div ref={personalRef} className="bg-white p-6 rounded shadow space-y-4">
        <h2 className="font-semibold text-lg border-b pb-2">Personal Information</h2>
        <div className="grid grid-cols-2 gap-4">

          {/* Full Name */}
          <div>
            <label className={labelCls}>Full Name</label>
            <div className="border p-2 rounded w-full text-sm bg-gray-50 text-gray-700">
              {application.name || <span className="text-gray-400 italic">Loading...</span>}
            </div>
            <p className="text-xs text-gray-400 mt-1">Auto-filled from your registered profile</p>
          </div>

          {/* ── FIX: Email — auto-filled, read-only, shows placeholder until loaded ── */}
          <div>
            <label className={labelCls}>Email</label>
            <div className="border p-2 rounded w-full text-sm bg-gray-50 text-gray-700 min-h-[36px]">
              {application.email
                ? application.email
                : <span className="text-gray-400 italic">Loading...</span>
              }
            </div>
            <p className="text-xs text-gray-400 mt-1">Auto-filled from your registered profile</p>
          </div>

          {/* Contact */}
          <div>
            <label className={labelCls}>Contact Number <span className="text-red-500">*</span></label>
            <div className="flex gap-2">
              <select
                value={application.countryCode || "+91"}
                disabled={isReadOnly}
                onChange={e => setApplication(a => ({ ...a, countryCode: e.target.value }))}
                onBlur={() => !isReadOnly && saveNow()}
                className={`border p-2 rounded text-sm focus:outline-none focus:ring-1 focus:ring-red-300 w-32 ${isReadOnly ? "bg-gray-50 text-gray-500" : ""}`}
              >
                <option value="+91">+91 (India)</option>
                <option value="+1">+1 (USA/Canada)</option>
                <option value="+44">+44 (UK)</option>
                <option value="+61">+61 (Australia)</option>
                <option value="+971">+971 (UAE)</option>
                <option value="+65">+65 (Singapore)</option>
                <option value="+49">+49 (Germany)</option>
                <option value="+33">+33 (France)</option>
                <option value="+86">+86 (China)</option>
                <option value="+81">+81 (Japan)</option>
                <option value="other">Other</option>
              </select>

              {(application.countryCode === "+91" || !application.countryCode) ? (
                <div className="flex-1">
                  <input
                    value={application.contact || ""}
                    placeholder="10-digit number"
                    className={inputCls}
                    disabled={isReadOnly}
                    maxLength={10}
                    onChange={e => {
                      const v = e.target.value.replace(/\D/g, "").slice(0, 10);
                      setApplication(a => ({ ...a, contact: v }));
                    }}
                    onBlur={() => !isReadOnly && saveNow()}
                  />
                  {application.contact && application.contact.length !== 10 && (
                    <p className="text-red-500 text-xs mt-1">Must be exactly 10 digits</p>
                  )}
                </div>
              ) : (
                <div className="flex-1">
                  <input
                    value={application.contact || ""}
                    placeholder="Enter number (digits only)"
                    className={inputCls}
                    disabled={isReadOnly}
                    onChange={e => {
                      const v = e.target.value.replace(/\D/g, "");
                      setApplication(a => ({ ...a, contact: v }));
                    }}
                    onBlur={() => !isReadOnly && saveNow()}
                  />
                </div>
              )}
            </div>
          </div>

          {/* ── FIX: Department — read-only, pre-filled from HoD's department ── */}
          <div>
            <label className={labelCls}>Department Applied For</label>
            <div className="border p-2 rounded w-full text-sm bg-gray-50 text-gray-700 min-h-[36px] flex items-center">
              {application.department
                ? application.department
                : <span className="text-gray-400 italic">Loading...</span>
              }
            </div>
            <p className="text-xs text-gray-400 mt-1">
              Pre-filled based on the department that uploaded your application
            </p>
          </div>
        </div>

        {/* Acceptance */}
        <div>
          <label className={labelCls}>Acceptance to attend Interview <span className="text-red-500">*</span></label>
          <div className="flex gap-6">
            {[{label:"Yes, I accept", val:true}, {label:"No, I decline", val:false}].map(({label,val}) => (
              <label key={label} className="flex items-center gap-2 cursor-pointer text-sm">
                <input type="radio" name="acceptance" disabled={isReadOnly}
                  checked={application.acceptance === val}
                  onChange={() => { if(isReadOnly) return; setApplication(a=>({...a,acceptance:val})); saveNow(); }} />
                {label}
              </label>
            ))}
          </div>
        </div>

        {/* If declined — show only submit button */}
        {application.acceptance === false && !isReadOnly && (
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-5 text-center space-y-3">
            <p className="text-sm text-amber-700 font-medium">
              You have declined the interview. Your response will be recorded.
            </p>
            <p className="text-xs text-amber-600">No further documents are required.</p>
            <button onClick={onSubmit}
              className="bg-red-600 text-white px-8 py-2.5 rounded-xl text-sm font-medium hover:bg-red-700">
              Submit Response
            </button>
          </div>
        )}
      </div>

      {application.acceptance !== false && (
      <>
      {/* ── DOCUMENTS ── */}
      <div ref={docsRef} className="bg-white p-6 rounded shadow space-y-6">
        <h2 className="font-semibold text-lg border-b pb-2">Upload Documents</h2>
        <div className="grid grid-cols-2 gap-6">
          <FileUpload label="Resume" file={files.docCv} disabled={isReadOnly} onUpload={f=>!isReadOnly&&handleUpload(f,"docCv")} />
          <FileUpload label="Teaching Statement" file={files.docTeachingStatement} disabled={isReadOnly} onUpload={f=>!isReadOnly&&handleUpload(f,"docTeachingStatement")} />
          <div className="col-span-2">
            <FileUpload label="Research Statement" file={files.docResearchStatement} disabled={isReadOnly} onUpload={f=>!isReadOnly&&handleUpload(f,"docResearchStatement")} />
          </div>
        </div>
        <div>
          <h3 className="text-sm font-semibold text-gray-600 uppercase tracking-wide mb-3">Academic Certificates</h3>
          <div className="grid grid-cols-2 gap-6">
            <FileUpload label="10th Marksheet & Passing Certificate(Single File)" file={files.docMarks10} disabled={isReadOnly} onUpload={f=>!isReadOnly&&handleUpload(f,"docMarks10")} />
            <FileUpload label="12th Marksheet & Passing Certificate(Single File)" file={files.docMarks12} disabled={isReadOnly} onUpload={f=>!isReadOnly&&handleUpload(f,"docMarks12")} />
            <FileUpload label="Graduation Marksheet & Passing Certificate(Single File)" file={files.docGraduation} disabled={isReadOnly} onUpload={f=>!isReadOnly&&handleUpload(f,"docGraduation")} />
            <FileUpload label="Post Graduation Marksheet & Passing Certificate(Single File)" file={files.docPostGraduation} disabled={isReadOnly} onUpload={f=>!isReadOnly&&handleUpload(f,"docPostGraduation")} />
          </div>
        </div>
        <div>
          <h3 className="text-sm font-semibold text-gray-600 uppercase tracking-wide mb-3">
            PhD Documents <span className="text-gray-400 font-normal text-xs">(Optional)</span>
          </h3>
          <div className="space-y-4">
            <FileUpload label="PhD Course Work Certificate (Optional)"
              file={files.docPhdCourseWork} disabled={isReadOnly}
              onUpload={f => !isReadOnly && handleUpload(f, "docPhdCourseWork")} />

            <div>
              <label className={labelCls}>PhD Thesis Status</label>
              <select
                value={application.phdStatus || ""}
                disabled={isReadOnly}
                onChange={e => { setApplication(a => ({...a, phdStatus: e.target.value})); saveNow(); }}
                className={inputCls}
              >
                <option value="">-- Select PhD Status --</option>
                <option value="defended">Thesis Defended</option>
                <option value="submitted">Thesis Submitted</option>
              </select>
            </div>

            {application.phdStatus === "defended" && (
              <div className="space-y-4 pl-4 border-l-2 border-indigo-200">
                <div>
                  <label className={labelCls}>Date of Defense <span className="text-red-500">*</span></label>
                  <input type="date" value={files.docDateOfDefense || ""} className={inputCls}
                    disabled={isReadOnly}
                    onChange={e => { const u={...files,docDateOfDefense:e.target.value}; setFiles(u); if(!isReadOnly) saveNow({documents:u}); }} />
                </div>
                <FileUpload label="Provisional PhD Degree (Required)" file={files.docPhdProvisional}
                  disabled={isReadOnly} onUpload={f => !isReadOnly && handleUpload(f, "docPhdProvisional")} />
                <FileUpload label="PhD Degree Certificate (Optional)" file={files.docPhdDegree}
                  disabled={isReadOnly} onUpload={f => !isReadOnly && handleUpload(f, "docPhdDegree")} />
              </div>
            )}

            {application.phdStatus === "submitted" && (
              <div className="pl-4 border-l-2 border-amber-200">
                <FileUpload label="Thesis Submission Certificate (Required)"
                  file={files.docThesisSubmission} disabled={isReadOnly}
                  onUpload={f => !isReadOnly && handleUpload(f, "docThesisSubmission")} />
              </div>
            )}
          </div>
        </div>
        <div>
          <h3 className="text-sm font-semibold text-gray-600 uppercase tracking-wide mb-3">Five Best Publications</h3>
          <MultiFileUpload label="Five Best Papers" maxFiles={5}
            existingFiles={files.docBestPapers} disabled={isReadOnly}
            onUpload={f=>!isReadOnly&&handleMultiUpload(f,"docBestPapers")} />
        </div>
        <div>
          <h3 className="text-sm font-semibold text-gray-600 uppercase tracking-wide mb-3">Post-Doc Documents</h3>
          <MultiFileUpload label="Post-Doc Documents" maxFiles={5}
            existingFiles={files.docPostDocDocs} disabled={isReadOnly}
            onUpload={f=>!isReadOnly&&handleMultiUpload(f,"docPostDocDocs")} />
        </div>
        <div>
          <h3 className="text-sm font-semibold text-gray-600 uppercase tracking-wide mb-3">Salary Slips</h3>
          <MultiFileUpload label="Current/Previous Month Salary Slip" maxFiles={3}
            existingFiles={files.docSalarySlips} disabled={isReadOnly}
            onUpload={f=>!isReadOnly&&handleMultiUpload(f,"docSalarySlips")} />
        </div>
      </div>

      {/* ── EXPERIENCE ── */}
      <div ref={expRef} className="bg-white p-6 rounded shadow space-y-5">
        <div className="flex items-start justify-between flex-wrap gap-3">
          <div>
            <h2 className="font-semibold text-lg">Post-PhD Experience</h2>
          </div>
          {expTotal > 0 && (
            <div className="flex gap-2 flex-wrap">
              {expByType.teaching   > 0 && <div className="text-xs bg-blue-50 text-blue-700 border border-blue-200 px-3 py-1.5 rounded-lg text-center"><div className="font-bold">{fmtDuration(expByType.teaching)}</div><div>Teaching</div></div>}
              {expByType.research   > 0 && <div className="text-xs bg-purple-50 text-purple-700 border border-purple-200 px-3 py-1.5 rounded-lg text-center"><div className="font-bold">{fmtDuration(expByType.research)}</div><div>Research</div></div>}
              {expByType.industrial > 0 && <div className="text-xs bg-orange-50 text-orange-700 border border-orange-200 px-3 py-1.5 rounded-lg text-center"><div className="font-bold">{fmtDuration(expByType.industrial)}</div><div>Industrial</div></div>}
              <div className="text-xs bg-green-50 text-green-700 border border-green-200 px-3 py-1.5 rounded-lg text-center"><div className="font-bold">{fmtDuration(expTotal)}</div><div>Total</div></div>
            </div>
          )}
        </div>

        <div>
          <label className={labelCls}>Select experience types (check all that apply) — Optional</label>
          <div className="flex gap-6 mt-2">
            {[
              { key:"research",   label:"Research Experience"   },
              { key:"teaching",   label:"Teaching Experience"   },
              { key:"industrial", label:"Industrial Experience" },
            ].map(({ key, label }) => (
              <label key={key} className="flex items-center gap-2 text-sm cursor-pointer">
                <input type="checkbox" disabled={isReadOnly} checked={expTypes[key]}
                  onChange={e => {
                    if(isReadOnly) return;
                    const u = { ...expTypes, [key]: e.target.checked };
                    setExpTypes(u);
                    if (e.target.checked) {
                      setExperiences(prev => [...prev, { ...EMPTY_EXP, type: key.charAt(0).toUpperCase() + key.slice(1) }]);
                    } else {
                      setExperiences(prev => prev.filter(exp => exp.type?.toLowerCase() !== key));
                    }
                    saveNow({ experienceTypes: u });
                  }} />
                {label}
              </label>
            ))}
          </div>
        </div>

        {["Research", "Teaching", "Industrial"].map(type => {
          if (!expTypes[type.toLowerCase()]) return null;
          const typeExps = experiences.filter(e => e.type === type);
          return (
            <div key={type} className="border border-gray-200 rounded-xl p-4 space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-semibold text-gray-700">{type} Experience</h4>
                {!isReadOnly && (
                  <button onClick={() => setExperiences(prev => [...prev, { ...EMPTY_EXP, type }])}
                    className="text-xs text-indigo-600 border border-indigo-200 px-3 py-1 rounded-lg hover:bg-indigo-50">
                    + Add {type} Entry
                  </button>
                )}
              </div>
              {typeExps.map((exp, i) => {
                const globalIdx = experiences.indexOf(exp);
                return (
                  <div key={i} onBlur={handleExpBlur}>
                    <ExperienceEntry
                      exp={exp} index={globalIdx}
                      displayNumber={i + 1}
                      onChange={handleExpChange}
                      onRemove={removeExperience}
                      isReadOnly={isReadOnly}
                      total={typeExps.length}
                      onCertUpload={(file) => handleCertUpload(globalIdx, file)}
                      hideNatureOfWork={type === "Teaching"}
                    />
                  </div>
                );
              })}
            </div>
          );
        })}
      </div>
      {/* ── OTHER DOCS ── */}
      <div ref={otherRef} className="bg-white p-6 rounded shadow space-y-4">
        <h2 className="font-semibold text-lg border-b pb-2">Other Documents</h2>
        <span>Any other Documents required for selection process</span>
        <MultiFileUpload label="Upload Additional Documents" maxFiles={5}
          existingFiles={files.docOtherDocs || []}
          disabled={isReadOnly}
          onUpload={f => !isReadOnly && handleMultiUpload(f, "docOtherDocs")} />
      </div>

      {/* ── REFEREES ── */}
      <div ref={refRef} className="bg-white p-6 rounded shadow space-y-6">
        <div>
          <h2 className="font-semibold text-lg">Referee Details</h2>
          <p className="text-sm text-red-600 mt-1">Minimum 3 referees are compulsory.</p>
        </div>
        {referees.map((ref, i) => (
          <div key={i} className="border rounded-lg p-4 bg-gray-50 space-y-4">
            <div className="flex justify-between items-center">
              <p className="text-sm font-semibold text-gray-600">
                Referee {i+1} {i < 3 && <span className="text-red-500">*</span>}
              </p>
              {i >= 3 && !isReadOnly && (
                <button onClick={() => { const u=referees.filter((_,idx)=>idx!==i); setReferees(u); saveNow({referees:u}); }}
                  className="text-red-500 text-xs hover:underline">Remove</button>
              )}
            </div>
            <div className="grid grid-cols-2 gap-4">
              {[
                { field:"salutation", label:"Salutation", span:1 },{field:"name",label:"Full Name",span:1},{field:"designation",label:"Designation",span:1},
                {field:"department",label:"Department",span:1},{field:"institute",label:"Institute",span:1},
                {field:"email",label:"Email",span:1},
              ].map(({ field, label, span }) => (
                <div key={field} className={span === 2 ? "col-span-2" : ""}>
                  <label className={labelCls}>{label}{i < 3 && <span className="text-red-500"> *</span>}</label>
                  {field === "salutation" ? (
                    <select value={ref[field] || "Prof."} className={inputCls}
                      disabled={isReadOnly}
                      onChange={e => !isReadOnly && handleRefereeChange(i, field, e.target.value)}
                      onBlur={() => !isReadOnly && saveNow()}>
                      {["Prof.", "Dr.", "Mr.", "Ms.", "Mrs."].map(s => (
                        <option key={s}>{s}</option>
                      ))}
                    </select>
                  ) : (
                    <input value={ref[field] || ""} placeholder={`Enter ${label}`} className={inputCls}
                      disabled={isReadOnly}
                      onChange={e => !isReadOnly && handleRefereeChange(i, field, e.target.value)}
                      onBlur={() => !isReadOnly && saveNow()} />
                  )}
                </div>
              ))}
            </div>
          </div>
        ))}
        {!isReadOnly && (
          <button onClick={()=>setReferees(r=>[...r,{...EMPTY_REFEREE}])}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded text-sm">
            + Add More Referee
          </button>
        )}
      </div>

      <RefereeStatus />

      {/* ── ACCOMMODATION ── */}
      <div ref={accRef} className="bg-white p-6 rounded shadow space-y-3">
        <h2 className="font-semibold text-lg border-b pb-2">Institute Accommodation Requirement (Accommodation will be provided based on Availability)</h2>
        <div className="flex gap-6">
          {[{label:"Yes",val:true},{label:"No",val:false}].map(({label,val})=>(
            <label key={label} className="flex items-center gap-2 cursor-pointer text-sm">
              <input type="radio" name="acc" disabled={isReadOnly}
                checked={application.accommodation===val}
                onChange={()=>{ if(isReadOnly) return; setApplication(a=>({...a,accommodation:val})); saveNow(); }} />
              {label}
            </label>
          ))}
        </div>
      </div>

      {/* Submit / Save */}
      {!isReadOnly && (
        <div className="flex justify-end gap-4 pb-8">
          <button onClick={onSaveDraft} className="border px-6 py-2 rounded text-sm hover:bg-gray-50">
            Save Draft
          </button>
          <button
            onClick={async () => {
              setIsSubmitting(true);
              await onSubmit();
              setIsSubmitting(false);
            }}
            disabled={isSubmitting}
            className="bg-red-600 text-white px-6 py-2 rounded text-sm hover:bg-red-700 disabled:opacity-60"
          >
            {isSubmitting ? "Submitting…" : "Submit Documents"}
          </button>
        </div>
      )}
    </>)}
    </div>
  );
}
// components/candidate/CandidateForm.jsx
import { useRef } from "react";
import FileUpload      from "../FileUpload";
import MultiFileUpload from "../MultiFileUpload";
import RefereeStatus   from "../RefereeStatus";
import ExperienceEntry from "./Experienceentry";
import API             from "../../api/api";

const BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";
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
  onBack,
  onSaveDraft,
  onSubmit,
  buildPayload,
  saveNow,
}) {
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

  // Add after handleExpBlur
const handleCertUpload = async (index, file) => {
  if (!file) return;
  // Save first to ensure experiences get DB ids
  const saved = await saveNow();
  const freshExps = saved?.experiences || experiences;
  const exp = freshExps[index];

  if (!exp?.id) {
    alert("Could not save experience. Please try again.");
    return;
  }

  const fd = new FormData();
  fd.append("file", file);
  try {
    const res = await API.post(`/candidate/experience/${exp.id}/certificate`, fd);
    // Update local state with the certificate path
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

  /* ── Sidebar section links (injected from parent scrollTo refs) ── */
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
        {!isReadOnly && (
          <span className="text-xs bg-amber-100 text-amber-700 border border-amber-200 px-3 py-1.5 rounded-full font-medium">
            Draft — auto-saved every 15s
          </span>
        )}
      </div>

      {/* ── PERSONAL INFO ── */}
      <div ref={personalRef} className="bg-white p-6 rounded shadow space-y-4">
        <h2 className="font-semibold text-lg border-b pb-2">Personal Information</h2>
        <div className="grid grid-cols-2 gap-4">

          {/* Full Name */}
          <div>
            <label className={labelCls}>Full Name</label>
            <input
              value={application.name || ""}
              placeholder="Enter Full Name"
              className={inputCls}
              disabled={isReadOnly}
              onKeyPress={e => { if (/\d/.test(e.key)) e.preventDefault(); }}
              onChange={e => setApplication(a => ({ ...a, name: e.target.value }))}
              onBlur={() => !isReadOnly && saveNow()}
            />
            <FieldError msg={validateName(application.name)} />
          </div>

          {/* Email */}
          <div>
            <label className={labelCls}>Email</label>
            <input
              type="email"
              value={application.email || ""}
              placeholder="Enter Email"
              className={inputCls}
              disabled={isReadOnly}
              onChange={e => setApplication(a => ({ ...a, email: e.target.value }))}
              onBlur={() => !isReadOnly && saveNow()}
            />
            <FieldError msg={validateEmail(application.email)} />
          </div>

          {/* Contact */}
          <div>
            <label className={labelCls}>Contact Number</label>
            <div className="flex gap-2">
              <select
                value={application.countryCode || "+91"}
                disabled={isReadOnly}
                onChange={e => setApplication(a => ({ ...a, countryCode: e.target.value }))}
                onBlur={() => !isReadOnly && saveNow()}
                className={`border p-2 rounded text-sm focus:outline-none focus:ring-1 focus:ring-red-300 w-24 ${isReadOnly ? "bg-gray-50 text-gray-500" : ""}`}
              >
                <option value="+91">🇮🇳 +91</option>
                <option value="+1">🇺🇸 +1</option>
                <option value="+44">🇬🇧 +44</option>
                <option value="+61">🇦🇺 +61</option>
                <option value="+971">🇦🇪 +971</option>
                <option value="+65">🇸🇬 +65</option>
                <option value="+49">🇩🇪 +49</option>
                <option value="+33">🇫🇷 +33</option>
                <option value="+86">🇨🇳 +86</option>
                <option value="+81">🇯🇵 +81</option>
              </select>
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
                <FieldError msg={validatePhone(application.contact)} />
              </div>
            </div>
          </div>

          {/* Department */}
          <div>
            <label className={labelCls}>Department Applied For</label>
            <select value={application.department} className={inputCls} disabled={isReadOnly}
              onChange={e => setApplication(a => ({ ...a, department: e.target.value }))}
              onBlur={() => !isReadOnly && saveNow()}>
              <option value="">-- Select Department --</option>
              <option>Communication and Computer Engineering</option>
              <option>Computer Science and Engineering</option>
              <option>Electronics and Communication Engineering</option>
              <option>Mechanical-Mechatronics Engineering</option>
              <option>Physics</option>
              <option>Mathematics</option>
              <option>Humanities and Social Sciences</option>
            </select>
            {!application.department && !isReadOnly && (
              <p className="text-amber-500 text-xs mt-1">Please select a department</p>
            )}
          </div>
        </div>

        {/* Referee email validation inline */}
        <div>
          <label className={labelCls}>Letter of Acceptance</label>
          <div className="flex gap-6">
            {[{label:"Yes, I accept",val:true},{label:"No, I decline",val:false}].map(({label,val})=>(
              <label key={label} className="flex items-center gap-2 cursor-pointer text-sm">
                <input type="radio" name="acceptance" disabled={isReadOnly}
                  checked={application.acceptance === val}
                  onChange={() => { if(isReadOnly) return; setApplication(a=>({...a,acceptance:val})); saveNow(); }} />
                {label}
              </label>
            ))}
          </div>
        </div>
      </div>
      {/* ── DOCUMENTS ── */}
      <div ref={docsRef} className="bg-white p-6 rounded shadow space-y-6">
        <h2 className="font-semibold text-lg border-b pb-2">Document Uploads</h2>
        <div className="grid grid-cols-2 gap-6">
          <FileUpload label="CV" file={files.docCv} disabled={isReadOnly} onUpload={f=>!isReadOnly&&handleUpload(f,"docCv")} />
          <FileUpload label="Teaching Statement" file={files.docTeachingStatement} disabled={isReadOnly} onUpload={f=>!isReadOnly&&handleUpload(f,"docTeachingStatement")} />
          <div className="col-span-2">
            <FileUpload label="Research Statement" file={files.docResearchStatement} disabled={isReadOnly} onUpload={f=>!isReadOnly&&handleUpload(f,"docResearchStatement")} />
          </div>
        </div>
        <div>
          <h3 className="text-sm font-semibold text-gray-600 uppercase tracking-wide mb-3">Academic Certificates</h3>
          <div className="grid grid-cols-2 gap-6">
            <FileUpload label="10th Marksheet" file={files.docMarks10} disabled={isReadOnly} onUpload={f=>!isReadOnly&&handleUpload(f,"docMarks10")} />
            <FileUpload label="12th Marksheet" file={files.docMarks12} disabled={isReadOnly} onUpload={f=>!isReadOnly&&handleUpload(f,"docMarks12")} />
            <FileUpload label="Graduation Certificate" file={files.docGraduation} disabled={isReadOnly} onUpload={f=>!isReadOnly&&handleUpload(f,"docGraduation")} />
            <FileUpload label="Post Graduation Certificate" file={files.docPostGraduation} disabled={isReadOnly} onUpload={f=>!isReadOnly&&handleUpload(f,"docPostGraduation")} />
          </div>
        </div>
        <div>
          <h3 className="text-sm font-semibold text-gray-600 uppercase tracking-wide mb-3">PhD Documents</h3>
          <div className="grid grid-cols-2 gap-6">
            <FileUpload label="PhD Course Work Certificate" file={files.docPhdCourseWork} disabled={isReadOnly} onUpload={f=>!isReadOnly&&handleUpload(f,"docPhdCourseWork")} />
            <div>
              <label className={labelCls}>Date of PhD Defense</label>
              <input type="date" value={files.docDateOfDefense||""} className={inputCls} disabled={isReadOnly}
                onChange={e=>{ const u={...files,docDateOfDefense:e.target.value}; setFiles(u); if(!isReadOnly) saveNow({documents:u}); }} />
            </div>
            <FileUpload label="Provisional PhD Degree" file={files.docPhdProvisional} disabled={isReadOnly} onUpload={f=>!isReadOnly&&handleUpload(f,"docPhdProvisional")} />
            <FileUpload label="PhD Degree Certificate"  file={files.docPhdDegree}      disabled={isReadOnly} onUpload={f=>!isReadOnly&&handleUpload(f,"docPhdDegree")} />
          </div>
        </div>
        <div>
          <h3 className="text-sm font-semibold text-gray-600 uppercase tracking-wide mb-3">Five Best Papers</h3>
          <MultiFileUpload label="Five Best Papers (Max 100 MB each)" maxFiles={5} maxMB={100}
            existingFiles={files.docBestPapers} disabled={isReadOnly}
            onUpload={f=>!isReadOnly&&handleMultiUpload(f,"docBestPapers")} />
        </div>
        <div>
          <h3 className="text-sm font-semibold text-gray-600 uppercase tracking-wide mb-3">Post-Doc Documents</h3>
          <MultiFileUpload label="Post-Doc Documents (if applicable)" maxFiles={5} maxMB={10}
            existingFiles={files.docPostDocDocs} disabled={isReadOnly}
            onUpload={f=>!isReadOnly&&handleMultiUpload(f,"docPostDocDocs")} />
        </div>
        <div>
          <h3 className="text-sm font-semibold text-gray-600 uppercase tracking-wide mb-3">Salary Slips</h3>
          <MultiFileUpload label="Current/Previous Month Salary Slip" maxFiles={3} maxMB={10}
            existingFiles={files.docSalarySlips} disabled={isReadOnly}
            onUpload={f=>!isReadOnly&&handleMultiUpload(f,"docSalarySlips")} />
        </div>
      </div>

      {/* ── EXPERIENCE ── */}
      <div ref={expRef} className="bg-white p-6 rounded shadow space-y-5">
        <div className="flex items-start justify-between flex-wrap gap-3">
          <div>
            <h2 className="font-semibold text-lg">Post-PhD Experience</h2>
            <p className="text-xs text-gray-400 mt-1">Minimum 1 entry required. Upload certificate at the bottom of each entry.</p>
          </div>
          {/* Total experience badges */}
          {expTotal > 0 && (
            <div className="flex gap-2 flex-wrap">
              {expByType.teaching   > 0 && <div className="text-xs bg-blue-50 text-blue-700 border border-blue-200 px-3 py-1.5 rounded-lg text-center"><div className="font-bold">{fmtDuration(expByType.teaching)}</div><div>Teaching</div></div>}
              {expByType.research   > 0 && <div className="text-xs bg-purple-50 text-purple-700 border border-purple-200 px-3 py-1.5 rounded-lg text-center"><div className="font-bold">{fmtDuration(expByType.research)}</div><div>Research</div></div>}
              {expByType.industrial > 0 && <div className="text-xs bg-orange-50 text-orange-700 border border-orange-200 px-3 py-1.5 rounded-lg text-center"><div className="font-bold">{fmtDuration(expByType.industrial)}</div><div>Industrial</div></div>}
              <div className="text-xs bg-green-50 text-green-700 border border-green-200 px-3 py-1.5 rounded-lg text-center"><div className="font-bold">{fmtDuration(expTotal)}</div><div>Total</div></div>
            </div>
          )}
        </div>

        {/* Experience type flags */}
        <div>
          <label className={labelCls}>Select experience types (check all that apply)</label>
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
                    const u={...expTypes,[key]:e.target.checked};
                    setExpTypes(u); saveNow({experienceTypes:u});
                  }} />
                {label}
              </label>
            ))}
          </div>
        </div>

        {experiences.map((exp, i) => (
          <div key={i} onBlur={handleExpBlur}>
            <ExperienceEntry exp={exp} index={i} onChange={handleExpChange}
              onRemove={removeExperience} isReadOnly={isReadOnly} total={experiences.length} 
              onCertUpload={(file)=>handleCertUpload(i, file)} />
          </div>
        ))}

        {!isReadOnly && (
          <button onClick={addExperience}
            className="border border-red-500 text-red-500 px-4 py-2 rounded text-sm hover:bg-red-50">
            + Add Experience
          </button>
        )}
      </div>

      {/* ── PUBLICATIONS ── */}
      <div className="bg-white p-6 rounded shadow space-y-4">
        <h2 className="font-semibold text-lg border-b pb-2">Five Best Publications</h2>
        {[0,1,2,3,4].map(i => (
          <div key={i}>
            <label className={labelCls}>Publication {i+1}</label>
            <input placeholder={`Enter publication ${i+1} (title, journal, year...)`}
              className={inputCls} disabled={isReadOnly}
              defaultValue={publications[i]||""}
              onBlur={e => { if(!isReadOnly){ const a=[...publications]; a[i]=e.target.value; setPublications(a); saveNow({publications:a}); }}} />
          </div>
        ))}
      </div>

      {/* ── OTHER DOCS ── */}
      <div ref={otherRef} className="bg-white p-6 rounded shadow space-y-4">
        <h2 className="font-semibold text-lg border-b pb-2">Other Documents</h2>
        <MultiFileUpload label="Upload Additional Documents" maxFiles={5} maxMB={10}
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
                {field:"name",label:"Full Name",span:1},{field:"designation",label:"Designation",span:1},
                {field:"department",label:"Department",span:1},{field:"institute",label:"Institute",span:1},
                {field:"email",label:"Email",span:2},
              ].map(({field,label,span})=>(
                <div key={field} className={span===2?"col-span-2":""}>
                  <label className={labelCls}>{label}{i<3&&<span className="text-red-500"> *</span>}</label>
                  <input value={ref[field]||""} placeholder={`Enter ${label}`} className={inputCls}
                    disabled={isReadOnly}
                    onChange={e=>!isReadOnly&&handleRefereeChange(i,field,e.target.value)}
                    onBlur={()=>!isReadOnly&&saveNow()} />
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
        <h2 className="font-semibold text-lg border-b pb-2">Accommodation Requirement</h2>
        <div className="flex gap-6">
          {[{label:"Yes — accommodation required",val:true},{label:"No",val:false}].map(({label,val})=>(
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
          <button onClick={onSubmit}
            className="bg-red-600 text-white px-6 py-2 rounded text-sm hover:bg-red-700">
            Submit Application
          </button>
        </div>
      )}
    </div>
  );
}
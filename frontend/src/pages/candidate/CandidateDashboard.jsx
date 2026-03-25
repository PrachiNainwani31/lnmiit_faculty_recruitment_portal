import { useState, useRef, useEffect, useCallback } from "react";
import { FaHome, FaUser, FaFileAlt, FaBriefcase, FaUsers, FaFolderOpen, FaBed } from "react-icons/fa";
import FileUpload from "../../components/FileUpload";
import MultiFileUpload from "../../components/MultiFileUpload";
import API from "../../api/api";
import { useNavigate } from "react-router-dom";
import RefereeStatus from "../../components/RefereeStatus";
import logo from "../../assets/lnmiit_logo.png";
import OnboardingStatus from "../../components/OnBoardingStatus";

const EMPTY_REFEREE    = { name:"", designation:"", department:"", institute:"", email:"" };
const EMPTY_EXPERIENCE = { type:"", organization:"", designation:"", department:"", fromDate:"", toDate:"", natureOfWork:"" };
const BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

export default function CandidateDashboard() {
  const navigate = useNavigate();

  const personalRef = useRef(null);
  const docsRef     = useRef(null);
  const expRef      = useRef(null);
  const refRef      = useRef(null);
  const otherRef    = useRef(null);
  const accRef      = useRef(null);

  const [application, setApplication] = useState({
    name:"", email:"", contact:"", department:"", acceptance:false, accommodation:false,
  });
  const [files, setFiles] = useState({
    cv:null, teachingStatement:null, researchStatement:null,
    marks10:null, marks12:null, graduation:null, postGraduation:null,
    phdCourseWork:null, phdProvisional:null, phdDegree:null, dateOfDefense:"",
    researchExpCerts:[], teachingExpCerts:[], industryExpCerts:[],
    bestPapers:[], postDocDocs:[], salarySlips:[],
  });
  const [expTypes, setExpTypes] = useState({ research:false, teaching:false, industrial:false });
  const [publications, setPublications] = useState(["","","","",""]);
  const [experiences, setExperiences]   = useState([]);
  const [referees, setReferees]         = useState([
    { ...EMPTY_REFEREE }, { ...EMPTY_REFEREE }, { ...EMPTY_REFEREE }
  ]);

  /* ── payload builder ── */
  const buildPayload = useCallback((overrides = {}) => ({
    ...application,
    publications,
    documents: { ...files },
    experienceTypes: expTypes,
    experiences,
    referees,
    ...overrides,
  }), [application, publications, files, expTypes, experiences, referees]);

  /* ── load on mount ── */
  useEffect(() => {
    API.get("/candidate/me").then(res => {
      const app = res.data || {};
      setApplication({
        name:         app.name         || "",
        email:        app.email        || "",
        contact:      app.contact      || app.phone || "",
        department:   app.department   || "",
        acceptance:   app.acceptance   || false,
        accommodation:app.accommodation|| false,
      });

      if (app.documents) {
        setFiles(f => ({ ...f, ...app.documents }));
      }

      if (app.experienceTypes) setExpTypes(app.experienceTypes);

      if (app.publications?.length > 0) {
        const pubs = [...app.publications];
        while (pubs.length < 5) pubs.push("");
        setPublications(pubs.slice(0, 5));
      }

      if (app.experiences?.length > 0)  setExperiences(app.experiences);
      if (app.referees?.length > 0)     setReferees(app.referees);
    }).catch(console.error);
  }, []);

  /* ── auto-save ── */
  useEffect(() => {
    const id = setInterval(() => {
      API.post("/candidate/save", buildPayload()).catch(() => {});
    }, 15000);
    return () => clearInterval(id);
  }, [buildPayload]);

  const saveNow = (overrides = {}) =>
    API.post("/candidate/save", buildPayload(overrides)).catch(console.error);

  /* ── single file upload ── */
  const handleUpload = async (file, type) => {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("type", type);
    const res = await API.post("/candidate/upload", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    const updatedFiles = { ...files, [type]: res.data.path };
    setFiles(updatedFiles);
    await API.post("/candidate/save", buildPayload({ documents: updatedFiles }));
  };

  /* ── multi file upload ── */
  const handleMultiUpload = async (selectedFiles, type) => {
    if (!selectedFiles.length) return;
    const paths = [];
    for (const file of selectedFiles) {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("type", type);
      const res = await API.post("/candidate/upload", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      paths.push(res.data.path);
    }
    const updatedFiles = { ...files, [type]: paths };
    setFiles(updatedFiles);
    await API.post("/candidate/save", buildPayload({ documents: updatedFiles }));
  };

  /* ── publication blur ── */
  const handlePublicationBlur = (i, value) => {
    const arr = [...publications];
    arr[i] = value;
    setPublications(arr);
    saveNow({ publications: arr });
  };

  /* ── experience ── */
  const handleExpChange = (i, field, value) => {
    const updated = experiences.map((e, idx) => idx === i ? { ...e, [field]: value } : e);
    setExperiences(updated);
  };

  const addExperience = () => setExperiences([...experiences, { ...EMPTY_EXPERIENCE }]);

  const removeExperience = (i) => {
    const updated = experiences.filter((_, idx) => idx !== i);
    setExperiences(updated);
    saveNow({ experiences: updated });
  };

  /* ── referee ── */
  const handleRefereeChange = (i, field, value) => {
    const updated = referees.map((r, idx) => idx === i ? { ...r, [field]: value } : r);
    setReferees(updated);
  };

  /* ── validate referees ── */
  const validateReferees = () => {
    const filled = referees.filter(r => r.name && r.email);
    if (filled.length < 3) {
      alert("Please fill in at least 3 complete referee details (name + email required for each).");
      refRef.current?.scrollIntoView({ behavior:"smooth" });
      return false;
    }
    return true;
  };

  const saveDraft = async () => {
    await saveNow();
    alert("Draft saved");
  };

  const submitApplication = async () => {
    if (!validateReferees()) return;
    await saveNow();
    await API.post("/candidate/submit");
    alert("Application submitted successfully! Emails sent to referees.");
  };

  const scrollTo = (ref) => ref.current?.scrollIntoView({ behavior:"smooth" });
  const handleLogout = () => { localStorage.clear(); navigate("/login"); };

  const inputCls = "border p-2 rounded w-full text-sm focus:outline-none focus:ring-1 focus:ring-red-300";
  const labelCls = "block text-sm font-medium text-gray-700 mb-1";

  /* ════════════════════════════════════════════════════
     RENDER
  ════════════════════════════════════════════════════ */
  return (
    <div className="flex min-h-screen bg-gray-100">

      {/* ── SIDEBAR ── */}
      <aside className="fixed left-0 top-0 h-screen w-64 bg-white shadow-md z-10 flex flex-col">
        <div className="p-5 border-b flex flex-col items-center gap-2">
          <img src={logo} alt="LNMIIT" className="w-28 object-contain" />
          <span className="text-sm font-semibold text-gray-700">Institute Portal</span>
        </div>
        <nav className="p-4 space-y-3 text-gray-700 text-sm flex-1">
          {[
            { icon:<FaHome/>,       label:"Dashboard",     ref:null        },
            { icon:<FaUser/>,       label:"Personal Info",  ref:personalRef },
            { icon:<FaFileAlt/>,    label:"Documents",      ref:docsRef     },
            { icon:<FaBriefcase/>,  label:"Experience",     ref:expRef      },
            { icon:<FaUsers/>,      label:"Referees",       ref:refRef      },
            { icon:<FaFolderOpen/>, label:"Other Docs",     ref:otherRef    },
            { icon:<FaBed/>,        label:"Accommodation",  ref:accRef      },
          ].map(({ icon, label, ref }) => (
            <div key={label}
              onClick={() => ref && scrollTo(ref)}
              className="flex items-center gap-3 cursor-pointer hover:text-red-600 transition py-1">
              {icon} {label}
            </div>
          ))}
        </nav>
        <button onClick={handleLogout}
          className="m-4 bg-red-600 text-white py-2 rounded text-sm hover:bg-red-700">
          Logout
        </button>
      </aside>

      {/* ── MAIN ── */}
      <div className="ml-64 flex-1 p-8 space-y-8 pb-16">

        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold text-gray-800">Candidate Application Portal</h1>
        </div>

        <div className="bg-green-100 text-green-700 p-3 rounded text-sm">
          Welcome! Please fill in all required details. Minimum 3 referees are compulsory.
          Your progress is auto-saved every 15 seconds.
        </div>

        {/* ── PERSONAL INFO ── */}
        <div ref={personalRef} className="bg-white p-6 rounded shadow space-y-4">
          <h2 className="font-semibold text-lg border-b pb-2">Personal Information</h2>
          <div className="grid grid-cols-2 gap-4">
            {[
              { key:"name",       label:"Full Name"              },
              { key:"email",      label:"Email"                  },
              { key:"contact",    label:"Contact Number"         },
            ].map(({ key, label }) => (
              <div key={key}>
                <label className={labelCls}>{label}</label>
                <input value={application[key]} placeholder={`Enter ${label}`}
                  className={inputCls}
                  onChange={e => setApplication({ ...application, [key]: e.target.value })}
                  onBlur={() => saveNow()} />
              </div>
            ))}
            {/* Department dropdown — outside the map */}
            <div>
              <label className={labelCls}>Department Applied For</label>
              <select
                value={application.department}
                className={inputCls}
                onChange={e => setApplication({ ...application, department: e.target.value })}
                onBlur={() => saveNow()}
              >
                <option value="">-- Select Department --</option>
                <option>Communication and Computer Engineering</option>
                <option>Computer Science and Engineering</option>
                <option>Electronics and Communication Engineering</option>
                <option>Mechanical-Mechatronics Engineering</option>
                <option>Physics</option>
                <option>Mathematics</option>
                <option>Humanities and Social Sciences</option>
              </select>
            </div>
          </div>

          <div>
            <label className={labelCls}>Letter of Acceptance</label>
            <div className="flex gap-6">
              {[{ label:"Yes, I accept", val:true },{ label:"No, I decline", val:false }].map(({ label, val }) => (
                <label key={label} className="flex items-center gap-2 cursor-pointer text-sm">
                  <input type="radio" name="acceptance"
                    checked={application.acceptance === val}
                    onChange={() => { const u={...application,acceptance:val}; setApplication(u); saveNow(u); }} />
                  {label}
                </label>
              ))}
            </div>
          </div>
        </div>

        {/* ── DOCUMENTS ── */}
        <div ref={docsRef} className="bg-white p-6 rounded shadow space-y-6">
          <h2 className="font-semibold text-lg border-b pb-2">Document Uploads</h2>

          {/* Core documents */}
          <div className="grid grid-cols-2 gap-6">
            <FileUpload label="CV" file={files.cv} onUpload={f=>handleUpload(f,"cv")} />
            <FileUpload label="Teaching Statement" file={files.teachingStatement} onUpload={f=>handleUpload(f,"teachingStatement")} />
            <div className="col-span-2">
              <FileUpload label="Research Statement" file={files.researchStatement} onUpload={f=>handleUpload(f,"researchStatement")} />
            </div>
          </div>

          {/* Academic certificates */}
          <div>
            <h3 className="text-sm font-semibold text-gray-600 uppercase tracking-wide mb-3">Academic Certificates</h3>
            <div className="grid grid-cols-2 gap-6">
              <FileUpload label="10th Marksheet & Certificates (Single File)" file={files.marks10} onUpload={f=>handleUpload(f,"marks10")} />
              <FileUpload label="12th Marksheet & Certificates (Single File)" file={files.marks12} onUpload={f=>handleUpload(f,"marks12")} />
              <FileUpload label="Graduation Marksheets & Degree Certificate (Single File, Max 100 MB)" file={files.graduation} onUpload={f=>handleUpload(f,"graduation")} />
              <FileUpload label="Post Graduation Marksheet & Degree Certificate (Single File, Max 100 MB)" file={files.postGraduation} onUpload={f=>handleUpload(f,"postGraduation")} />
            </div>
          </div>

          {/* PhD documents */}
          <div>
            <h3 className="text-sm font-semibold text-gray-600 uppercase tracking-wide mb-3">PhD Documents</h3>
            <div className="grid grid-cols-2 gap-6">
              <FileUpload label="PhD Course Work Certificate" file={files.phdCourseWork} onUpload={f=>handleUpload(f,"phdCourseWork")} />

              <div>
                <label className={labelCls}>Date of PhD Defense</label>
                <input type="date" value={files.dateOfDefense || ""}
                  className={inputCls}
                  onChange={e => {
                    const updated = { ...files, dateOfDefense: e.target.value };
                    setFiles(updated);
                    saveNow({ documents: updated });
                  }} />
              </div>

              <FileUpload label="Provisional PhD Degree Certificate (highlighting date of defense)" file={files.phdProvisional} onUpload={f=>handleUpload(f,"phdProvisional")} />
              <FileUpload label="PhD Degree Certificate" file={files.phdDegree} onUpload={f=>handleUpload(f,"phdDegree")} />
            </div>
          </div>

          {/* Best papers */}
          <div>
            <h3 className="text-sm font-semibold text-gray-600 uppercase tracking-wide mb-3">Five Best Papers</h3>
            <MultiFileUpload
              label="Five Best Papers (Max 100 MB each)"
              maxFiles={5}
              maxMB={100}
              existingFiles={files.bestPapers}
              onUpload={f => handleMultiUpload(f, "bestPapers")}
            />
          </div>

          {/* Post-doc */}
          <div>
            <h3 className="text-sm font-semibold text-gray-600 uppercase tracking-wide mb-3">Post-Doc Documents</h3>
            <MultiFileUpload
              label="Post-Doc Documents (if applicable — offer letter etc.)"
              maxFiles={5}
              maxMB={10}
              existingFiles={files.postDocDocs}
              onUpload={f => handleMultiUpload(f, "postDocDocs")}
            />
          </div>

          {/* Salary slips */}
          <div>
            <h3 className="text-sm font-semibold text-gray-600 uppercase tracking-wide mb-3">Salary Slips</h3>
            <MultiFileUpload
              label="Current/Previous Month Salary Slip (if claiming experience)"
              maxFiles={3}
              maxMB={10}
              existingFiles={files.salarySlips}
              onUpload={f => handleMultiUpload(f, "salarySlips")}
            />
          </div>
        </div>

        {/* ── EXPERIENCE ── */}
        <div ref={expRef} className="bg-white p-6 rounded shadow space-y-5">
          <h2 className="font-semibold text-lg border-b pb-2">Post-PhD Experience</h2>

          {/* Experience type checkboxes */}
          <div>
            <label className={labelCls}>Select experience types (check all that apply)</label>
            <div className="flex gap-6 mt-2">
              {[
                { key:"research",   label:"Research Experience"   },
                { key:"teaching",   label:"Teaching Experience"   },
                { key:"industrial", label:"Industrial Experience" },
              ].map(({ key, label }) => (
                <label key={key} className="flex items-center gap-2 text-sm cursor-pointer">
                  <input type="checkbox"
                    checked={expTypes[key]}
                    onChange={e => {
                      const updated = { ...expTypes, [key]: e.target.checked };
                      setExpTypes(updated);
                      saveNow({ experienceTypes: updated });
                    }} />
                  {label}
                </label>
              ))}
            </div>
          </div>

          {/* Conditional certificate uploads */}
          {expTypes.research && (
            <MultiFileUpload
              label="Research Experience Certificate(s)"
              maxFiles={5} maxMB={10}
              existingFiles={files.researchExpCerts}
              onUpload={f => handleMultiUpload(f, "researchExpCerts")}
            />
          )}
          {expTypes.teaching && (
            <MultiFileUpload
              label="Teaching Experience Certificate(s)"
              maxFiles={5} maxMB={10}
              existingFiles={files.teachingExpCerts}
              onUpload={f => handleMultiUpload(f, "teachingExpCerts")}
            />
          )}
          {expTypes.industrial && (
            <MultiFileUpload
              label="Industry Experience Certificate(s) (highlighting nature of work)"
              maxFiles={5} maxMB={10}
              existingFiles={files.industryExpCerts}
              onUpload={f => handleMultiUpload(f, "industryExpCerts")}
            />
          )}

          {/* Experience entries */}
          {experiences.map((exp, i) => (
            <div key={i} className="border rounded-lg p-4 bg-gray-50 space-y-3">
              <div className="flex justify-between items-center">
                <p className="text-sm font-semibold text-gray-600">Experience {i+1}</p>
                <button onClick={() => removeExperience(i)} className="text-red-500 text-xs hover:underline">Remove</button>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={labelCls}>Type</label>
                  <select value={exp.type || ""} className={inputCls}
                    onChange={e => handleExpChange(i, "type", e.target.value)}
                    onBlur={() => saveNow({ experiences })}>
                    <option value="">Select type</option>
                    <option>Research</option>
                    <option>Teaching</option>
                    <option>Industrial</option>
                  </select>
                </div>
                {[
                  { field:"organization", label:"Organization" },
                  { field:"designation",  label:"Designation"  },
                  { field:"department",   label:"Department"   },
                ].map(({ field, label }) => (
                  <div key={field}>
                    <label className={labelCls}>{label}</label>
                    <input value={exp[field] || ""} placeholder={`Enter ${label}`} className={inputCls}
                      onChange={e => handleExpChange(i, field, e.target.value)}
                      onBlur={() => saveNow({ experiences })} />
                  </div>
                ))}
                <div className="col-span-2">
                  <label className={labelCls}>Nature of Work</label>
                  <input value={exp.natureOfWork || ""} placeholder="Describe nature of work" className={inputCls}
                    onChange={e => handleExpChange(i, "natureOfWork", e.target.value)}
                    onBlur={() => saveNow({ experiences })} />
                </div>
                <div>
                  <label className={labelCls}>From Date</label>
                  <input type="date" value={exp.fromDate?.split("T")[0] || ""} className={inputCls}
                    onChange={e => handleExpChange(i, "fromDate", e.target.value)}
                    onBlur={() => saveNow({ experiences })} />
                </div>
                <div>
                  <label className={labelCls}>To Date</label>
                  <input type="date" value={exp.toDate?.split("T")[0] || ""} className={inputCls}
                    onChange={e => handleExpChange(i, "toDate", e.target.value)}
                    onBlur={() => saveNow({ experiences })} />
                </div>
              </div>
            </div>
          ))}

          <button onClick={addExperience}
            className="border border-red-500 text-red-500 px-4 py-2 rounded text-sm hover:bg-red-50">
            + Add Experience
          </button>
        </div>

        {/* ── PUBLICATIONS ── */}
        <div className="bg-white p-6 rounded shadow space-y-4">
          <h2 className="font-semibold text-lg border-b pb-2">Five Best Publications</h2>
          {[0,1,2,3,4].map(i => (
            <div key={i}>
              <label className={labelCls}>Publication {i+1}</label>
              <input placeholder={`Enter publication ${i+1} (title, journal, year...)`}
                className={inputCls}
                defaultValue={publications[i] || ""}
                onBlur={e => handlePublicationBlur(i, e.target.value)} />
            </div>
          ))}
        </div>

        {/* ── OTHER DOCUMENTS ── */}
        <div ref={otherRef} className="bg-white p-6 rounded shadow space-y-4">
          <h2 className="font-semibold text-lg border-b pb-2">Other Documents</h2>
          <FileUpload label="Upload Additional Documents (if any)" />
        </div>

        {/* ── REFEREES ── */}
        <div ref={refRef} className="bg-white p-6 rounded shadow space-y-6">
          <div>
            <h2 className="font-semibold text-lg">Referee Details</h2>
            <p className="text-sm text-red-600 mt-1">Minimum 3 referees are compulsory. All three marked with * are required.</p>
          </div>

          {referees.map((ref, i) => (
            <div key={i} className="border rounded-lg p-4 bg-gray-50 space-y-4">
              <div className="flex justify-between items-center">
                <p className="text-sm font-semibold text-gray-600">
                  Referee {i+1} {i < 3 && <span className="text-red-500">*</span>}
                </p>
                {i >= 3 && (
                  <button
                    onClick={() => { const u=referees.filter((_,idx)=>idx!==i); setReferees(u); saveNow({referees:u}); }}
                    className="text-red-500 text-xs hover:underline">Remove</button>
                )}
              </div>
              <div className="grid grid-cols-2 gap-4">
                {[
                  { field:"name",        label:"Full Name",   span:1 },
                  { field:"designation", label:"Designation", span:1 },
                  { field:"department",  label:"Department",  span:1 },
                  { field:"institute",   label:"Institute",   span:1 },
                  { field:"email",       label:"Email",       span:2 },
                ].map(({ field, label, span }) => (
                  <div key={field} className={span===2 ? "col-span-2" : ""}>
                    <label className={labelCls}>
                      {label} {i < 3 && <span className="text-red-500">*</span>}
                    </label>
                    <input value={ref[field] || ""} placeholder={`Enter ${label}`}
                      className={inputCls}
                      onChange={e => handleRefereeChange(i, field, e.target.value)}
                      onBlur={() => saveNow()} />
                  </div>
                ))}
              </div>
            </div>
          ))}

          <button
            onClick={() => setReferees([...referees, { ...EMPTY_REFEREE }])}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded text-sm">
            + Add More Referee
          </button>
        </div>

        {/* ── REFEREE STATUS (shows after submission) ── */}
        <RefereeStatus />

        {/* ── ACCOMMODATION ── */}
        <div ref={accRef} className="bg-white p-6 rounded shadow space-y-3">
          <h2 className="font-semibold text-lg border-b pb-2">Accommodation Requirement</h2>
          <div className="flex gap-6">
            {[{label:"Yes — accommodation required",val:true},{label:"No",val:false}].map(({label,val})=>(
              <label key={label} className="flex items-center gap-2 cursor-pointer text-sm">
                <input type="radio" name="acc"
                  checked={application.accommodation === val}
                  onChange={()=>{ const u={...application,accommodation:val}; setApplication(u); saveNow(u); }} />
                {label}
              </label>
            ))}
          </div>
        </div>
            <OnboardingStatus />
        {/* ── SUBMIT ── */}
        <div className="flex justify-end gap-4 pb-8">
          <button onClick={saveDraft} className="border px-6 py-2 rounded text-sm hover:bg-gray-50">
            Save Draft
          </button>
          <button onClick={submitApplication}
            className="bg-red-600 text-white px-6 py-2 rounded text-sm hover:bg-red-700">
            Submit Application
          </button>
        </div>

      </div>
    </div>
  );
}
import { useState, useRef, useEffect, useCallback } from "react";
import {
  FaHome, FaUser, FaFileAlt, FaBriefcase,
  FaUsers, FaFolderOpen, FaBed
} from "react-icons/fa";
import FileUpload from "../../components/FileUpload";
import API from "../../api/api";
import { useNavigate } from "react-router-dom";
import RefereeStatus from "../../components/RefereeStatus";

const EMPTY_REFEREE   = { name:"", designation:"", department:"", institute:"", email:"" };
const EMPTY_EXPERIENCE = { organization:"", designation:"", department:"", fromDate:"", toDate:"", natureOfWork:"" };

export default function CandidateDashboard() {
  const navigate = useNavigate();

  /* ── refs for scroll-nav ── */
  const personalRef = useRef(null);
  const docsRef     = useRef(null);
  const expRef      = useRef(null);
  const refRef      = useRef(null);
  const otherRef    = useRef(null);
  const accRef      = useRef(null);

  /* ── state ── */
  const [application, setApplication] = useState({
    name:"", email:"", contact:"", department:"", acceptance: false
  });
  const [files, setFiles] = useState({
    cv:null, teachingStatement:null, researchStatement:null,
    marks10:null, marks12:null, graduation:null,
    postGraduation:null, phdMarksheet:null, phdProvisional:null
  });
  // FIX 1: always keep 5 slots
  const [publications, setPublications] = useState(["","","","",""]);
  // FIX 2: experiences with proper initial state
  const [experiences, setExperiences]   = useState([]);
  const [referees, setReferees]         = useState([{ ...EMPTY_REFEREE }]);

  /* ── helper: build full save payload ── */
  const buildPayload = useCallback((overrides = {}) => ({
    ...application,
    publications,
    documents:    files,
    experiences,          // FIX 2: always included
    referees,
    ...overrides,
  }), [application, publications, files, experiences, referees]);

  /* ── fetch on mount ── */
  useEffect(() => {
    const fetch = async () => {
      const res = await API.get("/candidate/me");
      const app = res.data || {};

      setApplication({
        name:       app.name       || "",
        email:      app.email      || "",
        contact:    app.contact    || app.phone || "",
        department: app.department || "",
        acceptance: app.acceptance || false,
      });

      setFiles({
        cv:               app.documents?.cv               || null,
        teachingStatement:app.documents?.teachingStatement|| null,
        researchStatement:app.documents?.researchStatement|| null,
        marks10:          app.documents?.marks10          || null,
        marks12:          app.documents?.marks12          || null,
        graduation:       app.documents?.graduation       || null,
        postGraduation:   app.documents?.postGraduation   || null,
        phdMarksheet:     app.documents?.phdMarksheet     || null,
        phdProvisional:   app.documents?.phdProvisional   || null,
      });

      // FIX 1: guard against empty array wiping the 5 inputs
      if (app.publications && app.publications.length > 0) {
        // ensure exactly 5 slots
        const pubs = [...app.publications];
        while (pubs.length < 5) pubs.push("");
        setPublications(pubs.slice(0, 5));
      }

      // FIX 2: restore experiences
      if (app.experiences && app.experiences.length > 0) {
        setExperiences(app.experiences);
      }

      if (app.referees && app.referees.length > 0) {
        setReferees(app.referees);
      }
    };
    fetch();
  }, []);

  /* ── auto-save every 10 s ── */
  useEffect(() => {
    const id = setInterval(() => {
      API.post("/candidate/save", buildPayload()).catch(() => {});
    }, 10000);
    return () => clearInterval(id);
  }, [buildPayload]);

  /* ── save helpers ── */
  const saveNow = (overrides = {}) =>
    API.post("/candidate/save", buildPayload(overrides)).catch(console.error);

  const saveDraft = async () => {
    try {
      await saveNow();
      alert("Draft saved");
    } catch (err) { console.error(err); }
  };

  const submitApplication = async () => {
    try {
      await saveNow();                      // ensure latest data is persisted
      await API.post("/candidate/submit");
      alert("Application submitted successfully");
    } catch (err) { console.error(err); }
  };

  /* ── file upload ── */
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

  /* ── publications ── */
  // FIX 1: save on blur, not on every keystroke
  const handlePublicationBlur = (i, value) => {
    const arr = [...publications];
    arr[i] = value;
    setPublications(arr);
    saveNow({ publications: arr });
  };

  /* ── experience ── */
  // FIX 2: update a field in an experience row
  const handleExpChange = (i, field, value) => {
    const updated = experiences.map((e, idx) =>
      idx === i ? { ...e, [field]: value } : e
    );
    setExperiences(updated);
  };

  const handleExpBlur = (updatedExps) => {
    saveNow({ experiences: updatedExps || experiences });
  };

  const addExperience = () => {
    const updated = [...experiences, { ...EMPTY_EXPERIENCE }];
    setExperiences(updated);
  };

  const removeExperience = (i) => {
    const updated = experiences.filter((_, idx) => idx !== i);
    setExperiences(updated);
    saveNow({ experiences: updated });
  };

  /* ── referees ── */
  const handleRefereeChange = (i, field, value) => {
    const updated = referees.map((r, idx) =>
      idx === i ? { ...r, [field]: value } : r
    );
    setReferees(updated);
  };

  const scrollTo = (ref) => ref.current?.scrollIntoView({ behavior:"smooth" });

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("role");
    navigate("/login");
  };

  /* ════════════════════════════════════════════
     RENDER
  ════════════════════════════════════════════ */
  return (
    <div className="flex min-h-screen bg-gray-100">

      {/* SIDEBAR */}
      <aside className="fixed left-0 top-0 h-screen w-64 bg-white shadow-md z-10">
        <div className="p-6 border-b font-bold text-lg flex items-center gap-2">
          <div className="bg-red-600 text-white w-8 h-8 flex items-center justify-center rounded text-sm">IP</div>
          Institute Portal
        </div>
        <nav className="p-4 space-y-3 text-gray-700 text-sm">
          {[
            { icon:<FaHome/>,    label:"Dashboard",    ref:null        },
            { icon:<FaUser/>,    label:"Personal Info", ref:personalRef },
            { icon:<FaFileAlt/>, label:"Documents",     ref:docsRef     },
            { icon:<FaBriefcase/>,label:"Experience",   ref:expRef      },
            { icon:<FaUsers/>,   label:"Referees",      ref:refRef      },
            { icon:<FaFolderOpen/>,label:"Other Docs",  ref:otherRef    },
            { icon:<FaBed/>,     label:"Accommodation", ref:accRef      },
          ].map(({ icon, label, ref }) => (
            <div key={label}
              onClick={() => ref && scrollTo(ref)}
              className="flex items-center gap-3 cursor-pointer hover:text-red-600 transition">
              {icon} {label}
            </div>
          ))}
        </nav>
      </aside>

      {/* MAIN */}
      <div className="ml-64 flex-1 p-8 space-y-8">

        {/* Header */}
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold">Candidate Application Portal</h1>
          <button onClick={handleLogout} className="bg-red-600 text-white px-4 py-2 rounded">
            Logout
          </button>
        </div>

        <div className="bg-green-100 text-green-700 p-3 rounded text-sm">
          Welcome! Please fill in all required details and upload the necessary documents.
        </div>

        {/* ── PERSONAL INFO ── */}
        <div ref={personalRef} className="bg-white p-6 rounded shadow space-y-4">
          <h2 className="font-semibold text-lg">Personal Information</h2>
          <div className="grid grid-cols-2 gap-4">
            {[
              { key:"name",       placeholder:"Full Name"              },
              { key:"email",      placeholder:"Email"                  },
              { key:"contact",    placeholder:"Contact Number"         },
              { key:"department", placeholder:"Department Applied For" },
            ].map(({ key, placeholder }) => (
              <input key={key}
                value={application[key]}
                placeholder={placeholder}
                className="border p-2 rounded"
                onChange={e => setApplication({ ...application, [key]: e.target.value })}
                onBlur={() => saveNow()}
              />
            ))}
          </div>

          <div className="flex gap-6">
            {[
              { label:"Yes, I accept",  val:true  },
              { label:"No, I decline",  val:false },
            ].map(({ label, val }) => (
              <label key={label} className="flex items-center gap-2 cursor-pointer">
                <input type="radio" name="acceptance"
                  checked={application.acceptance === val}
                  onChange={() => {
                    const updated = { ...application, acceptance: val };
                    setApplication(updated);
                    saveNow({ ...updated });
                  }}
                />
                {label}
              </label>
            ))}
          </div>
        </div>

        {/* ── DOCUMENTS ── */}
        <div ref={docsRef} className="bg-white p-6 rounded shadow space-y-6">
          <h2 className="font-semibold text-lg">Document Uploads</h2>
          <div className="grid grid-cols-2 gap-6">
            <FileUpload label="Upload CV"           file={files.cv}               onUpload={f=>handleUpload(f,"cv")} />
            <FileUpload label="Teaching Statement"  file={files.teachingStatement} onUpload={f=>handleUpload(f,"teachingStatement")} />
            <div className="col-span-2">
              <FileUpload label="Research Statement" file={files.researchStatement} onUpload={f=>handleUpload(f,"researchStatement")} />
            </div>
          </div>
        </div>

        {/* ── CERTIFICATES ── */}
        <div className="bg-white p-6 rounded shadow space-y-6">
          <h2 className="font-semibold text-lg">Academic Certificates</h2>
          <div className="grid grid-cols-2 gap-6">
            {[
              { label:"10th Marksheet",              key:"marks10"        },
              { label:"12th Marksheet",              key:"marks12"        },
              { label:"Graduation Certificate",      key:"graduation"     },
              { label:"Post Graduation Certificate", key:"postGraduation" },
              { label:"PhD Marksheet",               key:"phdMarksheet"   },
              { label:"PhD Provisional",             key:"phdProvisional" },
            ].map(({ label, key }) => (
              <FileUpload key={key} label={label} file={files[key]} onUpload={f=>handleUpload(f, key)} />
            ))}
          </div>
        </div>

        {/* ── PUBLICATIONS ── FIX 1: use defaultValue + onBlur so inputs are always visible */}
        <div className="bg-white p-6 rounded shadow space-y-4">
          <h2 className="font-semibold text-lg">Five Best Publications</h2>
          {[0,1,2,3,4].map(i => (
            <input
              key={i}
              placeholder={`Publication ${i+1}`}
              className="border p-2 rounded w-full"
              defaultValue={publications[i] || ""}
              onBlur={e => handlePublicationBlur(i, e.target.value)}
            />
          ))}
        </div>

        {/* ── EXPERIENCE ── FIX 2: controlled inputs + saved */}
        <div ref={expRef} className="bg-white p-6 rounded shadow space-y-4">
          <h2 className="font-semibold text-lg">Post-PhD Experience</h2>

          {experiences.map((exp, i) => (
            <div key={i} className="border rounded-lg p-4 bg-gray-50 space-y-3">
              <div className="flex justify-between items-center">
                <p className="text-sm font-semibold text-gray-600">Experience {i+1}</p>
                <button onClick={() => removeExperience(i)}
                  className="text-red-500 text-xs hover:underline">Remove</button>
              </div>

              <div className="grid grid-cols-2 gap-3">
                {[
                  { field:"organization", placeholder:"Organization"   },
                  { field:"designation",  placeholder:"Designation"    },
                  { field:"department",   placeholder:"Department"     },
                  { field:"natureOfWork", placeholder:"Nature of Work", span:2 },
                ].map(({ field, placeholder, span }) => (
                  <input key={field}
                    value={exp[field] || ""}
                    placeholder={placeholder}
                    className={`border p-2 rounded ${span===2 ? "col-span-2" : ""}`}
                    onChange={e => handleExpChange(i, field, e.target.value)}
                    onBlur={() => handleExpBlur(experiences)}
                  />
                ))}

                <div className="flex flex-col gap-1">
                  <label className="text-xs text-gray-500">From Date</label>
                  <input type="date" value={exp.fromDate || ""}
                    className="border p-2 rounded"
                    onChange={e => handleExpChange(i, "fromDate", e.target.value)}
                    onBlur={() => handleExpBlur(experiences)}
                  />
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-xs text-gray-500">To Date</label>
                  <input type="date" value={exp.toDate || ""}
                    className="border p-2 rounded"
                    onChange={e => handleExpChange(i, "toDate", e.target.value)}
                    onBlur={() => handleExpBlur(experiences)}
                  />
                </div>
              </div>
            </div>
          ))}

          <button onClick={addExperience}
            className="border border-red-500 text-red-500 px-4 py-2 rounded hover:bg-red-50 transition">
            + Add Experience
          </button>
        </div>

        {/* ── OTHER DOCUMENTS ── */}
        <div ref={otherRef} className="bg-white p-6 rounded shadow space-y-4">
          <h2 className="font-semibold text-lg">Other Documents</h2>
          <FileUpload label="Upload Additional Documents" />
        </div>

        {/* ── REFEREES ── */}
        <div ref={refRef} className="bg-white p-6 rounded shadow space-y-6">
          <h2 className="font-semibold text-lg">Referee Details</h2>

          {referees.map((ref, i) => (
            <div key={i} className="border rounded-lg p-4 bg-gray-50 space-y-4">
              <div className="flex justify-between items-center">
                <p className="text-sm font-semibold text-gray-500">Referee {i+1}</p>
                {referees.length > 1 && (
                  <button
                    onClick={() => {
                      const updated = referees.filter((_,idx)=>idx!==i);
                      setReferees(updated);
                      saveNow({ referees: updated });
                    }}
                    className="text-red-500 text-xs hover:underline">Remove</button>
                )}
              </div>
              <div className="grid grid-cols-2 gap-4">
                {[
                  { field:"name",        placeholder:"Full Name",   span:1 },
                  { field:"designation", placeholder:"Designation", span:1 },
                  { field:"department",  placeholder:"Department",  span:1 },
                  { field:"institute",   placeholder:"Institute",   span:1 },
                  { field:"email",       placeholder:"Email",       span:2 },
                ].map(({ field, placeholder, span }) => (
                  <input key={field}
                    value={ref[field] || ""}
                    placeholder={placeholder}
                    className={`border p-2 rounded ${span===2?"col-span-2":""}`}
                    onChange={e => handleRefereeChange(i, field, e.target.value)}
                    onBlur={() => saveNow()}
                  />
                ))}
              </div>
            </div>
          ))}

          <button
            onClick={() => setReferees([...referees, { ...EMPTY_REFEREE }])}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded">
            + Add Referee
          </button>
        </div>
        <RefereeStatus />

        {/* ── ACCOMMODATION ── */}
        <div ref={accRef} className="bg-white p-6 rounded shadow space-y-3">
          <h2 className="font-semibold text-lg">Accommodation</h2>
          <div className="flex gap-6">
            {[{label:"Yes",val:true},{label:"No",val:false}].map(({label,val})=>(
              <label key={label} className="flex items-center gap-2 cursor-pointer">
                <input type="radio" name="acc"
                  checked={application.accommodation === val}
                  onChange={()=>{
                    const updated={...application,accommodation:val};
                    setApplication(updated);
                    saveNow({...updated});
                  }}
                />
                {label}
              </label>
            ))}
          </div>
        </div>

        {/* ── SUBMIT ── */}
        <div className="flex justify-end gap-4 pb-8">
          <button onClick={saveDraft} className="border px-6 py-2 rounded hover:bg-gray-50">
            Save Draft
          </button>
          <button onClick={submitApplication} className="bg-red-600 text-white px-6 py-2 rounded hover:bg-red-700">
            Submit Application
          </button>
        </div>

      </div>
    </div>
  );
}
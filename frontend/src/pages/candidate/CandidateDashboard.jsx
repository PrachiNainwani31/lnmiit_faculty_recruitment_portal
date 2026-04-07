// pages/candidate/CandidateDashboard.jsx
import { useState, useEffect, useCallback } from "react";
import { FaHome, FaFileAlt } from "react-icons/fa";
import API        from "../../api/api";
import { useNavigate } from "react-router-dom";
import logo       from "../../assets/lnmiit_logo.png";
import CandidateHome from "../../components/candidate/Candidatehome";
import CandidateForm from "../../components/candidate/Candidateform";

// Add at the top of CandidateDashboard.jsx after imports:
const validateEmail = (v) => v && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v)
  ? "Please enter a valid email address" : null;

const validatePhone = (v) => v && !/^\d{10}$/.test(v.replace(/\s/g, ""))
  ? "Phone must be exactly 10 digits" : null;

const EMPTY_EXP     = { type:"", organization:"", designation:"", department:"",
  fromDate:"", toDate:"", natureOfWork:"", ongoing:false, certificate:"" };
const EMPTY_REFEREE = { name:"", designation:"", department:"", institute:"", email:"" };

const cleanReferees = (refs) =>
  refs.filter(r => (r.name || "").trim() || (r.email || "").trim() || r.id);

const normalizeReferees = (savedRefs) => {
  const seen = new Set();
  const deduped = savedRefs.filter(r => {
    const key = (r.email || "").trim().toLowerCase();
    if (!key) return true;  // keep blank rows (required slots)
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
  const result = [...deduped];
  while (result.length < 3) result.push({ ...EMPTY_REFEREE });
  return result.slice(0, Math.max(deduped.length, 3));
};

export default function CandidateDashboard() {
  const navigate = useNavigate();
  const [view, setView] = useState("home");

  const [application, setApplication] = useState({
    name:"", email:"", contact:"", department:"",
    acceptance:false, accommodation:false, status:"DRAFT",
  });
  const [files,        setFiles]        = useState({
    docCv:null, docTeachingStatement:null, docResearchStatement:null,
    docMarks10:null, docMarks12:null, docGraduation:null, docPostGraduation:null,
    docPhdCourseWork:null, docPhdProvisional:null, docPhdDegree:null,
    docResearchExpCerts:[], docTeachingExpCerts:[], docIndustryExpCerts:[],
    docBestPapers:[], docPostDocDocs:[], docSalarySlips:[],docOtherDocs:[],
  });
  const [expTypes,     setExpTypes]     = useState({ research:false, teaching:false, industrial:false });
  const [publications, setPublications] = useState(["","","","",""]);
  const [experiences,  setExperiences]  = useState([{ ...EMPTY_EXP }]);
  const [referees,     setReferees]     = useState([EMPTY_REFEREE, EMPTY_REFEREE, EMPTY_REFEREE]);
  const [appLoaded,    setAppLoaded]    = useState(false);

  // ✅ QUERY status — treat as editable
  const isSubmitted = application.status === "SUBMITTED";
  const isQuery     = application.status === "QUERY";
  const isEditable  = application.status === "DRAFT" || isQuery;

  const buildPayload = useCallback((overrides = {}) => {
    const safeRefs = cleanReferees(referees);
    const safeExps = experiences.map(e => ({
    ...e,
    toDate: e.ongoing ? new Date().toISOString().split("T")[0] : (e.toDate || null),
  }));
    return { ...application, publications, documents: { ...files },
      experienceTypes: expTypes, experiences: safeExps, referees: safeRefs, ...overrides };
  }, [application, publications, files, expTypes, experiences, referees]);

  const saveNow = useCallback(async (overrides = {}) => {
  try {
    const res = await API.post("/candidate/save", buildPayload(overrides));
    return res.data;  // ← this is the key change
  } catch (err) {
    console.error(err);
    return null;
  }
}, [buildPayload]);

  useEffect(() => {
    API.get("/candidate/me").then(res => {
      const app = res.data || {};
      setApplication({
        name:          app.name          || "",
        email:         app.email         || "",
        contact:       app.contact       || app.phone || "",
        department:    app.department    || "",
        acceptance:    app.acceptance    || false,
        accommodation: app.accommodation || false,
        status:        app.status        || "DRAFT",
      });
      const docKeys = Object.keys(files);
      const docData = {};
      docKeys.forEach(k => { if (app[k] != null) docData[k] = app[k]; });
      if (Object.keys(docData).length) setFiles(f => ({ ...f, ...docData }));
      if (app.experienceTypes) setExpTypes(app.experienceTypes);
      if (app.publications?.length > 0) {
        const pubs = [...app.publications];
        while (pubs.length < 5) pubs.push("");
        setPublications(pubs.slice(0, 5));
      }
      if (app.experiences?.length > 0)
        setExperiences(app.experiences.map(e => ({ ...EMPTY_EXP, ...e,ongoing:!e.todate })));
      if (app.referees?.length > 0)
        setReferees(normalizeReferees(app.referees));
      setAppLoaded(true);
    }).catch(console.error);
  }, []);

  useEffect(() => {
  if (!appLoaded || isSubmitted || view !== "form") return;
  if (application.status !== "DRAFT" && application.status !== "QUERY") return;
  const id = setInterval(() => saveNow(), 15000);
  return () => clearInterval(id);
}, [appLoaded, application.status, view, saveNow]);

  const saveDraft = async () => { await saveNow(); alert("Draft saved"); };

  const submitApplication = async () => {
  // Validate required fields
  if (!application.name?.trim()) { alert("Please enter your full name"); return; }
  if (validateEmail(application.email)) { alert("Please enter a valid email address"); return; }
  if (validatePhone(application.contact)) { alert("Please enter a valid 10-digit phone number"); return; }
  if (!application.department) { alert("Please select a department"); return; }

  const filled = referees.filter(r => r.name && r.email);
  if (filled.length < 3) { alert("Please fill in at least 3 complete referee details."); return; }

  // Validate referee emails
  const badRefereeEmail = filled.find(r => validateEmail(r.email));
  if (badRefereeEmail) { alert(`Invalid email for referee: ${badRefereeEmail.name}`); return; }

  await saveNow();
  await API.post("/candidate/submit");
  setApplication(a => ({ ...a, status: "SUBMITTED" }));
  alert("Application submitted successfully!");
  setView("home");
};

  const handleLogout = () => { localStorage.clear(); navigate("/login"); };

  return (
    <div className="flex min-h-screen bg-gray-100">
      <aside className="fixed left-0 top-0 h-screen w-64 bg-white shadow-md z-10 flex flex-col">
        <div className="p-5 border-b flex flex-col items-center gap-2">
          <img src={logo} alt="LNMIIT" className="w-28 object-contain" />
          <span className="text-sm font-semibold text-gray-700">Institute Portal</span>
        </div>
        <nav className="p-4 space-y-1 text-gray-700 text-sm flex-1">
          {[
            { id:"home", icon:<FaHome/>,    label:"Dashboard" },
            {
              id:"form",
              icon:<FaFileAlt/>,
              label: isQuery ? "⚠ Revise Application" : isSubmitted ? "View Application" : "My Application",
            },
          ].map(({ id, icon, label }) => (
            <div key={id} onClick={() => setView(id)}
              className={`flex items-center gap-3 cursor-pointer rounded-lg px-3 py-2 transition ${
                view === id ? "bg-red-50 text-red-600 font-medium" : "hover:text-red-600 hover:bg-gray-50"
              } ${id === "form" && isQuery ? "text-amber-600 font-semibold" : ""}`}>
              {icon} {label}
            </div>
          ))}
        </nav>
        <button onClick={handleLogout}
          className="m-4 bg-red-600 text-white py-2 rounded text-sm hover:bg-red-700">
          Logout
        </button>
      </aside>

      <div className="ml-64 flex-1">
        {/* ✅ QUERY banner — shown on both home and form views */}
        {isQuery && (
          <div className="bg-amber-50 border-b border-amber-200 px-8 py-4 flex items-start gap-3">
            <span className="text-amber-500 text-xl shrink-0">⚠</span>
            <div className="flex-1">
              <p className="text-sm font-semibold text-amber-800">
                DOFA has flagged issues with your application
              </p>
              <p className="text-xs text-amber-600 mt-0.5">
                Please review your documents, make the necessary corrections, and resubmit.
              </p>
            </div>
            <button
              onClick={() => setView("form")}
              className="text-xs bg-amber-600 hover:bg-amber-700 text-white px-4 py-2 rounded-lg font-medium shrink-0"
            >
              Review & Resubmit
            </button>
          </div>
        )}

        {view === "home" && (
          <CandidateHome application={application} onOpenForm={() => setView("form")} />
        )}
        {view === "form" && (
          <CandidateForm
            application={application}    setApplication={setApplication}
            files={files}                setFiles={setFiles}
            expTypes={expTypes}          setExpTypes={setExpTypes}
            publications={publications}  setPublications={setPublications}
            experiences={experiences}    setExperiences={setExperiences}
            referees={referees}          setReferees={setReferees}
            // ✅ QUERY status means editable — only lock on SUBMITTED
            isReadOnly={isSubmitted}
            onBack={() => setView("home")}
            onSaveDraft={saveDraft}
            onSubmit={submitApplication}
            buildPayload={buildPayload}
            saveNow={saveNow}
            isQuery={isQuery}
          />
        )}
      </div>
    </div>
  );
}
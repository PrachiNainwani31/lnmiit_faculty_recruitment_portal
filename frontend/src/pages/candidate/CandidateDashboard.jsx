// pages/candidate/CandidateDashboard.jsx
import { useState, useEffect, useCallback,useRef } from "react";
import { FaHome, FaFileAlt } from "react-icons/fa";
import API        from "../../api/api";
import { useNavigate } from "react-router-dom";
import logo       from "../../assets/lnmiit_logo.png";
import CandidateHome from "../../components/candidate/Candidatehome";
import CandidateForm from "../../components/candidate/Candidateform";
import { showToast, showConfirm } from "../../components/ui/Toast";

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

  // const [application, setApplication] = useState({
  //   name:"", email:"", contact:"", department:"",
  //   acceptance:null, accommodation:false, status:"DRAFT",phdStatus:"",
  // });
const storedUser = JSON.parse(localStorage.getItem("user") || "{}");

const [application, setApplication] = useState({
  name:          storedUser.name  || "",   // ← pre-fill immediately
  email:         storedUser.email || "",   // ← pre-fill immediately
  contact:       "",
  department:    storedUser.department || "",
  acceptance:    null,
  accommodation: false,
  status:        "DRAFT",
  phdStatus:     "",
});
  const [files,        setFiles]        = useState({
    docCv:null, docTeachingStatement:null, docResearchStatement:null,
    docMarks10:null, docMarks12:null, docGraduation:null, docPostGraduation:null,
    docPhdCourseWork:null, docPhdProvisional:null, docPhdDegree:null,
    docThesisSubmission: null,docDateOfDefense: "", 
    docResearchExpCerts:[], docTeachingExpCerts:[], docIndustryExpCerts:[],
    docBestPapers:[], docPostDocDocs:[], docSalarySlips:[],docOtherDocs:[],
  });
  const [expTypes,     setExpTypes]     = useState({ research:false, teaching:false, industrial:false });
  const [publications, setPublications] = useState(["","","","",""]);
  const [experiences,  setExperiences]  = useState([{ ...EMPTY_EXP }]);
  const [referees,     setReferees]     = useState([EMPTY_REFEREE, EMPTY_REFEREE, EMPTY_REFEREE]);
  const [appLoaded,    setAppLoaded]    = useState(false);

  // QUERY status — treat as editable
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

    if (res.data?.experiences?.length > 0) {
      setExperiences(prev => prev.map((e, i) => ({
        ...e,
        id: res.data.experiences[i]?.id || e.id,
      })));
    }

    if (res.data?.referees?.length > 0) {
      setReferees(prev => prev.map(r => {
        if (r.id) return r;
        const match = res.data.referees.find(s =>
          s.email && r.email &&
          s.email.toLowerCase() === r.email.trim().toLowerCase()
        );
        return match ? { ...r, id: match.id } : r;
      }));
    }

    return res.data;
  } catch (err) {
    // 400 = already submitted — silent, don't log to console
    if (err?.response?.status === 400) return null;
    console.error("saveNow error:", err);
    return null;
  }
}, [buildPayload]);
  useEffect(() => {
    API.get("/candidate/me").then(res => {
      const app = res.data || {};
      const user = JSON.parse(localStorage.getItem("user") || "{}");
      const resolvedEmail = app.email || user.email || "";
      const resolvedName  = app.name  || user.name  || "";
      const resolvedDept  = app.department || user.department || "";

      setApplication(prev => ({
        ...prev,
        name:          resolvedName,
        email:         resolvedEmail,
        contact:       app.contact || app.phone || "",
        department:    resolvedDept,
        acceptance:    app.acceptance  ?? null,
        accommodation: app.accommodation ?? false,
        status:        app.status || "DRAFT",
        phdStatus:     app.phdStatus || "",
      }));
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

  const autoSaveRef = useRef(null);
  useEffect(() => {
  // Clear any existing interval first
  if (autoSaveRef.current) clearInterval(autoSaveRef.current);

  if (!appLoaded || isSubmitted || view !== "form") return;
  if (application.status !== "DRAFT" && application.status !== "QUERY") return;

  autoSaveRef.current = setInterval(() => saveNow(), 15000);
  return () => {
    clearInterval(autoSaveRef.current);
    autoSaveRef.current = null;
  };
}, [appLoaded, application.status, view, saveNow]);

  const saveDraft = async () => { await saveNow(); alert("Draft saved"); };

  const submitApplication = async () => {
    if (autoSaveRef.current) {
    clearInterval(autoSaveRef.current);
    autoSaveRef.current = null;
  }

  if (application.acceptance === false) {
    await saveNow();
    await API.post("/candidate/submit");
    setApplication(a => ({ ...a, status: "SUBMITTED" }));
    showToast("Response submitted successfully!");
    setView("home");
    return;
  }
   if (!application.name?.trim())      { alert("Full name is required");            return; }
  if (!application.email?.trim())     { alert("Email is required");                return; }
  if (validateEmail(application.email)) { alert("Please enter a valid email");     return; }
  if (!application.contact?.trim())   { alert("Contact number is required");       return; }
  if (validatePhone(application.contact)) { alert("Phone must be exactly 10 digits"); return; }
  if (!application.department)        { alert("Department is required");           return; }
  if (application.acceptance === null){ alert("Please select interview acceptance"); return; }

  // ── If declined, skip document checks ──
  if (application.acceptance !== false) {
    // Core documents
    if (!files.docCv)                  { alert("Resume is required");              return; }
    if (!files.docTeachingStatement)   { alert("Teaching Statement is required");  return; }
    if (!files.docResearchStatement)   { alert("Research Statement is required");  return; }
    if (!files.docMarks10)             { alert("10th Marksheet is required");      return; }
    if (!files.docMarks12)             { alert("12th Marksheet is required");      return; }
    if (!files.docGraduation)          { alert("Graduation Certificate is required"); return; }
    if (!files.docPostGraduation)      { alert("Post Graduation Certificate is required"); return; }

    // PhD status compulsory
    if (!application.phdStatus)        { alert("Please select PhD Thesis Status"); return; }

    // PhD status — conditional required docs (course work is optional, skipped)
    if (application.phdStatus === "defended") {
      if (!files.docDateOfDefense)     { alert("Date of Defense is required");     return; }
      if (!files.docPhdProvisional)    { alert("Provisional PhD Degree is required"); return; }
    }
    if (application.phdStatus === "submitted") {
      if (!files.docThesisSubmission)  { alert("Thesis Submission Certificate is required"); return; }
    }

    // Best papers
    if (!files.docBestPapers?.length)  { alert("Please upload at least 1 best paper"); return; }

    // Salary slips
    if (!files.docSalarySlips?.length) { alert("Please upload at least 1 salary slip"); return; }

    // Accommodation must be selected
    if (application.accommodation === null || application.accommodation === undefined) {
      alert("Please select accommodation preference"); return;
    }
  }

  // ── Referees ──
  const filled = referees.filter(r => r.name && r.email);
  if (filled.length < 3)             { alert("Please fill in at least 3 complete referee details"); return; }
  const badRef = filled.find(r => validateEmail(r.email));
  if (badRef)                        { alert(`Invalid email for referee: ${badRef.name}`); return; }

  try {
    await saveNow();
    await API.post("/candidate/submit");
    setApplication(a => ({ ...a, status: "SUBMITTED" }));
    showToast("Documents submitted successfully!");
    setView("home");
  } catch (err) {
    showToast(err.response?.data?.message || "Submission failed", "error");
  }
};
  const handleLogout = () => { localStorage.clear(); navigate("/login"); };

  return (
    <div className="flex min-h-screen bg-gray-100">
      <aside className="fixed left-0 top-0 h-screen w-64 bg-white shadow-md z-10 flex flex-col">
        <div className="p-5 border-b flex flex-col items-center gap-2">
          <img src={logo} alt="LNMIIT" className="w-28 object-contain" />
          <span className="text-sm font-semibold text-gray-700">LNMIIT Faculty Recruitment and Onboarding Portal</span>
        </div>
        <nav className="p-4 space-y-1 text-gray-700 text-sm flex-1">
          {[
            { id:"home", icon:<FaHome/>,    label:"Dashboard" },
            {
              id:"form",
              icon:<FaFileAlt/>,
              label: isQuery ? "Revise Documents" : isSubmitted ? "View Documents" : "My Documents",
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
            <div className="flex-1">
              <p className="text-sm font-semibold text-amber-800">
                DOFA has flagged issues with your documents
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

        {view === "home" && (appLoaded&&
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
// pages/candidate/CandidateDashboard.jsx
import { useState, useEffect, useCallback } from "react";
import { FaHome, FaFileAlt } from "react-icons/fa";
import API        from "../../api/api";
import { useNavigate } from "react-router-dom";
import logo       from "../../assets/lnmiit_logo.png";
import CandidateHome from "../../components/candidate/Candidatehome";
import CandidateForm from "../../components/candidate/Candidateform";

const EMPTY_EXP     = { type:"", organization:"", designation:"", department:"",
  fromDate:"", toDate:"", natureOfWork:"", ongoing:false, certificate:"" };
const EMPTY_REFEREE = { name:"", designation:"", department:"", institute:"", email:"" };

export default function CandidateDashboard() {
  const navigate = useNavigate();
  const [view, setView] = useState("home");

  const [application, setApplication] = useState({
    name:"", email:"", contact:"", department:"",
    acceptance:false, accommodation:false, status:"DRAFT",
  });
  const [files, setFiles] = useState({
    cv:null, teachingStatement:null, researchStatement:null,
    marks10:null, marks12:null, graduation:null, postGraduation:null,
    phdCourseWork:null, phdProvisional:null, phdDegree:null, dateOfDefense:"",
    researchExpCerts:[], teachingExpCerts:[], industryExpCerts:[],
    bestPapers:[], postDocDocs:[], salarySlips:[],
  });
  const [expTypes,     setExpTypes]     = useState({ research:false, teaching:false, industrial:false });
  const [publications, setPublications] = useState(["","","","",""]);
  const [experiences,  setExperiences]  = useState([{ ...EMPTY_EXP }]);
  const [referees,     setReferees]     = useState([EMPTY_REFEREE, EMPTY_REFEREE, EMPTY_REFEREE]);
  const [appLoaded,    setAppLoaded]    = useState(false);

  const isSubmitted = application.status === "SUBMITTED";

  const buildPayload = useCallback((overrides={}) => ({
    ...application, publications,
    documents: { ...files },
    experienceTypes: expTypes,
    experiences, referees,
    ...overrides,
  }), [application, publications, files, expTypes, experiences, referees]);

  const saveNow = useCallback((overrides={}) =>
    API.post("/candidate/save", buildPayload(overrides)).catch(console.error),
  [buildPayload]);

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
      if (app.documents)       setFiles(f => ({ ...f, ...app.documents }));
      if (app.experienceTypes) setExpTypes(app.experienceTypes);
      if (app.publications?.length > 0) {
        const pubs = [...app.publications];
        while (pubs.length < 5) pubs.push("");
        setPublications(pubs.slice(0,5));
      }
      if (app.experiences?.length > 0)
        setExperiences(app.experiences.map(e => ({ ...EMPTY_EXP, ...e })));
      if (app.referees?.length > 0) setReferees(app.referees);
      setAppLoaded(true);
    }).catch(console.error);
  }, []);

  useEffect(() => {
    if (!appLoaded || isSubmitted || view !== "form") return;
    const id = setInterval(() => saveNow(), 15000);
    return () => clearInterval(id);
  }, [appLoaded, isSubmitted, view, saveNow]);

  const saveDraft = async () => { await saveNow(); alert("Draft saved"); };

  const submitApplication = async () => {
    const filled = referees.filter(r => r.name && r.email);
    if (filled.length < 3) {
      alert("Please fill in at least 3 complete referee details."); return;
    }
    await saveNow();
    await API.post("/candidate/submit");
    setApplication(a => ({ ...a, status:"SUBMITTED" }));
    alert("Application submitted successfully! Emails sent to referees.");
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
            { id:"home", icon:<FaHome/>, label:"Dashboard" },
            { id:"form", icon:<FaFileAlt/>, label: isSubmitted ? "View Application" : "My Application" },
          ].map(({ id, icon, label }) => (
            <div key={id} onClick={() => setView(id)}
              className={`flex items-center gap-3 cursor-pointer rounded-lg px-3 py-2 transition ${
                view===id ? "bg-red-50 text-red-600 font-medium" : "hover:text-red-600 hover:bg-gray-50"
              }`}>
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
            isReadOnly={isSubmitted}
            onBack={() => setView("home")}
            onSaveDraft={saveDraft}
            onSubmit={submitApplication}
            buildPayload={buildPayload}
            saveNow={saveNow}
          />
        )}
      </div>
    </div>
  );
}
// frontend/api/dofaApi.js
import API from "./api";

/* ── Cycle / Dashboard ── */
export const getCurrentCycle         = ()         => API.get("/cycle/current");
export const approveCycle            = (hodId)    => API.post("/cycle/approve", { hodId });
export const raiseQuery              = (comment, hodId) => API.post("/cycle/query", { comment, hodId });
export const getDofaDashboard        = ()         => API.get("/cycle/dofa-dashboard");

// ── NEW: DoFA sets teaching-interaction + interview dates ──────────────
// After calling this, HoD's "Mark Appeared" toggle becomes active
export const setInterviewDates = ({ hodId, teachingInteractionDate, interviewDate }) =>
  API.post("/cycle/set-dates", { hodId, teachingInteractionDate, interviewDate });

/* ── Candidates ── */
export const getCandidatesByDepartment = (dept)  => API.get(`/hod/candidates/department/${dept}`);
export const downloadDepartmentResumes = (dept)  =>
  API.get(`/dofa/resumes/${dept}`, { responseType: "blob" });

/* ── Experts ── */
export const getExpertsByDepartment = (dept)  => API.get(`/hod/experts/department/${dept}`);
export const getAllExperts           = ()      => API.get("/hod/experts/all");

/* ── Document tracking ── */
export const getCandidateDocuments = ()       => API.get("/dofa/documents");
export const getDocumentTracking   = ()       => API.get("/dofa/document-tracking");
export const updateVerdict         = (data)   => API.post("/dofa/document-verdict", data);
export const sendReminder          = (data)   => API.post("/dofa/document-reminder", data);
import API from "./api";

/* =========================
   CYCLE / DASHBOARD
========================= */

export const getCurrentCycle = () =>
  API.get("/cycle/current");

export const approveCycle = (hodId) =>
  API.post("/cycle/approve", { hodId });

export const raiseQuery = (comment, hodId) =>
  API.post("/cycle/query", { comment, hodId });

export const getDofaDashboard = () =>
  API.get("/cycle/dofa-dashboard");

export const getCandidatesByDepartment = (dept) =>
  API.get(`/hod/candidates/department/${dept}`);

export const downloadDepartmentResumes = (department) =>
  API.get(`/dofa/resumes/${department}`, {
    responseType: "blob",
  });

export const getExpertsByDepartment = (dept) =>
  API.get(`/hod/experts/department/${dept}`);

export const getAllExperts = () =>
  API.get("/hod/experts/all");

export const getCandidateDocuments = () =>
  API.get("/dofa/documents");

export const getDocumentTracking = () =>
API.get("/dofa/document-tracking")

export const updateVerdict = (data) =>
API.post("/dofa/document-verdict",data)

export const sendReminder = (data) =>
API.post("/dofa/document-reminder",data)
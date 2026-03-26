import API from "./api";

export const saveCandidateStats = (data) =>
  API.post("/hod/candidates/stats", data);

export const getCandidateStats = (cycle) =>
  API.get(`/hod/candidates/stats`);

export const downloadCandidateTemplate = (cycle) =>
  API.get(`/hod/candidates/template/${cycle}`, {
    responseType: "blob",
  });

export const uploadCandidatesCSV = (formData) =>
  API.post("/hod/candidates/upload", formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });

export const clearCandidateStats = (cycle) =>
  API.delete(`/hod/candidates/clear/${cycle}`);

export const getCandidatesByCycle = (cycle) =>
  API.get(`/hod/candidates/${cycle}`);

export const deleteCandidateById = (id) =>
  API.delete(`/hod/candidates/${id}`);

export const getCandidateStatus = (cycle) =>
  API.get(`/hod/candidates/status`);

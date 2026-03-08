import API from "./api";

export const uploadCandidates = (formData) =>
  API.post("/hod/candidates/upload", formData);

export const getCandidates = (cycle) =>
  API.get(`/hod/candidates/${cycle}`);

export const addExpert = (data) =>
  API.post("/hod/experts", data);

export const getExperts = () =>
  API.get("/hod/experts");

export const clearExperts = async () => {
  return API.delete("/hod/experts/clear");
};

export const deleteCandidate = (id) =>
  API.delete(`/hod/candidates/${id}`);

export const deleteAllCandidates = (cycle) =>
  API.delete(`/hod/candidates/clear/${cycle}`);

export const getHodCounts = () =>
  API.get("/hod/counts");

export const submitToDofa = () =>
  API.post("/cycle/submit");

export const uploadExpertsCSV = async (file) => {
  const formData = new FormData();
  formData.append("file", file);

  return API.post("/hod/upload-experts", formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
};

export const getCurrentCycle = () =>
  API.get("/cycle/current");

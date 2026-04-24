import axios from "axios";

const API = axios.create({
  baseURL: import.meta.env.VITE_API_URL + "/api",
});

API.interceptors.request.use((req) => {
  req.headers.Authorization =
    "Bearer " + localStorage.getItem("token");
  return req;
});

export const getCurrentCycle = () => API.get("/cycle/current");
export const getCandidates = (cycle) =>
  API.get(`/hod/candidates/${cycle}`);
export const getExperts = () => API.get("/hod/experts");
export const approveCycle = () => API.post("/cycle/approve");
export const raiseQuery = (comment) =>
  API.post("/cycle/query", { comment });

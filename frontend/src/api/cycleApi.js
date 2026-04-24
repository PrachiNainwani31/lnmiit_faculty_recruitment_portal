import axios from "axios";

const API = axios.create({
  baseURL: import.meta.env.VITE_API_URL + "/api/cycle",
});

export const getCurrentCycle = () => API.get("/current");
export const submitToDofa = () => API.post("/submit");
export const raiseQuery = (comment) => API.post("/query", { comment });
export const approveCycle = () => API.post("/approve");

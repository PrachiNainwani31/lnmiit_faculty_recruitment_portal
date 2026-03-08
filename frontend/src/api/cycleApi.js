import axios from "axios";

const API = axios.create({
  baseURL: "http://localhost:5000/api/cycle",
});

export const getCurrentCycle = () => API.get("/current");
export const submitToDofa = () => API.post("/submit");
export const raiseQuery = (comment) => API.post("/query", { comment });
export const approveCycle = () => API.post("/approve");

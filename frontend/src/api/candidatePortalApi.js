import API from "./api";

export const getCandidateProfile = () =>
  API.get("/candidate/profile");

export const updateCandidateProfile = (data) =>
  API.put("/candidate/profile", data);
const express = require("express");
const router = express.Router();
const auth = require("../middlewares/auth");
const { downloadDepartmentResumes } = require("../controllers/dofa.controller");

router.get(
  "/resumes/:department",
  auth(["DOFA"]),
  downloadDepartmentResumes
);
module.exports = router;

const express = require("express");
const router = express.Router();
const auth = require("../middlewares/auth");
const controller = require("../controllers/candidatePortal.controller");
const upload = require("../middlewares/upload");

router.get("/me", auth(["CANDIDATE"]), controller.getMyApplication);

router.post("/save", auth(["CANDIDATE"]), controller.saveDraft);

router.post("/submit", auth(["CANDIDATE"]), controller.submitApplication);

router.post("/referee/reminder/:id", auth(["CANDIDATE"]), controller.remindReferee);
router.post("/upload",auth(["CANDIDATE"]),upload.single("file"),controller.uploadDocument);
module.exports = router;
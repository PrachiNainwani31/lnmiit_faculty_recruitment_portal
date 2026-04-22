const express = require("express");
const router  = express.Router();
const auth    = require("../middlewares/auth");
const { setDeadline, getDeadline,getActiveDeadline } = require("../controllers/deadline.controller");

router.post("/",         auth(["DOFA", "DOFA_OFFICE"]), setDeadline);
router.get("/:cycle",    auth(["DOFA", "DOFA_OFFICE", "CANDIDATE"]), getDeadline);
router.get("/active", auth(["DOFA","DOFA_OFFICE"]), getActiveDeadline);

module.exports = router;
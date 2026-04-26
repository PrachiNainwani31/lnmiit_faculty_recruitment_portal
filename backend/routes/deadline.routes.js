const express = require("express");
const router  = express.Router();
const auth    = require("../middlewares/auth");
const { setDeadline, getDeadline,getActiveDeadline } = require("../controllers/deadline.controller");

router.post("/",         auth(["DoFA", "DoFA_OFFICE"]), setDeadline);
router.get("/:cycle",    auth(["DoFA", "DoFA_OFFICE", "CANDIDATE"]), getDeadline);
router.get("/active", auth(["DoFA","DoFA_OFFICE"]), getActiveDeadline);

module.exports = router;
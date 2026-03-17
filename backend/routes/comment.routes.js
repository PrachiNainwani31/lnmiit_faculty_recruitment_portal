const express = require("express");
const router = express.Router();
const auth = require("../middlewares/auth");

const {
  getComments,
  addComment,
} = require("../controllers/comment.controller");

router.get("/", auth(["HOD", "DOFA","DOFA_OFFICE"]), getComments);
router.post("/", auth(["HOD", "DOFA","DOFA_OFFICE"]), addComment);

module.exports = router;

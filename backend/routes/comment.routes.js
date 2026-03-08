const express = require("express");
const router = express.Router();
const auth = require("../middlewares/auth");

const {
  getComments,
  addComment,
} = require("../controllers/comment.controller");

router.get("/", auth(["HOD", "DOFA"]), getComments);
router.post("/", auth(["HOD", "DOFA"]), addComment);

module.exports = router;

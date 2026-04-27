const express = require("express");
const router = express.Router();
const auth = require("../middlewares/auth");

const {
  getComments,
  addComment,
} = require("../controllers/comment.controller");

router.get("/", auth(["HoD", "DoFA","ADoFA","DoFA_OFFICE"]), getComments);
router.post("/", auth(["HoD", "DoFA","ADoFA","DoFA_OFFICE"]), addComment);

module.exports = router;

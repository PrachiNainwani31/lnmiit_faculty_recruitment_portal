const express = require("express");
const router  = express.Router();
const auth    = require("../middlewares/auth");
const ctrl    = require("../controllers/registration.controller");

router.post  ("/users",      auth(["DOFA_OFFICE", "DOFA"]), ctrl.registerUser);
router.get   ("/users",      auth(["DOFA_OFFICE", "DOFA"]), ctrl.listUsers);
router.delete("/users/:id",  auth(["DOFA_OFFICE", "DOFA"]), ctrl.deleteUser);

// Forgot / reset — public (no auth)
router.post("/forgot-password", ctrl.forgotPassword);
router.post("/reset-password",  ctrl.resetPassword);

module.exports = router;
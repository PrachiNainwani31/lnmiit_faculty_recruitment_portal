const express = require("express");
const router  = express.Router();
const auth    = require("../middlewares/auth");
const ctrl    = require("../controllers/registration.controller");

router.post  ("/users",      auth(["DoFA_OFFICE", "DoFA","ADoFA"]), ctrl.registerUser);
router.get   ("/users",      auth(["DoFA_OFFICE", "DoFA","ADoFA"]), ctrl.listUsers);
router.delete("/users/:id",  auth(["DoFA_OFFICE", "DoFA","ADoFA"]), ctrl.deleteUser);

// Forgot / reset — public (no auth)
router.post("/forgot-password", ctrl.forgotPassword);
router.post("/reset-password",  ctrl.resetPassword);
router.put('/users/:id',auth(["DoFA_OFFICE", "DoFA","ADoFA"]), ctrl.editUser);
router.patch('/users/:id/deactivate', auth(["DoFA_OFFICE", "DoFA","ADoFA"]), ctrl.deactivateUser);
router.patch('/users/:id/activate', auth(["DoFA_OFFICE", "DoFA","ADoFA"]), ctrl.activateUser);
module.exports = router;
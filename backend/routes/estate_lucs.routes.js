const express = require("express");
const router  = express.Router();
const auth    = require("../middlewares/auth");
const { getPendingHandovers, confirmHandover, getLucsRecords, updateLucs } = require("../controllers/estate_lucs.controller");

// ESTATE
router.get("/estate",          auth(["ESTATE","DOFA_OFFICE","DOFA"]), getPendingHandovers);
router.post("/estate/confirm", auth(["ESTATE"]),                      confirmHandover);

// LUCS
router.get("/lucs",            auth(["LUCS","ESTABLISHMENT"]),        getLucsRecords);
router.post("/lucs/update",    auth(["LUCS"]),                        updateLucs);

module.exports = router;
const express = require("express");
const router  = express.Router();
const auth    = require("../middlewares/auth");
const { getPendingHandovers, confirmHandover, getLucsRecords, updateLucs,getEstateLogs,getLucsLogs } = require("../controllers/estate_lucs.controller");

// ESTATE
router.get("/estate",          auth(["ESTATE","DoFA_OFFICE","DoFA","ADoFA"]), getPendingHandovers);
router.post("/estate/confirm", auth(["ESTATE"]),                      confirmHandover);

// LUCS
router.get("/lucs",            auth(["LUCS","ESTABLISHMENT"]),        getLucsRecords);
router.post("/lucs/update",    auth(["LUCS"]),                        updateLucs);
router.get("/estate/logs",  auth(["ESTATE"]), getEstateLogs);
router.get("/lucs/logs",    auth(["LUCS"]),   getLucsLogs);
module.exports = router;
const express = require("express");
const router  = express.Router();
const auth    = require("../middlewares/auth");
const upload  = require("../middlewares/documentUpload");
const { uploadOfficeOrder, getOfficeOrders, getAllOfficeOrders } = require("../controllers/director.controller");

router.post("/upload", auth(["DIRECTOR"]), upload.single("pdf"), uploadOfficeOrder);
router.get("/",        auth(["DIRECTOR","DOFA","ADOFA","DOFA_OFFICE","HOD"]), getOfficeOrders);
router.get("/all",     auth(["DIRECTOR","DOFA"]), getAllOfficeOrders);

module.exports = router;
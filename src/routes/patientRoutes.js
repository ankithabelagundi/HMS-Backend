const express = require("express");
const router = express.Router();
const protect = require("../middleware/authMiddleware");
const authorize = require("../middleware/roleMiddleware");
const supabase = require("../config/supabase");
const {getAllPatients} = require("../controllers/patientController");
const {updatePatientProfile} = require("../controllers/patientController")

router.put("/profile", protect, authorize("patient"), updatePatientProfile);

router.get("/", protect, authorize("admin", "staff"), getAllPatients);


module.exports = router;





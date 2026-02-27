const express = require("express");
const router = express.Router();

const protect = require("../middleware/authMiddleware");
const authorize = require("../middleware/roleMiddleware");

const {
  receptionistStats,
  registerPatient
} = require("../controllers/receptionistController");

router.get("/dashboard", protect, authorize("staff"), receptionistStats);
router.post("/register-patient", protect, authorize("staff"), registerPatient);

module.exports = router;
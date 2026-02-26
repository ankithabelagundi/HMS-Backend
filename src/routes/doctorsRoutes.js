const express = require("express");
const router = express.Router();

const protect = require("../middleware/authMiddleware")
const authorize  = require("../middleware/roleMiddleware");
const { getDoctors,deleteDoctor } = require("../controllers/doctorsController");


router.get(
  "/",
  protect,
  authorize("admin", "staff", "patient", "doctor"),
  getDoctors
);

router.delete("/:id", protect, authorize("admin"), deleteDoctor);

module.exports = router;
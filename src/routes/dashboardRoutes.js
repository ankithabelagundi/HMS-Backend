const express = require("express");
const router = express.Router();
const protect  = require("../middleware/authMiddleware");
const authorize = require("../middleware/roleMiddleware");
const { getDashboardStats,receptionistStats,adminStats,monthlyRevenue,doctorPerformance,getDoctorVideoConsultations } = require("../controllers/dashboardController");

router.get("/", protect, getDashboardStats);
router.get("/receptionist", protect, authorize("staff","admin"), receptionistStats);
router.get("/admin", protect, authorize("admin"), adminStats);
router.get("/revenue-monthly", protect, authorize("admin"), monthlyRevenue);
router.get("/doctor-performance", protect, authorize("admin"), doctorPerformance);
router.get(
  "/doctor/video-consultations",
  protect,
  authorize("doctor"),
  getDoctorVideoConsultations
);
module.exports = router;
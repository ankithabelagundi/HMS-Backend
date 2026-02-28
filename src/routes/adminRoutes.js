const express = require("express");
const router = express.Router();

const  protect = require("../middleware/authMiddleware");
const authorize = require("../middleware/roleMiddleware");
const { createStaff,adminStats,getStaff,deleteStaff,toggleStaffStatus,resetStaffPassword} = require("../controllers/adminControllers");

router.post("/create-staff", protect, authorize("admin"), createStaff);
router.post("/adminstats",protect,authorize("admin"),adminStats);
router.get("/staff", protect, authorize("admin"), getStaff);
router.delete("/staff/:id", protect, authorize("admin"), deleteStaff);
router.put("/staff/:id/toggle", protect, authorize("admin"), toggleStaffStatus);
router.put(
  "/staff/:id/reset-password",
  protect,
  authorize("admin"),
  resetStaffPassword
);

module.exports=router;
const express = require("express");
const router = express.Router();

const {
  register,
  login,
  createUserByAdmin
} = require("../controllers/authController");

const  protect = require("../middleware/authMiddleware");
const authorize = require("../middleware/roleMiddleware")

// Public routes
router.post("/register", register);
router.post("/login", login);

// Admin-only route
router.post("/create-user", protect, authorize("admin"), createUserByAdmin);

module.exports = router;
const express = require("express");
const router = express.Router();

const  protect  = require("../middleware/authMiddleware");
const { updateProfile,changePassword } = require("../controllers/usersController");

router.put("/profile", protect, updateProfile);
router.put("/change-password", protect, changePassword);

module.exports = router;
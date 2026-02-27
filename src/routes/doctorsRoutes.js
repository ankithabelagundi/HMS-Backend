const express = require("express");
const router = express.Router();

const protect = require("../middleware/authMiddleware")
const authorize  = require("../middleware/roleMiddleware");
const { getDoctors,deleteDoctor,uploadSignature } = require("../controllers/doctorsController");
const multer = require("multer");
const upload = multer();

router.get(
  "/",
  protect,
  authorize("admin", "staff", "patient", "doctor"),
  getDoctors
);


router.delete("/:id", protect, authorize("admin"), deleteDoctor);

router.post(
  "/upload-signature",
  protect,
  authorize("doctor"),
  upload.single("signature"),
  uploadSignature
);

module.exports = router;
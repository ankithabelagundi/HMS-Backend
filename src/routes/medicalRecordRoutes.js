const express = require('express');
const router = express.Router();

const protect = require('../middleware/authMiddleware');
const authorize = require('../middleware/roleMiddleware');

const {
  addMedicalRecord,
  getMedicalRecords,
  updateMedicalRecord,
  deleteMedicalRecord
} = require('../controllers/medicalRecordController');

router.post('/', protect, authorize('doctor'), addMedicalRecord);
router.get('/', protect, authorize('admin','doctor','patient'), getMedicalRecords);
router.put("/:id", protect, authorize("doctor"), updateMedicalRecord);
router.delete("/:id", protect, authorize("doctor"), deleteMedicalRecord);
module.exports = router;

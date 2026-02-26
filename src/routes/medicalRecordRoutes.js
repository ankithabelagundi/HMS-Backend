const express = require('express');
const router = express.Router();

const protect = require('../middleware/authMiddleware');
const authorize = require('../middleware/roleMiddleware');

const {
  addMedicalRecord,
  getMedicalRecords
} = require('../controllers/medicalRecordController');

router.post('/', protect, authorize('doctor'), addMedicalRecord);
router.get('/', protect, authorize('admin','doctor','patient'), getMedicalRecords);

module.exports = router;

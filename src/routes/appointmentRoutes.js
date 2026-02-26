
const express = require('express');
const router = express.Router();

const protect = require('../middleware/authMiddleware');
const authorize = require('../middleware/roleMiddleware');

const {
  createAppointment,
  getAppointments,
  updateAppointmentStatus
} = require('../controllers/appointmentController');

// DEBUG (optional)
console.log("protect:", typeof protect);
console.log("authorize:", typeof authorize);
console.log("createAppointment:", typeof createAppointment);

router.post('/', protect, authorize('admin','staff','patient'), createAppointment);
router.get('/', protect, authorize('admin','doctor','patient'), getAppointments);
router.put('/:id', protect, authorize('admin','doctor'), updateAppointmentStatus);

module.exports = router;

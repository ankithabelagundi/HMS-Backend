const express = require('express');
const router = express.Router();

const protect = require('../middleware/authMiddleware');
const authorize = require('../middleware/roleMiddleware');

const {
  createInvoice,
  recordPayment,
  createOrder,
  verifyPayment,
  generateInvoice,
  getInvoices,
  getPayments,
  createVideoOrder,
  verifyVideoPayment
} = require('../controllers/billingController');

// 🔥 GET ALL INVOICES (for patient / admin)
router.get('/', protect, getInvoices);

// 🔥 CREATE INVOICE (admin/staff)
router.post('/invoice', protect, authorize('admin','staff'), createInvoice);

// 🔥 RECORD MANUAL PAYMENT
router.post('/payment', protect, authorize('admin','staff'), recordPayment);


// 🔥 Download Invoice PDF
router.get('/invoice/:id', protect, generateInvoice);
router.get('/payments', protect, getPayments);

// 🔹 Appointment Billing
router.post("/create-order", protect, createOrder);
router.post("/verify-payment", protect, verifyPayment);

// 🔹 Video Consultation Billing
router.post("/video/create-order", protect, createVideoOrder);
router.post("/video/verify-payment", protect, verifyVideoPayment);

module.exports = router;
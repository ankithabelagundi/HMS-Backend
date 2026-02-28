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

// 🔥 Razorpay
router.post('/video/create-order', protect, createOrder);
router.post('/verify-payment', protect, verifyPayment);

// 🔥 Download Invoice PDF
router.get('/invoice/:id', protect, generateInvoice);
router.get('/payments', protect, getPayments);

router.post("/create-order", protect, createVideoOrder);
router.post("/verify", protect, verifyVideoPayment);

module.exports = router;
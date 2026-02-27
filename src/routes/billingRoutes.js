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
  getPayments
} = require('../controllers/billingController');

// 🔥 GET ALL INVOICES (for patient / admin)
router.get('/', protect, getInvoices);

// 🔥 CREATE INVOICE (admin/staff)
router.post('/invoice', protect, authorize('admin','staff'), createInvoice);

// 🔥 RECORD MANUAL PAYMENT
router.post('/payment', protect, authorize('admin','staff'), recordPayment);

// 🔥 Razorpay
router.post('/create-order', protect, createOrder);
router.post('/verify-payment', protect, verifyPayment);

// 🔥 Download Invoice PDF
router.get('/invoice/:id', protect, generateInvoice);
router.get('/payments', protect, getPayments);

module.exports = router;
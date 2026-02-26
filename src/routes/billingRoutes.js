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
  getInvoices
} = require('../controllers/billingController');

router.post('/invoice', protect, authorize('admin','staff'), createInvoice);
router.post('/payment', protect, authorize('admin','staff'), recordPayment);
router.post("/create-order", protect, createOrder);
router.post("/verify-payment", protect, verifyPayment);
router.get("/invoice/:id", protect, generateInvoice);
router.get("/invoice/:id", protect, getInvoices);

module.exports = router;

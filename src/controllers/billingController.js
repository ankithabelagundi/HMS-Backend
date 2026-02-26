const {
  createInvoiceDB,
  addBillingItemsDB,
  updateInvoiceTotalDB,
  recordPaymentDB,
  updateInvoiceStatusDB
} = require('../models/billingModel');
const supabase = require("../config/supabase");

const getInvoices = async (req, res, next) => {
  try {
    let query = supabase
      .from("billing")
      .select("*");

    // If patient → show only their invoices
    if (req.user.role === "patient") {
      const { data: patient } = await supabase
        .from("patients")
        .select("id")
        .eq("user_id", req.user.id)
        .single();

      query = query.eq("patient_id", patient.id);
    }

    const { data, error } = await query;

    if (error) return next(error);

    res.json(data);

  } catch (err) {
    next(err);
  }
};

const createInvoice = async (req, res, next) => {
  try {
    const { patient_id, items } = req.body;

    // Create invoice
    const { data: invoice, error } = await createInvoiceDB(patient_id);
    if (error) return next(error);

    // Prepare billing items
    const billingItems = items.map(item => ({
      billing_id: invoice.id,
      description: item.description,
      amount: item.amount
    }));

    await addBillingItemsDB(billingItems);

    // Calculate total
    const total = items.reduce((sum, item) => sum + item.amount, 0);

    await updateInvoiceTotalDB(invoice.id, total);

    res.status(201).json({
      message: "Invoice created successfully",
      invoice_id: invoice.id,
      total
    });

  } catch (err) {
    next(err);
  }
};

const recordPayment = async (req, res, next) => {
  try {
    const { billing_id, payment_method, paid_amount } = req.body;

    await recordPaymentDB({
      billing_id,
      payment_method,
      paid_amount
    });

    await updateInvoiceStatusDB(billing_id, 'paid');

    res.json({ message: "Payment recorded successfully" });

  } catch (err) {
    next(err);
  }
};
const Razorpay = require("razorpay");

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

const createOrder = async (req, res) => {
  const options = {
    amount: req.body.amount * 100,
    currency: "INR",
    receipt: "receipt_" + Date.now(),
  };

  const order = await razorpay.orders.create(options);

  res.json(order);
};
const crypto = require("crypto");

const verifyPayment = async (req, res) => {
  const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;

  const body = razorpay_order_id + "|" + razorpay_payment_id;

  const expectedSignature = crypto
    .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
    .update(body.toString())
    .digest("hex");

  if (expectedSignature === razorpay_signature) {
    // update billing payment_status = "paid"
    return res.json({ message: "Payment successful" });
  }

  res.status(400).json({ message: "Payment verification failed" });
};
const PDFDocument = require("pdfkit");

const generateInvoice = async (req, res, next) => {
  try {
    const { data: bill, error } = await supabase
      .from("billing")
      .select("*")
      .eq("id", req.params.id)
      .single();

    if (error) return next(error);

    const doc = new PDFDocument();

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename=invoice-${bill.id}.pdf`
    );

    doc.pipe(res);

    doc.fontSize(20).text("CLINIC INVOICE", { align: "center" });
    doc.moveDown();

    doc.fontSize(14).text(`Invoice ID: ${bill.id}`);
    doc.text(`Patient ID: ${bill.patient_id}`);
    doc.text(`Total Amount: ₹${bill.total_amount}`);
    doc.text(`Status: ${bill.status}`);

    doc.end();

  } catch (err) {
    next(err);
  }
};

module.exports = {
  createInvoice,
  recordPayment,
  createOrder,
  verifyPayment,
  generateInvoice,
  getInvoices
};

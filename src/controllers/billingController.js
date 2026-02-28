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
  const {
    razorpay_order_id,
    razorpay_payment_id,
    razorpay_signature,
    billing_id
  } = req.body;

  const body = razorpay_order_id + "|" + razorpay_payment_id;

  const expectedSignature = crypto
    .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
    .update(body)
    .digest("hex");

  if (expectedSignature === razorpay_signature) {

    // ✅ Mark invoice as paid
    await supabase
      .from("billing")
      .update({ status: "paid" })
      .eq("id", billing_id);

    // ✅ Record payment
    await supabase
      .from("payments")
      .insert([{
        billing_id,
        payment_method: "razorpay",
        paid_amount: 0, // optional if you want to pass
      }]);

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
const getPayments = async (req, res) => {
  try {
    let query = supabase
      .from("payments")
      .select(`
        *,
        billing ( invoice_number )
      `);

    if (req.user.role === "patient") {
      const { data: patient } = await supabase
        .from("patients")
        .select("id")
        .eq("user_id", req.user.id)
        .single();

      const { data: bills } = await supabase
        .from("billing")
        .select("id")
        .eq("patient_id", patient.id);

      const billIds = bills.map(b => b.id);

      query = query.in("billing_id", billIds);
    }

    const { data, error } = await query;

    if (error) throw error;

    res.json(data);

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
const createVideoOrder = async (req, res) => {
  try {
    const { doctor_id, amount } = req.body;

    if (!doctor_id || !amount) {
      return res.status(400).json({ message: "Missing fields" });
    }

    // 🔥 Get patient id properly
    const { data: patient, error: patientError } = await supabase
      .from("patients")
      .select("id")
      .eq("user_id", req.user.id)
      .single();

    if (patientError || !patient) {
      console.log("PATIENT ERROR:", patientError);
      return res.status(400).json({ message: "Patient not found" });
    }

    // Insert consultation
    const { data: consultation, error } = await supabase
      .from("video_consultations")
      .insert([{
        patient_id: patient.id,
        doctor_id,
        amount,
        payment_status: "pending"
      }])
      .select()
      .single();

    if (error) {
      console.log("INSERT ERROR:", error);
      return res.status(400).json({ error: error.message });
    }

    const order = await razorpay.orders.create({
      amount: amount * 100,
      currency: "INR",
      receipt: `vid_${consultation.id.substring(0, 15)}`
    });

    res.json({
      id: order.id,
      amount: order.amount,
      consultation_id: consultation.id
    });

  } catch (err) {
    console.log("SERVER ERROR:", err);
    res.status(500).json({ error: err.message });
  }
};

const verifyVideoPayment = async (req, res) => {
  try {
    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      consultation_id
    } = req.body;

    const body = razorpay_order_id + "|" + razorpay_payment_id;

    const expectedSignature = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
      .update(body)
      .digest("hex");

    if (expectedSignature !== razorpay_signature) {
      return res.status(400).json({ message: "Payment verification failed" });
    }

    // Get consultation
    const { data: consultation } = await supabase
      .from("video_consultations")
      .select("*")
      .eq("id", consultation_id)
      .single();

    if (!consultation) {
      return res.status(404).json({ message: "Consultation not found" });
    }

    // Create meeting link (Jitsi)
    const meet_link = `https://meet.jit.si/${consultation.id}_${Date.now()}`;

    // Token count
    const { count } = await supabase
      .from("video_consultations")
      .select("*", { count: "exact", head: true })
      .eq("doctor_id", consultation.doctor_id);

    const token = (count || 0);

    // Update consultation
    await supabase
      .from("video_consultations")
      .update({
        payment_status: "paid",
        meet_link,
        token_number: token
      })
      .eq("id", consultation_id);

    res.json({
      meet_link,
      token
    });

  } catch (err) {
    console.log(err);
    res.status(500).json({ error: err.message });
  }
};

module.exports = {
  createInvoice,
  recordPayment,
  createOrder,
  verifyPayment,
  generateInvoice,
  getInvoices,
  getPayments,
  createVideoOrder,
  verifyVideoPayment
};

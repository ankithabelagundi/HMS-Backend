const supabase = require("../config/supabase");
const db = require("../config/db");

// 🔥 Import billing model functions
const {
  createInvoiceDB,
  addBillingItemsDB,
  updateInvoiceTotalDB
} = require("../models/billingModel");

/* =====================================================
   CREATE APPOINTMENT (PATIENT)
===================================================== */
const createAppointment = async (req, res) => {
  try {
    const { doctor_id, appointment_date } = req.body;

    if (!doctor_id || !appointment_date) {
      return res.status(400).json({ error: "Missing fields" });
    }

    // 🔥 Convert appointment date
    const appointmentDate = new Date(appointment_date);

    // 🔥 Current IST time
    const nowIST = new Date(
      new Date().toLocaleString("en-US", { timeZone: "Asia/Kolkata" })
    );

    // ❌ Prevent past bookings
    if (appointmentDate < nowIST) {
      return res.status(400).json({
        error: "Cannot book appointment for past date/time"
      });
    }
    // 🔥 Check if doctor already has appointment at same time
const { data: existing } = await supabase
  .from("appointments")
  .select("id")
  .eq("doctor_id", doctor_id)
  .eq("appointment_date", appointment_date)
  .neq("status", "cancelled");

if (existing && existing.length > 0) {
  return res.status(400).json({
    error: "This time slot is already booked for the doctor"
  });
}
// 🔥 Limit appointments per doctor per day
const dateOnly = appointment_date.split("T")[0];

const { count } = await supabase
  .from("appointments")
  .select("*", { count: "exact", head: true })
  .eq("doctor_id", doctor_id)
  .gte("appointment_date", `${dateOnly}T00:00:00`)
  .lte("appointment_date", `${dateOnly}T23:59:59`)
  .neq("status", "cancelled");

if (count >= 20) {
  return res.status(400).json({
    error: "Doctor is fully booked for this day"
  });
}

    // 🔥 Optional: Restrict hospital hours (9AM–6PM)
    const hour = appointmentDate.getHours();

    if (hour < 9 || hour > 18) {
      return res.status(400).json({
        error: "Appointments allowed only between 9AM and 6PM IST"
      });
    }

    // Get patient linked to logged-in user
    const { data: patient, error: patientError } = await supabase
      .from("patients")
      .select("id")
      .eq("user_id", req.user.id)
      .single();

    if (patientError || !patient) {
      return res.status(400).json({ error: "Patient record not found" });
    }

    // Create appointment
    const { data, error } = await supabase
      .from("appointments")
      .insert([
        {
          patient_id: patient.id,
          doctor_id,
          appointment_date,
          status: "scheduled"
        }
      ])
      .select();

    if (error) {
      return res.status(400).json({ error: error.message });
    }

    res.status(201).json(data);

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

/* =====================================================
   GET APPOINTMENTS
===================================================== */
const getAppointments = async (req, res) => {
  try {
    let query = supabase
      .from("appointments")
      .select(`
        *,
        doctors (
          id,
          specialization,
          users ( name )
        ),
        patients (
          id,
          users ( name )
        )
      `);

    // If patient → only their appointments
    if (req.user.role === "patient") {
      const { data: patient } = await supabase
        .from("patients")
        .select("id")
        .eq("user_id", req.user.id)
        .single();

      query = query.eq("patient_id", patient.id);
    }

    // If doctor → only their appointments
    if (req.user.role === "doctor") {
      const { data: doctor } = await supabase
        .from("doctors")
        .select("id")
        .eq("user_id", req.user.id)
        .single();

      query = query.eq("doctor_id", doctor.id);
    }

    const { data, error } = await query.order("appointment_date", {
      ascending: false
    });

    if (error) return res.status(400).json({ error: error.message });

    res.json(data);

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

/* =====================================================
   UPDATE APPOINTMENT STATUS
   🔥 Auto-create invoice when completed
===================================================== */
const updateAppointmentStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    // 1️⃣ Update appointment status
    const { data: appointment, error } = await supabase
      .from("appointments")
      .update({ status })
      .eq("id", id)
      .select()
      .single();

    if (error) {
      return res.status(400).json({ error: error.message });
    }

    // 2️⃣ If completed → create invoice automatically
    if (status === "completed") {

      console.log("Creating invoice for appointment:", appointment.id);

      const consultationFee = 500;

      // Create invoice
      const { data: invoice, error: invoiceError } =
        await createInvoiceDB(appointment.patient_id);

      if (invoiceError) {
        console.log("Invoice creation error:", invoiceError.message);
      } else {

        // Add billing item
        await addBillingItemsDB([
          {
            billing_id: invoice.id,
            description: "Consultation Fee",
            amount: consultationFee
          }
        ]);

        // Update total
        await updateInvoiceTotalDB(invoice.id, consultationFee);

        console.log("Invoice created successfully");
      }
    }

    res.json(appointment);

  } catch (err) {
    console.error("Update appointment error:", err);
    res.status(500).json({ error: err.message });
  }
};

const createVideoAppointment = async (req, res) => {
  try {
    const { doctor_id, slot_id } = req.body;
    const patient_id = req.user.id;

    // Check slot
    const slot = await db("doctor_slots")
      .where({ id: slot_id, is_booked: false })
      .first();

    if (!slot) {
      return res.status(400).json({ message: "Slot not available" });
    }

    // Create provisional appointment
    const [appointment] = await db("appointments")
      .insert({
        doctor_id,
        patient_id,
        date: slot.date,
        mode: "video",
        payment_status: "pending"
      })
      .returning("*");

    res.json({ appointment });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};


module.exports = {
  createAppointment,
  getAppointments,
  updateAppointmentStatus,
  createVideoAppointment
};
const supabase = require("../config/supabase");

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

module.exports = {
  createAppointment,
  getAppointments,
  updateAppointmentStatus
};
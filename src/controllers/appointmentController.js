const supabase = require('../config/supabase');

const createAppointment = async (req, res) => {
  try {
    const { doctor_id, appointment_date } = req.body;

    if (!doctor_id || !appointment_date) {
      return res.status(400).json({ error: "Missing fields" });
    }

    // 🔹 Get patient linked to logged-in user
    const { data: patient, error: patientError } = await supabase
      .from("patients")
      .select("id")
      .eq("user_id", req.user.id)
      .single();

    if (patientError || !patient) {
      return res.status(400).json({ error: "Patient record not found" });
    }

    // 🔹 Create appointment using patient.id
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

    // 🔹 If patient → only their appointments
    if (req.user.role === "patient") {
      const { data: patient } = await supabase
        .from("patients")
        .select("id")
        .eq("user_id", req.user.id)
        .single();

      query = query.eq("patient_id", patient.id);
    }

    // 🔹 If doctor → only their appointments
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
const updateAppointmentStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    // 🔹 Update appointment status
    const { data: appointment, error } = await supabase
      .from('appointments')
      .update({ status })
      .eq('id', id)
      .select()
      .single();

    if (error) return res.status(400).json({ error: error.message });

    // ✅ STEP 3: If appointment completed → create billing
    if (status === "completed") {

      const consultationFee = 500; // you can change later

      const { error: billingError } = await supabase
        .from("billing")
        .insert([
          {
            patient_id: appointment.patient_id,
            appointment_id: appointment.id,
            total_amount: consultationFee,
            status: "pending"
          }
        ]);

      if (billingError) {
        return res.status(400).json({ error: billingError.message });
      }
    }

    res.json(appointment);

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};


module.exports = {
  createAppointment,
  getAppointments,
  updateAppointmentStatus
};


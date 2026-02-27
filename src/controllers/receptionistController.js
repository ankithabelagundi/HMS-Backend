const supabase = require("../config/supabase");

/* ======================================
   DASHBOARD STATS
====================================== */
const receptionistStats = async (req, res) => {
  try {
    const today = new Date().toISOString().split("T")[0];

    const { count: todayAppointments } = await supabase
      .from("appointments")
      .select("*", { count: "exact", head: true })
      .gte("appointment_date", today);

    const { count: totalPatients } = await supabase
      .from("patients")
      .select("*", { count: "exact", head: true });

    const { count: pendingBills } = await supabase
      .from("billing")
      .select("*", { count: "exact", head: true })
      .eq("status", "pending");

    res.json({
      todayAppointments,
      totalPatients,
      pendingBills
    });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

/* ======================================
   REGISTER PATIENT
====================================== */
const registerPatient = async (req, res) => {
  try {
    const { name, email } = req.body;

    const { data: user, error: userError } = await supabase
      .from("users")
      .insert([
        {
          name,
          email,
          password: "123456", // default password
          role: "patient"
        }
      ])
      .select()
      .single();

    if (userError) return res.status(400).json({ error: userError.message });

    const { error: patientError } = await supabase
      .from("patients")
      .insert([{ user_id: user.id }]);

    if (patientError)
      return res.status(400).json({ error: patientError.message });

    res.json({ message: "Patient registered successfully" });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

module.exports = {
  receptionistStats,
  registerPatient
};
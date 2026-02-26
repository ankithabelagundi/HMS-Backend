const supabase = require("../config/supabase");

const getDashboardStats = async (req, res) => {
  try {
    if (req.user.role === "admin") {
      const { count: doctors } = await supabase
        .from("doctors")
        .select("*", { count: "exact", head: true });

      const { count: patients } = await supabase
        .from("patients")
        .select("*", { count: "exact", head: true });

      const { count: appointments } = await supabase
        .from("appointments")
        .select("*", { count: "exact", head: true });

      return res.json({ doctors, patients, appointments });
    }

    if (req.user.role === "doctor") {
      const { data: doctor } = await supabase
        .from("doctors")
        .select("id")
        .eq("user_id", req.user.id)
        .single();

      const { count: appointments } = await supabase
        .from("appointments")
        .select("*", { count: "exact", head: true })
        .eq("doctor_id", doctor.id);

      return res.json({ appointments });
    }

    if (req.user.role === "patient") {
      const { data: patient } = await supabase
        .from("patients")
        .select("id")
        .eq("user_id", req.user.id)
        .single();

      const { count: appointments } = await supabase
        .from("appointments")
        .select("*", { count: "exact", head: true })
        .eq("patient_id", patient.id);

      return res.json({ appointments });
    }

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

module.exports = { getDashboardStats };
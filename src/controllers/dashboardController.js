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
      const { data: doctor, error } = await supabase
        .from("doctors")
        .select("id")
        .eq("user_id", req.user.id)
        .single();

      if (error || !doctor) {
        return res.status(404).json({ message: "Doctor not found" });
      }

      const { count: appointments } = await supabase
        .from("appointments")
        .select("*", { count: "exact", head: true })
        .eq("doctor_id", doctor.id);

      return res.json({ appointments });
    }

    if (req.user.role === "patient") {
      const { data: patient, error } = await supabase
        .from("patients")
        .select("id")
        .eq("user_id", req.user.id)
        .single();

      if (error || !patient) {
        return res.status(404).json({ message: "Patient not found" });
      }

      const { count: appointments } = await supabase
        .from("appointments")
        .select("*", { count: "exact", head: true })
        .eq("patient_id", patient.id);

      return res.json({ appointments });
    }

    return res.status(403).json({ message: "Unauthorized role" });

  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};

const receptionistStats = async (req, res) => {
  try {
    const today = new Date().toISOString().split("T")[0];

    // Only today's appointments (not future)
    const { count: todayAppointments } = await supabase
      .from("appointments")
      .select("*", { count: "exact", head: true })
      .eq("appointment_date", today);

    const { count: totalPatients } = await supabase
      .from("patients")
      .select("*", { count: "exact", head: true });

    const { count: pendingBills } = await supabase
      .from("billing")
      .select("*", { count: "exact", head: true })
      .eq("status", "pending");

    const { data: revenue, error } = await supabase
      .from("billing")
      .select("total_amount")
      .eq("status", "paid")
      .eq("billing_date", today);  // Only today's revenue

    if (error) {
      return res.status(500).json({ error: error.message });
    }

    const todayRevenue =
      revenue?.reduce((sum, r) => sum + Number(r.total_amount), 0) || 0;

    return res.json({
      todayAppointments,
      totalPatients,
      pendingBills,
      todayRevenue
    });

  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};


/* ======================================
   ADMIN MAIN STATS
====================================== */
const adminStats = async (req, res) => {
  try {
    // ===== BASIC COUNTS =====
    const { count: totalDoctors } = await supabase
      .from("doctors")
      .select("*", { count: "exact", head: true });

    const { count: totalPatients } = await supabase
      .from("patients")
      .select("*", { count: "exact", head: true });

    const { count: totalAppointments } = await supabase
      .from("appointments")
      .select("*", { count: "exact", head: true });

    const { count: completedAppointments } = await supabase
      .from("appointments")
      .select("*", { count: "exact", head: true })
      .eq("status", "completed");

    const { count: pendingAppointments } = await supabase
      .from("appointments")
      .select("*", { count: "exact", head: true })
      .eq("status", "scheduled");

    // ===== TOTAL REVENUE =====
    const { data: revenue } = await supabase
      .from("billing")
      .select("total_amount")
      .eq("status", "paid");

    const totalRevenue =
      revenue?.reduce((sum, r) => sum + Number(r.total_amount), 0) || 0;

    // ===== VIDEO CONSULTATION COUNT =====
    const { count: totalVideoConsultations } = await supabase
      .from("video_consultations")
      .select("*", { count: "exact", head: true })
      .eq("payment_status", "paid");

    // ===== RESPONSE =====
    res.json({
      totalDoctors,
      totalPatients,
      totalAppointments,
      completedAppointments,
      pendingAppointments,
      totalRevenue,
      totalVideoConsultations
    });

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

/* ======================================
   MONTHLY REVENUE
====================================== */
const monthlyRevenue = async (req, res) => {
  try {
    const { data } = await supabase
      .from("billing")
      .select("total_amount, created_at")
      .eq("status", "paid");

    const months = Array(12).fill(0);

    data.forEach((bill) => {
      const month = new Date(bill.created_at).getMonth();
      months[month] += bill.total_amount;
    });

    res.json(months);

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

/* ======================================
   DOCTOR PERFORMANCE
====================================== */
const doctorPerformance = async (req, res) => {
  try {
    const { data } = await supabase
      .from("appointments")
      .select(`
        doctor_id,
        status,
        doctors (
          id,
          users ( name )
        )
      `);

    const performance = {};

    data.forEach(app => {
      if (!performance[app.doctor_id]) {
        performance[app.doctor_id] = {
          name: app.doctors?.users?.name || "Unknown",
          total: 0,
          completed: 0
        };
      }

      performance[app.doctor_id].total++;

      if (app.status === "completed") {
        performance[app.doctor_id].completed++;
      }
    });

    res.json(Object.values(performance));

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
const getDoctorVideoConsultations = async (req, res) => {
  try {
    const { data: doctor } = await supabase
      .from("doctors")
      .select("id")
      .eq("user_id", req.user.id)
      .single();

    if (!doctor) {
      return res.status(404).json({ message: "Doctor not found" });
    }

    const { data, error } = await supabase
      .from("video_consultations")
      .select("*")
      .eq("doctor_id", doctor.id)
      .eq("payment_status", "paid");

    if (error) {
      return res.status(400).json({ error: error.message });
    }

    res.json(data || []);

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};


module.exports = {
  getDashboardStats,
  receptionistStats,
   adminStats,
  monthlyRevenue,
  doctorPerformance,
  getDoctorVideoConsultations
};
const supabase = require("../config/supabase");
const bcrypt = require("bcryptjs");


const adminStats = async (req, res) => {
  try {
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

    const { data: revenue } = await supabase
      .from("billing")
      .select("total_amount")
      .eq("status", "paid");

    const totalRevenue =
      revenue?.reduce((sum, r) => sum + r.total_amount, 0) || 0;

    res.json({
      totalDoctors,
      totalPatients,
      totalAppointments,
      completedAppointments,
      pendingAppointments,
      totalRevenue
    });

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};


/* ================================
   CREATE STAFF
================================ */
const createStaff = async (req, res) => {
  try {
    const { name, email, password } = req.body;

    const hashedPassword = await bcrypt.hash(password, 10);

    const { error } = await supabase
      .from("users")
      .insert([
        {
          name,
          email,
          password: hashedPassword,
          role: "staff",
          status: "active"
        }
      ]);

    if (error) return res.status(400).json({ error: error.message });

    res.json({ message: "Staff created successfully" });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

/* ================================
   GET STAFF (WITH SEARCH + PAGINATION)
================================ */
const getStaff = async (req, res) => {
  try {
    const { search = "", page = 1 } = req.query;
    const limit = 5;
    const offset = (page - 1) * limit;

    let query = supabase
      .from("users")
      .select("id, name, email, role, status, created_at", { count: "exact" })
      .eq("role", "staff")
      .ilike("name", `%${search}%`)
      .range(offset, offset + limit - 1);

    const { data, count, error } = await query;

    if (error) return res.status(400).json({ error: error.message });

    res.json({
      data,
      total: count,
      page,
      totalPages: Math.ceil(count / limit)
    });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

/* ================================
   DELETE STAFF
================================ */
const deleteStaff = async (req, res) => {
  try {
    const { id } = req.params;

    const { error } = await supabase
      .from("users")
      .delete()
      .eq("id", id)
      .eq("role", "staff");

    if (error) return res.status(400).json({ error: error.message });

    res.json({ message: "Staff deleted" });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

/* ================================
   TOGGLE STATUS
================================ */
const toggleStaffStatus = async (req, res) => {
  try {
    const { id } = req.params;

    const { data: user } = await supabase
      .from("users")
      .select("status")
      .eq("id", id)
      .single();

    const newStatus = user.status === "active" ? "inactive" : "active";

    await supabase
      .from("users")
      .update({ status: newStatus })
      .eq("id", id);

    res.json({ message: "Status updated" });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
/* ================================
   RESET STAFF PASSWORD
================================ */
const resetStaffPassword = async (req, res) => {
  try {
    const { id } = req.params;
    const { newPassword } = req.body;

    const hashedPassword = await bcrypt.hash(newPassword, 10);

    const { error } = await supabase
      .from("users")
      .update({ password: hashedPassword })
      .eq("id", id)
      .eq("role", "staff");

    if (error) return res.status(400).json({ error: error.message });

    res.json({ message: "Password reset successfully" });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
const getVideoStats = async (req, res) => {
  const { count } = await supabase
    .from("video_consultations")
    .select("*", { count: "exact", head: true })
    .eq("payment_status", "paid");

  res.json({ totalVideoConsultations: count });
};

module.exports = {
  adminStats,
  createStaff,
  getStaff,
  deleteStaff,
  toggleStaffStatus,
   resetStaffPassword,
   getVideoStats
};


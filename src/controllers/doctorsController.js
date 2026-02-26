const supabase = require("../config/supabase");

const getDoctors = async (req, res) => {
  try {
    const { data, error } = await supabase
      .from("doctors")
      .select(`
        id,
        specialization,
        users (
          id,
          name
        )
      `);

    if (error) return res.status(400).json({ error: error.message });

    res.json(data);

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
const deleteDoctor = async (req, res) => {
  try {
    const { id } = req.params;

    // Delete related appointments first
    await supabase
      .from("appointments")
      .delete()
      .eq("doctor_id", id);

    // Delete related medical records (if linked)
    await supabase
      .from("medical_records")
      .delete()
      .eq("doctor_id", id);

    // Now delete doctor
    const { error } = await supabase
      .from("doctors")
      .delete()
      .eq("id", id);

    if (error) return res.status(400).json({ error: error.message });

    res.json({ message: "Doctor deleted successfully" });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

module.exports = { getDoctors,deleteDoctor};
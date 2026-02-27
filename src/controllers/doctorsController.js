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
const uploadSignature = async (req, res) => {
  const file = req.file;

  const { data, error } = await supabase.storage
    .from("signatures")
    .upload(`doctor-${req.user.id}.png`, file.buffer, {
      contentType: file.mimetype
    });

  if (error) return res.status(400).json({ error: error.message });

  const publicUrl = supabase.storage
    .from("signatures")
    .getPublicUrl(data.path).data.publicUrl;

  await supabase
    .from("doctors")
    .update({ signature_url: publicUrl })
    .eq("user_id", req.user.id);

  res.json({ url: publicUrl });
};

module.exports = { getDoctors,deleteDoctor,uploadSignature};
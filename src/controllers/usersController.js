const supabase = require("../config/supabase");

// ================= UPDATE USER PROFILE =================
const updateProfile = async (req, res) => {
  try {
    const { name } = req.body;

    const { error } = await supabase
      .from("users")
      .update({ name })
      .eq("id", req.user.id);

    if (error) return res.status(400).json({ error: error.message });

    res.json({ message: "Profile updated successfully" });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

module.exports = { updateProfile };
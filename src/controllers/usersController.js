const supabase = require("../config/supabase");


/* =========================
   UPDATE PROFILE
========================= */
const updateProfile = async (req, res) => {
  try {
    const { name, email, phone } = req.body;

    const { error } = await supabase
      .from("users")
      .update({ name, email, phone })
      .eq("id", req.user.id);

    if (error) {
      return res.status(400).json({ error: error.message });
    }

    res.json({ message: "Profile updated successfully" });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};


/* =========================
   CHANGE PASSWORD
========================= */
const changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    const { data: user, error } = await supabase
      .from("users")
      .select("*")
      .eq("id", req.user.id)
      .single();

    if (error || !user) {
      return res.status(400).json({ error: "User not found" });
    }

    const isMatch = await bcrypt.compare(currentPassword, user.password);

    if (!isMatch) {
      return res.status(400).json({ error: "Incorrect current password" });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);

    await supabase
      .from("users")
      .update({ password: hashedPassword })
      .eq("id", req.user.id);

    res.json({ message: "Password updated successfully" });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};


module.exports = { 
  updateProfile,
  changePassword
 };
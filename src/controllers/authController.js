const supabase = require("../config/supabase");
const bcrypt = require("bcrypt");
const generateToken = require("../utils/generateToken");
const { createAppointment } = require("./appointmentController");

// ================= REGISTER (Public - Patient Only) =================
const register = async (req, res) => {
  try {
    const { name, email, password } = req.body;

    const passwordRegex =
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&]).{8,}$/;

    if (!passwordRegex.test(password)) {
      return res.status(400).json({
        error:
          "Password must be at least 8 characters and include uppercase, lowercase, number and special character."
      });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const role = "patient";

    const { data, error } = await supabase
      .from("users")
      .insert([{ name, email, password: hashedPassword, role }])
      .select()
      .single();
     

    if (error) return res.status(400).json({ error: error.message });

    // insert into patients table
    await supabase
      .from("patients")
      .insert([{ user_id: data.id }]);

    const token = generateToken(data);

    res.status(201).json({
      message: "User registered successfully",
      token,
      user: data
    });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// ================= LOGIN =================
const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    const { data: user, error } = await supabase
      .from("users")
      .select("*")
      .eq("email", email)
      .single();

    if (!user || error) {
      return res.status(400).json({ error: "Invalid credentials" });
    }

    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      return res.status(400).json({ error: "Invalid credentials" });
    }

    const token = generateToken(user);

    res.json({
      message: "Login successful",
      token,
      user
    });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
    // ================= createUserByAdmin =================
const createUserByAdmin = async (req, res) => {
  try {
    const { name, email, password, role, specialization } = req.body;

    if (!name || !email || !password || !role) {
      return res.status(400).json({ error: "Missing fields" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    // Insert user
    const { data: user, error: userError } = await supabase
      .from("users")
      .insert([{ name, email, password: hashedPassword, role }])
      .select()
      .single();

    if (userError) {
      return res.status(400).json({ error: userError.message });
    }

    // If doctor → insert into doctors table
    if (role === "doctor") {
      const { error: doctorError } = await supabase
        .from("doctors")
        .insert([
          {
            user_id: user.id,
            specialization,
            availability: {}
          }
        ]);

      if (doctorError) {
        return res.status(400).json({ error: doctorError.message });
      }
    }

    res.status(201).json({ message: "Doctor created successfully" });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
// ================= EXPORT =================
module.exports = {
  register,
  login,
  createUserByAdmin
};

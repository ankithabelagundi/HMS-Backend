const supabase = require('../config/supabase');

const createPatient = async (req, res) => {
  try {
    const { user_id, dob, gender, phone, address, medical_history } = req.body;

    const { data, error } = await supabase
      .from('patients')
      .insert([{ user_id, dob, gender, phone, address, medical_history }])
      .select()
      .single();

    if (error) return res.status(400).json({ error: error.message });

    res.status(201).json(data);

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const getAllPatients = async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('patients')
      .select(`
        *,
        users ( name, email )
      `);

    if (error) return res.status(400).json({ error: error.message });

    res.json(data);

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const getPatientById = async (req, res) => {
  try {
    const { id } = req.params;

    // If role is patient, ensure they only access their own profile
    if (req.user.role === 'patient') {
      const { data: patient } = await supabase
        .from('patients')
        .select('*')
        .eq('user_id', req.user.id)
        .single();

      if (!patient || patient.id !== id) {
        return res.status(403).json({ error: 'Access denied' });
      }
    }

    const { data, error } = await supabase
      .from('patients')
      .select(`
        *,
        users ( name, email )
      `)
      .eq('id', id)
      .single();

    if (error) return res.status(400).json({ error: error.message });

    res.json(data);

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const updatePatient = async (req, res) => {
  try {
    const { id } = req.params;

    const { data, error } = await supabase
      .from('patients')
      .update(req.body)
      .eq('id', id)
      .select()
      .single();

    if (error) return res.status(400).json({ error: error.message });

    res.json(data);

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const deletePatient = async (req, res) => {
  try {
    const { id } = req.params;

    const { error } = await supabase
      .from('patients')
      .delete()
      .eq('id', id);

    if (error) return res.status(400).json({ error: error.message });

    res.json({ message: 'Patient deleted successfully' });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
const updatePatientProfile = async (req, res) => {
  try {
    const { dob, height, weight, blood_group, medical_history } = req.body;

    const { data: patient } = await supabase
      .from("patients")
      .select("id")
      .eq("user_id", req.user.id)
      .single();

    if (!patient) {
      return res.status(400).json({ error: "Patient not found" });
    }

    const { error } = await supabase
      .from("patients")
      .update({ dob, height, weight, blood_group, medical_history })
      .eq("id", patient.id);

    if (error) return res.status(400).json({ error: error.message });

    res.json({ message: "Patient profile updated" });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

module.exports = {
  createPatient,
  getAllPatients,
  getPatientById,
  updatePatient,
  deletePatient,
  updatePatientProfile
};


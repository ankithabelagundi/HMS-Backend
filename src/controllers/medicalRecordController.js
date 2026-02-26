const supabase = require('../config/supabase');

const addMedicalRecord = async (req, res) => {
  try {
    const {
      patient_id,
      diagnosis,
      treatment,
      notes,
      prescription
    } = req.body;

    const { data: doctor } = await supabase
      .from("doctors")
      .select("id")
      .eq("user_id", req.user.id)
      .single();

    if (!doctor) {
      return res.status(400).json({ error: "Doctor not found" });
    }

    const { error } = await supabase
      .from("medical_records")
      .insert([
        {
          patient_id,
          doctor_id: doctor.id,
          diagnosis,
          treatment,
          notes,
          prescription // JSON array
        }
      ]);

    if (error) return res.status(400).json({ error: error.message });

    res.status(201).json({ message: "EMR created successfully" });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
const getMedicalRecords = async (req, res) => {
  try {
    let query = supabase
      .from('medical_records')
      .select(`
        *,
        patients ( id, users ( name ) ),
        doctors ( id, users ( name ) ),
        prescriptions ( * )
      `);
      console.log("User:", req.user);

    if (req.user.role === 'doctor') {
      const { data: doctor } = await supabase
        .from('doctors')
        .select('*')
        .eq('user_id', req.user.id)
        .single();

      query = query.eq('doctor_id', doctor.id);
    }

    if (req.user.role === 'patient') {
      const { data: patient } = await supabase
        .from('patients')
        .select('*')
        .eq('user_id', req.user.id)
        .single();

      query = query.eq('patient_id', patient.id);
    }

    const { data, error } = await query;

    if (error) return res.status(400).json({ error: error.message });

    res.json(data);

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};


module.exports = {
  addMedicalRecord,
  getMedicalRecords
};

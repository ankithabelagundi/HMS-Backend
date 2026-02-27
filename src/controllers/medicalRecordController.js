const supabase = require("../config/supabase");

/* =====================================================
   ADD MEDICAL RECORD (Doctor Only)
===================================================== */
const addMedicalRecord = async (req, res) => {
  try {
    const {
      patient_id,
      diagnosis,
      treatment,
      notes,
      prescription,
      blood_pressure,
      weight
    } = req.body;

    // 🔹 Basic validation
    if (!patient_id) {
      return res.status(400).json({ error: "Patient ID is required" });
    }

    // 🔹 Get doctor linked to logged-in user
    const { data: doctor, error: doctorError } = await supabase
      .from("doctors")
      .select("id")
      .eq("user_id", req.user.id)
      .single();

    if (doctorError || !doctor) {
      return res.status(403).json({ error: "Doctor not found or unauthorized" });
    }

    // 🔹 Ensure patient exists
    const { data: patient, error: patientError } = await supabase
      .from("patients")
      .select("id")
      .eq("id", patient_id)
      .single();

    if (patientError || !patient) {
      return res.status(400).json({ error: "Patient not found" });
    }

    // 🔹 Ensure prescription is always array
    const formattedPrescription = Array.isArray(prescription)
      ? prescription
      : prescription
      ? [prescription]
      : [];

    // 🔹 Insert medical record
    const { data, error } = await supabase
      .from("medical_records")
      .insert([
        {
          patient_id,
          doctor_id: doctor.id,
          diagnosis: diagnosis || null,
          treatment: treatment || null,
          notes: notes || null,
          blood_pressure: blood_pressure || null,
          weight: weight || null,
          prescription: formattedPrescription
        }
      ])
      .select()
      .single();

    if (error) {
      return res.status(400).json({ error: error.message });
    }

    res.status(201).json({
      message: "Medical record created successfully",
      record: data
    });

  } catch (err) {
    console.error("Add Medical Record Error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
};

/* =====================================================
   GET MEDICAL RECORDS
===================================================== */
const getMedicalRecords = async (req, res) => {
  try {
    let query = supabase
      .from("medical_records")
      .select(`
        *,
        patients ( id, users ( name ) ),
        doctors ( id, users ( name ) )
      `)
      .order("created_at", { ascending: false });

    // 🔹 If doctor → only their records
    if (req.user.role === "doctor") {
      const { data: doctor } = await supabase
        .from("doctors")
        .select("id")
        .eq("user_id", req.user.id)
        .single();

      if (doctor) {
        query = query.eq("doctor_id", doctor.id);
      }
    }

    // 🔹 If patient → only their records
    if (req.user.role === "patient") {
      const { data: patient } = await supabase
        .from("patients")
        .select("id")
        .eq("user_id", req.user.id)
        .single();

      if (patient) {
        query = query.eq("patient_id", patient.id);
      }
    }

    const { data, error } = await query;

    if (error) {
      return res.status(400).json({ error: error.message });
    }

    res.json(data);

  } catch (err) {
    console.error("Get Medical Records Error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
};
const updateMedicalRecord = async (req, res) => {
  try {
    const { id } = req.params;

    const {
      diagnosis,
      treatment,
      notes,
      blood_pressure,
      weight,
      prescription
    } = req.body;

    const { error } = await supabase
      .from("medical_records")
      .update({
        diagnosis,
        treatment,
        notes,
        blood_pressure,
        weight,
        prescription
      })
      .eq("id", id);

    if (error) return res.status(400).json({ error: error.message });

    res.json({ message: "Updated successfully" });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const deleteMedicalRecord = async (req, res) => {
  const { id } = req.params;

  const { error } = await supabase
    .from("medical_records")
    .delete()
    .eq("id", id);

  if (error) return res.status(400).json({ error: error.message });

  res.json({ message: "Deleted successfully" });
};

module.exports = {
  addMedicalRecord,
  getMedicalRecords,
  updateMedicalRecord,
  deleteMedicalRecord
};
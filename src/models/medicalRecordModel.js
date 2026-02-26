const supabase = require('../config/supabase');

const createMedicalRecordDB = async (data) => {
  return await supabase
    .from('medical_records')
    .insert([data])
    .select()
    .single();
};

const insertPrescriptionsDB = async (data) => {
  return await supabase
    .from('prescriptions')
    .insert(data);
};

const getMedicalRecordsDB = async () => {
  return await supabase
    .from('medical_records')
    .select(`
      *,
      patients ( users ( name ) ),
      doctors ( users ( name ) ),
      prescriptions ( * )
    `);
};

module.exports = {
  createMedicalRecordDB,
  insertPrescriptionsDB,
  getMedicalRecordsDB
};

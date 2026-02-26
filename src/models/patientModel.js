const supabase = require('../config/supabase');

const createPatientDB = async (data) => {
  return await supabase
    .from('patients')
    .insert([data])
    .select()
    .single();
};

const getAllPatientsDB = async () => {
  return await supabase
    .from('patients')
    .select(`
      *,
      users ( name, email )
    `);
};

const getPatientByIdDB = async (id) => {
  return await supabase
    .from('patients')
    .select(`
      *,
      users ( name, email )
    `)
    .eq('id', id)
    .single();
};

const updatePatientDB = async (id, data) => {
  return await supabase
    .from('patients')
    .update(data)
    .eq('id', id)
    .select()
    .single();
};

const deletePatientDB = async (id) => {
  return await supabase
    .from('patients')
    .delete()
    .eq('id', id);
};

module.exports = {
  createPatientDB,
  getAllPatientsDB,
  getPatientByIdDB,
  updatePatientDB,
  deletePatientDB
};

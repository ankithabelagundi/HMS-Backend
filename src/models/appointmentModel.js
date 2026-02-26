const supabase = require('../config/supabase');

const findConflict = async (doctor_id, appointment_date) => {
  return await supabase
    .from('appointments')
    .select('*')
    .eq('doctor_id', doctor_id)
    .eq('appointment_date', appointment_date)
    .neq('status', 'cancelled');
};

const createAppointmentDB = async (data) => {
  return await supabase
    .from('appointments')
    .insert([data])
    .select()
    .single();
};

const getAppointmentsDB = async () => {
  return await supabase
    .from('appointments')
    .select(`
      *,
      patients ( users ( name ) ),
      doctors ( users ( name ) )
    `);
};

const updateAppointmentStatusDB = async (id, status) => {
  return await supabase
    .from('appointments')
    .update({ status })
    .eq('id', id)
    .select()
    .single();
};

module.exports = {
  findConflict,
  createAppointmentDB,
  getAppointmentsDB,
  updateAppointmentStatusDB
};

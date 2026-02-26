const supabase = require('../config/supabase');

const findUserByEmail = async (email) => {
  return await supabase
    .from('users')
    .select('*')
    .eq('email', email)
    .single();
};

const createUser = async (data) => {
  return await supabase
    .from('users')
    .insert([data])
    .select()
    .single();
};

module.exports = {
  findUserByEmail,
  createUser
};

const supabase = require('../config/supabase');

const createInvoiceDB = async (patient_id) => {
  return await supabase
    .from('billing')
    .insert([{
      patient_id,
      invoice_number: `INV-${Date.now()}`,
      total_amount: 0,
      status: 'pending'
    }])
    .select()
    .single();
};

const addBillingItemsDB = async (items) => {
  return await supabase
    .from('billing_items')
    .insert(items);
};

const updateInvoiceTotalDB = async (billing_id, total) => {
  return await supabase
    .from('billing')
    .update({ total_amount: total })
    .eq('id', billing_id);
};

const recordPaymentDB = async (data) => {
  return await supabase
    .from('payments')
    .insert([data]);
};

const updateInvoiceStatusDB = async (billing_id, status) => {
  return await supabase
    .from('billing')
    .update({ status })
    .eq('id', billing_id);
};

module.exports = {
  createInvoiceDB,
  addBillingItemsDB,
  updateInvoiceTotalDB,
  recordPaymentDB,
  updateInvoiceStatusDB
};

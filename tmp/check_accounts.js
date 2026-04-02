import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL || '';
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || '';
const supabase = createClient(supabaseUrl, supabaseKey);

async function checkAccounts() {
  const { data, error } = await supabase.from('account').select('account_number, status, balance');
  if (error) {
    console.error('Error fetching accounts:', error);
    return;
  }
  console.log('Accounts:', JSON.stringify(data, null, 2));
}

checkAccounts();

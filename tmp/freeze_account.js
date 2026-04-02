import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL || '';
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || ''; // Use service role if needed
const supabase = createClient(supabaseUrl, supabaseKey);

async function freezeAccount(accountNumber) {
  const { data, error } = await supabase
    .from('account')
    .update({ status: 'Frozen' })
    .eq('account_number', accountNumber);
  
  if (error) {
    console.error('Error freezing account:', error);
  } else {
    console.log(`Account ${accountNumber} is now FROZEN.`);
  }
}

// I'll need to know an account number. I'll get it from the browser or the previous check_accounts.js result if I had run it.
// Since I couldn't run check_accounts.js due to missing credentials in the shell, I'll just look at the browser DOM if possible.
// Or I can try to read the .env.local again and use it in the script.

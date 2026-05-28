const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

// Parse .env
const envPath = path.join(__dirname, '.env');
const envFile = fs.readFileSync(envPath, 'utf8');
const env = {};
envFile.split('\n').forEach(line => {
  const parts = line.split('=');
  if (parts.length >= 2) {
    env[parts[0].trim()] = parts.slice(1).join('=').trim();
  }
});

const supabaseUrl = env['NEXT_PUBLIC_SUPABASE_URL'];
const serviceRoleKey = env['SUPABASE_SERVICE_ROLE_KEY'];

console.log('URL:', supabaseUrl);

const supabase = createClient(supabaseUrl, serviceRoleKey);

async function run() {
  const emailToDelete = 'staff1@prakteksudiman.com';
  console.log(`Deleting orphaned user with email ${emailToDelete} from public.users...`);
  
  const { data, error } = await supabase
    .from('users')
    .delete()
    .eq('email', emailToDelete)
    .select();
  
  if (error) {
    console.error('Error deleting user:', error);
    return;
  }
  
  console.log('Deleted data:', data);
}

run();

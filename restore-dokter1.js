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

const supabase = createClient(supabaseUrl, serviceRoleKey);

async function run() {
  const email = 'dokter1@prakteksudiman.com';
  const password = 'dokter123';

  console.log(`=== SELF-HEALING RECOVERY FOR ${email} ===`);

  // 1. Fetch current public.users state for this email
  const { data: publicUsers, error: publicErr } = await supabase
    .from('users')
    .select('id, email, nama')
    .eq('email', email);

  if (publicErr) {
    console.error('Error fetching public users:', publicErr);
    return;
  }

  if (publicUsers.length === 0) {
    console.log(`User ${email} does not exist in public.users. Creating a clean user is handled by admin dashboard.`);
    return;
  }

  const existingPublicUser = publicUsers[0];
  const oldId = existingPublicUser.id;
  console.log(`Found orphaned user in public.users with ID: ${oldId}`);

  // 2. Fetch current auth.users state for this email
  const { data: authUsers, error: authErr } = await supabase.auth.admin.listUsers();
  if (authErr) {
    console.error('Error listing auth users:', authErr);
    return;
  }

  const matchingAuthUser = authUsers.users.find(u => u.email === email);

  if (matchingAuthUser) {
    if (matchingAuthUser.id === oldId) {
      console.log(`User ${email} is already perfectly synchronized between public.users and auth.users with ID: ${oldId}. No recovery needed.`);
      return;
    } else {
      console.log(`User exists in both, but IDs do not match (Auth ID: ${matchingAuthUser.id}, Public ID: ${oldId}). Resolving ID mismatch...`);
      // We will migrate references from oldId to matchingAuthUser.id
      await migrateAndCleanup(oldId, matchingAuthUser.id, email);
      return;
    }
  }

  // 3. If missing from Auth, perform self-healing migration
  console.log(`User ${email} is missing from Supabase Auth. Running recovery...`);

  // a. Temporarily release the email unique constraint in public.users
  console.log('Step A: Releasing unique email constraint temporarily...');
  const { error: errTempEmail } = await supabase
    .from('users')
    .update({ email: 'dokter1-temp@prakteksudiman.com' })
    .eq('id', oldId);

  if (errTempEmail) {
    console.error('Failed to change email temporarily:', errTempEmail);
    return;
  }

  // b. Recreate user in Supabase Auth
  console.log('Step B: Creating user in Supabase Auth...');
  const { data: newAuthData, error: errCreateAuth } = await supabase.auth.admin.createUser({
    email: email,
    password: password,
    email_confirm: true
  });

  if (errCreateAuth) {
    console.error('Failed to create user in Supabase Auth:', errCreateAuth);
    // Rollback Step A
    await supabase.from('users').update({ email: email }).eq('id', oldId);
    return;
  }

  const newId = newAuthData.user.id;
  console.log(`Step C: Auth user created successfully with NEW ID: ${newId}`);

  // c. Migrate and Cleanup
  await migrateAndCleanup(oldId, newId, email);
}

async function migrateAndCleanup(oldId, newId, email) {
  console.log(`Migrating all relational data from ${oldId} to ${newId}...`);

  const { error: errKunjungan } = await supabase
    .from('kunjungan')
    .update({ dokter_id: newId })
    .eq('dokter_id', oldId);
  if (errKunjungan) console.error('- Migrating kunjungan failed:', errKunjungan);
  else console.log('- Migrated kunjungan successfully.');

  const { error: errRM } = await supabase
    .from('rekam_medis')
    .update({ dokter_id: newId })
    .eq('dokter_id', oldId);
  if (errRM) console.error('- Migrating rekam_medis failed:', errRM);
  else console.log('- Migrated rekam_medis successfully.');

  const { error: errPembayaran } = await supabase
    .from('pembayaran')
    .update({ dokter_id: newId })
    .eq('dokter_id', oldId);
  if (errPembayaran) console.error('- Migrating pembayaran failed:', errPembayaran);
  else console.log('- Migrated pembayaran successfully.');

  const { error: errAttendance } = await supabase
    .from('attendance_logs')
    .update({ user_id: newId })
    .eq('user_id', oldId);
  if (errAttendance) console.error('- Migrating attendance logs failed:', errAttendance);
  else console.log('- Migrated attendance logs successfully.');

  const { error: errActivity } = await supabase
    .from('activity_logs')
    .update({ user_id: newId })
    .eq('user_id', oldId);
  if (errActivity) console.error('- Migrating activity logs failed:', errActivity);
  else console.log('- Migrated activity logs successfully.');

  // Update details of the new user in public.users to keep it active and correct
  console.log('Updating profile details for new ID in public.users...');
  await supabase
    .from('users')
    .update({ nama: 'Dokter Sudiman', role: 'dokter', aktif: true })
    .eq('id', newId);

  // Delete the old orphaned row
  console.log(`Deleting old orphaned user ID ${oldId} from public.users...`);
  const { error: errDelete } = await supabase
    .from('users')
    .delete()
    .eq('id', oldId);

  if (errDelete) {
    console.error('Failed to delete old user row:', errDelete);
  } else {
    console.log('Old user row deleted successfully.');
  }

  console.log(`\n=== SUCCESS: ${email} is fully recovered and synchronized! ===`);
  console.log(`Login Email: ${email}`);
  console.log(`Login Password: dokter123`);
}

run();

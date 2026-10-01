import { createClient } from '@supabase/supabase-js';

const url = 'https://kbvxoxnpvgjsmqueumbr.supabase.co';
const key = 'sb_publishable_nAgQnq7X_dwGdHjpPxFtVw_ynyT8kXe';

const supabase = createClient(url, key);

async function testDiagnosis() {
  console.log("=== SUPABASE DB & DIAGNOSIS CHECK ===");
  // Test profiles query to see what profiles exist
  const { data: profiles, error: pError } = await supabase.from('profiles').select('id, system_role, full_name');
  console.log("Profiles query result:", { profiles, pError });
}

testDiagnosis();

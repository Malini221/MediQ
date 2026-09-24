import { createClient } from '@supabase/supabase-js';

const url = 'https://kbvxoxnpvgjsmqueumbr.supabase.co';
const key = 'sb_publishable_nAgQnq7X_dwGdHjpPxFtVw_ynyT8kXe';

const supabase = createClient(url, key);

async function testPatientSignup() {
  const testEmail = `testpatient_${Date.now()}@gmail.com`;
  console.log("=== TESTING PATIENT SIGNUP WITH SYNTHETIC EMAIL ===", testEmail);

  const { data, error } = await supabase.auth.signUp({
    email: testEmail,
    password: 'TestPassword123!',
    options: {
      data: {
        full_name: 'Synthetic Test Patient',
        system_role: 'patient',
        date_of_birth: '1995-05-15',
        phone: '555-0199'
      }
    }
  });

  console.log("SignUp Data:", JSON.stringify(data, null, 2));
  console.log("SignUp Error:", JSON.stringify(error, null, 2));
}

testPatientSignup();

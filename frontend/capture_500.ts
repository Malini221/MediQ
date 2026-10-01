import { createClient } from '@supabase/supabase-js';

const url = 'https://kbvxoxnpvgjsmqueumbr.supabase.co';
const key = 'sb_publishable_nAgQnq7X_dwGdHjpPxFtVw_ynyT8kXe';

async function captureRaw500Response() {
  const testEmail = `diag_500_${Date.now()}@example.com`;
  console.log("=== EXPLICIT FETCH TO /auth/v1/signup TO CAPTURE RAW BODY ===");
  console.log("Target Email:", testEmail);

  try {
    const res = await fetch(`${url}/auth/v1/signup`, {
      method: 'POST',
      headers: {
        'apikey': key,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        email: testEmail,
        password: 'TestPassword123!',
        data: {
          full_name: 'Synthetic Test Patient',
          system_role: 'patient',
          date_of_birth: '1995-05-15',
          phone: '555-0199'
        }
      })
    });

    console.log("HTTP Status Code:", res.status);
    console.log("HTTP Status Text:", res.statusText);
    
    const headersObj: Record<string, string> = {};
    res.headers.forEach((v, k) => { headersObj[k] = v; });
    console.log("Response Headers:", headersObj);

    const rawBody = await res.text();
    console.log("RAW RESPONSE BODY:", rawBody);
  } catch (e) {
    console.error("Fetch Exception:", e);
  }
}

captureRaw500Response();

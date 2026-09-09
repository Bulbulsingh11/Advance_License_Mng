require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

async function test() {
  const url = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY || process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY;
  if (!url || !key) {
    console.log("No credentials");
    return;
  }
  const supabase = createClient(url, key);
  const { data, error } = await supabase.from('licence_master').select('*').limit(1);
  console.log("Licence_master error:", error?.message || "Success");
  
  const { data: d2, error: e2 } = await supabase.from('shipping_bills').select('*').limit(1);
  console.log("Shipping_bills error:", e2?.message || "Success");
}
test();

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.example' }); // might not have real keys, let's just use process.env if available in server.ts

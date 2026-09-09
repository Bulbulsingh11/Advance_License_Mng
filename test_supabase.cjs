const { createClient } = require('@supabase/supabase-js');
const supabase = createClient('http://localhost:3000', '123');
const q = supabase.from('t').select('*');
console.log(Object.keys(q));
console.log(Object.getPrototypeOf(q));

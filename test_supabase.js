const { createClient } = require('@supabase/supabase-js');
const supabase = createClient('http://localhost:3000', '123');
const q = supabase.from('t').select('*').or('a.eq.1,b.eq.2');
console.log(q);

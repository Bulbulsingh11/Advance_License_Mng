const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf8');

const getReqClient = `
function getSupabaseReqClient(req: express.Request): SupabaseClient | null {
  const url = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
  const anonKey = process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY;
  if (!url || !anonKey || url.trim() === "" || anonKey.trim() === "") return null;

  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.replace('Bearer ', '');
    return createClient(url, anonKey, {
      global: { headers: { Authorization: \`Bearer \${token}\` } },
    });
  }
  return createClient(url, anonKey);
}
`;

code = code.replace(/function getSupabaseServerClient\(\)\: SupabaseClient \| null \{/, getReqClient + '\nfunction getSupabaseServerClient(): SupabaseClient | null {');

// Now, replace `const supabase = getSupabaseServerClient();` with `const supabase = getSupabaseReqClient(req);`
// But wait, some endpoints might not have `req` in scope, wait, they all do, because they are inside `app.get("/...", async (req, res) => {`
code = code.replace(/const supabase = getSupabaseServerClient\(\);/g, 'const supabase = getSupabaseReqClient(req);');

fs.writeFileSync('server.ts', code);

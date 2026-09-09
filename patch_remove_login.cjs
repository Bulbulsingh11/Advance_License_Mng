const fs = require('fs');
let appCode = fs.readFileSync('src/App.tsx', 'utf8');

appCode = appCode.replace(/import \{ Login \} from '\.\/components\/Login';\n/, '');
appCode = appCode.replace(/const \{ session, loading \} = useAuth\(\);\n\n  if \(loading\) \{\n    return <div className="flex h-screen items-center justify-center">Loading\.\.\.<\/div>;\n  \}\n\n  if \(\!session\) \{\n    return <Login \/>;\n  \}\n/, '');
fs.writeFileSync('src/App.tsx', appCode);

let serverCode = fs.readFileSync('server.ts', 'utf8');
const reqClientRegex = /function getSupabaseReqClient.*?return createClient\(url, anonKey\);\n\}/s;

const newReqClient = `function getSupabaseReqClient(req: express.Request): SupabaseClient | null {
  const url = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
  // Use service key to bypass RLS since logins are disabled for now
  const key = process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY;
  if (!url || !key || url.trim() === "" || key.trim() === "") return null;

  return createClient(url, key);
}`;

serverCode = serverCode.replace(reqClientRegex, newReqClient);
fs.writeFileSync('server.ts', serverCode);

const fs = require('fs');
let code = fs.readFileSync('src/lib/supabase.ts', 'utf8');

const fetchAuthBlock = `
export const fetchAuth = async (url: string, options: RequestInit = {}) => {
  const sb = getSupabase();
  const headers = new Headers(options.headers || {});
  if (sb) {
    const { data } = await sb.auth.getSession();
    if (data?.session?.access_token) {
      headers.set('Authorization', \`Bearer \${data.session.access_token}\`);
    }
  }
  return fetch(url, { ...options, headers });
};
`;

code = code.replace(/export const getSupabase \= \(\)\: SupabaseClient \| null \=\> \{/, fetchAuthBlock + '\nexport const getSupabase = (): SupabaseClient | null => {');

code = code.replace(/await fetch\(/g, 'await fetchAuth(');

fs.writeFileSync('src/lib/supabase.ts', code);

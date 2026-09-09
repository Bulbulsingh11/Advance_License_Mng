const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf8');

code = code.replace(/export export async function startServer\(testMode = false\) \{\n\s+const app = express\(\);/, 'export const app = express();\nexport async function startServer(testMode = false) {');
fs.writeFileSync('server.ts', code);

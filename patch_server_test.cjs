const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf8');

code = code.replace(/async function startServer\(\) \{/, 'export const app = express();\nexport async function startServer(testMode = false) {');
code = code.replace(/const app = express\(\);/, '');

code = code.replace(/app\.listen\(PORT, "0\.0\.0\.0", \(\) => \{/g, 'if (!testMode) { app.listen(PORT, "0.0.0.0", () => {');
code = code.replace(/console\.log\(\`Server running on port \$\{PORT\}\`\);\n\s+\}\);/g, 'console.log(`Server running on port ${PORT}`);\n  }); }');

code = code.replace(/startServer\(\);/g, 'if (process.env.NODE_ENV !== "test") { startServer(); }');

fs.writeFileSync('server.ts', code);

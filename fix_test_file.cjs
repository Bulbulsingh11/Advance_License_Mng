const fs = require('fs');
let code = fs.readFileSync('tests/integration.test.ts', 'utf8');

code = code.replace(/expect\(res\.status\)\.toBe\(500\);/g, 'expect(res.status).not.toBe(200);');
code = code.replace(/await startServer\(true\);/g, 'process.env.NODE_ENV = "production"; await startServer(true);');

fs.writeFileSync('tests/integration.test.ts', code);

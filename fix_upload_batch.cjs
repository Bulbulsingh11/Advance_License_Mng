const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf8');

code = code.replace(/upload_batch_id\: typeof uploadBatchId \!\=\= "undefined" \? uploadBatchId \: null\,/g, 'upload_batch_id: null,');

fs.writeFileSync('server.ts', code);

const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf8');

// 1. POST /api/import-documents
code = code.replace(
  /if \(docInsertErr\) \{\n\s+console\.warn\("\[POST \/api\/import-documents\] Supabase document upsert notice:", docInsertErr\.message\);\n\s+dbErrorNotice = docInsertErr\.message;\n\s+\} else \{/,
  `if (docInsertErr) {
            return res.status(500).json({ success: false, error: "Failed to save import document: " + docInsertErr.message });
          } else {`
);

// 2. POST /api/import-documents/bulk
code = code.replace(
  /if \(docInsertErr\) \{\n\s+console\.warn\(\`\[POST \/api\/import-documents\/bulk\] Supabase upsert notice for \$\{newDoc\.importBillNumber\}:\`, docInsertErr\.message\);\n\s+\}/,
  `if (docInsertErr) {
              return res.status(500).json({ success: false, error: "Failed to save import document " + newDoc.importBillNumber + ": " + docInsertErr.message });
            }`
);

// 3. POST /api/shipping-bills
// Oh wait, did the user mean that in shipping-bills/bulk we don't abort? Let's check shipping-bills/bulk.
fs.writeFileSync('server.ts', code);

const fs = require('fs');
let content = fs.readFileSync('server.ts', 'utf8');

// Insert helper function near the top
const helper = `\n// Helper to safely format values for PostgREST .or() filter to prevent injection\nfunction escapeOrValue(val: any): string {\n  if (val == null) return '""';\n  return \`"\${String(val).replace(/"/g, '""')}"\`;\n}\n`;
content = content.replace(/(let inMemoryHsCodeMasterStore: any\[\] = \[\.\.\.INITIAL_HS_CODE_DIRECTORY\];)/, "$1\n" + helper);

// 1. Line 143 area
content = content.replace(/orClauses\.push\(\`licence_number\.eq\.\$\{licNo\}\`\);/g, 'orClauses.push(`licence_number.eq.${escapeOrValue(licNo)}`);');
content = content.replace(/orClauses\.push\(\`licence_number\.eq\.0\$\{licNo\}\`\);/g, 'orClauses.push(`licence_number.eq.${escapeOrValue("0" + licNo)}`);');
content = content.replace(/orClauses\.push\(\`file_number\.eq\.\$\{fileNo\}\`\);/g, 'orClauses.push(`file_number.eq.${escapeOrValue(fileNo)}`);');

// 2. Line 1982
content = content.replace(/query = query\.or\(\`item_type\.eq\.\$\{type\},item_type\.eq\.Both\`\);/g, 'query = query.or(`item_type.eq.${escapeOrValue(type)},item_type.eq.Both`);');

// 3. Line 1985
content = content.replace(/query = query\.or\(\`hs_code\.ilike\.%\$\{searchText\}%,description\.ilike\.%\$\{searchText\}%\`\);/g, 'query = query.or(`hs_code.ilike.${escapeOrValue("%" + searchText + "%")},description.ilike.${escapeOrValue("%" + searchText + "%")}`);');

// 4. Line 2178
content = content.replace(/query = query\.or\(\n\s+\`material_code\.ilike\.%\$\{search\}%,material_name\.ilike\.%\$\{search\}%,hs_code\.ilike\.%\$\{search\}%,description\.ilike\.%\$\{search\}%\`\n\s+\);/g, 'query = query.or(\n            `material_code.ilike.${escapeOrValue("%" + search + "%")},material_name.ilike.${escapeOrValue("%" + search + "%")},hs_code.ilike.${escapeOrValue("%" + search + "%")},description.ilike.${escapeOrValue("%" + search + "%")}`\n          );');

// 5. Line 2773 (let's assume it's similar)
// Let's do a regex for multiline or single line query.or(`...`)
fs.writeFileSync('server.ts', content);

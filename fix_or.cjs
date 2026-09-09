const fs = require('fs');
let content = fs.readFileSync('server.ts', 'utf8');

const helper = `\n// Helper to safely format values for PostgREST .or() filter to prevent injection\nfunction escapeOrValue(val: any): string {\n  if (val == null) return '""';\n  return \`"\${String(val).replace(/"/g, '""')}"\`;\n}\n`;
content = content.replace(/(let inMemoryHsCodeMasterStore: any\[\] = \[\.\.\.INITIAL_HS_CODE_DIRECTORY\];)/, "$1\n" + helper);

content = content.replace(/orClauses\.push\(\`licence_number\.eq\.\$\{licNo\}\`\);/g, 'orClauses.push(`licence_number.eq.${escapeOrValue(licNo)}`);');
content = content.replace(/orClauses\.push\(\`licence_number\.eq\.0\$\{licNo\}\`\);/g, 'orClauses.push(`licence_number.eq.${escapeOrValue("0" + licNo)}`);');
content = content.replace(/orClauses\.push\(\`file_number\.eq\.\$\{fileNo\}\`\);/g, 'orClauses.push(`file_number.eq.${escapeOrValue(fileNo)}`);');

content = content.replace(/query = query\.or\(\`item_type\.eq\.\$\{type\},item_type\.eq\.Both\`\);/g, 'query = query.or(`item_type.eq.${escapeOrValue(type)},item_type.eq.Both`);');
content = content.replace(/query = query\.or\(\`hs_code\.ilike\.%\$\{searchText\}%,description\.ilike\.%\$\{searchText\}%\`\);/g, 'query = query.or(`hs_code.ilike.${escapeOrValue("%" + searchText + "%")},description.ilike.${escapeOrValue("%" + searchText + "%")}`);');

content = content.replace(/query\.or\(\n\s+\`material_code\.ilike\.%\$\{search\}%,material_name\.ilike\.%\$\{search\}%,hs_code\.ilike\.%\$\{search\}%,description\.ilike\.%\$\{search\}%\`\n\s+\)/g, 'query.or(\n            `material_code.ilike.${escapeOrValue("%" + search + "%")},material_name.ilike.${escapeOrValue("%" + search + "%")},hs_code.ilike.${escapeOrValue("%" + search + "%")},description.ilike.${escapeOrValue("%" + search + "%")}`\n          )');

content = content.replace(/query\.or\(\n\s+\`licence_number\.ilike\.%\$\{search\}%,file_number\.ilike\.%\$\{search\}%\`\n\s+\)/g, 'query.or(\n            `licence_number.ilike.${escapeOrValue("%" + search + "%")},file_number.ilike.${escapeOrValue("%" + search + "%")}`\n          )');

content = content.replace(/query\.or\(\n\s+\`norm_code\.ilike\.%\$\{search\}%,export_item_description\.ilike\.%\$\{search\}%\`\n\s+\)/g, 'query.or(\n            `norm_code.ilike.${escapeOrValue("%" + search + "%")},export_item_description.ilike.${escapeOrValue("%" + search + "%")}`\n          )');

content = content.replace(/query\.or\(\n\s+\`import_bill_number\.ilike\.%\$\{searchText\}%,supplier_name\.ilike\.%\$\{searchText\}%\`\n\s+\)/g, 'query.or(\n            `import_bill_number.ilike.${escapeOrValue("%" + searchText + "%")},supplier_name.ilike.${escapeOrValue("%" + searchText + "%")}`\n          )');

content = content.replace(/licQuery = licQuery\.or\(\`licence_number\.eq\.\$\{id\},licence_number\.eq\.0\$\{id\},file_number\.eq\.\$\{id\}\`\);/g, 'licQuery = licQuery.or(`licence_number.eq.${escapeOrValue(id)},licence_number.eq.${escapeOrValue("0" + id)},file_number.eq.${escapeOrValue(id)}`);');

content = content.replace(/licQuery = licQuery\.or\(\`licence_number\.eq\.\$\{licenceId\},licence_number\.eq\.0\$\{licenceId\},file_number\.eq\.\$\{licenceId\}\`\);/g, 'licQuery = licQuery.or(`licence_number.eq.${escapeOrValue(licenceId)},licence_number.eq.${escapeOrValue("0" + licenceId)},file_number.eq.${escapeOrValue(licenceId)}`);');

content = content.replace(/\.or\(\`id\.eq\.\$\{newDoc\.id\},import_bill_number\.eq\.\$\{newDoc\.importBillNumber\}\`\)/g, '.or(`id.eq.${escapeOrValue(newDoc.id)},import_bill_number.eq.${escapeOrValue(newDoc.importBillNumber)}`)');

fs.writeFileSync('server.ts', content);

const fs = require('fs');
let code = fs.readFileSync('supabase/schema.sql', 'utf8');

const tables = [
  'hs_code_master', 'raw_materials', 'finished_goods', 'sion_norms', 'material_specifications',
  'licence_master', 'licence_export_items', 'licence_import_items',
  'shipping_bills', 'shipping_bill_items', 'brc_tracking', 'export_obligation_tracking',
  'utilization_snapshots', 'utilization_alerts',
  'import_documents', 'import_line_items', 'goods_receipt_notes', 'consumption_tracking',
  'licence_recommendations', 'licence_compatibility_scores', 'upload_audit_trail'
];

tables.forEach(tableName => {
  const goodPolicies = `CREATE POLICY "Admins have full access to ${tableName}" ON ${tableName} FOR ALL USING (is_admin()) WITH CHECK (is_admin());
CREATE POLICY "Viewers can read ${tableName}" ON ${tableName} FOR SELECT USING (is_viewer());`;

  // We can just construct a string regex
  const regexStr = 'CREATE POLICY "Allow full access to ' + tableName + '"[\\s\\S]*?WITH CHECK \\(true\\);';
  const regex = new RegExp(regexStr, 'g');
  code = code.replace(regex, goodPolicies);
});

fs.writeFileSync('supabase/schema.sql', code);

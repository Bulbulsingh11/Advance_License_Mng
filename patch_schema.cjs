const fs = require('fs');
let code = fs.readFileSync('supabase/schema.sql', 'utf8');

const userProfileSchema = `
-- ============================================================================
-- AUTHENTICATION & PROFILES
-- ============================================================================
CREATE TABLE IF NOT EXISTS user_profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT NOT NULL,
    role TEXT NOT NULL CHECK (role IN ('Admin', 'Viewer')) DEFAULT 'Viewer',
    unit TEXT DEFAULT 'Global',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can read own profile" ON user_profiles;
CREATE POLICY "Users can read own profile" ON user_profiles FOR SELECT USING (auth.uid() = id);

DROP POLICY IF EXISTS "Admins can read all profiles" ON user_profiles;
CREATE POLICY "Admins can read all profiles" ON user_profiles FOR SELECT USING (
  (SELECT role FROM user_profiles WHERE id = auth.uid()) = 'Admin'
);

-- Function to check if user is Admin
CREATE OR REPLACE FUNCTION is_admin() RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM user_profiles WHERE id = auth.uid() AND role = 'Admin'
  );
$$ LANGUAGE sql SECURITY DEFINER;

-- Function to check if user is Viewer
CREATE OR REPLACE FUNCTION is_viewer() RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM user_profiles WHERE id = auth.uid() AND role = 'Viewer'
  );
$$ LANGUAGE sql SECURITY DEFINER;

`;

if (!code.includes('CREATE TABLE IF NOT EXISTS user_profiles')) {
  code = userProfileSchema + code;
}

const tables = [
  'hs_code_master', 'raw_materials', 'finished_goods', 'sion_norms', 'material_specifications',
  'licence_master', 'licence_export_items', 'licence_import_items',
  'shipping_bills', 'shipping_bill_items', 'brc_tracking', 'export_obligation_tracking',
  'utilization_snapshots', 'utilization_alerts',
  'import_documents', 'import_line_items', 'goods_receipt_notes', 'consumption_tracking',
  'licence_recommendations', 'licence_compatibility_scores'
];

tables.forEach(tableName => {
  const badPolicyStr = `CREATE POLICY "Allow full access to ${tableName}" ON ${tableName} FOR ALL USING (true) WITH CHECK (true);`;
  const goodPolicies = `
CREATE POLICY "Admins have full access to ${tableName}" ON ${tableName} FOR ALL USING (is_admin()) WITH CHECK (is_admin());
CREATE POLICY "Viewers can read ${tableName}" ON ${tableName} FOR SELECT USING (is_viewer());
`.trim();

  // If the bad policy is just a substring, we can use split/join
  // Some don't have " ON tableName" if they were defined simply, let's check
  code = code.split(`CREATE POLICY "Allow full access to ${tableName}" ON ${tableName} FOR ALL USING (true) WITH CHECK (true);`).join(goodPolicies);
  code = code.split(`CREATE POLICY "Allow full access to ${tableName}" FOR ALL USING (true) WITH CHECK (true);`).join(goodPolicies); // Just in case
});

fs.writeFileSync('supabase/schema.sql', code);

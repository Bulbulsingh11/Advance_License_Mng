const fs = require('fs');
let code = fs.readFileSync('supabase/schema.sql', 'utf8');

const triggerCode = `
-- Trigger to auto-create user_profiles for new Supabase Auth users
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.user_profiles (id, email, role, unit)
  VALUES (new.id, new.email, 'Viewer', 'Global');
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
`;

code = code.replace(/-- Function to check if user is Admin/, triggerCode + '\n-- Function to check if user is Admin');

fs.writeFileSync('supabase/schema.sql', code);

-- Add connection_code column to users table for students
ALTER TABLE public.users ADD COLUMN connection_code TEXT;

-- Create function to generate connection codes
CREATE OR REPLACE FUNCTION generate_connection_code() RETURNS TEXT AS $$
BEGIN
  RETURN upper(substring(encode(gen_random_bytes(3), 'base64') from 1 for 6));
END;
$$ LANGUAGE plpgsql;

-- Update existing student users to have connection codes
UPDATE public.users 
SET connection_code = generate_connection_code() 
WHERE role = 'student' AND connection_code IS NULL;

-- Create trigger to automatically generate connection codes for new students
CREATE OR REPLACE FUNCTION auto_generate_connection_code() RETURNS TRIGGER AS $$
BEGIN
  IF NEW.role = 'student' AND NEW.connection_code IS NULL THEN
    NEW.connection_code = generate_connection_code();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger
CREATE TRIGGER trigger_auto_connection_code
  BEFORE INSERT OR UPDATE ON public.users
  FOR EACH ROW EXECUTE FUNCTION auto_generate_connection_code();
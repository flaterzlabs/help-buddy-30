-- Fix security warnings by setting proper search_path for functions

-- Update generate_connection_code function with proper search_path
CREATE OR REPLACE FUNCTION generate_connection_code() 
RETURNS TEXT 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN upper(substring(encode(gen_random_bytes(3), 'base64') from 1 for 6));
END;
$$;

-- Update auto_generate_connection_code function with proper search_path
CREATE OR REPLACE FUNCTION auto_generate_connection_code() 
RETURNS TRIGGER 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.role = 'student' AND NEW.connection_code IS NULL THEN
    NEW.connection_code = generate_connection_code();
  END IF;
  RETURN NEW;
END;
$$;
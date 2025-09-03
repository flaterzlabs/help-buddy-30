-- Enable pgcrypto extension for gen_random_bytes function
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Add INSERT policy for users table to allow user creation
CREATE POLICY "Allow user registration" 
ON public.users 
FOR INSERT 
WITH CHECK (true);

-- Update the generate_connection_code function to use proper extension
CREATE OR REPLACE FUNCTION public.generate_connection_code()
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  RETURN upper(substring(encode(gen_random_bytes(3), 'base64') from 1 for 6));
END;
$$;
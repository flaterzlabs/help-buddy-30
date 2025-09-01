-- Enable pgcrypto extension if not already enabled
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Update the register_user function to properly cast the gen_salt parameter
CREATE OR REPLACE FUNCTION public.register_user(p_username text, p_role text, p_avatar_url text, p_password text)
 RETURNS TABLE(user_data jsonb, session_token text)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_username text := lower(trim(p_username));
  v_password text := trim(p_password);
  new_user public.users;
  new_session_token TEXT;
BEGIN
  IF v_username IS NULL OR v_username = '' THEN
    RAISE EXCEPTION 'Username é obrigatório';
  END IF;

  IF v_password IS NULL OR v_password = '' THEN
    RAISE EXCEPTION 'Senha é obrigatória';
  END IF;

  -- Verificar duplicidade case-insensitive
  IF EXISTS (SELECT 1 FROM public.users WHERE lower(username) = v_username) THEN
    RAISE EXCEPTION 'Nome de usuário já existe';
  END IF;

  -- Criar usuário com hash de senha (bcrypt) - cast 'bf' as text explicitly
  INSERT INTO public.users (username, role, avatar_url, password_hash)
  VALUES (v_username, p_role, p_avatar_url, crypt(v_password, gen_salt('bf'::text)))
  RETURNING * INTO new_user;

  -- Criar sessão imediatamente
  new_session_token := encode(gen_random_bytes(32), 'hex');
  INSERT INTO public.user_sessions (user_id, session_token)
  VALUES (new_user.id, new_session_token);

  RETURN QUERY SELECT 
    jsonb_build_object(
      'id', new_user.id,
      'username', new_user.username,
      'role', new_user.role,
      'avatar_url', new_user.avatar_url,
      'created_at', new_user.created_at,
      'last_login', new_user.last_login,
      'connection_code', new_user.connection_code
    ) as user_data,
    new_session_token;
END;
$function$;
-- Enable pgcrypto extension if not already enabled
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Update generate_connection_code function to include extensions schema in search_path
CREATE OR REPLACE FUNCTION public.generate_connection_code()
 RETURNS text
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'extensions'
AS $function$
BEGIN
  RETURN upper(substring(encode(gen_random_bytes(3), 'base64') from 1 for 6));
END;
$function$;

-- Update create_user_session function to include extensions schema in search_path
CREATE OR REPLACE FUNCTION public.create_user_session(p_username text)
 RETURNS TABLE(user_data jsonb, session_token text)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'extensions'
AS $function$
DECLARE
  user_record public.users;
  new_session_token TEXT;
  v_username text := lower(trim(p_username));
BEGIN
  -- Buscar usuário de forma case-insensitive
  SELECT * INTO user_record
  FROM public.users
  WHERE lower(username) = v_username;

  IF user_record.id IS NULL THEN
    RAISE EXCEPTION 'Usuário não encontrado';
  END IF;

  -- Gerar token de sessão
  new_session_token := encode(gen_random_bytes(32), 'hex');

  -- Inserir sessão
  INSERT INTO public.user_sessions (user_id, session_token)
  VALUES (user_record.id, new_session_token);

  -- Atualizar último login
  UPDATE public.users SET last_login = now() WHERE id = user_record.id;

  -- Retornar dados do usuário (inclui connection_code)
  RETURN QUERY SELECT 
    jsonb_build_object(
      'id', user_record.id,
      'username', user_record.username,
      'role', user_record.role,
      'avatar_url', user_record.avatar_url,
      'created_at', user_record.created_at,
      'last_login', now(),
      'connection_code', user_record.connection_code
    ) as user_data,
    new_session_token;
END;
$function$;

-- Update authenticate_user function to include extensions schema in search_path
CREATE OR REPLACE FUNCTION public.authenticate_user(p_username text, p_password text)
 RETURNS TABLE(user_data jsonb, session_token text)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'extensions'
AS $function$
DECLARE
  user_record public.users;
  new_session_token TEXT;
  v_username text := lower(trim(p_username));
BEGIN
  -- Buscar usuário (case-insensitive)
  SELECT * INTO user_record
  FROM public.users
  WHERE lower(username) = v_username;

  IF user_record.id IS NULL THEN
    RAISE EXCEPTION 'Usuário não encontrado';
  END IF;

  -- Exigir senha definida
  IF user_record.password_hash IS NULL THEN
    RAISE EXCEPTION 'Usuário não possui senha definida';
  END IF;

  -- Validar senha
  IF user_record.password_hash <> crypt(p_password, user_record.password_hash) THEN
    RAISE EXCEPTION 'Credenciais inválidas';
  END IF;

  -- Gerar token de sessão
  new_session_token := encode(gen_random_bytes(32), 'hex');

  -- Inserir sessão
  INSERT INTO public.user_sessions (user_id, session_token)
  VALUES (user_record.id, new_session_token);

  -- Atualizar último login
  UPDATE public.users SET last_login = now() WHERE id = user_record.id;

  -- Retornar dados do usuário (inclui connection_code)
  RETURN QUERY SELECT 
    jsonb_build_object(
      'id', user_record.id,
      'username', user_record.username,
      'role', user_record.role,
      'avatar_url', user_record.avatar_url,
      'created_at', user_record.created_at,
      'last_login', now(),
      'connection_code', user_record.connection_code
    ) as user_data,
    new_session_token;
END;
$function$;

-- Update register_user function to include extensions schema in search_path
CREATE OR REPLACE FUNCTION public.register_user(p_username text, p_role text, p_avatar_url text, p_password text)
 RETURNS TABLE(user_data jsonb, session_token text)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'extensions'
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

  -- Criar usuário com hash de senha (bcrypt)
  INSERT INTO public.users (username, role, avatar_url, password_hash)
  VALUES (v_username, p_role, p_avatar_url, crypt(v_password, gen_salt('bf')))
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
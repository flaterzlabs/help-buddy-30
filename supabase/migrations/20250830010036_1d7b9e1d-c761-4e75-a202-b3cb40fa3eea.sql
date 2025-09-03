
-- 1) Padronizar usernames existentes para minúsculo
UPDATE public.users
SET username = lower(trim(username));

-- 2) Garantir unicidade case-insensitive em username
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes 
    WHERE schemaname = 'public' AND indexname = 'users_username_lower_idx'
  ) THEN
    CREATE UNIQUE INDEX users_username_lower_idx ON public.users (lower(username));
  END IF;
END;
$$;

-- 3) Tornar o login case-insensitive no banco
CREATE OR REPLACE FUNCTION public.create_user_session(p_username text)
RETURNS TABLE(user_data jsonb, session_token text)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
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

-- 4) Incluir connection_code também na validação de sessão
CREATE OR REPLACE FUNCTION public.validate_session(p_session_token text)
RETURNS TABLE(user_data jsonb)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  session_record public.user_sessions;
  user_record public.users;
BEGIN
  -- Buscar sessão válida
  SELECT * INTO session_record 
  FROM public.user_sessions 
  WHERE session_token = p_session_token 
  AND expires_at > now();
  
  IF session_record.id IS NULL THEN
    RAISE EXCEPTION 'Sessão inválida ou expirada';
  END IF;
  
  -- Buscar dados do usuário
  SELECT * INTO user_record FROM public.users WHERE id = session_record.user_id;
  
  -- Retornar dados do usuário (inclui connection_code)
  RETURN QUERY SELECT 
    jsonb_build_object(
      'id', user_record.id,
      'username', user_record.username,
      'role', user_record.role,
      'avatar_url', user_record.avatar_url,
      'created_at', user_record.created_at,
      'last_login', user_record.last_login,
      'connection_code', user_record.connection_code
    ) as user_data;
END;
$function$;

-- 5) Criar trigger para gerar connection_code automaticamente para alunos
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'trg_auto_generate_connection_code'
  ) THEN
    CREATE TRIGGER trg_auto_generate_connection_code
    BEFORE INSERT ON public.users
    FOR EACH ROW
    EXECUTE FUNCTION public.auto_generate_connection_code();
  END IF;
END;
$$;

-- 6) Backfill para alunos existentes sem connection_code
UPDATE public.users
SET connection_code = public.generate_connection_code()
WHERE role = 'student' AND connection_code IS NULL;

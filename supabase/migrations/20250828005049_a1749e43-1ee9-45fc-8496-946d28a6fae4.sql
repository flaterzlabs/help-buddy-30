-- Remove todas as políticas que dependem das tabelas primeiro
DROP POLICY IF EXISTS "Connected users can view mood logs" ON public.mood_logs;
DROP POLICY IF EXISTS "Connected users can view help requests" ON public.help_requests;
DROP POLICY IF EXISTS "Users can view their connections" ON public.connections;
DROP POLICY IF EXISTS "Parents/Educators can create connections" ON public.connections;
DROP POLICY IF EXISTS "Users can delete their connections" ON public.connections;

-- Agora remove as tabelas em CASCADE
DROP TABLE IF EXISTS public.connections CASCADE;
DROP TABLE IF EXISTS public.help_requests CASCADE;
DROP TABLE IF EXISTS public.mood_logs CASCADE;
DROP TABLE IF EXISTS public.profiles CASCADE;

-- Remove função que não será mais necessária
DROP FUNCTION IF EXISTS public.generate_connection_code();

-- Criar tabela de usuários personalizada (sem usar auth.users do Supabase)
CREATE TABLE public.users (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  username TEXT NOT NULL UNIQUE,
  role TEXT NOT NULL CHECK (role IN ('student', 'parent', 'educator')),
  avatar_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  last_login TIMESTAMP WITH TIME ZONE
);

-- Habilitar RLS
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- Políticas para usuários
CREATE POLICY "Users can view all users for connections"
ON public.users FOR SELECT USING (true);

CREATE POLICY "Users can update their own profile"
ON public.users FOR UPDATE 
USING (id = current_setting('app.current_user_id', true)::uuid)
WITH CHECK (id = current_setting('app.current_user_id', true)::uuid);

-- Tabela de sessões para gerenciar logins
CREATE TABLE public.user_sessions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  session_token TEXT NOT NULL UNIQUE,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT (now() + interval '30 days'),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Políticas para sessões
ALTER TABLE public.user_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own sessions"
ON public.user_sessions FOR ALL 
USING (user_id = current_setting('app.current_user_id', true)::uuid)
WITH CHECK (user_id = current_setting('app.current_user_id', true)::uuid);

-- Tabela de conexões entre usuários
CREATE TABLE public.connections (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  student_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  parent_educator_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(student_id, parent_educator_id)
);

-- Policies para conexões
ALTER TABLE public.connections ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their connections"
ON public.connections FOR SELECT 
USING (
  student_id = current_setting('app.current_user_id', true)::uuid OR 
  parent_educator_id = current_setting('app.current_user_id', true)::uuid
);

CREATE POLICY "Parents/Educators can create connections with students"
ON public.connections FOR INSERT
WITH CHECK (
  parent_educator_id = current_setting('app.current_user_id', true)::uuid AND
  EXISTS (
    SELECT 1 FROM public.users 
    WHERE id = parent_educator_id 
    AND role IN ('parent', 'educator')
  )
);

CREATE POLICY "Users can delete their connections"
ON public.connections FOR DELETE
USING (
  student_id = current_setting('app.current_user_id', true)::uuid OR 
  parent_educator_id = current_setting('app.current_user_id', true)::uuid
);

-- Tabela de pedidos de ajuda
CREATE TABLE public.help_requests (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  student_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  resolved_at TIMESTAMP WITH TIME ZONE
);

-- Policies para help_requests
ALTER TABLE public.help_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Students can manage their help requests"
ON public.help_requests FOR ALL
USING (student_id = current_setting('app.current_user_id', true)::uuid)
WITH CHECK (student_id = current_setting('app.current_user_id', true)::uuid);

CREATE POLICY "Connected users can view help requests"
ON public.help_requests FOR SELECT
USING (
  student_id = current_setting('app.current_user_id', true)::uuid OR
  EXISTS (
    SELECT 1 FROM public.connections 
    WHERE connections.student_id = help_requests.student_id 
    AND connections.parent_educator_id = current_setting('app.current_user_id', true)::uuid
  )
);

-- Tabela de logs de humor
CREATE TABLE public.mood_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  student_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  mood TEXT NOT NULL CHECK (mood IN ('happy', 'sad', 'angry', 'excited', 'calm', 'worried')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Policies para mood_logs
ALTER TABLE public.mood_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Students can insert their mood logs"
ON public.mood_logs FOR INSERT
WITH CHECK (student_id = current_setting('app.current_user_id', true)::uuid);

CREATE POLICY "Connected users can view mood logs"
ON public.mood_logs FOR SELECT
USING (
  student_id = current_setting('app.current_user_id', true)::uuid OR
  EXISTS (
    SELECT 1 FROM public.connections 
    WHERE connections.student_id = mood_logs.student_id 
    AND connections.parent_educator_id = current_setting('app.current_user_id', true)::uuid
  )
);

-- Tabela para notificações push
CREATE TABLE public.push_subscriptions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  endpoint TEXT NOT NULL,
  p256dh TEXT NOT NULL,
  auth TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, endpoint)
);

-- Policies para push subscriptions
ALTER TABLE public.push_subscriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their push subscriptions"
ON public.push_subscriptions FOR ALL
USING (user_id = current_setting('app.current_user_id', true)::uuid)
WITH CHECK (user_id = current_setting('app.current_user_id', true)::uuid);

-- Função para criar sessão de usuário (login)
CREATE OR REPLACE FUNCTION public.create_user_session(p_username TEXT)
RETURNS TABLE(user_data jsonb, session_token TEXT) AS $$
DECLARE
  user_record public.users;
  new_session_token TEXT;
BEGIN
  -- Buscar usuário
  SELECT * INTO user_record FROM public.users WHERE username = p_username;
  
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
  
  -- Retornar dados do usuário e token
  RETURN QUERY SELECT 
    jsonb_build_object(
      'id', user_record.id,
      'username', user_record.username,
      'role', user_record.role,
      'avatar_url', user_record.avatar_url,
      'created_at', user_record.created_at,
      'last_login', now()
    ) as user_data,
    new_session_token;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = 'public';

-- Função para validar sessão
CREATE OR REPLACE FUNCTION public.validate_session(p_session_token TEXT)
RETURNS TABLE(user_data jsonb) AS $$
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
  
  -- Retornar dados do usuário
  RETURN QUERY SELECT 
    jsonb_build_object(
      'id', user_record.id,
      'username', user_record.username,
      'role', user_record.role,
      'avatar_url', user_record.avatar_url,
      'created_at', user_record.created_at,
      'last_login', user_record.last_login
    ) as user_data;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = 'public';
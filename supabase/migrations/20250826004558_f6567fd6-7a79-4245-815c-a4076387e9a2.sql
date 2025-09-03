-- Criar enum para roles de usuário
CREATE TYPE public.user_role AS ENUM ('student', 'parent', 'educator');

-- Criar enum para tipos de humor
CREATE TYPE public.mood_type AS ENUM ('happy', 'sad', 'calm', 'excited', 'focused');

-- Criar tabela de profiles
CREATE TABLE public.profiles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  username TEXT NOT NULL,
  role user_role NOT NULL,
  connection_code TEXT UNIQUE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Criar tabela de conexões entre pais/educadores e alunos
CREATE TABLE public.connections (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  parent_educator_id UUID NOT NULL REFERENCES public.profiles(user_id) ON DELETE CASCADE,
  student_id UUID NOT NULL REFERENCES public.profiles(user_id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(parent_educator_id, student_id)
);

-- Criar tabela de logs de humor
CREATE TABLE public.mood_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  student_id UUID NOT NULL REFERENCES public.profiles(user_id) ON DELETE CASCADE,
  mood mood_type NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Criar tabela de pedidos de ajuda
CREATE TABLE public.help_requests (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  student_id UUID NOT NULL REFERENCES public.profiles(user_id) ON DELETE CASCADE,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  resolved_at TIMESTAMP WITH TIME ZONE
);

-- Habilitar RLS em todas as tabelas
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.connections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mood_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.help_requests ENABLE ROW LEVEL SECURITY;

-- Políticas para profiles
CREATE POLICY "Users can view their own profile" 
ON public.profiles 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own profile" 
ON public.profiles 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own profile" 
ON public.profiles 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

-- Políticas para connections
CREATE POLICY "Users can view their connections" 
ON public.connections 
FOR SELECT 
USING (auth.uid() = parent_educator_id OR auth.uid() = student_id);

CREATE POLICY "Parents/Educators can create connections" 
ON public.connections 
FOR INSERT 
WITH CHECK (
  auth.uid() = parent_educator_id AND 
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE user_id = auth.uid() AND role IN ('parent', 'educator')
  )
);

CREATE POLICY "Parents/Educators can delete their connections" 
ON public.connections 
FOR DELETE 
USING (auth.uid() = parent_educator_id);

-- Políticas para mood_logs
CREATE POLICY "Students can insert their own mood logs" 
ON public.mood_logs 
FOR INSERT 
WITH CHECK (auth.uid() = student_id);

CREATE POLICY "Connected users can view mood logs" 
ON public.mood_logs 
FOR SELECT 
USING (
  auth.uid() = student_id OR 
  EXISTS (
    SELECT 1 FROM public.connections 
    WHERE student_id = mood_logs.student_id AND parent_educator_id = auth.uid()
  )
);

-- Políticas para help_requests
CREATE POLICY "Students can manage their help requests" 
ON public.help_requests 
FOR ALL 
USING (auth.uid() = student_id)
WITH CHECK (auth.uid() = student_id);

CREATE POLICY "Connected users can view help requests" 
ON public.help_requests 
FOR SELECT 
USING (
  auth.uid() = student_id OR 
  EXISTS (
    SELECT 1 FROM public.connections 
    WHERE student_id = help_requests.student_id AND parent_educator_id = auth.uid()
  )
);

-- Função para atualizar timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para atualizar timestamps na tabela profiles
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Função para gerar código de conexão único
CREATE OR REPLACE FUNCTION public.generate_connection_code()
RETURNS TEXT AS $$
DECLARE
  code TEXT;
  exists_check INTEGER;
BEGIN
  LOOP
    code := upper(substring(md5(random()::text) from 1 for 6));
    SELECT COUNT(*) INTO exists_check FROM public.profiles WHERE connection_code = code;
    IF exists_check = 0 THEN
      EXIT;
    END IF;
  END LOOP;
  RETURN code;
END;
$$ LANGUAGE plpgsql;
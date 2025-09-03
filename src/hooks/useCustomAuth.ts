
import React, { useState, useEffect, useContext, createContext, ReactNode } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface User {
  id: string;
  username: string;
  role: 'student' | 'parent' | 'educator';
  avatar_url?: string;
  created_at: string;
  last_login?: string;
  connection_code?: string;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (username: string, password: string) => Promise<{ success: boolean; error?: string }>;
  register: (username: string, role: 'student' | 'parent' | 'educator', password: string, avatarUrl?: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
  updateAvatar: (avatarUrl: string) => Promise<{ success: boolean; error?: string }>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkSession();
  }, []);

  const checkSession = async () => {
    try {
      const sessionToken = localStorage.getItem('session_token');
      if (!sessionToken) {
        setLoading(false);
        return;
      }

      const { data, error } = await supabase.rpc('validate_session', { 
        p_session_token: sessionToken 
      });

      if (error || !data || data.length === 0) {
        console.log('Sessão inválida ou expirada, removendo token');
        localStorage.removeItem('session_token');
        setLoading(false);
        return;
      }

      console.log('Sessão válida encontrada:', data[0].user_data);
      setUser(data[0].user_data as unknown as User);
    } catch (error) {
      console.error('Erro ao verificar sessão:', error);
      localStorage.removeItem('session_token');
    } finally {
      setLoading(false);
    }
  };

  const login = async (username: string, password: string): Promise<{ success: boolean; error?: string }> => {
    try {
      const normalizedUsername = username.trim().toLowerCase();
      console.log('Tentando login com username:', normalizedUsername);

      const { data, error } = await supabase.rpc('authenticate_user', { 
        p_username: normalizedUsername,
        p_password: password
      });

      if (error) {
        console.error('Erro no RPC authenticate_user:', error);
        if (error.message.includes('Usuário não encontrado')) {
          return { success: false, error: 'Usuário não encontrado. Verifique o nome e tente novamente.' };
        }
        if (error.message.includes('Credenciais inválidas')) {
          return { success: false, error: 'Senha incorreta. Tente novamente.' };
        }
        if (error.message.includes('não possui senha definida')) {
          return { success: false, error: 'Este usuário não possui senha definida. Entre em contato com o administrador.' };
        }
        return { success: false, error: 'Erro no login: ' + error.message };
      }

      if (data && data.length > 0) {
        const { user_data, session_token } = data[0];
        console.log('Login bem-sucedido:', user_data);
        localStorage.setItem('session_token', session_token);
        setUser(user_data as unknown as User);
        return { success: true };
      }

      return { success: false, error: 'Erro inesperado no login' };
    } catch (error: any) {
      console.error('Erro no login:', error);
      return { success: false, error: error.message || 'Erro no servidor' };
    }
  };

  const register = async (username: string, role: 'student' | 'parent' | 'educator', password: string, avatarUrl?: string): Promise<{ success: boolean; error?: string }> => {
    try {
      const normalizedUsername = username.trim().toLowerCase();
      console.log('Tentando registrar usuário:', { username: normalizedUsername, role });

      const { data, error } = await supabase.rpc('register_user', {
        p_username: normalizedUsername,
        p_role: role,
        p_avatar_url: avatarUrl || null,
        p_password: password
      });

      if (error) {
        console.error('Erro no RPC register_user:', error);
        if (error.message.includes('Nome de usuário já existe')) {
          return { success: false, error: 'Nome de usuário já existe' };
        }
        if (error.message.includes('Username é obrigatório')) {
          return { success: false, error: 'Nome de usuário é obrigatório' };
        }
        if (error.message.includes('Senha é obrigatória')) {
          return { success: false, error: 'Senha é obrigatória' };
        }
        return { success: false, error: 'Erro ao criar usuário: ' + error.message };
      }

      if (data && data.length > 0) {
        const { user_data, session_token } = data[0];
        console.log('Usuário criado com sucesso:', user_data);
        localStorage.setItem('session_token', session_token);
        setUser(user_data as unknown as User);
        return { success: true };
      }

      return { success: false, error: 'Erro inesperado no registro' };
    } catch (error: any) {
      console.error('Erro no registro:', error);
      return { success: false, error: error.message || 'Erro no servidor' };
    }
  };

  const updateAvatar = async (avatarUrl: string): Promise<{ success: boolean; error?: string }> => {
    if (!user) return { success: false, error: 'Usuário não logado' };

    try {
      const { error } = await supabase
        .from('users')
        .update({ avatar_url: avatarUrl })
        .eq('id', user.id);

      if (error) {
        return { success: false, error: 'Erro ao atualizar avatar' };
      }

      setUser({ ...user, avatar_url: avatarUrl });
      return { success: true };
    } catch (error: any) {
      return { success: false, error: error.message || 'Erro no servidor' };
    }
  };

  const logout = async () => {
    try {
      const sessionToken = localStorage.getItem('session_token');
      if (sessionToken) {
        await supabase
          .from('user_sessions')
          .delete()
          .eq('session_token', sessionToken);
      }
    } catch (error) {
      console.error('Erro ao fazer logout:', error);
    } finally {
      localStorage.removeItem('session_token');
      setUser(null);
    }
  };

  const contextValue = {
    user,
    loading,
    login,
    register,
    logout,
    updateAvatar
  };

  return React.createElement(AuthContext.Provider, { value: contextValue }, children);
};

export const useCustomAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useCustomAuth must be used within an AuthProvider');
  }
  return context;
};

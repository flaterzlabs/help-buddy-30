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
  login: (username: string) => Promise<{ success: boolean; error?: string }>;
  register: (username: string, role: 'student' | 'parent' | 'educator', avatarUrl?: string) => Promise<{ success: boolean; error?: string }>;
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
        localStorage.removeItem('session_token');
        setLoading(false);
        return;
      }

      setUser(data[0].user_data as unknown as User);
    } catch (error) {
      console.error('Erro ao verificar sessão:', error);
      localStorage.removeItem('session_token');
    } finally {
      setLoading(false);
    }
  };

  const login = async (username: string): Promise<{ success: boolean; error?: string }> => {
    try {
      const { data, error } = await supabase.rpc('create_user_session', { 
        p_username: username 
      });

      if (error) {
        return { success: false, error: 'Usuário não encontrado' };
      }

      if (data && data.length > 0) {
        const { user_data, session_token } = data[0];
        localStorage.setItem('session_token', session_token);
        setUser(user_data as unknown as User);
        return { success: true };
      }

      return { success: false, error: 'Erro no login' };
    } catch (error: any) {
      return { success: false, error: error.message || 'Erro no servidor' };
    }
  };

  const register = async (username: string, role: 'student' | 'parent' | 'educator', avatarUrl?: string): Promise<{ success: boolean; error?: string }> => {
    try {
      // Verificar se username já existe
      const { data: existingUser } = await supabase
        .from('users')
        .select('id')
        .eq('username', username)
        .maybeSingle();

      if (existingUser) {
        return { success: false, error: 'Nome de usuário já existe' };
      }

      // Criar novo usuário
      const { data: newUser, error } = await supabase
        .from('users')
        .insert({
          username,
          role,
          avatar_url: avatarUrl
        })
        .select()
        .single();

      if (error) {
        return { success: false, error: 'Erro ao criar usuário' };
      }

      // Fazer login automaticamente
      return await login(username);
    } catch (error: any) {
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
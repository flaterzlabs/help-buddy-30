import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { rpcCall } from '@/lib/supabase-extensions';

export interface Connection {
  id: string;
  parent_educator_id: string;
  student_id: string;
  created_at: string;
  student_profile?: {
    username: string;
    connection_code: string;
  };
}

export interface MoodLog {
  id: string;
  student_id: string;
  mood: 'happy' | 'sad' | 'calm' | 'excited' | 'focused';
  created_at: string;
}

export interface HelpRequest {
  id: string;
  student_id: string;
  is_active: boolean;
  created_at: string;
  resolved_at: string | null;
}

export function useSupabaseData(userId?: string) {
  const [connections, setConnections] = useState<Connection[]>([]);
  const [moodLogs, setMoodLogs] = useState<MoodLog[]>([]);
  const [helpRequests, setHelpRequests] = useState<HelpRequest[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (userId) {
      fetchConnections();
      fetchMoodLogs();
      fetchHelpRequests();
    }
  }, [userId]);

  const fetchConnections = async () => {
    if (!userId) return;
    
    try {
      const sessionToken = localStorage.getItem('session_token');
      if (!sessionToken) {
        console.error('No session token found');
        return;
      }

      const { data, error } = await rpcCall.getConnections(sessionToken);

      if (error) throw error;
      
      // Transform data to match expected format
      const transformedData = (data || []).map((item: any) => ({
        id: item.id,
        parent_educator_id: item.parent_educator_id,
        student_id: item.student_id,
        created_at: item.created_at,
        student_profile: {
          username: item.student_username,
          connection_code: item.student_connection_code
        }
      }));
      
      setConnections(transformedData);
    } catch (error: any) {
      console.error('Erro ao buscar conexões:', error);
    }
  };

  const fetchMoodLogs = async () => {
    if (!userId) return;
    
    try {
      const sessionToken = localStorage.getItem('session_token');
      if (!sessionToken) {
        console.error('No session token found');
        return;
      }

      const { data, error } = await rpcCall.getMoodLogs(sessionToken);

      if (error) throw error;
      setMoodLogs(data || []);
    } catch (error: any) {
      console.error('Erro ao buscar logs de humor:', error);
    }
  };

  const fetchHelpRequests = async () => {
    if (!userId) return;
    
    try {
      const sessionToken = localStorage.getItem('session_token');
      if (!sessionToken) {
        console.error('No session token found');
        return;
      }

      const { data, error } = await rpcCall.getHelpRequests(sessionToken);

      if (error) throw error;
      setHelpRequests(data || []);
    } catch (error: any) {
      console.error('Erro ao buscar pedidos de ajuda:', error);
    }
  };

  const connectToStudent = async (connectionCode: string) => {
    if (!userId) return false;
    
    try {
      setLoading(true);
      
      const sessionToken = localStorage.getItem('session_token');
      if (!sessionToken) {
        toast.error('Sessão expirada', {
          description: 'Faça login novamente'
        });
        return false;
      }

      const { data, error } = await rpcCall.connectToStudent(sessionToken, connectionCode.trim());

      if (error) {
        if (error.message.includes('Student not found')) {
          toast.error('Código inválido', {
            description: 'Não foi possível encontrar um aluno com este código'
          });
        } else if (error.message.includes('Connection already exists')) {
          toast.error('Já conectado', {
            description: 'Você já está conectado com este aluno'
          });
        } else {
          throw error;
        }
        return false;
      }

      toast.success('Conectado com sucesso! 🎉');
      await fetchConnections();
      return true;
    } catch (error: any) {
      console.error('Erro ao conectar:', error);
      toast.error('Erro ao conectar', {
        description: error.message
      });
      return false;
    } finally {
      setLoading(false);
    }
  };

  const logMood = async (mood: MoodLog['mood']) => {
    if (!userId) return;
    
    try {
      const sessionToken = localStorage.getItem('session_token');
      if (!sessionToken) {
        toast.error('Sessão expirada', {
          description: 'Faça login novamente'
        });
        return;
      }

      const { error } = await rpcCall.logMood(sessionToken, mood);

      if (error) throw error;
      await fetchMoodLogs();
    } catch (error: any) {
      console.error('Erro ao registrar humor:', error);
      toast.error('Erro ao registrar humor');
    }
  };

  const createHelpRequest = async () => {
    if (!userId) return;
    
    try {
      const sessionToken = localStorage.getItem('session_token');
      if (!sessionToken) {
        toast.error('Sessão expirada', {
          description: 'Faça login novamente'
        });
        return;
      }

      const { error } = await rpcCall.createHelpRequest(sessionToken);

      if (error) {
        if (error.message.includes('already has an active help request')) {
          toast.info('Você já tem um pedido de ajuda ativo');
        } else {
          throw error;
        }
        return;
      }
      
      await fetchHelpRequests();
      toast.success('Pedido de ajuda enviado! 🚨', {
        description: 'Alguém virá te ajudar em breve'
      });
    } catch (error: any) {
      console.error('Erro ao criar pedido de ajuda:', error);
      toast.error('Erro ao enviar pedido de ajuda');
    }
  };

  return {
    connections,
    moodLogs,
    helpRequests,
    loading,
    connectToStudent,
    logMood,
    createHelpRequest,
    refetch: () => {
      fetchConnections();
      fetchMoodLogs();
      fetchHelpRequests();
    }
  };
}
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

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
      const { data, error } = await supabase
        .from('connections')
        .select(`
          *,
          student_profile:users!student_id(username, connection_code)
        `)
        .eq('parent_educator_id', userId);

      if (error) throw error;
      setConnections((data as any) || []);
    } catch (error: any) {
      console.error('Erro ao buscar conexões:', error);
    }
  };

  const fetchMoodLogs = async () => {
    if (!userId) return;
    
    try {
      const { data, error } = await supabase
        .from('mood_logs')
        .select('*')
        .or(`student_id.eq.${userId},student_id.in.(${connections.map(c => c.student_id).join(',')})`)
        .order('created_at', { ascending: false })
        .limit(10);

      if (error) throw error;
      setMoodLogs((data as any) || []);
    } catch (error: any) {
      console.error('Erro ao buscar logs de humor:', error);
    }
  };

  const fetchHelpRequests = async () => {
    if (!userId) return;
    
    try {
      const { data, error } = await supabase
        .from('help_requests')
        .select('*')
        .or(`student_id.eq.${userId},student_id.in.(${connections.map(c => c.student_id).join(',')})`)
        .order('created_at', { ascending: false });

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
      
      // Encontrar aluno pelo código
      const { data: studentData, error: studentError } = await supabase
        .from('users')
        .select('id')
        .eq('connection_code', connectionCode)
        .eq('role', 'student')
        .maybeSingle();

      if (studentError || !studentData) {
        toast.error('Código inválido', {
          description: 'Não foi possível encontrar um aluno com este código'
        });
        return false;
      }

      // Criar conexão
      const { error: connectionError } = await supabase
        .from('connections')
        .insert({
          parent_educator_id: userId,
          student_id: studentData.id
        });

      if (connectionError) {
        if (connectionError.code === '23505') {
          toast.error('Já conectado', {
            description: 'Você já está conectado com este aluno'
          });
        } else {
          throw connectionError;
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
      const { error } = await supabase
        .from('mood_logs')
        .insert({
          student_id: userId,
          mood
        });

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
      // Verificar se já existe um pedido ativo
      const { data: existingRequest } = await supabase
        .from('help_requests')
        .select('id')
        .eq('student_id', userId)
        .eq('is_active', true)
        .maybeSingle();

      if (existingRequest) {
        toast.info('Você já tem um pedido de ajuda ativo');
        return;
      }

      const { error } = await supabase
        .from('help_requests')
        .insert({
          student_id: userId,
          is_active: true
        });

      if (error) throw error;
      
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
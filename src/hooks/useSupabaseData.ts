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
      
      // Setup real-time subscription for help requests
      const channel = supabase
        .channel('help_requests_changes')
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'help_requests' },
          (payload) => {
            console.log('Help request change:', payload);
            fetchHelpRequests();
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
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

      // Try RPC function first, fallback to direct query
      let data, error;
      try {
        const rpcResult = await rpcCall.getConnections(sessionToken);
        data = rpcResult.data;
        error = rpcResult.error;
      } catch (rpcError: any) {
        console.warn('RPC not available, using direct query:', rpcError.message);
        // Fallback to direct query
        const directResult = await supabase
          .from('connections')
          .select(`
            *,
            student_profile:users!student_id(username, connection_code)
          `)
          .eq('parent_educator_id', userId);
        data = directResult.data;
        error = directResult.error;
      }

      if (error) throw error;
      
      // Transform data to match expected format
      const transformedData = (data || []).map((item: any) => ({
        id: item.id,
        parent_educator_id: item.parent_educator_id,
        student_id: item.student_id,
        created_at: item.created_at,
        student_profile: item.student_profile || {
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

      // Try RPC function first, fallback to direct query
      let data, error;
      try {
        const rpcResult = await rpcCall.getMoodLogs(sessionToken);
        data = rpcResult.data;
        error = rpcResult.error;
      } catch (rpcError: any) {
        console.warn('RPC not available, using direct query:', rpcError.message);
        // Fallback to direct query
        const directResult = await supabase
          .from('mood_logs')
          .select('*')
          .or(`student_id.eq.${userId},student_id.in.(${connections.map(c => c.student_id).join(',') || userId})`)
          .order('created_at', { ascending: false })
          .limit(10);
        data = directResult.data;
        error = directResult.error;
      }

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

      // Try RPC function first, fallback to direct query
      let data, error;
      try {
        const rpcResult = await rpcCall.getHelpRequests(sessionToken);
        data = rpcResult.data;
        error = rpcResult.error;
      } catch (rpcError: any) {
        console.warn('RPC not available, using direct query:', rpcError.message);
        // Fallback to direct query
        const directResult = await supabase
          .from('help_requests')
          .select('*')
          .or(`student_id.eq.${userId},student_id.in.(${connections.map(c => c.student_id).join(',') || userId})`)
          .order('created_at', { ascending: false });
        data = directResult.data;
        error = directResult.error;
      }

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

      // Try RPC function first, fallback to direct operations
      let data, error;
      try {
        const rpcResult = await rpcCall.connectToStudent(sessionToken, connectionCode.trim());
        data = rpcResult.data;
        error = rpcResult.error;
      } catch (rpcError: any) {
        console.warn('RPC not available, using direct operations:', rpcError.message);
        
        // Fallback to direct operations
        // First find the student
        const { data: studentData, error: studentError } = await supabase
          .from('users')
          .select('id')
          .eq('connection_code', connectionCode.trim())
          .eq('role', 'student')
          .maybeSingle();

        if (studentError || !studentData) {
          toast.error('Código inválido', {
            description: 'Não foi possível encontrar um aluno com este código'
          });
          return false;
        }

        // Then create the connection
        const { error: connectionError } = await supabase
          .from('connections')
          .insert({
            parent_educator_id: userId,
            student_id: studentData.id
          });

        error = connectionError;
      }

      if (error) {
        if (error.message.includes('Student not found') || error.message.includes('Código inválido')) {
          toast.error('Código inválido', {
            description: 'Não foi possível encontrar um aluno com este código'
          });
        } else if (error.message.includes('Connection already exists') || error.code === '23505') {
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

      // Try RPC function first, fallback to direct operations
      let error;
      try {
        const rpcResult = await rpcCall.logMood(sessionToken, mood);
        error = rpcResult.error;
      } catch (rpcError: any) {
        console.warn('RPC not available, using direct operations:', rpcError.message);
        
        // Fallback to direct operations
        const { error: insertError } = await supabase
          .from('mood_logs')
          .insert({
            student_id: userId,
            mood
          });
        
        error = insertError;
      }

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

      // Try RPC function first, fallback to direct operations
      let error;
      try {
        const rpcResult = await rpcCall.createHelpRequest(sessionToken);
        error = rpcResult.error;
      } catch (rpcError: any) {
        console.warn('RPC not available, using direct operations:', rpcError.message);
        
        // Fallback to direct operations
        // First check for existing active request
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

        // Create the help request
        const { error: insertError } = await supabase
          .from('help_requests')
          .insert({
            student_id: userId,
            is_active: true
          });
        
        error = insertError;
      }

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

  const resolveHelpRequest = async (helpRequestId: string) => {
    if (!userId) return;
    
    try {
      const sessionToken = localStorage.getItem('session_token');
      if (!sessionToken) {
        toast.error('Sessão expirada', {
          description: 'Faça login novamente'
        });
        return;
      }

      // Try RPC function first, fallback to direct operations
      let error;
      try {
        const rpcResult = await rpcCall.resolveHelpRequest(sessionToken, helpRequestId);
        error = rpcResult.error;
      } catch (rpcError: any) {
        console.warn('RPC not available, using direct operations:', rpcError.message);
        
        // Fallback to direct operations
        const { error: updateError } = await supabase
          .from('help_requests')
          .update({
            is_active: false,
            resolved_at: new Date().toISOString()
          })
          .eq('id', helpRequestId)
          .eq('is_active', true);
        
        error = updateError;
      }

      if (error) throw error;
      
      await fetchHelpRequests();
      toast.success('Pedido de ajuda resolvido! ✅', {
        description: 'O aluno poderá enviar novos pedidos de ajuda'
      });
    } catch (error: any) {
      console.error('Erro ao resolver pedido de ajuda:', error);
      toast.error('Erro ao resolver pedido de ajuda');
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
    resolveHelpRequest,
    refetch: () => {
      fetchConnections();
      fetchMoodLogs();
      fetchHelpRequests();
    }
  };
}
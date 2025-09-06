// Temporary type extensions for new RPC functions
// This file extends the Supabase client with our new RPC functions

import { supabase } from '@/integrations/supabase/client';

// Type definitions for new RPC functions
export interface ConnectionRpcResult {
  id: string;
  parent_educator_id: string;
  student_id: string;
  created_at: string;
  student_username: string;
  student_connection_code: string;
}

export interface HelpRequestRpcResult {
  id: string;
  student_id: string;
  is_active: boolean;
  created_at: string;
  resolved_at: string | null;
}

export interface MoodLogRpcResult {
  id: string;
  student_id: string;
  mood: string;
  created_at: string;
}

// Extended supabase client with proper typing
export const rpcCall = {
  createHelpRequest: (sessionToken: string) =>
    supabase.rpc('create_help_request_rpc' as any, { session_token: sessionToken }),
    
  connectToStudent: (sessionToken: string, connectionCode: string) =>
    supabase.rpc('connect_to_student_rpc' as any, { 
      session_token: sessionToken, 
      connection_code: connectionCode 
    }),
    
  getConnections: (sessionToken: string) =>
    supabase.rpc('get_connections_rpc' as any, { session_token: sessionToken }),
    
  getHelpRequests: (sessionToken: string) =>
    supabase.rpc('get_help_requests_rpc' as any, { session_token: sessionToken }),
    
  getMoodLogs: (sessionToken: string) =>
    supabase.rpc('get_mood_logs_rpc' as any, { session_token: sessionToken }),
    
  logMood: (sessionToken: string, moodValue: string) =>
    supabase.rpc('log_mood_rpc' as any, { 
      session_token: sessionToken, 
      mood_value: moodValue 
    }),
    
  resolveHelpRequest: (sessionToken: string, helpRequestId: string) =>
    supabase.rpc('resolve_help_request_rpc' as any, {
      session_token: sessionToken,
      help_request_id: helpRequestId
    })
};
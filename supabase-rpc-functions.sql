-- =====================================================
-- RUN THIS SQL IN YOUR SUPABASE SQL EDITOR
-- This will fix the RLS issues and enable help requests/connections
-- =====================================================

-- Function to get current user ID from session token
CREATE OR REPLACE FUNCTION get_current_user_from_session(session_token TEXT)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  user_id UUID;
BEGIN
  SELECT us.user_id INTO user_id
  FROM user_sessions us
  WHERE us.session_token = $1
    AND us.expires_at > now();
    
  RETURN user_id;
END;
$$;

-- Function to create help request with proper session validation
CREATE OR REPLACE FUNCTION create_help_request_rpc(session_token TEXT)
RETURNS TABLE(
  id UUID,
  student_id UUID,
  is_active BOOLEAN,
  created_at TIMESTAMPTZ,
  resolved_at TIMESTAMPTZ
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  current_user_id UUID;
  existing_request UUID;
BEGIN
  -- Get current user from session
  SELECT get_current_user_from_session(session_token) INTO current_user_id;
  
  IF current_user_id IS NULL THEN
    RAISE EXCEPTION 'Invalid or expired session token';
  END IF;
  
  -- Check if user has active help request
  SELECT hr.id INTO existing_request
  FROM help_requests hr
  WHERE hr.student_id = current_user_id
    AND hr.is_active = true;
    
  IF existing_request IS NOT NULL THEN
    RAISE EXCEPTION 'User already has an active help request';
  END IF;
  
  -- Set user context for RLS
  PERFORM set_config('app.current_user_id', current_user_id::TEXT, true);
  
  -- Create help request
  RETURN QUERY
  INSERT INTO help_requests (student_id, is_active)
  VALUES (current_user_id, true)
  RETURNING help_requests.id, help_requests.student_id, help_requests.is_active, 
            help_requests.created_at, help_requests.resolved_at;
END;
$$;

-- Function to connect to student by code with proper session validation
CREATE OR REPLACE FUNCTION connect_to_student_rpc(session_token TEXT, connection_code TEXT)
RETURNS TABLE(
  id UUID,
  parent_educator_id UUID,
  student_id UUID,
  created_at TIMESTAMPTZ,
  student_username TEXT,
  student_connection_code TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  current_user_id UUID;
  target_student_id UUID;
  existing_connection UUID;
BEGIN
  -- Get current user from session
  SELECT get_current_user_from_session(session_token) INTO current_user_id;
  
  IF current_user_id IS NULL THEN
    RAISE EXCEPTION 'Invalid or expired session token';
  END IF;
  
  -- Find student by connection code
  SELECT u.id INTO target_student_id
  FROM users u
  WHERE u.connection_code = connection_code
    AND u.role = 'student';
    
  IF target_student_id IS NULL THEN
    RAISE EXCEPTION 'Student not found with this connection code';
  END IF;
  
  -- Check if connection already exists
  SELECT c.id INTO existing_connection
  FROM connections c
  WHERE c.parent_educator_id = current_user_id
    AND c.student_id = target_student_id;
    
  IF existing_connection IS NOT NULL THEN
    RAISE EXCEPTION 'Connection already exists with this student';
  END IF;
  
  -- Set user context for RLS
  PERFORM set_config('app.current_user_id', current_user_id::TEXT, true);
  
  -- Create connection using CTE to avoid ambiguous column references
  RETURN QUERY
  WITH new_connection AS (
    INSERT INTO connections (parent_educator_id, student_id)
    VALUES (current_user_id, target_student_id)
    RETURNING connections.id, connections.parent_educator_id, connections.student_id, connections.created_at
  ),
  student_info AS (
    SELECT u.username, u.connection_code
    FROM users u
    WHERE u.id = target_student_id
  )
  SELECT nc.id, nc.parent_educator_id, nc.student_id, nc.created_at, si.username, si.connection_code
  FROM new_connection nc
  CROSS JOIN student_info si;
END;
$$;

-- Function to get connections for current user
CREATE OR REPLACE FUNCTION get_connections_rpc(session_token TEXT)
RETURNS TABLE(
  id UUID,
  parent_educator_id UUID,
  student_id UUID,
  created_at TIMESTAMPTZ,
  student_username TEXT,
  student_connection_code TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  current_user_id UUID;
BEGIN
  -- Get current user from session
  SELECT get_current_user_from_session(session_token) INTO current_user_id;
  
  IF current_user_id IS NULL THEN
    RAISE EXCEPTION 'Invalid or expired session token';
  END IF;
  
  -- Set user context for RLS
  PERFORM set_config('app.current_user_id', current_user_id::TEXT, true);
  
  -- Return connections with student info
  RETURN QUERY
  SELECT c.id, c.parent_educator_id, c.student_id, c.created_at,
         u.username, u.connection_code
  FROM connections c
  JOIN users u ON u.id = c.student_id
  WHERE c.parent_educator_id = current_user_id;
END;
$$;

-- Function to get help requests for current user and connected students
CREATE OR REPLACE FUNCTION get_help_requests_rpc(session_token TEXT)
RETURNS TABLE(
  id UUID,
  student_id UUID,
  is_active BOOLEAN,
  created_at TIMESTAMPTZ,
  resolved_at TIMESTAMPTZ
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  current_user_id UUID;
  student_ids UUID[];
BEGIN
  -- Get current user from session
  SELECT get_current_user_from_session(session_token) INTO current_user_id;
  
  IF current_user_id IS NULL THEN
    RAISE EXCEPTION 'Invalid or expired session token';
  END IF;
  
  -- Set user context for RLS
  PERFORM set_config('app.current_user_id', current_user_id::TEXT, true);
  
  -- Get list of connected student IDs + current user ID
  SELECT ARRAY(
    SELECT c.student_id 
    FROM connections c 
    WHERE c.parent_educator_id = current_user_id
    UNION
    SELECT current_user_id
  ) INTO student_ids;
  
  -- Return help requests for these students
  RETURN QUERY
  SELECT hr.id, hr.student_id, hr.is_active, hr.created_at, hr.resolved_at
  FROM help_requests hr
  WHERE hr.student_id = ANY(student_ids)
  ORDER BY hr.created_at DESC;
END;
$$;

-- Function to get mood logs for current user and connected students
CREATE OR REPLACE FUNCTION get_mood_logs_rpc(session_token TEXT)
RETURNS TABLE(
  id UUID,
  student_id UUID,
  mood TEXT,
  created_at TIMESTAMPTZ
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  current_user_id UUID;
  student_ids UUID[];
BEGIN
  -- Get current user from session
  SELECT get_current_user_from_session(session_token) INTO current_user_id;
  
  IF current_user_id IS NULL THEN
    RAISE EXCEPTION 'Invalid or expired session token';
  END IF;
  
  -- Set user context for RLS
  PERFORM set_config('app.current_user_id', current_user_id::TEXT, true);
  
  -- Get list of connected student IDs + current user ID
  SELECT ARRAY(
    SELECT c.student_id 
    FROM connections c 
    WHERE c.parent_educator_id = current_user_id
    UNION
    SELECT current_user_id
  ) INTO student_ids;
  
  -- Return mood logs for these students
  RETURN QUERY
  SELECT ml.id, ml.student_id, ml.mood, ml.created_at
  FROM mood_logs ml
  WHERE ml.student_id = ANY(student_ids)
  ORDER BY ml.created_at DESC
  LIMIT 10;
END;
$$;

-- Function to log mood with proper session validation
CREATE OR REPLACE FUNCTION log_mood_rpc(session_token TEXT, mood_value TEXT)
RETURNS TABLE(
  id UUID,
  student_id UUID,
  mood TEXT,
  created_at TIMESTAMPTZ
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  current_user_id UUID;
BEGIN
  -- Get current user from session
  SELECT get_current_user_from_session(session_token) INTO current_user_id;
  
  IF current_user_id IS NULL THEN
    RAISE EXCEPTION 'Invalid or expired session token';
  END IF;
  
  -- Set user context for RLS
  PERFORM set_config('app.current_user_id', current_user_id::TEXT, true);
  
  -- Create mood log
  RETURN QUERY
  INSERT INTO mood_logs (student_id, mood)
  VALUES (current_user_id, mood_value)
  RETURNING mood_logs.id, mood_logs.student_id, mood_logs.mood, mood_logs.created_at;
END;
$$;
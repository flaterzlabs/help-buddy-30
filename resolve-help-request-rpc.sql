-- Function to resolve help request
CREATE OR REPLACE FUNCTION resolve_help_request_rpc(session_token TEXT, help_request_id UUID)
RETURNS VOID AS $$
DECLARE
  current_user_id UUID;
BEGIN
  -- Get current user from session token
  SELECT get_current_user_from_session(session_token) INTO current_user_id;
  
  IF current_user_id IS NULL THEN
    RAISE EXCEPTION 'Invalid or expired session token';
  END IF;
  
  -- Set app.current_user_id for RLS
  PERFORM set_config('app.current_user_id', current_user_id::TEXT, TRUE);
  
  -- Update help request to resolved
  UPDATE help_requests 
  SET is_active = FALSE, resolved_at = NOW()
  WHERE id = help_request_id
    AND is_active = TRUE;
    
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Help request not found or already resolved';
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
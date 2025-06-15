-- Create password reset tokens table
CREATE TABLE public.password_reset_tokens (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  token_hash TEXT NOT NULL,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  used_at TIMESTAMP WITH TIME ZONE NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  ip_address INET NULL,
  user_agent TEXT NULL
);

-- Create index for efficient lookups
CREATE INDEX idx_password_reset_tokens_token_hash ON public.password_reset_tokens(token_hash);
CREATE INDEX idx_password_reset_tokens_user_id ON public.password_reset_tokens(user_id);
CREATE INDEX idx_password_reset_tokens_expires_at ON public.password_reset_tokens(expires_at);

-- Enable RLS
ALTER TABLE public.password_reset_tokens ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can view their own reset tokens" 
ON public.password_reset_tokens 
FOR SELECT 
USING (auth.uid() = user_id);

-- Create function to clean expired tokens
CREATE OR REPLACE FUNCTION public.cleanup_expired_reset_tokens()
RETURNS void
LANGUAGE plpgsql
AS $$
BEGIN
  DELETE FROM public.password_reset_tokens 
  WHERE expires_at < now() OR used_at IS NOT NULL;
END;
$$;

-- Create rate limiting table
CREATE TABLE public.password_reset_rate_limit (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  identifier TEXT NOT NULL, -- email or IP
  attempt_count INTEGER NOT NULL DEFAULT 1,
  first_attempt_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  last_attempt_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  blocked_until TIMESTAMP WITH TIME ZONE NULL
);

-- Create index for rate limiting
CREATE UNIQUE INDEX idx_password_reset_rate_limit_identifier ON public.password_reset_rate_limit(identifier);

-- Enable RLS for rate limiting
ALTER TABLE public.password_reset_rate_limit ENABLE ROW LEVEL SECURITY;

-- Create function to check rate limits
CREATE OR REPLACE FUNCTION public.check_reset_rate_limit(
  p_identifier TEXT,
  p_max_attempts INTEGER DEFAULT 5,
  p_window_minutes INTEGER DEFAULT 60
)
RETURNS BOOLEAN
LANGUAGE plpgsql
AS $$
DECLARE
  v_rate_limit RECORD;
  v_window_start TIMESTAMP WITH TIME ZONE;
BEGIN
  v_window_start := now() - INTERVAL '1 minute' * p_window_minutes;
  
  -- Get or create rate limit record
  SELECT * INTO v_rate_limit 
  FROM public.password_reset_rate_limit 
  WHERE identifier = p_identifier;
  
  -- If no record exists, create one and allow
  IF v_rate_limit IS NULL THEN
    INSERT INTO public.password_reset_rate_limit (identifier)
    VALUES (p_identifier);
    RETURN TRUE;
  END IF;
  
  -- If blocked, check if block period has expired
  IF v_rate_limit.blocked_until IS NOT NULL AND v_rate_limit.blocked_until > now() THEN
    RETURN FALSE;
  END IF;
  
  -- If outside window, reset counter
  IF v_rate_limit.first_attempt_at < v_window_start THEN
    UPDATE public.password_reset_rate_limit 
    SET 
      attempt_count = 1,
      first_attempt_at = now(),
      last_attempt_at = now(),
      blocked_until = NULL
    WHERE identifier = p_identifier;
    RETURN TRUE;
  END IF;
  
  -- If within limits, increment and allow
  IF v_rate_limit.attempt_count < p_max_attempts THEN
    UPDATE public.password_reset_rate_limit 
    SET 
      attempt_count = attempt_count + 1,
      last_attempt_at = now()
    WHERE identifier = p_identifier;
    RETURN TRUE;
  END IF;
  
  -- Exceeded limits, block for 1 hour
  UPDATE public.password_reset_rate_limit 
  SET 
    attempt_count = attempt_count + 1,
    last_attempt_at = now(),
    blocked_until = now() + INTERVAL '1 hour'
  WHERE identifier = p_identifier;
  
  RETURN FALSE;
END;
$$;
-- Create table to track answer verification attempts for rate limiting
CREATE TABLE IF NOT EXISTS public.answer_verification_attempts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  question_id UUID NOT NULL,
  attempted_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  CONSTRAINT fk_user FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE
);

-- Create index for efficient rate limit queries
CREATE INDEX idx_verification_attempts_user_question_time 
ON public.answer_verification_attempts(user_id, question_id, attempted_at DESC);

-- Enable RLS
ALTER TABLE public.answer_verification_attempts ENABLE ROW LEVEL SECURITY;

-- Policy: Users can only view their own attempts
CREATE POLICY "Users can view own verification attempts"
ON public.answer_verification_attempts
FOR SELECT
USING (auth.uid() = user_id);

-- Update verify_answer function with rate limiting
CREATE OR REPLACE FUNCTION public.verify_answer(question_id uuid, user_answer text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  correct_answer text;
  v_user_id uuid;
  v_recent_attempts integer;
BEGIN
  v_user_id := auth.uid();
  
  -- Check if user is authenticated
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Authentication required';
  END IF;
  
  -- Check rate limit: max 5 attempts per question per user in last minute
  SELECT COUNT(*) INTO v_recent_attempts
  FROM answer_verification_attempts
  WHERE user_id = v_user_id
    AND question_id = verify_answer.question_id
    AND attempted_at > (now() - interval '1 minute');
  
  IF v_recent_attempts >= 5 THEN
    RAISE EXCEPTION 'Rate limit exceeded. Please wait before trying again.';
  END IF;
  
  -- Log this verification attempt
  INSERT INTO answer_verification_attempts (user_id, question_id)
  VALUES (v_user_id, verify_answer.question_id);
  
  -- Get the correct answer
  SELECT answer INTO correct_answer
  FROM questions
  WHERE id = verify_answer.question_id;
  
  -- Return true if answers match (case-insensitive, trimmed)
  RETURN LOWER(TRIM(user_answer)) = LOWER(TRIM(correct_answer));
END;
$$;
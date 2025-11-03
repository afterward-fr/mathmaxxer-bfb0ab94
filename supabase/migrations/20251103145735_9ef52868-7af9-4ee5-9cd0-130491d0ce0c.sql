-- Drop the existing overly permissive policy
DROP POLICY IF EXISTS "Authenticated users can view questions" ON public.questions;

-- Create a new policy that excludes the answer column
CREATE POLICY "Users can view questions without answers"
ON public.questions
FOR SELECT
USING (true);

-- Grant SELECT on specific columns only (excluding answer)
REVOKE SELECT ON public.questions FROM authenticated;
GRANT SELECT (id, question, difficulty, created_at) ON public.questions TO authenticated;

-- Create a secure function to verify answers server-side
CREATE OR REPLACE FUNCTION public.verify_answer(
  question_id uuid,
  user_answer text
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  correct_answer text;
BEGIN
  -- Get the correct answer
  SELECT answer INTO correct_answer
  FROM questions
  WHERE id = question_id;
  
  -- Return true if answers match (case-insensitive, trimmed)
  RETURN LOWER(TRIM(user_answer)) = LOWER(TRIM(correct_answer));
END;
$$;
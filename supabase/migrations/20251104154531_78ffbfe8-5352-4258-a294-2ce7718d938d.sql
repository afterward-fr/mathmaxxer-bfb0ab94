-- Create a view that excludes the answer column
CREATE OR REPLACE VIEW public.questions_public AS
SELECT id, question, difficulty, created_at
FROM public.questions;

-- Enable RLS on the view
ALTER VIEW public.questions_public SET (security_invoker = true);

-- Grant access to the view
GRANT SELECT ON public.questions_public TO authenticated;
GRANT SELECT ON public.questions_public TO anon;

-- Revoke direct access to the questions table
REVOKE SELECT ON public.questions FROM authenticated;
REVOKE SELECT ON public.questions FROM anon;

-- Update the existing policy to be more restrictive
DROP POLICY IF EXISTS "Users can view questions without answers" ON public.questions;

-- Create a policy that effectively blocks direct SELECT access
CREATE POLICY "Block direct access to questions"
ON public.questions
FOR SELECT
USING (false);
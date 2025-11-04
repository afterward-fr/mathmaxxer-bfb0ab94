-- Create a SECURITY DEFINER function to fetch questions without exposing answers
CREATE OR REPLACE FUNCTION public.get_questions(
  p_difficulty text,
  p_limit integer DEFAULT 10
)
RETURNS TABLE (
  id uuid,
  question text,
  difficulty text,
  created_at timestamptz
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT q.id, q.question, q.difficulty::text, q.created_at
  FROM questions q
  WHERE q.difficulty::text = p_difficulty
  ORDER BY random()
  LIMIT p_limit;
END;
$$;
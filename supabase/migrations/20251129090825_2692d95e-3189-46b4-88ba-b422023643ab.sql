-- Drop and recreate verify_answer with unambiguous parameter name
DROP FUNCTION IF EXISTS public.verify_answer(uuid, text);

CREATE OR REPLACE FUNCTION public.verify_answer(p_question_id uuid, user_answer text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
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
  FROM answer_verification_attempts ava
  WHERE ava.user_id = v_user_id
    AND ava.question_id = p_question_id
    AND ava.attempted_at > (now() - interval '1 minute');

  IF v_recent_attempts >= 5 THEN
    RAISE EXCEPTION 'Rate limit exceeded. Please wait before trying again.';
  END IF;

  -- Log this verification attempt
  INSERT INTO answer_verification_attempts (user_id, question_id)
  VALUES (v_user_id, p_question_id);

  -- Get the correct answer
  SELECT q.answer INTO correct_answer
  FROM questions q
  WHERE q.id = p_question_id;

  -- Return true if answers match (case-insensitive, trimmed)
  RETURN LOWER(TRIM(user_answer)) = LOWER(TRIM(correct_answer));
END;
$function$;
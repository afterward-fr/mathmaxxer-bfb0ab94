-- Create game_answers table to track each answer attempt
CREATE TABLE public.game_answers (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  game_session_id UUID NOT NULL REFERENCES public.game_sessions(id) ON DELETE CASCADE,
  question_id UUID NOT NULL REFERENCES public.questions(id) ON DELETE CASCADE,
  user_answer TEXT NOT NULL,
  is_correct BOOLEAN NOT NULL,
  answered_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE
);

-- Enable RLS
ALTER TABLE public.game_answers ENABLE ROW LEVEL SECURITY;

-- Users can insert their own answers
CREATE POLICY "Users can insert their own answers"
ON public.game_answers
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Users can view their own answers
CREATE POLICY "Users can view their own answers"
ON public.game_answers
FOR SELECT
USING (auth.uid() = user_id);

-- Remove UPDATE permission for score from game_sessions
-- This prevents client-side score manipulation
DROP POLICY IF EXISTS "Users can update their incomplete sessions" ON public.game_sessions;

CREATE POLICY "Users can update their incomplete sessions"
ON public.game_sessions
FOR UPDATE
USING (auth.uid() = user_id AND is_completed = false)
WITH CHECK (
  auth.uid() = user_id 
  AND is_completed = false
  -- Prevent direct score modification
  AND score = (SELECT score FROM game_sessions WHERE id = game_sessions.id)
);

-- Update complete_game function to calculate score from answer log
CREATE OR REPLACE FUNCTION public.complete_game(p_session_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_user_id UUID;
  v_calculated_score INTEGER;
  v_is_completed BOOLEAN;
  v_points_earned INTEGER;
  v_current_rating INTEGER;
  v_current_games INTEGER;
BEGIN
  -- Get session details and lock the row
  SELECT user_id, is_completed
  INTO v_user_id, v_is_completed
  FROM game_sessions
  WHERE id = p_session_id
  FOR UPDATE;
  
  -- Validate session exists
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Game session not found';
  END IF;
  
  -- Validate user owns this session
  IF v_user_id != auth.uid() THEN
    RAISE EXCEPTION 'Unauthorized: You can only complete your own games';
  END IF;
  
  -- Prevent duplicate completions
  IF v_is_completed THEN
    RAISE EXCEPTION 'Game already completed';
  END IF;
  
  -- Calculate score from answer log (server-side verification)
  SELECT COUNT(*)
  INTO v_calculated_score
  FROM game_answers
  WHERE game_session_id = p_session_id
    AND is_correct = true
    AND user_id = v_user_id;
  
  -- Calculate points
  v_points_earned := v_calculated_score * 10;
  
  -- Get current profile stats
  SELECT iq_rating, total_games
  INTO v_current_rating, v_current_games
  FROM profiles
  WHERE id = v_user_id;
  
  -- Update profile atomically
  UPDATE profiles
  SET 
    iq_rating = iq_rating + v_points_earned,
    total_games = total_games + 1,
    updated_at = now()
  WHERE id = v_user_id;
  
  -- Update session with calculated score and mark as completed
  UPDATE game_sessions
  SET 
    score = v_calculated_score,
    is_completed = true,
    completed_at = now()
  WHERE id = p_session_id;
  
  -- Return results
  RETURN jsonb_build_object(
    'success', true,
    'score', v_calculated_score,
    'points_earned', v_points_earned,
    'new_rating', v_current_rating + v_points_earned,
    'total_games', v_current_games + 1
  );
END;
$function$;
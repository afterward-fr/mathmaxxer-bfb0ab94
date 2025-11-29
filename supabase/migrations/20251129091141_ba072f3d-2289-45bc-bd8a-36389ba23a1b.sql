-- Update complete_game to use dynamic rating multiplier based on games played
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
  v_current_practice_rating INTEGER;
  v_current_games INTEGER;
  v_rating_multiplier INTEGER;
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
  
  -- Get current profile stats
  SELECT practice_rating, total_games
  INTO v_current_practice_rating, v_current_games
  FROM profiles
  WHERE id = v_user_id;
  
  -- Calculate dynamic rating multiplier based on total games played
  -- First 10 games: 30 points per correct answer
  -- Games 11-30: 20 points per correct answer
  -- Games 31-50: 15 points per correct answer
  -- Games 51+: 10 points per correct answer
  IF v_current_games < 10 THEN
    v_rating_multiplier := 30;
  ELSIF v_current_games < 30 THEN
    v_rating_multiplier := 20;
  ELSIF v_current_games < 50 THEN
    v_rating_multiplier := 15;
  ELSE
    v_rating_multiplier := 10;
  END IF;
  
  -- Calculate points with dynamic multiplier
  v_points_earned := v_calculated_score * v_rating_multiplier;
  
  -- Update profile atomically (only practice_rating, not iq_rating)
  UPDATE profiles
  SET 
    practice_rating = practice_rating + v_points_earned,
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
  
  -- Return results with practice_rating and multiplier info
  RETURN jsonb_build_object(
    'success', true,
    'score', v_calculated_score,
    'points_earned', v_points_earned,
    'rating_multiplier', v_rating_multiplier,
    'new_practice_rating', v_current_practice_rating + v_points_earned,
    'total_games', v_current_games + 1
  );
END;
$function$;
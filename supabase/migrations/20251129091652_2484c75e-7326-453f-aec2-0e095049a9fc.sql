-- Update complete_game to scale points based on difficulty level
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
  v_difficulty TEXT;
BEGIN
  -- Get session details and lock the row
  SELECT user_id, is_completed, difficulty
  INTO v_user_id, v_is_completed, v_difficulty
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
  
  -- Calculate points based on difficulty and total games played
  -- Beginner: 15 → 12 → 10 → 8
  -- Elementary: 18 → 15 → 12 → 10
  -- Intermediate: 21 → 17 → 13 → 10
  -- Advanced: 24 → 19 → 14 → 10
  -- Expert: 27 → 22 → 16 → 10
  -- Master: 30 → 20 → 15 → 10
  
  IF v_difficulty = 'beginner' THEN
    IF v_current_games < 10 THEN
      v_points_earned := 15;
    ELSIF v_current_games < 30 THEN
      v_points_earned := 12;
    ELSIF v_current_games < 50 THEN
      v_points_earned := 10;
    ELSE
      v_points_earned := 8;
    END IF;
  ELSIF v_difficulty = 'elementary' THEN
    IF v_current_games < 10 THEN
      v_points_earned := 18;
    ELSIF v_current_games < 30 THEN
      v_points_earned := 15;
    ELSIF v_current_games < 50 THEN
      v_points_earned := 12;
    ELSE
      v_points_earned := 10;
    END IF;
  ELSIF v_difficulty = 'intermediate' THEN
    IF v_current_games < 10 THEN
      v_points_earned := 21;
    ELSIF v_current_games < 30 THEN
      v_points_earned := 17;
    ELSIF v_current_games < 50 THEN
      v_points_earned := 13;
    ELSE
      v_points_earned := 10;
    END IF;
  ELSIF v_difficulty = 'advanced' THEN
    IF v_current_games < 10 THEN
      v_points_earned := 24;
    ELSIF v_current_games < 30 THEN
      v_points_earned := 19;
    ELSIF v_current_games < 50 THEN
      v_points_earned := 14;
    ELSE
      v_points_earned := 10;
    END IF;
  ELSIF v_difficulty = 'expert' THEN
    IF v_current_games < 10 THEN
      v_points_earned := 27;
    ELSIF v_current_games < 30 THEN
      v_points_earned := 22;
    ELSIF v_current_games < 50 THEN
      v_points_earned := 16;
    ELSE
      v_points_earned := 10;
    END IF;
  ELSE -- master
    IF v_current_games < 10 THEN
      v_points_earned := 30;
    ELSIF v_current_games < 30 THEN
      v_points_earned := 20;
    ELSIF v_current_games < 50 THEN
      v_points_earned := 15;
    ELSE
      v_points_earned := 10;
    END IF;
  END IF;
  
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
  
  -- Return results with practice_rating
  RETURN jsonb_build_object(
    'success', true,
    'score', v_calculated_score,
    'points_earned', v_points_earned,
    'new_practice_rating', v_current_practice_rating + v_points_earned,
    'total_games', v_current_games + 1
  );
END;
$function$;
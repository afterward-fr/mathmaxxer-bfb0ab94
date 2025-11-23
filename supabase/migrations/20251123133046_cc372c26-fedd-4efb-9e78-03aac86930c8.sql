-- Drop the old find_match function if it exists
DROP FUNCTION IF EXISTS find_match(uuid, text, text, integer);

-- Create an improved find_match function that pairs players quickly
CREATE OR REPLACE FUNCTION find_match(
  p_user_id uuid,
  p_difficulty text,
  p_time_control text,
  p_iq_rating integer
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_opponent_id uuid;
  v_match_id uuid;
  v_rating_range integer := 100;
  v_max_iterations integer := 5;
  v_iteration integer := 0;
BEGIN
  -- Try to find a match with progressively wider rating ranges
  WHILE v_opponent_id IS NULL AND v_iteration < v_max_iterations LOOP
    -- Look for an opponent in the queue (excluding the current user)
    SELECT user_id INTO v_opponent_id
    FROM matchmaking_queue
    WHERE user_id != p_user_id
      AND difficulty = p_difficulty
      AND time_control = p_time_control
      AND ABS(iq_rating - p_iq_rating) <= v_rating_range
    ORDER BY created_at ASC
    LIMIT 1;
    
    -- If no match found, widen the rating range
    IF v_opponent_id IS NULL THEN
      v_rating_range := v_rating_range + 200;
      v_iteration := v_iteration + 1;
    END IF;
  END LOOP;
  
  -- If still no opponent found after expanding range, just match with anyone in queue
  IF v_opponent_id IS NULL THEN
    SELECT user_id INTO v_opponent_id
    FROM matchmaking_queue
    WHERE user_id != p_user_id
      AND difficulty = p_difficulty
      AND time_control = p_time_control
    ORDER BY created_at ASC
    LIMIT 1;
  END IF;
  
  -- If we found an opponent, create the match
  IF v_opponent_id IS NOT NULL THEN
    -- Create the match
    INSERT INTO matches (player1_id, player2_id, difficulty, time_control, status)
    VALUES (p_user_id, v_opponent_id, p_difficulty::difficulty_level, p_time_control::time_control_type, 'active')
    RETURNING id INTO v_match_id;
    
    -- Remove both players from the queue
    DELETE FROM matchmaking_queue WHERE user_id IN (p_user_id, v_opponent_id);
    
    RETURN v_match_id;
  END IF;
  
  RETURN NULL;
END;
$$;
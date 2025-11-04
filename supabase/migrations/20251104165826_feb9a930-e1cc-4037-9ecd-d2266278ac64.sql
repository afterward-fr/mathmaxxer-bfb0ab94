-- Create matchmaking queue table
CREATE TABLE IF NOT EXISTS public.matchmaking_queue (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  difficulty TEXT NOT NULL,
  time_control TEXT NOT NULL,
  iq_rating INTEGER NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id)
);

-- Enable RLS
ALTER TABLE public.matchmaking_queue ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can insert themselves into queue"
  ON public.matchmaking_queue
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view queue entries"
  ON public.matchmaking_queue
  FOR SELECT
  USING (true);

CREATE POLICY "Users can delete themselves from queue"
  ON public.matchmaking_queue
  FOR DELETE
  USING (auth.uid() = user_id);

-- Create index for faster matchmaking queries
CREATE INDEX idx_matchmaking_queue_difficulty_time ON public.matchmaking_queue(difficulty, time_control, created_at);
CREATE INDEX idx_matchmaking_queue_iq_rating ON public.matchmaking_queue(iq_rating);

-- Create function to find match
CREATE OR REPLACE FUNCTION public.find_match(
  p_user_id UUID,
  p_difficulty TEXT,
  p_time_control TEXT,
  p_iq_rating INTEGER
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_opponent_id UUID;
  v_match_id UUID;
  v_rating_range INTEGER := 100; -- Start with +/- 100 rating points
BEGIN
  -- Try to find an opponent with similar rating (within range)
  SELECT user_id INTO v_opponent_id
  FROM matchmaking_queue
  WHERE user_id != p_user_id
    AND difficulty = p_difficulty
    AND time_control = p_time_control
    AND iq_rating BETWEEN (p_iq_rating - v_rating_range) AND (p_iq_rating + v_rating_range)
  ORDER BY created_at ASC
  LIMIT 1;

  -- If no match found within range, try wider range
  IF v_opponent_id IS NULL THEN
    v_rating_range := 300; -- Expand to +/- 300 rating points
    
    SELECT user_id INTO v_opponent_id
    FROM matchmaking_queue
    WHERE user_id != p_user_id
      AND difficulty = p_difficulty
      AND time_control = p_time_control
      AND iq_rating BETWEEN (p_iq_rating - v_rating_range) AND (p_iq_rating + v_rating_range)
    ORDER BY created_at ASC
    LIMIT 1;
  END IF;

  -- If still no match, just find anyone with same difficulty and time control
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
    VALUES (p_user_id, v_opponent_id, p_difficulty::game_difficulty, p_time_control::game_time_control, 'in_progress')
    RETURNING id INTO v_match_id;

    -- Remove both players from queue
    DELETE FROM matchmaking_queue WHERE user_id IN (p_user_id, v_opponent_id);

    RETURN v_match_id;
  END IF;

  -- No match found
  RETURN NULL;
END;
$$;
-- Create game_sessions table to track active games and prevent score manipulation
CREATE TABLE public.game_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  difficulty TEXT NOT NULL,
  time_control TEXT NOT NULL,
  total_questions INTEGER NOT NULL,
  score INTEGER NOT NULL DEFAULT 0,
  started_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  completed_at TIMESTAMP WITH TIME ZONE,
  is_completed BOOLEAN NOT NULL DEFAULT false,
  CONSTRAINT valid_score CHECK (score >= 0 AND score <= total_questions)
);

-- Enable RLS on game_sessions
ALTER TABLE public.game_sessions ENABLE ROW LEVEL SECURITY;

-- Users can view their own game sessions
CREATE POLICY "Users can view their own game sessions"
ON public.game_sessions
FOR SELECT
USING (auth.uid() = user_id);

-- Users can create their own game sessions
CREATE POLICY "Users can insert their own game sessions"
ON public.game_sessions
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Users can update their own incomplete game sessions (for score tracking)
CREATE POLICY "Users can update their incomplete sessions"
ON public.game_sessions
FOR UPDATE
USING (auth.uid() = user_id AND is_completed = false);

-- Create secure function to complete a game and update profile
CREATE OR REPLACE FUNCTION public.complete_game(p_session_id UUID)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id UUID;
  v_score INTEGER;
  v_is_completed BOOLEAN;
  v_points_earned INTEGER;
  v_current_rating INTEGER;
  v_current_games INTEGER;
BEGIN
  -- Get session details and lock the row
  SELECT user_id, score, is_completed
  INTO v_user_id, v_score, v_is_completed
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
  
  -- Calculate points
  v_points_earned := v_score * 10;
  
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
  
  -- Mark session as completed
  UPDATE game_sessions
  SET 
    is_completed = true,
    completed_at = now()
  WHERE id = p_session_id;
  
  -- Return results
  RETURN jsonb_build_object(
    'success', true,
    'points_earned', v_points_earned,
    'new_rating', v_current_rating + v_points_earned,
    'total_games', v_current_games + 1
  );
END;
$$;

-- Update profiles RLS to prevent direct manipulation of game stats
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;

CREATE POLICY "Users can update their own profile"
ON public.profiles
FOR UPDATE
USING (auth.uid() = id)
WITH CHECK (
  auth.uid() = id AND
  -- Prevent direct updates to game statistics
  (iq_rating = (SELECT iq_rating FROM profiles WHERE id = auth.uid())) AND
  (total_games = (SELECT total_games FROM profiles WHERE id = auth.uid())) AND
  (wins = (SELECT wins FROM profiles WHERE id = auth.uid())) AND
  (losses = (SELECT losses FROM profiles WHERE id = auth.uid()))
);
-- Add challenge_id to game_sessions to track daily challenge attempts
ALTER TABLE public.game_sessions 
ADD COLUMN challenge_id uuid REFERENCES public.daily_challenges(id) ON DELETE SET NULL;

-- Create index for efficient lookups
CREATE INDEX idx_game_sessions_challenge_id ON public.game_sessions(challenge_id) WHERE challenge_id IS NOT NULL;

-- Drop the existing insecure complete_daily_challenge function that accepts client scores
DROP FUNCTION IF EXISTS public.complete_daily_challenge(uuid, integer);

-- Remove direct RPC access - the function will only be called from edge function with service role
-- Create a new version that can only be called with service role (not callable from client)
CREATE OR REPLACE FUNCTION public.complete_daily_challenge_internal(
  p_user_id UUID,
  p_challenge_id UUID,
  p_session_id UUID,
  p_verified_score INTEGER
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_target_score INTEGER;
  v_reward_practice INTEGER;
  v_reward_iq INTEGER;
  v_profile RECORD;
  v_already_completed BOOLEAN;
BEGIN
  -- Check if already completed
  SELECT EXISTS(
    SELECT 1 FROM user_challenge_completions 
    WHERE user_id = p_user_id AND challenge_id = p_challenge_id
  ) INTO v_already_completed;
  
  IF v_already_completed THEN
    RAISE EXCEPTION 'Challenge already completed';
  END IF;

  -- Get challenge details
  SELECT target_score, reward_practice_rating, reward_iq_rating
  INTO v_target_score, v_reward_practice, v_reward_iq
  FROM daily_challenges
  WHERE id = p_challenge_id;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Challenge not found';
  END IF;

  -- Verify score meets target
  IF p_verified_score < v_target_score THEN
    RAISE EXCEPTION 'Score did not meet target. Required: %, Achieved: %', v_target_score, p_verified_score;
  END IF;

  -- Get current profile
  SELECT * INTO v_profile FROM profiles WHERE id = p_user_id;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Profile not found';
  END IF;

  -- Record completion
  INSERT INTO user_challenge_completions (user_id, challenge_id, score_achieved)
  VALUES (p_user_id, p_challenge_id, p_verified_score);

  -- Update profile with rewards
  UPDATE profiles SET
    practice_rating = practice_rating + v_reward_practice,
    iq_rating = iq_rating + v_reward_iq,
    updated_at = now()
  WHERE id = p_user_id;

  RETURN json_build_object(
    'success', true,
    'score', p_verified_score,
    'practice_rating_earned', v_reward_practice,
    'iq_rating_earned', v_reward_iq,
    'new_practice_rating', v_profile.practice_rating + v_reward_practice,
    'new_iq_rating', v_profile.iq_rating + v_reward_iq
  );
END;
$$;

-- Revoke public access - only service role can call this
REVOKE EXECUTE ON FUNCTION public.complete_daily_challenge_internal FROM public, anon, authenticated;

-- Note: The edge function will use service role to call this function
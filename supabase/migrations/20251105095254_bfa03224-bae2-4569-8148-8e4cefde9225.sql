-- Create daily challenges table
CREATE TABLE public.daily_challenges (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  challenge_date DATE NOT NULL UNIQUE,
  difficulty TEXT NOT NULL,
  time_control TEXT NOT NULL,
  target_score INTEGER NOT NULL,
  reward_practice_rating INTEGER NOT NULL DEFAULT 50,
  reward_iq_rating INTEGER NOT NULL DEFAULT 25,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.daily_challenges ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view daily challenges"
ON public.daily_challenges
FOR SELECT
USING (true);

-- Create user challenge completions table
CREATE TABLE public.user_challenge_completions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  challenge_id UUID NOT NULL REFERENCES public.daily_challenges(id) ON DELETE CASCADE,
  score_achieved INTEGER NOT NULL,
  completed_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, challenge_id)
);

ALTER TABLE public.user_challenge_completions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own completions"
ON public.user_challenge_completions
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own completions"
ON public.user_challenge_completions
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Create friendships table
CREATE TABLE public.friendships (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  friend_id UUID NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'blocked')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, friend_id)
);

ALTER TABLE public.friendships ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their friendships"
ON public.friendships
FOR SELECT
USING (auth.uid() = user_id OR auth.uid() = friend_id);

CREATE POLICY "Users can create friend requests"
ON public.friendships
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update received requests"
ON public.friendships
FOR UPDATE
USING (auth.uid() = friend_id);

CREATE POLICY "Users can delete their friendships"
ON public.friendships
FOR DELETE
USING (auth.uid() = user_id OR auth.uid() = friend_id);

CREATE TRIGGER update_friendships_updated_at
BEFORE UPDATE ON public.friendships
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Insert initial daily challenge
INSERT INTO public.daily_challenges (challenge_date, difficulty, time_control, target_score, reward_practice_rating, reward_iq_rating)
VALUES (CURRENT_DATE, 'medium', 'blitz', 7, 100, 50);

-- Function to complete daily challenge
CREATE OR REPLACE FUNCTION public.complete_daily_challenge(
  p_challenge_id UUID,
  p_score INTEGER
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  v_user_id UUID;
  v_target_score INTEGER;
  v_reward_practice INTEGER;
  v_reward_iq INTEGER;
  v_already_completed BOOLEAN;
BEGIN
  v_user_id := auth.uid();
  
  SELECT EXISTS (
    SELECT 1 FROM user_challenge_completions
    WHERE user_id = v_user_id AND challenge_id = p_challenge_id
  ) INTO v_already_completed;
  
  IF v_already_completed THEN
    RAISE EXCEPTION 'Challenge already completed';
  END IF;
  
  SELECT target_score, reward_practice_rating, reward_iq_rating
  INTO v_target_score, v_reward_practice, v_reward_iq
  FROM daily_challenges
  WHERE id = p_challenge_id;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Challenge not found';
  END IF;
  
  IF p_score < v_target_score THEN
    RAISE EXCEPTION 'Score did not meet target';
  END IF;
  
  INSERT INTO user_challenge_completions (user_id, challenge_id, score_achieved)
  VALUES (v_user_id, p_challenge_id, p_score);
  
  UPDATE profiles
  SET 
    practice_rating = practice_rating + v_reward_practice,
    iq_rating = iq_rating + v_reward_iq,
    updated_at = now()
  WHERE id = v_user_id;
  
  RETURN jsonb_build_object(
    'success', true,
    'practice_reward', v_reward_practice,
    'iq_reward', v_reward_iq
  );
END;
$$;
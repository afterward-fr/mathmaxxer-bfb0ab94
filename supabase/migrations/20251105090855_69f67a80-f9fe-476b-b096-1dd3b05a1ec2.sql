-- Create achievements table
CREATE TABLE public.achievements (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT NOT NULL,
  icon TEXT NOT NULL,
  category TEXT NOT NULL,
  criteria_type TEXT NOT NULL,
  criteria_value INTEGER NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create user_achievements table
CREATE TABLE public.user_achievements (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  achievement_id UUID NOT NULL REFERENCES public.achievements(id) ON DELETE CASCADE,
  unlocked_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, achievement_id)
);

-- Enable RLS
ALTER TABLE public.achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_achievements ENABLE ROW LEVEL SECURITY;

-- RLS Policies for achievements (public read)
CREATE POLICY "Anyone can view achievements"
ON public.achievements
FOR SELECT
USING (true);

-- RLS Policies for user_achievements
CREATE POLICY "Users can view all user achievements"
ON public.user_achievements
FOR SELECT
USING (true);

CREATE POLICY "Users can insert their own achievements"
ON public.user_achievements
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Insert initial achievements
INSERT INTO public.achievements (name, description, icon, category, criteria_type, criteria_value) VALUES
  -- First Steps
  ('First Victory', 'Win your first game', 'trophy', 'milestones', 'total_wins', 1),
  ('Getting Started', 'Complete 5 games', 'target', 'milestones', 'total_games', 5),
  ('Dedicated Player', 'Complete 25 games', 'zap', 'milestones', 'total_games', 25),
  ('Veteran', 'Complete 100 games', 'award', 'milestones', 'total_games', 100),
  ('Legend', 'Complete 500 games', 'crown', 'milestones', 'total_games', 500),
  
  -- Winning Streaks
  ('On a Roll', 'Win 3 games in a row', 'flame', 'streaks', 'win_streak', 3),
  ('Unstoppable', 'Win 5 games in a row', 'zap', 'streaks', 'win_streak', 5),
  ('Domination', 'Win 10 games in a row', 'trophy', 'streaks', 'win_streak', 10),
  
  -- Win Count
  ('Winner', 'Win 10 games', 'trophy', 'victories', 'total_wins', 10),
  ('Champion', 'Win 50 games', 'medal', 'victories', 'total_wins', 50),
  ('Master', 'Win 100 games', 'crown', 'victories', 'total_wins', 100),
  ('Grandmaster', 'Win 250 games', 'star', 'victories', 'total_wins', 250),
  
  -- IQ Rating
  ('Rising Star', 'Reach 1200 IQ rating', 'trending-up', 'rating', 'iq_rating', 1200),
  ('Genius', 'Reach 1500 IQ rating', 'brain', 'rating', 'iq_rating', 1500),
  ('Einstein', 'Reach 1800 IQ rating', 'sparkles', 'rating', 'iq_rating', 1800),
  ('Prodigy', 'Reach 2000 IQ rating', 'crown', 'rating', 'iq_rating', 2000),
  
  -- Difficulty Mastery
  ('Beginner Master', 'Win 20 games on Beginner difficulty', 'star', 'difficulty', 'difficulty_beginner_wins', 20),
  ('Elementary Expert', 'Win 20 games on Elementary difficulty', 'star', 'difficulty', 'difficulty_elementary_wins', 20),
  ('Intermediate Champion', 'Win 20 games on Intermediate difficulty', 'award', 'difficulty', 'difficulty_intermediate_wins', 20),
  ('Advanced Virtuoso', 'Win 20 games on Advanced difficulty', 'trophy', 'difficulty', 'difficulty_advanced_wins', 20),
  ('Expert Specialist', 'Win 20 games on Expert difficulty', 'medal', 'difficulty', 'difficulty_expert_wins', 20),
  ('Master Difficulty Champion', 'Win 20 games on Master difficulty', 'crown', 'difficulty', 'difficulty_master_wins', 20),
  
  -- Perfect Games
  ('Flawless', 'Complete a game with 100% accuracy', 'target', 'performance', 'perfect_game', 1),
  ('Perfectionist', 'Complete 5 games with 100% accuracy', 'sparkles', 'performance', 'perfect_games', 5),
  
  -- Speed
  ('Quick Thinker', 'Complete a game in under 2 minutes', 'zap', 'speed', 'fast_game', 1),
  ('Speed Demon', 'Complete 10 games in under 2 minutes each', 'flame', 'speed', 'fast_games', 10);

-- Create indexes for better performance
CREATE INDEX idx_user_achievements_user_id ON public.user_achievements(user_id);
CREATE INDEX idx_user_achievements_achievement_id ON public.user_achievements(achievement_id);
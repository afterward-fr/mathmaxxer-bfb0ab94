-- Create enum for difficulty levels
CREATE TYPE difficulty_level AS ENUM ('beginner', 'elementary', 'intermediate', 'advanced', 'expert', 'master');

-- Create enum for time control types
CREATE TYPE time_control_type AS ENUM ('3+2', '5+5', '10+10', '15+15', '30+30');

-- Create profiles table for user data
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username TEXT UNIQUE NOT NULL,
  iq_rating INTEGER NOT NULL DEFAULT 1000,
  total_games INTEGER NOT NULL DEFAULT 0,
  wins INTEGER NOT NULL DEFAULT 0,
  losses INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- RLS Policies for profiles
CREATE POLICY "Users can view all profiles"
  ON public.profiles FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can insert their own profile"
  ON public.profiles FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update their own profile"
  ON public.profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = id);

-- Create questions table
CREATE TABLE public.questions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  question TEXT NOT NULL,
  answer TEXT NOT NULL,
  difficulty difficulty_level NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Enable RLS for questions (read-only for authenticated users)
ALTER TABLE public.questions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view questions"
  ON public.questions FOR SELECT
  TO authenticated
  USING (true);

-- Create matches table
CREATE TABLE public.matches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  player1_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  player2_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  difficulty difficulty_level NOT NULL,
  time_control time_control_type NOT NULL,
  winner_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  player1_score INTEGER NOT NULL DEFAULT 0,
  player2_score INTEGER NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'waiting', -- waiting, in_progress, completed
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  completed_at TIMESTAMPTZ
);

-- Enable RLS
ALTER TABLE public.matches ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own matches"
  ON public.matches FOR SELECT
  TO authenticated
  USING (auth.uid() = player1_id OR auth.uid() = player2_id);

CREATE POLICY "Users can insert matches"
  ON public.matches FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = player1_id);

CREATE POLICY "Users can update their own matches"
  ON public.matches FOR UPDATE
  TO authenticated
  USING (auth.uid() = player1_id OR auth.uid() = player2_id);

-- Create match_answers table to track answers
CREATE TABLE public.match_answers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  match_id UUID REFERENCES public.matches(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  question_id UUID REFERENCES public.questions(id) ON DELETE CASCADE NOT NULL,
  user_answer TEXT NOT NULL,
  is_correct BOOLEAN NOT NULL,
  answered_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.match_answers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view answers for their matches"
  ON public.match_answers FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.matches
      WHERE id = match_id
      AND (player1_id = auth.uid() OR player2_id = auth.uid())
    )
  );

CREATE POLICY "Users can insert their own answers"
  ON public.match_answers FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Function to update profile updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Trigger for profiles
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Function to handle new user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, username)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'username', SPLIT_PART(NEW.email, '@', 1))
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Trigger for new user creation
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- Insert sample questions for different difficulty levels
INSERT INTO public.questions (question, answer, difficulty) VALUES
  -- Beginner (basic arithmetic)
  ('5 + 3 = ?', '8', 'beginner'),
  ('10 - 4 = ?', '6', 'beginner'),
  ('7 + 2 = ?', '9', 'beginner'),
  ('12 - 5 = ?', '7', 'beginner'),
  ('6 + 6 = ?', '12', 'beginner'),
  
  -- Elementary (simple multiplication/division)
  ('8 × 3 = ?', '24', 'elementary'),
  ('15 ÷ 3 = ?', '5', 'elementary'),
  ('7 × 4 = ?', '28', 'elementary'),
  ('24 ÷ 6 = ?', '4', 'elementary'),
  ('9 × 5 = ?', '45', 'elementary'),
  
  -- Intermediate (mixed operations)
  ('(8 + 4) × 2 = ?', '24', 'intermediate'),
  ('15 - 3 × 2 = ?', '9', 'intermediate'),
  ('(20 ÷ 4) + 7 = ?', '12', 'intermediate'),
  ('6 × (5 - 2) = ?', '18', 'intermediate'),
  ('18 ÷ 3 + 4 = ?', '10', 'intermediate'),
  
  -- Advanced (algebra basics)
  ('If x + 5 = 12, what is x?', '7', 'advanced'),
  ('Solve: 2x = 16', '8', 'advanced'),
  ('If 3x - 4 = 11, what is x?', '5', 'advanced'),
  ('Solve: x/4 = 5', '20', 'advanced'),
  ('If 5x + 3 = 23, what is x?', '4', 'advanced'),
  
  -- Expert (quadratics/geometry)
  ('What is the square root of 144?', '12', 'expert'),
  ('If x² = 25, what is x? (positive)', '5', 'expert'),
  ('Area of triangle: base=10, height=6', '30', 'expert'),
  ('Solve: x² - 9 = 0 (positive x)', '3', 'expert'),
  ('Circumference of circle with radius 7 (use 22/7 for π)', '44', 'expert'),
  
  -- Master (complex problems)
  ('If 2^x = 32, what is x?', '5', 'master'),
  ('Solve: x² + 5x + 6 = 0 (smaller root)', '-3', 'master'),
  ('What is 15% of 200?', '30', 'master'),
  ('If f(x) = 2x + 3, what is f(5)?', '13', 'master'),
  ('Solve: log₂(16) = ?', '4', 'master');

-- Enable realtime for matches table
ALTER PUBLICATION supabase_realtime ADD TABLE public.matches;
ALTER PUBLICATION supabase_realtime ADD TABLE public.match_answers;
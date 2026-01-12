-- ============================================
-- DAILY STREAK SYSTEM
-- ============================================
CREATE TABLE public.user_streaks (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE,
  current_streak INTEGER NOT NULL DEFAULT 0,
  longest_streak INTEGER NOT NULL DEFAULT 0,
  last_login_date DATE,
  streak_frozen_until DATE,
  freeze_tokens INTEGER NOT NULL DEFAULT 1,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.user_streaks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view all streaks" ON public.user_streaks FOR SELECT USING (true);
CREATE POLICY "Users can update own streak" ON public.user_streaks FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own streak" ON public.user_streaks FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Daily login rewards table
CREATE TABLE public.daily_rewards (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  day_number INTEGER NOT NULL UNIQUE,
  reward_type TEXT NOT NULL, -- 'practice_rating', 'iq_rating', 'freeze_token', 'bonus_multiplier'
  reward_value INTEGER NOT NULL,
  description TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.daily_rewards ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view rewards" ON public.daily_rewards FOR SELECT USING (true);

-- Insert default daily rewards (7-day cycle)
INSERT INTO public.daily_rewards (day_number, reward_type, reward_value, description) VALUES
(1, 'practice_rating', 10, '+10 Practice Rating'),
(2, 'practice_rating', 15, '+15 Practice Rating'),
(3, 'iq_rating', 5, '+5 IQ Rating'),
(4, 'practice_rating', 20, '+20 Practice Rating'),
(5, 'freeze_token', 1, '+1 Streak Freeze'),
(6, 'practice_rating', 25, '+25 Practice Rating'),
(7, 'bonus_multiplier', 2, '2x Points for 24h');

-- Claimed rewards tracking
CREATE TABLE public.claimed_rewards (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  reward_id UUID NOT NULL REFERENCES public.daily_rewards(id),
  claimed_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.claimed_rewards ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own claimed rewards" ON public.claimed_rewards FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own claimed rewards" ON public.claimed_rewards FOR INSERT WITH CHECK (auth.uid() = user_id);

-- ============================================
-- QUESTION TOPICS
-- ============================================
CREATE TABLE public.question_topics (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  description TEXT,
  icon TEXT NOT NULL DEFAULT '📚',
  color TEXT NOT NULL DEFAULT '#6366f1',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.question_topics ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view topics" ON public.question_topics FOR SELECT USING (true);

-- Insert default topics
INSERT INTO public.question_topics (name, description, icon, color) VALUES
('Algebra', 'Equations, expressions, and algebraic manipulation', '🔢', '#ef4444'),
('Geometry', 'Shapes, angles, areas, and spatial reasoning', '📐', '#f97316'),
('Arithmetic', 'Basic operations, fractions, decimals, percentages', '➕', '#22c55e'),
('Calculus', 'Derivatives, integrals, limits', '∫', '#3b82f6'),
('Statistics', 'Probability, data analysis, averages', '📊', '#8b5cf6'),
('Number Theory', 'Primes, divisibility, number properties', '🔬', '#ec4899'),
('Logic', 'Logical reasoning and problem solving', '🧩', '#14b8a6'),
('Word Problems', 'Real-world math applications', '📝', '#f59e0b');

-- Add topic column to questions
ALTER TABLE public.questions ADD COLUMN topic_id UUID REFERENCES public.question_topics(id);

-- ============================================
-- WEEKLY TOURNAMENTS
-- ============================================
CREATE TABLE public.tournaments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  start_date TIMESTAMP WITH TIME ZONE NOT NULL,
  end_date TIMESTAMP WITH TIME ZONE NOT NULL,
  difficulty TEXT NOT NULL,
  entry_fee INTEGER NOT NULL DEFAULT 0,
  prize_pool INTEGER NOT NULL DEFAULT 0,
  max_participants INTEGER,
  status TEXT NOT NULL DEFAULT 'upcoming', -- upcoming, active, completed
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.tournaments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view tournaments" ON public.tournaments FOR SELECT USING (true);

CREATE TABLE public.tournament_participants (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tournament_id UUID NOT NULL REFERENCES public.tournaments(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  score INTEGER NOT NULL DEFAULT 0,
  games_played INTEGER NOT NULL DEFAULT 0,
  best_time INTEGER, -- best completion time in seconds
  joined_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(tournament_id, user_id)
);

ALTER TABLE public.tournament_participants ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view participants" ON public.tournament_participants FOR SELECT USING (true);
CREATE POLICY "Users can join tournaments" ON public.tournament_participants FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own participation" ON public.tournament_participants FOR UPDATE USING (auth.uid() = user_id);

-- ============================================
-- REFERRAL SYSTEM
-- ============================================
CREATE TABLE public.referral_codes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE,
  code TEXT NOT NULL UNIQUE,
  uses INTEGER NOT NULL DEFAULT 0,
  max_uses INTEGER DEFAULT 100,
  reward_per_referral INTEGER NOT NULL DEFAULT 50,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.referral_codes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view referral codes" ON public.referral_codes FOR SELECT USING (true);
CREATE POLICY "Users can create own code" ON public.referral_codes FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own code" ON public.referral_codes FOR UPDATE USING (auth.uid() = user_id);

CREATE TABLE public.referrals (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  referrer_id UUID NOT NULL,
  referred_id UUID NOT NULL UNIQUE,
  referral_code_id UUID NOT NULL REFERENCES public.referral_codes(id),
  reward_claimed BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.referrals ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own referrals" ON public.referrals FOR SELECT USING (auth.uid() = referrer_id OR auth.uid() = referred_id);
CREATE POLICY "Anyone can create referral" ON public.referrals FOR INSERT WITH CHECK (auth.uid() = referred_id);

-- ============================================
-- CLANS/TEAMS SYSTEM
-- ============================================
CREATE TABLE public.clans (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  description TEXT,
  icon TEXT NOT NULL DEFAULT '⚔️',
  banner_color TEXT NOT NULL DEFAULT '#6366f1',
  owner_id UUID NOT NULL,
  total_rating INTEGER NOT NULL DEFAULT 0,
  member_count INTEGER NOT NULL DEFAULT 1,
  max_members INTEGER NOT NULL DEFAULT 50,
  is_public BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.clans ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view clans" ON public.clans FOR SELECT USING (true);
CREATE POLICY "Owner can update clan" ON public.clans FOR UPDATE USING (auth.uid() = owner_id);
CREATE POLICY "Users can create clans" ON public.clans FOR INSERT WITH CHECK (auth.uid() = owner_id);
CREATE POLICY "Owner can delete clan" ON public.clans FOR DELETE USING (auth.uid() = owner_id);

CREATE TABLE public.clan_members (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  clan_id UUID NOT NULL REFERENCES public.clans(id) ON DELETE CASCADE,
  user_id UUID NOT NULL UNIQUE,
  role TEXT NOT NULL DEFAULT 'member', -- owner, admin, member
  contribution_points INTEGER NOT NULL DEFAULT 0,
  joined_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.clan_members ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view clan members" ON public.clan_members FOR SELECT USING (true);
CREATE POLICY "Users can join clans" ON public.clan_members FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Members can leave" ON public.clan_members FOR DELETE USING (auth.uid() = user_id);

CREATE TABLE public.clan_invites (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  clan_id UUID NOT NULL REFERENCES public.clans(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  invited_by UUID NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending', -- pending, accepted, rejected
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(clan_id, user_id)
);

ALTER TABLE public.clan_invites ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own invites" ON public.clan_invites FOR SELECT USING (auth.uid() = user_id OR auth.uid() = invited_by);
CREATE POLICY "Members can invite" ON public.clan_invites FOR INSERT WITH CHECK (auth.uid() = invited_by);
CREATE POLICY "Users can update own invites" ON public.clan_invites FOR UPDATE USING (auth.uid() = user_id);

-- ============================================
-- IN-GAME CHAT & EMOTES
-- ============================================
CREATE TABLE public.quick_chats (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  message TEXT NOT NULL,
  category TEXT NOT NULL, -- greeting, taunt, encouragement, reaction
  icon TEXT,
  sort_order INTEGER NOT NULL DEFAULT 0
);

ALTER TABLE public.quick_chats ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view quick chats" ON public.quick_chats FOR SELECT USING (true);

INSERT INTO public.quick_chats (message, category, icon, sort_order) VALUES
('Good luck!', 'greeting', '🍀', 1),
('Have fun!', 'greeting', '🎉', 2),
('Nice one!', 'encouragement', '👍', 3),
('Well played!', 'encouragement', '👏', 4),
('Too easy!', 'taunt', '😎', 5),
('Bring it on!', 'taunt', '💪', 6),
('Wow!', 'reaction', '😮', 7),
('Oops!', 'reaction', '😅', 8),
('GG!', 'reaction', '🤝', 9),
('Rematch?', 'reaction', '🔄', 10);

CREATE TABLE public.match_messages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  match_id UUID NOT NULL REFERENCES public.matches(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  quick_chat_id UUID REFERENCES public.quick_chats(id),
  custom_message TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.match_messages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Match players can view messages" ON public.match_messages FOR SELECT 
  USING (EXISTS (SELECT 1 FROM matches WHERE id = match_id AND (player1_id = auth.uid() OR player2_id = auth.uid())));
CREATE POLICY "Match players can send messages" ON public.match_messages FOR INSERT 
  WITH CHECK (auth.uid() = user_id AND EXISTS (SELECT 1 FROM matches WHERE id = match_id AND (player1_id = auth.uid() OR player2_id = auth.uid())));

-- Enable realtime for match messages
ALTER PUBLICATION supabase_realtime ADD TABLE public.match_messages;

-- ============================================
-- USER ANALYTICS (enhanced stats tracking)
-- ============================================
CREATE TABLE public.user_analytics (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  date DATE NOT NULL,
  games_played INTEGER NOT NULL DEFAULT 0,
  questions_answered INTEGER NOT NULL DEFAULT 0,
  correct_answers INTEGER NOT NULL DEFAULT 0,
  average_time_per_question NUMERIC(10,2),
  best_streak INTEGER NOT NULL DEFAULT 0,
  topics_practiced TEXT[],
  difficulty_breakdown JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, date)
);

ALTER TABLE public.user_analytics ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own analytics" ON public.user_analytics FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own analytics" ON public.user_analytics FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own analytics" ON public.user_analytics FOR UPDATE USING (auth.uid() = user_id);

-- Add bonus multiplier to profiles
ALTER TABLE public.profiles ADD COLUMN bonus_multiplier NUMERIC(3,1) NOT NULL DEFAULT 1.0;
ALTER TABLE public.profiles ADD COLUMN bonus_expires_at TIMESTAMP WITH TIME ZONE;

-- Triggers for updated_at
CREATE TRIGGER update_user_streaks_updated_at BEFORE UPDATE ON public.user_streaks
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_clans_updated_at BEFORE UPDATE ON public.clans
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- clan_invites: require inviter be a clan member
DROP POLICY IF EXISTS "Members can invite" ON public.clan_invites;
CREATE POLICY "Members can invite" ON public.clan_invites
FOR INSERT TO authenticated
WITH CHECK (
  auth.uid() = invited_by
  AND EXISTS (
    SELECT 1 FROM public.clan_members cm
    WHERE cm.clan_id = clan_invites.clan_id AND cm.user_id = auth.uid()
  )
);

-- clan_members: restrict role on insert to 'member'
DROP POLICY IF EXISTS "Users can join clans" ON public.clan_members;
CREATE POLICY "Users can join clans" ON public.clan_members
FOR INSERT TO authenticated
WITH CHECK (
  auth.uid() = user_id
  AND role = 'member'
);

-- matchmaking_queue: restrict select to own entries (find_match is SECURITY DEFINER)
DROP POLICY IF EXISTS "Users can view queue entries" ON public.matchmaking_queue;
CREATE POLICY "Users can view own queue entries" ON public.matchmaking_queue
FOR SELECT TO authenticated
USING (auth.uid() = user_id);

-- game_sessions: prevent client-side score changes; completion goes through SECURITY DEFINER RPC
DROP POLICY IF EXISTS "Users can update their incomplete sessions" ON public.game_sessions;
CREATE POLICY "Users can update their incomplete sessions" ON public.game_sessions
FOR UPDATE TO authenticated
USING (auth.uid() = user_id AND is_completed = false)
WITH CHECK (
  auth.uid() = user_id
  AND is_completed = false
  AND score = 0
);

-- referral_codes: restrict select to authenticated users
DROP POLICY IF EXISTS "Anyone can view referral codes" ON public.referral_codes;
CREATE POLICY "Authenticated users can view referral codes" ON public.referral_codes
FOR SELECT TO authenticated
USING (true);

-- user_streaks: restrict select to own streak
DROP POLICY IF EXISTS "Users can view all streaks" ON public.user_streaks;
CREATE POLICY "Users can view own streak" ON public.user_streaks
FOR SELECT TO authenticated
USING (auth.uid() = user_id);

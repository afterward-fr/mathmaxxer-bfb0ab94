import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Flame, Snowflake, Gift, Sparkles } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";

interface StreakData {
  current_streak: number;
  longest_streak: number;
  last_login_date: string | null;
  freeze_tokens: number;
  streak_frozen_until: string | null;
}

interface DailyReward {
  id: string;
  day_number: number;
  reward_type: string;
  reward_value: number;
  description: string;
}

export const StreakTracker = ({ userId }: { userId: string }) => {
  const { toast } = useToast();
  const [streak, setStreak] = useState<StreakData | null>(null);
  const [rewards, setRewards] = useState<DailyReward[]>([]);
  const [todayRewardClaimed, setTodayRewardClaimed] = useState(false);
  const [showRewardsDialog, setShowRewardsDialog] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStreakData();
  }, [userId]);

  const loadStreakData = async () => {
    try {
      // Load or create streak data
      let { data: streakData, error } = await supabase
        .from("user_streaks")
        .select("*")
        .eq("user_id", userId)
        .single();

      if (!streakData) {
        // Create new streak record
        const { data: newStreak, error: insertError } = await supabase
          .from("user_streaks")
          .insert({ user_id: userId })
          .select()
          .single();
        
        if (insertError) throw insertError;
        streakData = newStreak;
      }

      // Check and update streak
      await updateStreak(streakData);

      // Load daily rewards
      const { data: rewardsData } = await supabase
        .from("daily_rewards")
        .select("*")
        .order("day_number");

      setRewards(rewardsData || []);

      // Check if today's reward was claimed
      const today = new Date().toISOString().split('T')[0];
      const { data: claimedToday } = await supabase
        .from("claimed_rewards")
        .select("id")
        .eq("user_id", userId)
        .gte("claimed_at", today)
        .limit(1);

      setTodayRewardClaimed((claimedToday?.length || 0) > 0);
    } catch (error) {
      console.error("Error loading streak data:", error);
    } finally {
      setLoading(false);
    }
  };

  const updateStreak = async (currentStreak: StreakData) => {
    const today = new Date().toISOString().split('T')[0];
    const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];
    
    let newStreak = { ...currentStreak };
    
    if (currentStreak.last_login_date === today) {
      // Already logged in today
      setStreak(currentStreak);
      return;
    }

    if (currentStreak.last_login_date === yesterday) {
      // Continue streak
      newStreak.current_streak = currentStreak.current_streak + 1;
      newStreak.longest_streak = Math.max(newStreak.current_streak, currentStreak.longest_streak);
    } else if (currentStreak.streak_frozen_until && currentStreak.streak_frozen_until >= today) {
      // Streak is frozen, keep it
      newStreak.current_streak = currentStreak.current_streak;
    } else if (currentStreak.last_login_date) {
      // Streak broken
      newStreak.current_streak = 1;
    } else {
      // First login
      newStreak.current_streak = 1;
    }

    newStreak.last_login_date = today;

    // Update in database
    await supabase
      .from("user_streaks")
      .update({
        current_streak: newStreak.current_streak,
        longest_streak: newStreak.longest_streak,
        last_login_date: today,
      })
      .eq("user_id", userId);

    setStreak(newStreak);
  };

  const claimDailyReward = async () => {
    if (!streak || todayRewardClaimed) return;

    const dayNumber = ((streak.current_streak - 1) % 7) + 1;
    const todayReward = rewards.find(r => r.day_number === dayNumber);
    
    if (!todayReward) return;

    try {
      // Record claim
      await supabase.from("claimed_rewards").insert({
        user_id: userId,
        reward_id: todayReward.id,
      });

      // Apply reward
      if (todayReward.reward_type === 'practice_rating') {
        // Direct update for reward
        const { data: profile } = await supabase
          .from("profiles")
          .select("practice_rating")
          .eq("id", userId)
          .single();
        
        if (profile) {
          await supabase
            .from("profiles")
            .update({ practice_rating: profile.practice_rating + todayReward.reward_value })
            .eq("id", userId);
        }
      } else if (todayReward.reward_type === 'iq_rating') {
        const { data: profile } = await supabase
          .from("profiles")
          .select("iq_rating")
          .eq("id", userId)
          .single();
        
        if (profile) {
          await supabase
            .from("profiles")
            .update({ iq_rating: profile.iq_rating + todayReward.reward_value })
            .eq("id", userId);
        }
      } else if (todayReward.reward_type === 'freeze_token') {
        await supabase
          .from("user_streaks")
          .update({ freeze_tokens: streak.freeze_tokens + todayReward.reward_value })
          .eq("user_id", userId);
      } else if (todayReward.reward_type === 'bonus_multiplier') {
        const expiresAt = new Date(Date.now() + 86400000).toISOString();
        await supabase
          .from("profiles")
          .update({ 
            bonus_multiplier: todayReward.reward_value,
            bonus_expires_at: expiresAt
          })
          .eq("id", userId);
      }

      setTodayRewardClaimed(true);
      toast({
        title: "🎁 Daily Reward Claimed!",
        description: todayReward.description,
      });
    } catch (error) {
      console.error("Error claiming reward:", error);
      toast({
        title: "Error",
        description: "Failed to claim reward",
        variant: "destructive",
      });
    }
  };

  const useStreakFreeze = async () => {
    if (!streak || streak.freeze_tokens <= 0) return;

    const tomorrow = new Date(Date.now() + 86400000).toISOString().split('T')[0];
    
    await supabase
      .from("user_streaks")
      .update({
        freeze_tokens: streak.freeze_tokens - 1,
        streak_frozen_until: tomorrow,
      })
      .eq("user_id", userId);

    setStreak({
      ...streak,
      freeze_tokens: streak.freeze_tokens - 1,
      streak_frozen_until: tomorrow,
    });

    toast({
      title: "❄️ Streak Frozen!",
      description: "Your streak is protected for 24 hours",
    });
  };

  if (loading || !streak) {
    return (
      <Card className="animate-pulse">
        <CardContent className="p-4">
          <div className="h-16 bg-secondary/50 rounded" />
        </CardContent>
      </Card>
    );
  }

  const currentDayReward = rewards.find(r => r.day_number === ((streak.current_streak - 1) % 7) + 1);

  return (
    <Card className="border-primary/20" style={{ boxShadow: "var(--shadow-card)" }}>
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center justify-between text-lg">
          <div className="flex items-center gap-2">
            <Flame className="w-5 h-5 text-orange-500" />
            Daily Streak
          </div>
          <div className="flex items-center gap-1 text-sm font-normal text-muted-foreground">
            <Snowflake className="w-4 h-4" />
            {streak.freeze_tokens} freezes
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="text-center">
              <p className="text-3xl font-bold text-primary">{streak.current_streak}</p>
              <p className="text-xs text-muted-foreground">Current</p>
            </div>
            <div className="h-8 w-px bg-border" />
            <div className="text-center">
              <p className="text-xl font-semibold text-muted-foreground">{streak.longest_streak}</p>
              <p className="text-xs text-muted-foreground">Best</p>
            </div>
          </div>
          
          <div className="flex gap-2">
            {streak.freeze_tokens > 0 && (
              <Button
                variant="outline"
                size="sm"
                onClick={useStreakFreeze}
                className="text-xs"
              >
                <Snowflake className="w-3 h-3 mr-1" />
                Freeze
              </Button>
            )}
            
            <Dialog open={showRewardsDialog} onOpenChange={setShowRewardsDialog}>
              <DialogTrigger asChild>
                <Button
                  variant={todayRewardClaimed ? "outline" : "default"}
                  size="sm"
                  className="text-xs"
                >
                  <Gift className="w-3 h-3 mr-1" />
                  {todayRewardClaimed ? "Claimed" : "Claim"}
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle className="flex items-center gap-2">
                    <Sparkles className="w-5 h-5 text-primary" />
                    7-Day Reward Cycle
                  </DialogTitle>
                </DialogHeader>
                <div className="grid grid-cols-7 gap-2 mt-4">
                  {rewards.map((reward) => {
                    const isCurrentDay = reward.day_number === ((streak.current_streak - 1) % 7) + 1;
                    const isPast = reward.day_number < ((streak.current_streak - 1) % 7) + 1;
                    
                    return (
                      <div
                        key={reward.id}
                        className={`p-2 rounded-lg text-center text-xs ${
                          isCurrentDay
                            ? "bg-primary text-primary-foreground ring-2 ring-primary"
                            : isPast
                            ? "bg-secondary/50 text-muted-foreground"
                            : "bg-secondary/30"
                        }`}
                      >
                        <p className="font-bold">Day {reward.day_number}</p>
                        <p className="mt-1">{reward.description}</p>
                      </div>
                    );
                  })}
                </div>
                {!todayRewardClaimed && currentDayReward && (
                  <Button onClick={claimDailyReward} className="w-full mt-4">
                    <Gift className="w-4 h-4 mr-2" />
                    Claim Today's Reward: {currentDayReward.description}
                  </Button>
                )}
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default StreakTracker;


import { useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";

interface CheckAchievementsParams {
  userId: string;
  profile: {
    total_games: number;
    wins: number;
    iq_rating: number;
  };
  gameSessions: any[];
  matches: any[];
}

export const useAchievements = () => {
  const { toast } = useToast();

  const checkAndAwardAchievements = async ({
    userId,
    profile,
    gameSessions,
    matches,
  }: CheckAchievementsParams) => {
    try {
      // Get all achievements
      const { data: allAchievements } = await supabase
        .from("achievements")
        .select("*");

      if (!allAchievements) return;

      // Get user's unlocked achievements
      const { data: unlockedAchievements } = await supabase
        .from("user_achievements")
        .select("achievement_id")
        .eq("user_id", userId);

      const unlockedIds = new Set(
        unlockedAchievements?.map((ua) => ua.achievement_id) || []
      );

      // Calculate stats
      const stats = calculateStats(profile, gameSessions, matches, userId);

      // Check each achievement
      const newlyUnlocked: string[] = [];

      for (const achievement of allAchievements) {
        if (unlockedIds.has(achievement.id)) continue;

        const criteria = achievement.criteria_type;
        const requiredValue = achievement.criteria_value;
        const currentValue = stats[criteria as keyof typeof stats] || 0;

        if (currentValue >= requiredValue) {
          // Award achievement
          const { error } = await supabase
            .from("user_achievements")
            .insert({
              user_id: userId,
              achievement_id: achievement.id,
            });

          if (!error) {
            newlyUnlocked.push(achievement.name);
          }
        }
      }

      // Show toast for newly unlocked achievements
      if (newlyUnlocked.length > 0) {
        toast({
          title: "🏆 Achievement Unlocked!",
          description: newlyUnlocked.join(", "),
          duration: 5000,
        });
      }
    } catch (error) {
      console.error("Error checking achievements:", error);
    }
  };

  const calculateStats = (
    profile: any,
    gameSessions: any[],
    matches: any[],
    userId: string
  ) => {
    const stats: Record<string, number> = {
      total_games: profile.total_games,
      total_wins: profile.wins,
      iq_rating: profile.iq_rating,
    };

    // Calculate win streak
    const allGames = [
      ...gameSessions.map((s) => ({
        date: s.completed_at,
        won: s.score >= s.total_questions * 0.7,
      })),
      ...matches.map((m) => ({
        date: m.completed_at,
        won: m.winner_id === userId,
      })),
    ]
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    let currentStreak = 0;
    let maxStreak = 0;
    for (const game of allGames) {
      if (game.won) {
        currentStreak++;
        maxStreak = Math.max(maxStreak, currentStreak);
      } else {
        currentStreak = 0;
      }
    }
    stats.win_streak = maxStreak;

    // Calculate difficulty-specific wins
    const difficultyWins: Record<string, number> = {};
    gameSessions.forEach((session) => {
      const won = session.score >= session.total_questions * 0.7;
      if (won) {
        difficultyWins[session.difficulty] =
          (difficultyWins[session.difficulty] || 0) + 1;
      }
    });
    matches.forEach((match) => {
      if (match.winner_id === userId) {
        difficultyWins[match.difficulty] =
          (difficultyWins[match.difficulty] || 0) + 1;
      }
    });

    Object.entries(difficultyWins).forEach(([difficulty, count]) => {
      stats[`difficulty_${difficulty}_wins`] = count;
    });

    // Calculate perfect games
    const perfectGames = gameSessions.filter(
      (s) => s.score === s.total_questions
    ).length;
    stats.perfect_game = perfectGames > 0 ? 1 : 0;
    stats.perfect_games = perfectGames;

    // Calculate fast games (under 2 minutes)
    const fastGames = gameSessions.filter((s) => {
      const duration =
        new Date(s.completed_at).getTime() -
        new Date(s.started_at).getTime();
      return duration < 120000; // 2 minutes in ms
    }).length;
    stats.fast_game = fastGames > 0 ? 1 : 0;
    stats.fast_games = fastGames;

    return stats;
  };

  return { checkAndAwardAchievements };
};

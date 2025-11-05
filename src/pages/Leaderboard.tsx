import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Trophy, Medal, Award, ArrowLeft, Crown } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";

interface LeaderboardEntry {
  id: string;
  username: string;
  iq_rating: number;
  wins: number;
  losses: number;
  total_games: number;
}

const Leaderboard = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  useEffect(() => {
    loadLeaderboard();
    getCurrentUser();
  }, []);

  const getCurrentUser = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (session) {
      setCurrentUserId(session.user.id);
    }
  };

  const loadLeaderboard = async () => {
    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("id, username, iq_rating, wins, losses, total_games")
        .order("iq_rating", { ascending: false })
        .limit(100);

      if (error) throw error;

      setLeaderboard(data || []);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 1:
        return <Crown className="w-6 h-6 text-yellow-500" />;
      case 2:
        return <Medal className="w-6 h-6 text-gray-400" />;
      case 3:
        return <Award className="w-6 h-6 text-amber-700" />;
      default:
        return <span className="text-lg font-bold text-muted-foreground">#{rank}</span>;
    }
  };

  const getWinRate = (wins: number, total: number) => {
    if (total === 0) return "0%";
    return `${Math.round((wins / total) * 100)}%`;
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: "var(--gradient-primary)" }}>
        <Card className="p-8">
          <p className="text-lg">Loading leaderboard...</p>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-4 md:p-8" style={{ background: "var(--gradient-primary)" }}>
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <Button onClick={() => navigate("/")} variant="outline" size="sm">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Home
          </Button>
        </div>

        {/* Leaderboard Card */}
        <Card style={{ boxShadow: "var(--shadow-game)" }}>
          <CardHeader>
            <CardTitle className="flex items-center gap-3 text-2xl">
              <Trophy className="w-8 h-8 text-primary" />
              Global Leaderboard
            </CardTitle>
            <CardDescription>Top 100 players ranked by IQ rating</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {/* Header Row */}
              <div className="grid grid-cols-12 gap-2 md:gap-4 p-3 text-sm font-semibold text-muted-foreground border-b">
                <div className="col-span-1">Rank</div>
                <div className="col-span-4 md:col-span-3">Player</div>
                <div className="col-span-2 text-center">Rating</div>
                <div className="col-span-2 text-center hidden md:block">Games</div>
                <div className="col-span-2 text-center">W/L</div>
                <div className="col-span-3 md:col-span-2 text-center">Win Rate</div>
              </div>

              {/* Leaderboard Entries */}
              {leaderboard.map((entry, index) => {
                const rank = index + 1;
                const isCurrentUser = entry.id === currentUserId;
                
                return (
                  <div
                    key={entry.id}
                    className={`grid grid-cols-12 gap-2 md:gap-4 p-3 rounded-lg transition-all ${
                      isCurrentUser 
                        ? "bg-primary/20 border-2 border-primary" 
                        : "bg-secondary/30 hover:bg-secondary/50"
                    }`}
                  >
                    <div className="col-span-1 flex items-center">
                      {getRankIcon(rank)}
                    </div>
                    <div className="col-span-4 md:col-span-3 flex items-center font-medium truncate">
                      {entry.username}
                      {isCurrentUser && (
                        <span className="ml-2 text-xs text-primary font-bold">(You)</span>
                      )}
                    </div>
                    <div className="col-span-2 flex items-center justify-center">
                      <span className="font-bold text-primary text-lg">
                        {entry.iq_rating}
                      </span>
                    </div>
                    <div className="col-span-2 hidden md:flex items-center justify-center text-muted-foreground">
                      {entry.total_games}
                    </div>
                    <div className="col-span-2 flex items-center justify-center">
                      <span className="text-sm">
                        <span className="text-green-500 font-semibold">{entry.wins}</span>
                        /
                        <span className="text-red-500 font-semibold">{entry.losses}</span>
                      </span>
                    </div>
                    <div className="col-span-3 md:col-span-2 flex items-center justify-center font-semibold">
                      {getWinRate(entry.wins, entry.total_games)}
                    </div>
                  </div>
                );
              })}

              {leaderboard.length === 0 && (
                <div className="text-center py-12 text-muted-foreground">
                  <Trophy className="w-16 h-16 mx-auto mb-4 opacity-50" />
                  <p className="text-lg">No players yet. Be the first!</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Stats Info */}
        <div className="grid md:grid-cols-3 gap-4">
          <Card className="p-4 text-center bg-card/50">
            <Crown className="w-8 h-8 mx-auto mb-2 text-yellow-500" />
            <h3 className="font-bold text-sm">Top Player</h3>
            <p className="text-xs text-muted-foreground">
              {leaderboard[0]?.username || "None yet"}
            </p>
          </Card>
          <Card className="p-4 text-center bg-card/50">
            <Trophy className="w-8 h-8 mx-auto mb-2 text-primary" />
            <h3 className="font-bold text-sm">Total Players</h3>
            <p className="text-xs text-muted-foreground">{leaderboard.length}</p>
          </Card>
          <Card className="p-4 text-center bg-card/50">
            <Award className="w-8 h-8 mx-auto mb-2 text-primary" />
            <h3 className="font-bold text-sm">Highest Rating</h3>
            <p className="text-xs text-muted-foreground">
              {leaderboard[0]?.iq_rating || 0}
            </p>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Leaderboard;

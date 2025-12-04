import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft, Users, Loader2, Trophy, Target } from "lucide-react";
import MediumRectangleAd from "@/components/MediumRectangleAd";
interface QueueEntry {
  id: string;
  user_id: string;
  difficulty: string;
  time_control: string;
  iq_rating: number;
  created_at: string;
}

const Multiplayer = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [difficulty, setDifficulty] = useState("beginner");
  const [timeControl, setTimeControl] = useState("5+5");
  const [inQueue, setInQueue] = useState(false);
  const [queueCount, setQueueCount] = useState(0);
  const [searching, setSearching] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const [userRating, setUserRating] = useState(1000);

  useEffect(() => {
    checkAuth();
    loadQueueStatus();
    
    // Subscribe to queue changes
    const queueChannel = supabase
      .channel('queue-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'matchmaking_queue'
        },
        () => {
          loadQueueStatus();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(queueChannel);
    };
  }, []);

  // Separate effect for match detection that depends on userId
  useEffect(() => {
    if (!userId) return;

    const matchChannel = supabase
      .channel(`match-found-${userId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'matches',
          filter: `player1_id=eq.${userId}`
        },
        (payload) => {
          handleMatchFound(payload.new.id);
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'matches',
          filter: `player2_id=eq.${userId}`
        },
        (payload) => {
          handleMatchFound(payload.new.id);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(matchChannel);
    };
  }, [userId]);

  const checkAuth = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      navigate("/auth");
    } else {
      setUserId(session.user.id);
      
      // Load user profile to get rating
      const { data: profile } = await supabase
        .from("profiles")
        .select("iq_rating")
        .eq("id", session.user.id)
        .single();
      
      if (profile) {
        setUserRating(profile.iq_rating);
      }
    }
  };

  const loadQueueStatus = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Check if user is in queue
      const { data: userQueue } = await supabase
        .from("matchmaking_queue")
        .select("*")
        .eq("user_id", user.id)
        .single();

      setInQueue(!!userQueue);

      // Get total queue count
      const { count } = await supabase
        .from("matchmaking_queue")
        .select("*", { count: 'exact', head: true });

      setQueueCount(count || 0);
    } catch (error: any) {
      console.error("Error loading queue status:", error);
    }
  };

  const handleMatchFound = (matchId: string) => {
    toast({
      title: "Match Found!",
      description: "Starting your game...",
    });
    
    setInQueue(false);
    setSearching(false);
    
    // Navigate to the game
    setTimeout(() => {
      navigate(`/game?matchId=${matchId}&mode=multiplayer`);
    }, 1000);
  };

  const joinQueue = async () => {
    setSearching(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      // Add user to queue
      const { error: queueError } = await supabase
        .from("matchmaking_queue")
        .insert({
          user_id: user.id,
          difficulty,
          time_control: timeControl,
          iq_rating: userRating,
        });

      if (queueError) throw queueError;

      setInQueue(true);

      toast({
        title: "Searching for Match",
        description: "Finding an opponent with similar skill...",
      });

      // Try to find a match immediately
      const { data: matchId } = await supabase.rpc("find_match", {
        p_user_id: user.id,
        p_difficulty: difficulty,
        p_time_control: timeControl,
        p_iq_rating: userRating,
      });

      if (matchId) {
        handleMatchFound(matchId);
      }
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to join matchmaking queue",
      });
      setSearching(false);
    }
  };

  const leaveQueue = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const { error } = await supabase
        .from("matchmaking_queue")
        .delete()
        .eq("user_id", user.id);

      if (error) throw error;

      setInQueue(false);
      setSearching(false);

      toast({
        title: "Left Queue",
        description: "Matchmaking cancelled",
      });
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to leave queue",
      });
    }
  };

  const getDifficultyLabel = (difficulty: string) => {
    const labels: Record<string, string> = {
      beginner: "Beginner",
      elementary: "Elementary",
      intermediate: "Intermediate",
      advanced: "Advanced",
      expert: "Expert",
      master: "Master"
    };
    return labels[difficulty] || difficulty;
  };

  return (
    <div className="min-h-screen p-4 md:p-8" style={{ background: "var(--gradient-primary)" }}>
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex items-center gap-4">
          <Button onClick={() => navigate("/")} variant="outline" size="icon">
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-2">
              <Users className="w-8 h-8 text-primary" />
              Multiplayer Arena
            </h1>
            <p className="text-muted-foreground">Skill-based matchmaking</p>
          </div>
        </div>

        {/* User Stats Card */}
        <Card style={{ boxShadow: "var(--shadow-game)" }}>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                  <Trophy className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Competitive Rating</p>
                  <p className="text-2xl font-bold">{userRating}</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-sm text-muted-foreground">Players in Queue</p>
                <p className="text-2xl font-bold">{queueCount}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Matchmaking Card */}
        <Card style={{ boxShadow: "var(--shadow-game)" }}>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="w-5 h-5" />
              Find Match
            </CardTitle>
            <CardDescription>
              Compete for competitive IQ rating and climb the leaderboard
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {!inQueue ? (
              <>
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Difficulty</label>
                    <Select value={difficulty} onValueChange={setDifficulty}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="beginner">Beginner</SelectItem>
                        <SelectItem value="elementary">Elementary</SelectItem>
                        <SelectItem value="intermediate">Intermediate</SelectItem>
                        <SelectItem value="advanced">Advanced</SelectItem>
                        <SelectItem value="expert">Expert</SelectItem>
                        <SelectItem value="master">Master</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium">Time Control</label>
                    <Select value={timeControl} onValueChange={setTimeControl}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="3+2">Blitz - 3 min / 2 questions</SelectItem>
                        <SelectItem value="5+5">Rapid - 5 min / 5 questions</SelectItem>
                        <SelectItem value="10+10">Classic - 10 min / 10 questions</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <Button onClick={joinQueue} disabled={searching} className="w-full" size="lg">
                  <Users className="w-4 h-4 mr-2" />
                  Find Match
                </Button>
              </>
            ) : (
              <div className="space-y-4">
                <div className="text-center py-8">
                  <Loader2 className="w-16 h-16 mx-auto mb-4 text-primary animate-spin" />
                  <h3 className="text-xl font-semibold mb-2">Searching for Opponent...</h3>
                  <p className="text-muted-foreground mb-1">
                    Looking for players around {userRating} IQ rating
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {getDifficultyLabel(difficulty)} • {timeControl}
                  </p>
                </div>

                <Button onClick={leaveQueue} variant="outline" className="w-full">
                  Cancel Search
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        <MediumRectangleAd />

        {/* Info Card */}
        <Card className="bg-card/50">
          <CardContent className="pt-6">
            <div className="flex items-start gap-3">
              <Trophy className="w-5 h-5 text-primary mt-0.5" />
              <div>
                <h4 className="font-semibold mb-1">Skill-Based Matchmaking</h4>
                <p className="text-sm text-muted-foreground">
                  Our matchmaking system pairs you with opponents of similar IQ rating (±100 points initially, expanding if needed) to ensure fair and competitive matches.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Multiplayer;

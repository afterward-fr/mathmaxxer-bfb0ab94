import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft, Users, Swords, Trophy, Clock } from "lucide-react";

interface Match {
  id: string;
  difficulty: string;
  time_control: string;
  status: string;
  player1_id: string;
  player2_id: string | null;
  created_at: string;
}

const Multiplayer = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [difficulty, setDifficulty] = useState("beginner");
  const [timeControl, setTimeControl] = useState("5+5");
  const [matches, setMatches] = useState<Match[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    checkAuth();
    loadMatches();
    
    // Subscribe to match changes
    const channel = supabase
      .channel('matches-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'matches'
        },
        () => {
          loadMatches();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const checkAuth = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      navigate("/auth");
    } else {
      setUserId(session.user.id);
    }
  };

  const loadMatches = async () => {
    try {
      const { data, error } = await supabase
        .from("matches")
        .select("*")
        .eq("status", "waiting")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setMatches(data || []);
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to load matches",
      });
    } finally {
      setLoading(false);
    }
  };

  const createMatch = async () => {
    setCreating(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const { data, error } = await supabase
        .from("matches")
        .insert({
          player1_id: user.id,
          difficulty: difficulty as any,
          time_control: timeControl as any,
        })
        .select()
        .single();

      if (error) throw error;

      toast({
        title: "Match Created!",
        description: "Waiting for an opponent to join...",
      });

      loadMatches();
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to create match",
      });
    } finally {
      setCreating(false);
    }
  };

  const joinMatch = async (matchId: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const { error } = await supabase
        .from("matches")
        .update({
          player2_id: user.id,
          status: "in_progress",
        })
        .eq("id", matchId);

      if (error) throw error;

      toast({
        title: "Joined Match!",
        description: "Starting game...",
      });

      // Navigate to multiplayer game
      navigate(`/game?matchId=${matchId}&mode=multiplayer`);
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to join match",
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
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="flex items-center gap-4">
          <Button onClick={() => navigate("/")} variant="outline" size="icon">
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-2">
              <Users className="w-8 h-8 text-primary" />
              Multiplayer Arena
            </h1>
            <p className="text-muted-foreground">Challenge players worldwide</p>
          </div>
        </div>

        <Card style={{ boxShadow: "var(--shadow-game)" }}>
          <CardHeader>
            <CardTitle>Create Match</CardTitle>
            <CardDescription>Set up a new match and wait for an opponent</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
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

            <Button onClick={createMatch} disabled={creating} className="w-full">
              <Swords className="w-4 h-4 mr-2" />
              {creating ? "Creating Match..." : "Create Match"}
            </Button>
          </CardContent>
        </Card>

        <Card style={{ boxShadow: "var(--shadow-game)" }}>
          <CardHeader>
            <CardTitle>Available Matches</CardTitle>
            <CardDescription>Join an existing match or wait for your match to fill</CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <p className="text-center text-muted-foreground py-8">Loading matches...</p>
            ) : matches.length === 0 ? (
              <div className="text-center py-8">
                <Trophy className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
                <p className="text-muted-foreground">No matches available. Create one!</p>
              </div>
            ) : (
              <div className="space-y-3">
                {matches.map((match) => (
                  <Card key={match.id} className="p-4">
                    <div className="flex justify-between items-center">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <Swords className="w-5 h-5 text-primary" />
                          <span className="font-semibold">{getDifficultyLabel(match.difficulty)}</span>
                          <span className="text-muted-foreground">•</span>
                          <div className="flex items-center gap-1 text-sm text-muted-foreground">
                            <Clock className="w-4 h-4" />
                            {match.time_control}
                          </div>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          Waiting for opponent...
                        </p>
                      </div>
                      {match.player1_id !== userId && (
                        <Button onClick={() => joinMatch(match.id)}>
                          Join Match
                        </Button>
                      )}
                      {match.player1_id === userId && (
                        <span className="text-sm text-muted-foreground">Your match</span>
                      )}
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Multiplayer;

import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Brain, Trophy, Clock, Zap, LogOut, User, Bug, Users, Award, Star, Sparkles, UserPlus } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import AdBanner from "@/components/AdBanner";

const Index = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [difficulty, setDifficulty] = useState("beginner");
  const [timeControl, setTimeControl] = useState("5+5");

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) {
        navigate("/auth");
      } else {
        setUser(session.user);
        loadProfile(session.user.id);
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (!session) {
        navigate("/auth");
      } else {
        setUser(session.user);
        loadProfile(session.user.id);
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  const loadProfile = async (userId: string) => {
    const { data, error } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", userId)
      .single();

    if (data) {
      setProfile(data);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/auth");
  };

  const startGame = () => {
    navigate(`/game?difficulty=${difficulty}&timeControl=${timeControl}`);
  };

  if (!user || !profile) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: "var(--gradient-primary)" }}>
        <Card className="p-8">
          <p className="text-lg">Loading...</p>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-4 md:p-8" style={{ background: "var(--gradient-primary)" }}>
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
              <Brain className="w-6 h-6 text-primary" />
            </div>
            <div>
              <h1 className="text-2xl md:text-3xl font-bold">Math Battle Arena</h1>
              <p className="text-sm text-muted-foreground">Compete. Learn. Dominate.</p>
            </div>
          </div>
          <Button onClick={handleLogout} variant="outline" size="icon">
            <LogOut className="w-5 h-5" />
          </Button>
        </div>

        {/* Profile Stats */}
        <Card style={{ boxShadow: "var(--shadow-game)" }}>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <User className="w-5 h-5" />
                  {profile.username}
                </CardTitle>
                <CardDescription>Your competitive stats</CardDescription>
              </div>
              <Button onClick={() => navigate("/profile")} variant="outline" size="sm">
                View Full Profile
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              <div className="text-center p-4 rounded-lg bg-secondary/50">
                <Trophy className="w-8 h-8 mx-auto mb-2 text-primary" />
                <p className="text-2xl font-bold text-primary">{profile.iq_rating}</p>
                <p className="text-sm text-muted-foreground">Competitive Rating</p>
              </div>
              <div className="text-center p-4 rounded-lg bg-secondary/50">
                <Brain className="w-8 h-8 mx-auto mb-2 text-primary" />
                <p className="text-2xl font-bold text-primary">{profile.practice_rating}</p>
                <p className="text-sm text-muted-foreground">Practice Rating</p>
              </div>
              <div className="text-center p-4 rounded-lg bg-secondary/50">
                <Zap className="w-8 h-8 mx-auto mb-2 text-primary" />
                <p className="text-2xl font-bold">{profile.total_games}</p>
                <p className="text-sm text-muted-foreground">Games Played</p>
              </div>
              <div className="text-center p-4 rounded-lg bg-secondary/50">
                <Trophy className="w-8 h-8 mx-auto mb-2 text-green-500" />
                <p className="text-2xl font-bold text-green-500">{profile.wins}</p>
                <p className="text-sm text-muted-foreground">Wins</p>
              </div>
              <button 
                onClick={() => navigate("/profile")}
                className="text-center p-4 rounded-lg bg-primary/10 hover:bg-primary/20 transition-all"
              >
                <Star className="w-8 h-8 mx-auto mb-2 text-primary" />
                <p className="text-2xl font-bold">View</p>
                <p className="text-sm text-muted-foreground">Achievements</p>
              </button>
            </div>
          </CardContent>
        </Card>

        {/* Multiplayer Setup */}
        <Card style={{ boxShadow: "var(--shadow-game)" }}>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="w-5 h-5 text-primary" />
              Multiplayer
            </CardTitle>
            <CardDescription>Compete for competitive IQ rating and climb the leaderboard</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="text-center py-4">
              <Trophy className="w-16 h-16 mx-auto mb-4 text-primary" />
              <h3 className="text-xl font-bold mb-2">Challenge Players Worldwide</h3>
              <p className="text-sm text-muted-foreground mb-6">
                Compete in real-time matches and earn competitive rating points
              </p>
              <Button onClick={() => navigate("/multiplayer")} size="lg" className="w-full">
                <Users className="w-4 h-4 mr-2" />
                Play Multiplayer
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Daily Challenge and Friends */}
        <div className="grid md:grid-cols-2 gap-4">
          <Card style={{ boxShadow: "var(--shadow-game)" }}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-primary" />
                Daily Challenge
              </CardTitle>
              <CardDescription>Special rewards for both ratings</CardDescription>
            </CardHeader>
            <CardContent>
              <Button onClick={() => navigate("/daily-challenge")} className="w-full">
                <Star className="w-4 h-4 mr-2" />
                Today's Challenge
              </Button>
            </CardContent>
          </Card>

          <Card style={{ boxShadow: "var(--shadow-game)" }}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <UserPlus className="w-5 h-5 text-primary" />
                Friends
              </CardTitle>
              <CardDescription>Add friends and challenge them</CardDescription>
            </CardHeader>
            <CardContent>
              <Button onClick={() => navigate("/friends")} className="w-full">
                <Users className="w-4 h-4 mr-2" />
                Manage Friends
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Solo Game, Leaderboard, and Bug Report */}
        <div className="grid md:grid-cols-3 gap-4">
          <Card style={{ boxShadow: "var(--shadow-game)" }}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Brain className="w-5 h-5 text-primary" />
                Solo Practice
              </CardTitle>
              <CardDescription>Practice without affecting competitive rating</CardDescription>
            </CardHeader>
            <CardContent>
              <Button onClick={startGame} className="w-full">
                <Brain className="w-4 h-4 mr-2" />
                Start Solo Game
              </Button>
            </CardContent>
          </Card>

          <Card style={{ boxShadow: "var(--shadow-game)" }}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Award className="w-5 h-5 text-primary" />
                Leaderboard
              </CardTitle>
              <CardDescription>See top players ranked</CardDescription>
            </CardHeader>
            <CardContent>
              <Button onClick={() => navigate("/leaderboard")} variant="outline" className="w-full">
                <Trophy className="w-4 h-4 mr-2" />
                View Rankings
              </Button>
            </CardContent>
          </Card>

          <Card style={{ boxShadow: "var(--shadow-game)" }}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bug className="w-5 h-5 text-primary" />
                Bug Report
              </CardTitle>
              <CardDescription>Help us improve</CardDescription>
            </CardHeader>
            <CardContent>
              <Button onClick={() => navigate("/bug-report")} variant="outline" className="w-full">
                <Bug className="w-4 h-4 mr-2" />
                Report a Bug
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Game Modes Info */}
        <div className="grid md:grid-cols-3 gap-4">
          <Card className="p-6 text-center bg-card/50">
            <Zap className="w-10 h-10 mx-auto mb-3 text-primary" />
            <h3 className="font-bold mb-2">Fast-Paced Action</h3>
            <p className="text-sm text-muted-foreground">Compete in real-time math battles</p>
          </Card>
          <Card className="p-6 text-center bg-card/50">
            <Trophy className="w-10 h-10 mx-auto mb-3 text-primary" />
            <h3 className="font-bold mb-2">Earn IQ Points</h3>
            <p className="text-sm text-muted-foreground">Build your rating with every victory</p>
          </Card>
          <Card className="p-6 text-center bg-card/50">
            <Brain className="w-10 h-10 mx-auto mb-3 text-primary" />
            <h3 className="font-bold mb-2">Multiple Levels</h3>
            <p className="text-sm text-muted-foreground">From beginner to master difficulty</p>
          </Card>
        </div>

        {/* Ad Banner */}
        <AdBanner />
      </div>
    </div>
  );
};

export default Index;

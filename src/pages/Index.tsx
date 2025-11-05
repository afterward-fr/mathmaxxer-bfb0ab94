import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Brain, Trophy, Clock, Zap, LogOut, User, Bug, Users, Award, Star } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";

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

        {/* Game Setup */}
        <Card style={{ boxShadow: "var(--shadow-game)" }}>
          <CardHeader>
            <CardTitle>Start Solo Game</CardTitle>
            <CardDescription>Practice without affecting competitive rating</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid md:grid-cols-2 gap-6">
              <div className="space-y-3">
                <label className="text-sm font-medium flex items-center gap-2">
                  <Brain className="w-4 h-4" />
                  Difficulty Level
                </label>
                <Select value={difficulty} onValueChange={setDifficulty}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="beginner">Beginner - Basic Arithmetic</SelectItem>
                    <SelectItem value="elementary">Elementary - Simple Multiplication</SelectItem>
                    <SelectItem value="intermediate">Intermediate - Mixed Operations</SelectItem>
                    <SelectItem value="advanced">Advanced - Algebra Basics</SelectItem>
                    <SelectItem value="expert">Expert - Geometry & Roots</SelectItem>
                    <SelectItem value="master">Master - Complex Problems</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-3">
                <label className="text-sm font-medium flex items-center gap-2">
                  <Clock className="w-4 h-4" />
                  Time Control
                </label>
                <Select value={timeControl} onValueChange={setTimeControl}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="3+2">Blitz - 3 min / 2 questions</SelectItem>
                    <SelectItem value="5+5">Rapid - 5 min / 5 questions</SelectItem>
                    <SelectItem value="10+10">Classic - 10 min / 10 questions</SelectItem>
                    <SelectItem value="15+15">Extended - 15 min / 15 questions</SelectItem>
                    <SelectItem value="30+30">Marathon - 30 min / 30 questions</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <Button onClick={startGame} size="lg" className="w-full">
              Start Solo Game
            </Button>
          </CardContent>
        </Card>

        {/* Multiplayer, Leaderboard, and Bug Report */}
        <div className="grid md:grid-cols-3 gap-4">
          <Card style={{ boxShadow: "var(--shadow-game)" }}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="w-5 h-5 text-primary" />
                Multiplayer
              </CardTitle>
              <CardDescription>Challenge players worldwide</CardDescription>
            </CardHeader>
            <CardContent>
              <Button onClick={() => navigate("/multiplayer")} className="w-full">
                <Users className="w-4 h-4 mr-2" />
                Play Online
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
      </div>
    </div>
  );
};

export default Index;

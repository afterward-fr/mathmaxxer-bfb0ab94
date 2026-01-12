import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Brain, Trophy, Clock, Zap, LogOut, Bug, Users, Award, Star, Sparkles, UserPlus, Info, Shield, Mail, Settings, Swords, Gift, BarChart3, BookOpen, Target } from "lucide-react";
import { Link } from "react-router-dom";
import { useToast } from "@/components/ui/use-toast";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import MediumRectangleAd from "@/components/MediumRectangleAd";
import StreakTracker from "@/components/StreakTracker";
import { useKeyboardShortcuts } from "@/hooks/useKeyboardShortcuts";

const Index = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [difficulty, setDifficulty] = useState("beginner");
  const [timeControl, setTimeControl] = useState("5+5");

  // Enable keyboard shortcuts
  useKeyboardShortcuts();

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
            <img src="/logo.png" alt="Math Maxxer" className="w-12 h-12" />
            <div>
              <h1 className="text-2xl md:text-3xl font-bold">Math Maxxer</h1>
              <p className="text-sm text-muted-foreground">Compete. Learn. Dominate.</p>
            </div>
          </div>
          
          <div className="flex items-center gap-2 md:gap-4">
            {/* Navigation Links */}
            <nav className="hidden sm:flex items-center gap-1 md:gap-2">
              <Link to="/about">
                <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-foreground gap-1.5">
                  <Info className="w-4 h-4" />
                  <span className="hidden md:inline">About</span>
                </Button>
              </Link>
              <Link to="/privacy-policy">
                <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-foreground gap-1.5">
                  <Shield className="w-4 h-4" />
                  <span className="hidden md:inline">Privacy</span>
                </Button>
              </Link>
              <Link to="/contact">
                <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-foreground gap-1.5">
                  <Mail className="w-4 h-4" />
                  <span className="hidden md:inline">Contact</span>
                </Button>
              </Link>
            </nav>
            
            <div className="h-6 w-px bg-border hidden sm:block" />
            
            <Button onClick={() => navigate("/settings")} variant="outline" size="icon">
              <Settings className="w-5 h-5" />
            </Button>
            <Button onClick={handleLogout} variant="outline" size="icon">
              <LogOut className="w-5 h-5" />
            </Button>
          </div>
        </div>

        {/* Streak Tracker */}
        <StreakTracker userId={user.id} />

        {/* Profile Stats */}
        <Card style={{ boxShadow: "var(--shadow-game)" }}>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Avatar className="w-12 h-12 border-2 border-primary/20">
                  <AvatarImage src={profile.avatar_url || undefined} alt={profile.username} />
                  <AvatarFallback className="bg-primary/10">
                    {profile.username.slice(0, 2).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <CardTitle className="flex items-center gap-2">
                    {profile.username}
                  </CardTitle>
                  <CardDescription>Your competitive stats</CardDescription>
                </div>
              </div>
              <div className="flex gap-2">
                <Button onClick={() => navigate("/analytics")} variant="outline" size="sm">
                  <BarChart3 className="w-4 h-4 mr-1" />
                  Analytics
                </Button>
                <Button onClick={() => navigate("/profile")} variant="outline" size="sm">
                  View Profile
                </Button>
              </div>
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

        {/* New Features Row: Tournaments, Clans, Referrals */}
        <div className="grid md:grid-cols-3 gap-4">
          <Card className="hover-lift cursor-pointer" style={{ boxShadow: "var(--shadow-card)" }} onClick={() => navigate("/tournaments")}>
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-lg">
                <Trophy className="w-5 h-5 text-yellow-500" />
                Weekly Tournaments
              </CardTitle>
              <CardDescription>Compete for prizes & glory</CardDescription>
            </CardHeader>
            <CardContent>
              <Button className="w-full" variant="outline">
                <Swords className="w-4 h-4 mr-2" />
                View Tournaments
              </Button>
            </CardContent>
          </Card>

          <Card className="hover-lift cursor-pointer" style={{ boxShadow: "var(--shadow-card)" }} onClick={() => navigate("/clans")}>
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-lg">
                <Shield className="w-5 h-5 text-primary" />
                Clans
              </CardTitle>
              <CardDescription>Join forces with others</CardDescription>
            </CardHeader>
            <CardContent>
              <Button className="w-full" variant="outline">
                <Users className="w-4 h-4 mr-2" />
                Browse Clans
              </Button>
            </CardContent>
          </Card>

          <Card className="hover-lift cursor-pointer" style={{ boxShadow: "var(--shadow-card)" }} onClick={() => navigate("/referrals")}>
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-lg">
                <Gift className="w-5 h-5 text-pink-500" />
                Refer Friends
              </CardTitle>
              <CardDescription>Earn bonus points</CardDescription>
            </CardHeader>
            <CardContent>
              <Button className="w-full" variant="outline">
                <Gift className="w-4 h-4 mr-2" />
                Get Referral Code
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Game Modes Row */}
        <div className="grid md:grid-cols-2 gap-4">
          {/* Multiplayer */}
          <Card style={{ boxShadow: "var(--shadow-game)" }}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="w-5 h-5 text-primary" />
                Multiplayer
              </CardTitle>
              <CardDescription>Compete for IQ rating</CardDescription>
            </CardHeader>
            <CardContent>
              <Button onClick={() => navigate("/multiplayer")} size="lg" className="w-full">
                <Users className="w-4 h-4 mr-2" />
                Find Match
              </Button>
            </CardContent>
          </Card>

          {/* Practice Mode */}
          <Card style={{ boxShadow: "var(--shadow-game)" }}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-primary" />
                Practice Mode
              </CardTitle>
              <CardDescription>Topics, Speed Rounds & Survival</CardDescription>
            </CardHeader>
            <CardContent>
              <Button onClick={() => navigate("/practice")} size="lg" className="w-full">
                <Target className="w-4 h-4 mr-2" />
                Choose Practice Mode
              </Button>
            </CardContent>
          </Card>
        </div>

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

        {/* Quick Solo Game */}
        <Card style={{ boxShadow: "var(--shadow-game)" }}>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Brain className="w-5 h-5 text-primary" />
              Quick Solo Game
            </CardTitle>
            <CardDescription>Jump right into practice</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-3 gap-4">
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
                    <SelectItem value="3+2">3 min / 2 questions</SelectItem>
                    <SelectItem value="5+5">5 min / 5 questions</SelectItem>
                    <SelectItem value="10+10">10 min / 10 questions</SelectItem>
                    <SelectItem value="15+15">15 min / 15 questions</SelectItem>
                    <SelectItem value="30+30">30 min / 30 questions</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="flex items-end">
                <Button onClick={startGame} className="w-full">
                  <Zap className="w-4 h-4 mr-2" />
                  Start Game
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Bottom Row: Leaderboard & Bug Report */}
        <div className="grid md:grid-cols-2 gap-4">
          <Card style={{ boxShadow: "var(--shadow-card)" }}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Award className="w-5 h-5 text-primary" />
                Leaderboard
              </CardTitle>
              <CardDescription>See top players ranked</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              <Button onClick={() => navigate("/leaderboard")} variant="outline" className="w-full">
                <Trophy className="w-4 h-4 mr-2" />
                View Rankings
              </Button>
            </CardContent>
          </Card>

          <Card style={{ boxShadow: "var(--shadow-card)" }}>
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

        {/* Keyboard Shortcuts Hint */}
        <Card className="p-4 bg-card/50">
          <div className="flex flex-wrap items-center justify-center gap-4 text-sm text-muted-foreground">
            <span>⌨️ Shortcuts:</span>
            <span className="flex items-center gap-1"><kbd className="px-1.5 py-0.5 bg-secondary rounded text-xs">Alt+H</kbd> Home</span>
            <span className="flex items-center gap-1"><kbd className="px-1.5 py-0.5 bg-secondary rounded text-xs">Alt+P</kbd> Practice</span>
            <span className="flex items-center gap-1"><kbd className="px-1.5 py-0.5 bg-secondary rounded text-xs">Alt+M</kbd> Multiplayer</span>
            <span className="flex items-center gap-1"><kbd className="px-1.5 py-0.5 bg-secondary rounded text-xs">Alt+T</kbd> Tournaments</span>
          </div>
        </Card>

        <MediumRectangleAd />
      </div>
    </div>
  );
};

export default Index;

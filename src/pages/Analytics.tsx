import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart3, ArrowLeft, TrendingUp, Target, Clock, Brain, Trophy, Zap } from "lucide-react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell } from "recharts";

interface AnalyticsData {
  date: string;
  games_played: number;
  questions_answered: number;
  correct_answers: number;
  average_time_per_question: number;
}

interface GameSession {
  id: string;
  difficulty: string;
  score: number;
  total_questions: number;
  completed_at: string;
}

const Analytics = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [analytics, setAnalytics] = useState<AnalyticsData[]>([]);
  const [recentGames, setRecentGames] = useState<GameSession[]>([]);
  const [difficultyBreakdown, setDifficultyBreakdown] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const COLORS = ["#22c55e", "#3b82f6", "#f59e0b", "#ef4444", "#8b5cf6", "#ec4899"];

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) {
        navigate("/auth");
      } else {
        setUser(session.user);
        loadData(session.user.id);
      }
    });
  }, [navigate]);

  const loadData = async (userId: string) => {
    try {
      // Load profile
      const { data: profileData } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", userId)
        .single();

      setProfile(profileData);

      // Load analytics data
      const { data: analyticsData } = await supabase
        .from("user_analytics")
        .select("*")
        .eq("user_id", userId)
        .order("date", { ascending: true })
        .limit(30);

      setAnalytics(analyticsData || []);

      // Load recent game sessions
      const { data: gamesData } = await supabase
        .from("game_sessions")
        .select("id, difficulty, score, total_questions, completed_at")
        .eq("user_id", userId)
        .eq("is_completed", true)
        .order("completed_at", { ascending: false })
        .limit(50);

      setRecentGames(gamesData || []);

      // Calculate difficulty breakdown
      if (gamesData) {
        const breakdown: Record<string, { count: number; correct: number }> = {};
        gamesData.forEach((game) => {
          if (!breakdown[game.difficulty]) {
            breakdown[game.difficulty] = { count: 0, correct: 0 };
          }
          breakdown[game.difficulty].count += game.total_questions;
          breakdown[game.difficulty].correct += game.score;
        });

        const breakdownArray = Object.entries(breakdown).map(([name, data]) => ({
          name: name.charAt(0).toUpperCase() + name.slice(1),
          accuracy: Math.round((data.correct / data.count) * 100),
          games: data.count,
        }));

        setDifficultyBreakdown(breakdownArray);
      }
    } catch (error) {
      console.error("Error loading analytics:", error);
    } finally {
      setLoading(false);
    }
  };

  // Calculate stats
  const totalQuestions = recentGames.reduce((sum, g) => sum + g.total_questions, 0);
  const totalCorrect = recentGames.reduce((sum, g) => sum + g.score, 0);
  const overallAccuracy = totalQuestions > 0 ? Math.round((totalCorrect / totalQuestions) * 100) : 0;
  const avgScore = recentGames.length > 0 
    ? Math.round(recentGames.reduce((sum, g) => sum + (g.score / g.total_questions) * 100, 0) / recentGames.length)
    : 0;

  // Prepare chart data
  const performanceData = analytics.map((a) => ({
    date: new Date(a.date).toLocaleDateString("en-US", { month: "short", day: "numeric" }),
    accuracy: a.questions_answered > 0 ? Math.round((a.correct_answers / a.questions_answered) * 100) : 0,
    games: a.games_played,
  }));

  // Rating history (simulated from games for now)
  const ratingHistory = recentGames.slice(0, 20).reverse().map((game, index) => ({
    game: index + 1,
    rating: profile?.practice_rating ? profile.practice_rating - (20 - index) * 5 : 1000,
  }));

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: "var(--gradient-primary)" }}>
        <Card className="p-8">
          <p className="text-lg">Loading analytics...</p>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-4 md:p-8" style={{ background: "var(--gradient-primary)" }}>
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Button onClick={() => navigate("/")} variant="ghost" size="icon">
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div>
            <h1 className="text-2xl md:text-3xl font-bold flex items-center gap-2">
              <BarChart3 className="w-8 h-8 text-primary" />
              Performance Analytics
            </h1>
            <p className="text-muted-foreground">Deep insights into your math journey</p>
          </div>
        </div>

        {/* Overview Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card style={{ boxShadow: "var(--shadow-card)" }}>
            <CardContent className="p-4 text-center">
              <Target className="w-8 h-8 mx-auto mb-2 text-green-500" />
              <p className="text-2xl font-bold text-green-500">{overallAccuracy}%</p>
              <p className="text-sm text-muted-foreground">Overall Accuracy</p>
            </CardContent>
          </Card>
          <Card style={{ boxShadow: "var(--shadow-card)" }}>
            <CardContent className="p-4 text-center">
              <Zap className="w-8 h-8 mx-auto mb-2 text-primary" />
              <p className="text-2xl font-bold">{recentGames.length}</p>
              <p className="text-sm text-muted-foreground">Games Played</p>
            </CardContent>
          </Card>
          <Card style={{ boxShadow: "var(--shadow-card)" }}>
            <CardContent className="p-4 text-center">
              <Brain className="w-8 h-8 mx-auto mb-2 text-primary" />
              <p className="text-2xl font-bold">{totalCorrect}</p>
              <p className="text-sm text-muted-foreground">Questions Correct</p>
            </CardContent>
          </Card>
          <Card style={{ boxShadow: "var(--shadow-card)" }}>
            <CardContent className="p-4 text-center">
              <TrendingUp className="w-8 h-8 mx-auto mb-2 text-yellow-500" />
              <p className="text-2xl font-bold text-yellow-500">{avgScore}%</p>
              <p className="text-sm text-muted-foreground">Avg Game Score</p>
            </CardContent>
          </Card>
        </div>

        {/* Charts Row */}
        <div className="grid md:grid-cols-2 gap-6">
          {/* Accuracy Trend */}
          <Card style={{ boxShadow: "var(--shadow-card)" }}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-primary" />
                Accuracy Trend
              </CardTitle>
              <CardDescription>Your accuracy over the last 30 days</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-64">
                {performanceData.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={performanceData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                      <XAxis dataKey="date" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                      <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} />
                      <Tooltip 
                        contentStyle={{ 
                          backgroundColor: "hsl(var(--card))",
                          border: "1px solid hsl(var(--border))",
                          borderRadius: "8px"
                        }}
                      />
                      <Line 
                        type="monotone" 
                        dataKey="accuracy" 
                        stroke="hsl(var(--primary))" 
                        strokeWidth={2}
                        dot={{ fill: "hsl(var(--primary))" }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-full flex items-center justify-center text-muted-foreground">
                    <p>Play more games to see your trend!</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Rating Progress */}
          <Card style={{ boxShadow: "var(--shadow-card)" }}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Trophy className="w-5 h-5 text-primary" />
                Rating Progress
              </CardTitle>
              <CardDescription>Your practice rating over recent games</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-64">
                {ratingHistory.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={ratingHistory}>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                      <XAxis dataKey="game" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                      <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} domain={['auto', 'auto']} />
                      <Tooltip 
                        contentStyle={{ 
                          backgroundColor: "hsl(var(--card))",
                          border: "1px solid hsl(var(--border))",
                          borderRadius: "8px"
                        }}
                      />
                      <Line 
                        type="monotone" 
                        dataKey="rating" 
                        stroke="hsl(var(--accent))" 
                        strokeWidth={2}
                        dot={{ fill: "hsl(var(--accent))" }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-full flex items-center justify-center text-muted-foreground">
                    <p>Play more games to see your progress!</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Difficulty Breakdown */}
        <div className="grid md:grid-cols-2 gap-6">
          <Card style={{ boxShadow: "var(--shadow-card)" }}>
            <CardHeader>
              <CardTitle>Accuracy by Difficulty</CardTitle>
              <CardDescription>How you perform at each level</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-64">
                {difficultyBreakdown.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={difficultyBreakdown}>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                      <XAxis dataKey="name" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                      <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} />
                      <Tooltip 
                        contentStyle={{ 
                          backgroundColor: "hsl(var(--card))",
                          border: "1px solid hsl(var(--border))",
                          borderRadius: "8px"
                        }}
                      />
                      <Bar dataKey="accuracy" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-full flex items-center justify-center text-muted-foreground">
                    <p>Play at different difficulties to see breakdown!</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          <Card style={{ boxShadow: "var(--shadow-card)" }}>
            <CardHeader>
              <CardTitle>Games by Difficulty</CardTitle>
              <CardDescription>Distribution of your practice</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-64">
                {difficultyBreakdown.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={difficultyBreakdown}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="games"
                      >
                        {difficultyBreakdown.map((_, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip 
                        contentStyle={{ 
                          backgroundColor: "hsl(var(--card))",
                          border: "1px solid hsl(var(--border))",
                          borderRadius: "8px"
                        }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-full flex items-center justify-center text-muted-foreground">
                    <p>Play more games to see distribution!</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Recent Games */}
        <Card style={{ boxShadow: "var(--shadow-card)" }}>
          <CardHeader>
            <CardTitle>Recent Games</CardTitle>
            <CardDescription>Your last 10 game sessions</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {recentGames.slice(0, 10).map((game) => (
                <div
                  key={game.id}
                  className="flex items-center justify-between p-3 rounded-lg bg-secondary/50"
                >
                  <div className="flex items-center gap-4">
                    <span className="font-medium capitalize">{game.difficulty}</span>
                    <span className="text-sm text-muted-foreground">
                      {new Date(game.completed_at).toLocaleDateString()}
                    </span>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className={`font-bold ${
                      (game.score / game.total_questions) >= 0.8 ? "text-green-500" :
                      (game.score / game.total_questions) >= 0.5 ? "text-yellow-500" :
                      "text-red-500"
                    }`}>
                      {game.score}/{game.total_questions}
                    </span>
                    <span className="text-sm text-muted-foreground">
                      {Math.round((game.score / game.total_questions) * 100)}%
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Analytics;

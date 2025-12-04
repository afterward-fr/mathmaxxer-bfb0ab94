import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Trophy, User, ArrowLeft, Calendar, TrendingUp, Target, Zap, Brain, Clock, Award, UserPlus, Swords } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from "recharts";
import { format } from "date-fns";
import AchievementBadge from "@/components/AchievementBadge";
import { useAchievements } from "@/hooks/useAchievements";

import ProfilePictureUpload from "@/components/ProfilePictureUpload";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import MediumRectangleAd from "@/components/MediumRectangleAd";

interface Profile {
  id: string;
  username: string;
  iq_rating: number;
  practice_rating: number;
  wins: number;
  losses: number;
  total_games: number;
  created_at: string;
  avatar_url?: string | null;
}

interface GameSession {
  id: string;
  difficulty: string;
  time_control: string;
  score: number;
  total_questions: number;
  started_at: string;
  completed_at: string;
  is_completed: boolean;
}

interface Match {
  id: string;
  difficulty: string;
  time_control: string;
  status: string;
  created_at: string;
  completed_at: string;
  player1_id: string;
  player2_id: string;
  player1_score: number;
  player2_score: number;
  winner_id: string;
}

const Profile = () => {
  const navigate = useNavigate();
  const { userId } = useParams();
  const { toast } = useToast();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [gameSessions, setGameSessions] = useState<GameSession[]>([]);
  const [matches, setMatches] = useState<Match[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [achievements, setAchievements] = useState<any[]>([]);
  const [userAchievements, setUserAchievements] = useState<any[]>([]);
  const [friendshipStatus, setFriendshipStatus] = useState<'none' | 'pending' | 'accepted' | 'loading'>('loading');
  const { checkAndAwardAchievements } = useAchievements();

  useEffect(() => {
    loadData();
  }, [userId]);

  const loadData = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        navigate("/auth");
        return;
      }

      const targetUserId = userId || session.user.id;
      setCurrentUserId(session.user.id);

      // Check friendship status if viewing another user's profile
      if (userId && userId !== session.user.id) {
        const { data: friendshipData } = await supabase
          .from("friendships")
          .select("status")
          .or(`and(user_id.eq.${session.user.id},friend_id.eq.${userId}),and(user_id.eq.${userId},friend_id.eq.${session.user.id})`)
          .maybeSingle();

        if (friendshipData) {
          setFriendshipStatus(friendshipData.status as 'pending' | 'accepted');
        } else {
          setFriendshipStatus('none');
        }
      } else {
        setFriendshipStatus('none');
      }

      // Load profile
      const { data: profileData, error: profileError } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", targetUserId)
        .single();

      if (profileError) throw profileError;
      setProfile(profileData);

      // Load game sessions
      const { data: sessionsData, error: sessionsError } = await supabase
        .from("game_sessions")
        .select("*")
        .eq("user_id", targetUserId)
        .eq("is_completed", true)
        .order("completed_at", { ascending: false })
        .limit(20);

      if (sessionsError) throw sessionsError;
      setGameSessions(sessionsData || []);

      // Load matches
      const { data: matchesData, error: matchesError } = await supabase
        .from("matches")
        .select("*")
        .or(`player1_id.eq.${targetUserId},player2_id.eq.${targetUserId}`)
        .eq("status", "completed")
        .order("completed_at", { ascending: false })
        .limit(20);

      if (matchesError) throw matchesError;
      setMatches(matchesData || []);

      // Load achievements
      const { data: achievementsData, error: achievementsError } = await supabase
        .from("achievements")
        .select("*")
        .order("category", { ascending: true });

      if (achievementsError) throw achievementsError;
      setAchievements(achievementsData || []);

      // Load user achievements
      const { data: userAchievementsData, error: userAchievementsError } = await supabase
        .from("user_achievements")
        .select("*, achievements(*)")
        .eq("user_id", targetUserId);

      if (userAchievementsError) throw userAchievementsError;
      setUserAchievements(userAchievementsData || []);

      // Check for new achievements if viewing own profile
      if (targetUserId === session.user.id && profileData) {
        await checkAndAwardAchievements({
          userId: targetUserId,
          profile: profileData,
          gameSessions: sessionsData || [],
          matches: matchesData || [],
        });
      }

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

  const getPerformanceData = () => {
    // Combine sessions and matches, sort by date
    const allGames = [
      ...gameSessions.map(s => ({
        date: s.completed_at,
        type: 'solo',
        score: s.score,
        total: s.total_questions,
        accuracy: (s.score / s.total_questions) * 100
      })),
      ...matches.map(m => {
        const isPlayer1 = m.player1_id === profile?.id;
        const myScore = isPlayer1 ? m.player1_score : m.player2_score;
        const opponentScore = isPlayer1 ? m.player2_score : m.player1_score;
        const total = myScore + opponentScore;
        return {
          date: m.completed_at,
          type: 'multiplayer',
          score: myScore,
          total: total > 0 ? total : 1,
          accuracy: total > 0 ? (myScore / total) * 100 : 0
        };
      })
    ]
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
    .slice(-10)
    .map(game => ({
      date: format(new Date(game.date), 'MMM dd'),
      accuracy: Math.round(game.accuracy),
      score: game.score
    }));

    return allGames;
  };

  const sendFriendRequest = async () => {
    if (!currentUserId || !profile) return;

    try {
      // Check if friendship already exists (in either direction)
      const { data: existingFriendship } = await supabase
        .from("friendships")
        .select("id, status")
        .or(`and(user_id.eq.${currentUserId},friend_id.eq.${profile.id}),and(user_id.eq.${profile.id},friend_id.eq.${currentUserId})`)
        .maybeSingle();

      if (existingFriendship) {
        if (existingFriendship.status === 'accepted') {
          toast({
            title: "Already Friends",
            description: "You are already friends with this user",
            variant: "destructive",
          });
        } else {
          toast({
            title: "Request Already Sent",
            description: "A friend request is already pending",
            variant: "destructive",
          });
        }
        return;
      }

      const { error } = await supabase
        .from("friendships")
        .insert({
          user_id: currentUserId,
          friend_id: profile.id,
          status: "pending",
        });

      if (error) throw error;

      toast({
        title: "Friend request sent!",
        description: "Wait for them to accept your request",
      });

      setFriendshipStatus('pending');
    } catch (error: any) {
      console.error("Error sending friend request:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to send friend request",
        variant: "destructive",
      });
    }
  };

  const challengeUser = () => {
    if (profile) {
      navigate(`/multiplayer?friendId=${profile.id}`);
    }
  };

  const getDifficultyStats = () => {
    const stats: Record<string, { played: number, won: number }> = {};
    
    gameSessions.forEach(session => {
      if (!stats[session.difficulty]) {
        stats[session.difficulty] = { played: 0, won: 0 };
      }
      stats[session.difficulty].played++;
      if (session.score >= session.total_questions * 0.7) {
        stats[session.difficulty].won++;
      }
    });

    matches.forEach(match => {
      if (!stats[match.difficulty]) {
        stats[match.difficulty] = { played: 0, won: 0 };
      }
      stats[match.difficulty].played++;
      if (match.winner_id === profile?.id) {
        stats[match.difficulty].won++;
      }
    });

    return Object.entries(stats).map(([difficulty, data]) => ({
      difficulty: difficulty.charAt(0).toUpperCase() + difficulty.slice(1),
      games: data.played,
      winRate: data.played > 0 ? Math.round((data.won / data.played) * 100) : 0
    }));
  };

  const getRecentActivity = () => {
    return gameSessions.slice(0, 5);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: "var(--gradient-primary)" }}>
        <Card className="p-8">
          <p className="text-lg">Loading profile...</p>
        </Card>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: "var(--gradient-primary)" }}>
        <Card className="p-8">
          <p className="text-lg">Profile not found</p>
          <Button onClick={() => navigate("/")} className="mt-4">
            Go Home
          </Button>
        </Card>
      </div>
    );
  }

  const isOwnProfile = currentUserId === profile.id;
  const performanceData = getPerformanceData();
  const difficultyStats = getDifficultyStats();
  const winRate = profile.total_games > 0 ? Math.round((profile.wins / profile.total_games) * 100) : 0;
  
  const unlockedAchievementIds = new Set(userAchievements.map((ua) => ua.achievement_id));
  const achievementsByCategory = achievements.reduce((acc, achievement) => {
    if (!acc[achievement.category]) {
      acc[achievement.category] = [];
    }
    acc[achievement.category].push(achievement);
    return acc;
  }, {} as Record<string, any[]>);

  return (
    <div className="min-h-screen p-4 md:p-8" style={{ background: "var(--gradient-primary)" }}>
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <Button onClick={() => navigate("/")} variant="outline" size="sm">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Home
          </Button>
          {isOwnProfile ? (
            <Button onClick={() => navigate("/leaderboard")} variant="outline" size="sm">
              <Trophy className="w-4 h-4 mr-2" />
              Leaderboard
            </Button>
          ) : (
            <div className="flex gap-2">
              {friendshipStatus === 'accepted' && (
                <Button onClick={challengeUser} size="sm">
                  <Swords className="w-4 h-4 mr-2" />
                  Challenge
                </Button>
              )}
              {friendshipStatus === 'none' && (
                <Button onClick={sendFriendRequest} size="sm" variant="outline">
                  <UserPlus className="w-4 h-4 mr-2" />
                  Add Friend
                </Button>
              )}
              {friendshipStatus === 'pending' && (
                <Button size="sm" variant="outline" disabled>
                  <UserPlus className="w-4 h-4 mr-2" />
                  Request Sent
                </Button>
              )}
            </div>
          )}
        </div>

        {/* Profile Header */}
        <Card style={{ boxShadow: "var(--shadow-game)" }}>
          <CardHeader>
            <div className="flex items-center gap-4">
              <Avatar className="w-16 h-16 border-2 border-primary/20">
                <AvatarImage src={profile.avatar_url || undefined} alt={profile.username} />
                <AvatarFallback className="text-xl bg-primary/10">
                  {profile.username.slice(0, 2).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <CardTitle className="text-3xl">{profile.username}</CardTitle>
                <CardDescription className="flex items-center gap-2 mt-1">
                  <Calendar className="w-4 h-4" />
                  Joined {format(new Date(profile.created_at), 'MMMM yyyy')}
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
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
                <p className="text-sm text-muted-foreground">Total Games</p>
              </div>
              <div className="text-center p-4 rounded-lg bg-secondary/50">
                <Trophy className="w-8 h-8 mx-auto mb-2 text-green-500" />
                <p className="text-2xl font-bold text-green-500">{profile.wins}</p>
                <p className="text-sm text-muted-foreground">Wins</p>
              </div>
              <div className="text-center p-4 rounded-lg bg-secondary/50">
                <Brain className="w-8 h-8 mx-auto mb-2 text-red-500" />
                <p className="text-2xl font-bold text-red-500">{profile.losses}</p>
                <p className="text-sm text-muted-foreground">Losses</p>
              </div>
              <div className="text-center p-4 rounded-lg bg-secondary/50">
                <Target className="w-8 h-8 mx-auto mb-2 text-primary" />
                <p className="text-2xl font-bold">{winRate}%</p>
                <p className="text-sm text-muted-foreground">Win Rate</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Profile Picture Upload - Only for own profile */}
        {isOwnProfile && (
          <ProfilePictureUpload
            userId={profile.id}
            currentAvatarUrl={profile.avatar_url}
            username={profile.username}
            onUploadSuccess={(url) => setProfile({ ...profile, avatar_url: url })}
          />
        )}

        <MediumRectangleAd />

        {/* Tabs for Statistics and History */}
        <Tabs defaultValue="achievements" className="space-y-4">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="achievements">Achievements</TabsTrigger>
            <TabsTrigger value="stats">Statistics</TabsTrigger>
            <TabsTrigger value="history">Match History</TabsTrigger>
            <TabsTrigger value="performance">Performance</TabsTrigger>
          </TabsList>

          {/* Achievements Tab */}
          <TabsContent value="achievements" className="space-y-4">
            <Card style={{ boxShadow: "var(--shadow-game)" }}>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Award className="w-5 h-5 text-primary" />
                  Achievements ({userAchievements.length}/{achievements.length})
                </CardTitle>
                <CardDescription>
                  Unlock achievements by reaching milestones
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {Object.entries(achievementsByCategory).map(([category, categoryAchievements]: [string, any[]]) => (
                  <div key={category}>
                    <h3 className="text-lg font-semibold mb-3 capitalize">
                      {category.replace(/_/g, " ")}
                    </h3>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                      {categoryAchievements.map((achievement) => {
                        const userAchievement = userAchievements.find(
                          (ua) => ua.achievement_id === achievement.id
                        );
                        return (
                          <AchievementBadge
                            key={achievement.id}
                            achievement={{
                              ...achievement,
                              unlocked_at: userAchievement?.unlocked_at,
                            }}
                            unlocked={unlockedAchievementIds.has(achievement.id)}
                          />
                        );
                      })}
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Statistics Tab */}
          <TabsContent value="stats" className="space-y-4">
            <div className="grid md:grid-cols-2 gap-4">
              {/* Performance by Difficulty */}
              <Card style={{ boxShadow: "var(--shadow-game)" }}>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Brain className="w-5 h-5 text-primary" />
                    Performance by Difficulty
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={250}>
                    <BarChart data={difficultyStats}>
                      <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                      <XAxis dataKey="difficulty" />
                      <YAxis />
                      <Tooltip />
                      <Bar dataKey="games" fill="hsl(var(--primary))" name="Games Played" />
                      <Bar dataKey="winRate" fill="hsl(var(--chart-2))" name="Win Rate %" />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              {/* Recent Activity */}
              <Card style={{ boxShadow: "var(--shadow-game)" }}>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Clock className="w-5 h-5 text-primary" />
                    Recent Solo Games
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {getRecentActivity().map((session) => (
                      <div key={session.id} className="flex items-center justify-between p-3 rounded-lg bg-secondary/30">
                        <div className="flex-1">
                          <p className="font-medium capitalize">{session.difficulty}</p>
                          <p className="text-sm text-muted-foreground">
                            {format(new Date(session.completed_at), 'MMM dd, yyyy')}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="font-bold text-primary">
                            {session.score}/{session.total_questions}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {Math.round((session.score / session.total_questions) * 100)}%
                          </p>
                        </div>
                      </div>
                    ))}
                    {getRecentActivity().length === 0 && (
                      <p className="text-center text-muted-foreground py-8">No games played yet</p>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Match History Tab */}
          <TabsContent value="history" className="space-y-4">
            <Card style={{ boxShadow: "var(--shadow-game)" }}>
              <CardHeader>
                <CardTitle>Multiplayer Match History</CardTitle>
                <CardDescription>Your recent competitive matches</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {matches.map((match) => {
                    const isPlayer1 = match.player1_id === profile.id;
                    const myScore = isPlayer1 ? match.player1_score : match.player2_score;
                    const opponentScore = isPlayer1 ? match.player2_score : match.player1_score;
                    const won = match.winner_id === profile.id;
                    const isDraw = match.winner_id === null;

                    return (
                      <div 
                        key={match.id} 
                        className={`p-4 rounded-lg border-2 ${
                          won ? 'bg-green-500/10 border-green-500/50' : 
                          isDraw ? 'bg-yellow-500/10 border-yellow-500/50' :
                          'bg-red-500/10 border-red-500/50'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <span className={`font-bold ${
                                won ? 'text-green-500' : isDraw ? 'text-yellow-500' : 'text-red-500'
                              }`}>
                                {won ? 'VICTORY' : isDraw ? 'DRAW' : 'DEFEAT'}
                              </span>
                              <span className="text-sm text-muted-foreground">•</span>
                              <span className="text-sm capitalize">{match.difficulty}</span>
                              <span className="text-sm text-muted-foreground">•</span>
                              <span className="text-sm">{match.time_control}</span>
                            </div>
                            <p className="text-sm text-muted-foreground">
                              {format(new Date(match.completed_at), 'MMM dd, yyyy HH:mm')}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="text-2xl font-bold">
                              <span className={won ? 'text-green-500' : ''}>{myScore}</span>
                              <span className="text-muted-foreground mx-2">-</span>
                              <span className={!won && !isDraw ? 'text-red-500' : ''}>{opponentScore}</span>
                            </p>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                  {matches.length === 0 && (
                    <p className="text-center text-muted-foreground py-8">No matches played yet</p>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Performance Tab */}
          <TabsContent value="performance" className="space-y-4">
            <Card style={{ boxShadow: "var(--shadow-game)" }}>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-primary" />
                  Accuracy Trend
                </CardTitle>
                <CardDescription>Your performance over the last 10 games</CardDescription>
              </CardHeader>
              <CardContent>
                {performanceData.length > 0 ? (
                  <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={performanceData}>
                      <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                      <XAxis dataKey="date" />
                      <YAxis domain={[0, 100]} />
                      <Tooltip />
                      <Line 
                        type="monotone" 
                        dataKey="accuracy" 
                        stroke="hsl(var(--primary))" 
                        strokeWidth={3}
                        name="Accuracy %"
                      />
                    </LineChart>
                  </ResponsiveContainer>
                ) : (
                  <p className="text-center text-muted-foreground py-12">
                    Not enough data to display performance trend. Play more games!
                  </p>
                )}
              </CardContent>
            </Card>

            <Card style={{ boxShadow: "var(--shadow-game)" }}>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Target className="w-5 h-5 text-primary" />
                  Score Trend
                </CardTitle>
                <CardDescription>Your scores over the last 10 games</CardDescription>
              </CardHeader>
              <CardContent>
                {performanceData.length > 0 ? (
                  <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={performanceData}>
                      <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                      <XAxis dataKey="date" />
                      <YAxis />
                      <Tooltip />
                      <Line 
                        type="monotone" 
                        dataKey="score" 
                        stroke="hsl(var(--chart-2))" 
                        strokeWidth={3}
                        name="Score"
                      />
                    </LineChart>
                  </ResponsiveContainer>
                ) : (
                  <p className="text-center text-muted-foreground py-12">
                    Not enough data to display score trend. Play more games!
                  </p>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

      </div>
    </div>
  );
};

export default Profile;

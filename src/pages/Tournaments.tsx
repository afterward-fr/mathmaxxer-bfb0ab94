import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Trophy, ArrowLeft, Clock, Users, Star, Medal, Crown, Zap } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

interface Tournament {
  id: string;
  name: string;
  description: string;
  start_date: string;
  end_date: string;
  difficulty: string;
  entry_fee: number;
  prize_pool: number;
  max_participants: number | null;
  status: string;
}

interface Participant {
  id: string;
  user_id: string;
  score: number;
  games_played: number;
  best_time: number | null;
  profile?: {
    username: string;
    avatar_url: string | null;
  };
}

const Tournaments = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [user, setUser] = useState<any>(null);
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [selectedTournament, setSelectedTournament] = useState<Tournament | null>(null);
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [isParticipating, setIsParticipating] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) {
        navigate("/auth");
      } else {
        setUser(session.user);
        loadTournaments();
      }
    });
  }, [navigate]);

  const loadTournaments = async () => {
    try {
      const { data, error } = await supabase
        .from("tournaments")
        .select("*")
        .order("start_date", { ascending: false });

      if (error) throw error;
      setTournaments(data || []);
    } catch (error) {
      console.error("Error loading tournaments:", error);
    } finally {
      setLoading(false);
    }
  };

  const loadTournamentDetails = async (tournament: Tournament) => {
    setSelectedTournament(tournament);
    
    // Load participants with profiles
    const { data: participantsData } = await supabase
      .from("tournament_participants")
      .select("*")
      .eq("tournament_id", tournament.id)
      .order("score", { ascending: false });

    if (participantsData) {
      // Fetch profiles for participants
      const userIds = participantsData.map(p => p.user_id);
      const { data: profiles } = await supabase
        .from("profiles")
        .select("id, username, avatar_url")
        .in("id", userIds);

      const participantsWithProfiles = participantsData.map(p => ({
        ...p,
        profile: profiles?.find(prof => prof.id === p.user_id),
      }));

      setParticipants(participantsWithProfiles);
      setIsParticipating(participantsData.some(p => p.user_id === user?.id));
    }
  };

  const joinTournament = async () => {
    if (!selectedTournament || !user) return;

    try {
      const { error } = await supabase
        .from("tournament_participants")
        .insert({
          tournament_id: selectedTournament.id,
          user_id: user.id,
        });

      if (error) throw error;

      toast({
        title: "🏆 Joined Tournament!",
        description: `You're now competing in ${selectedTournament.name}`,
      });

      loadTournamentDetails(selectedTournament);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to join tournament",
        variant: "destructive",
      });
    }
  };

  const playTournamentGame = () => {
    if (!selectedTournament) return;
    navigate(`/game?difficulty=${selectedTournament.difficulty}&timeControl=5+5&tournament=${selectedTournament.id}`);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "upcoming":
        return <Badge variant="secondary">Upcoming</Badge>;
      case "active":
        return <Badge className="bg-green-500">Active</Badge>;
      case "completed":
        return <Badge variant="outline">Completed</Badge>;
      default:
        return null;
    }
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: "var(--gradient-primary)" }}>
        <Card className="p-8">
          <p className="text-lg">Loading tournaments...</p>
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
              <Trophy className="w-8 h-8 text-primary" />
              Weekly Tournaments
            </h1>
            <p className="text-muted-foreground">Compete for glory and prizes</p>
          </div>
        </div>

        {selectedTournament ? (
          // Tournament Details View
          <div className="space-y-6">
            <Button variant="outline" onClick={() => setSelectedTournament(null)}>
              ← Back to Tournaments
            </Button>

            <Card style={{ boxShadow: "var(--shadow-game)" }}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-2xl">{selectedTournament.name}</CardTitle>
                    <CardDescription>{selectedTournament.description}</CardDescription>
                  </div>
                  {getStatusBadge(selectedTournament.status)}
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="text-center p-4 rounded-lg bg-secondary/50">
                    <Clock className="w-6 h-6 mx-auto mb-2 text-primary" />
                    <p className="text-sm text-muted-foreground">Starts</p>
                    <p className="font-semibold">{formatDate(selectedTournament.start_date)}</p>
                  </div>
                  <div className="text-center p-4 rounded-lg bg-secondary/50">
                    <Clock className="w-6 h-6 mx-auto mb-2 text-primary" />
                    <p className="text-sm text-muted-foreground">Ends</p>
                    <p className="font-semibold">{formatDate(selectedTournament.end_date)}</p>
                  </div>
                  <div className="text-center p-4 rounded-lg bg-secondary/50">
                    <Trophy className="w-6 h-6 mx-auto mb-2 text-yellow-500" />
                    <p className="text-sm text-muted-foreground">Prize Pool</p>
                    <p className="font-semibold text-yellow-500">+{selectedTournament.prize_pool} pts</p>
                  </div>
                  <div className="text-center p-4 rounded-lg bg-secondary/50">
                    <Users className="w-6 h-6 mx-auto mb-2 text-primary" />
                    <p className="text-sm text-muted-foreground">Participants</p>
                    <p className="font-semibold">{participants.length}</p>
                  </div>
                </div>

                {selectedTournament.status === "active" && (
                  <div className="flex gap-4">
                    {!isParticipating ? (
                      <Button onClick={joinTournament} className="flex-1">
                        <Star className="w-4 h-4 mr-2" />
                        Join Tournament
                      </Button>
                    ) : (
                      <Button onClick={playTournamentGame} className="flex-1">
                        <Zap className="w-4 h-4 mr-2" />
                        Play Tournament Game
                      </Button>
                    )}
                  </div>
                )}

                {/* Leaderboard */}
                <div>
                  <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                    <Medal className="w-5 h-5 text-primary" />
                    Leaderboard
                  </h3>
                  <div className="space-y-2">
                    {participants.length === 0 ? (
                      <p className="text-center text-muted-foreground py-8">
                        No participants yet. Be the first to join!
                      </p>
                    ) : (
                      participants.map((participant, index) => (
                        <div
                          key={participant.id}
                          className={`flex items-center justify-between p-3 rounded-lg ${
                            index === 0 ? "bg-yellow-500/20" :
                            index === 1 ? "bg-gray-400/20" :
                            index === 2 ? "bg-amber-600/20" :
                            "bg-secondary/50"
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <span className="text-lg font-bold w-8">
                              {index === 0 ? <Crown className="w-5 h-5 text-yellow-500" /> :
                               index === 1 ? <Medal className="w-5 h-5 text-gray-400" /> :
                               index === 2 ? <Medal className="w-5 h-5 text-amber-600" /> :
                               `#${index + 1}`}
                            </span>
                            <Avatar className="w-8 h-8">
                              <AvatarImage src={participant.profile?.avatar_url || undefined} />
                              <AvatarFallback>
                                {participant.profile?.username?.slice(0, 2).toUpperCase() || "?"}
                              </AvatarFallback>
                            </Avatar>
                            <span className="font-medium">{participant.profile?.username || "Unknown"}</span>
                          </div>
                          <div className="text-right">
                            <p className="font-bold text-primary">{participant.score} pts</p>
                            <p className="text-xs text-muted-foreground">{participant.games_played} games</p>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        ) : (
          // Tournament List View
          <Tabs defaultValue="active" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="active">Active</TabsTrigger>
              <TabsTrigger value="upcoming">Upcoming</TabsTrigger>
              <TabsTrigger value="completed">Past</TabsTrigger>
            </TabsList>

            {["active", "upcoming", "completed"].map((status) => (
              <TabsContent key={status} value={status} className="space-y-4">
                {tournaments.filter(t => t.status === status).length === 0 ? (
                  <Card className="p-8 text-center">
                    <Trophy className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                    <p className="text-muted-foreground">No {status} tournaments</p>
                  </Card>
                ) : (
                  tournaments
                    .filter(t => t.status === status)
                    .map((tournament) => (
                      <Card
                        key={tournament.id}
                        className="cursor-pointer hover:border-primary/50 transition-colors"
                        style={{ boxShadow: "var(--shadow-card)" }}
                        onClick={() => loadTournamentDetails(tournament)}
                      >
                        <CardHeader>
                          <div className="flex items-start justify-between">
                            <div>
                              <CardTitle className="flex items-center gap-2">
                                <Trophy className="w-5 h-5 text-primary" />
                                {tournament.name}
                              </CardTitle>
                              <CardDescription>{tournament.description}</CardDescription>
                            </div>
                            {getStatusBadge(tournament.status)}
                          </div>
                        </CardHeader>
                        <CardContent>
                          <div className="flex items-center gap-6 text-sm text-muted-foreground">
                            <span className="flex items-center gap-1">
                              <Clock className="w-4 h-4" />
                              {formatDate(tournament.start_date)}
                            </span>
                            <span className="flex items-center gap-1">
                              <Trophy className="w-4 h-4 text-yellow-500" />
                              +{tournament.prize_pool} pts
                            </span>
                            <Badge variant="outline">{tournament.difficulty}</Badge>
                          </div>
                        </CardContent>
                      </Card>
                    ))
                )}
              </TabsContent>
            ))}
          </Tabs>
        )}
      </div>
    </div>
  );
};

export default Tournaments;

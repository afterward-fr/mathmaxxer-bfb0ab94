import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Brain, Trophy, Clock, ArrowLeft, Star, Zap } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import SmallBannerAd from "@/components/SmallBannerAd";

const DailyChallenge = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [user, setUser] = useState<any>(null);
  const [challenge, setChallenge] = useState<any>(null);
  const [completed, setCompleted] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) {
        navigate("/auth");
      } else {
        setUser(session.user);
        loadChallenge(session.user.id);
      }
    });
  }, [navigate]);

  const loadChallenge = async (userId: string) => {
    try {
      // Get today's challenge
      const { data: challengeData, error: challengeError } = await supabase
        .from("daily_challenges")
        .select("*")
        .eq("challenge_date", new Date().toISOString().split('T')[0])
        .maybeSingle();

      if (challengeError) throw challengeError;

      setChallenge(challengeData);

      // Check if user has completed it
      if (challengeData) {
        const { data: completionData } = await supabase
          .from("user_challenge_completions")
          .select("*")
          .eq("user_id", userId)
          .eq("challenge_id", challengeData.id)
          .maybeSingle();

        setCompleted(!!completionData);
      }
    } catch (error) {
      if (import.meta.env.DEV) {
        console.error("Error loading challenge:", error);
      }
      toast({
        title: "Error",
        description: "Failed to load daily challenge",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const startChallenge = () => {
    if (!challenge) return;
    navigate(`/game?difficulty=${challenge.difficulty}&timeControl=${challenge.time_control}&challengeId=${challenge.id}&targetScore=${challenge.target_score}`);
  };

  const getDifficultyLabel = (difficulty: string) => {
    const labels: Record<string, string> = {
      beginner: "Beginner",
      elementary: "Elementary",
      intermediate: "Intermediate",
      advanced: "Advanced",
      expert: "Expert",
      master: "Master",
    };
    return labels[difficulty] || difficulty;
  };

  const getTimeControlLabel = (timeControl: string) => {
    const labels: Record<string, string> = {
      blitz: "3 min / 2 questions",
      rapid: "5 min / 5 questions",
      classical: "10 min / 10 questions",
    };
    return labels[timeControl] || timeControl;
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: "var(--gradient-primary)" }}>
        <Card className="p-8">
          <p className="text-lg">Loading challenge...</p>
        </Card>
      </div>
    );
  }

  if (!challenge) {
    return (
      <div className="min-h-screen p-4 md:p-8" style={{ background: "var(--gradient-primary)" }}>
        <div className="max-w-4xl mx-auto">
          <Button onClick={() => navigate("/")} variant="outline" className="mb-6">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Home
          </Button>
          <Card>
            <CardContent className="text-center py-12 space-y-4">
              <Brain className="w-16 h-16 mx-auto text-muted-foreground" />
              <p className="text-lg text-muted-foreground">No daily challenge available today</p>
              <p className="text-sm text-muted-foreground">Check back later or play a regular game!</p>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-4 md:p-8" style={{ background: "var(--gradient-primary)" }}>
      <div className="max-w-4xl mx-auto space-y-6">
        <Button onClick={() => navigate("/")} variant="outline">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Home
        </Button>

        <Card style={{ boxShadow: "var(--shadow-game)" }}>
          <CardHeader className="text-center">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-primary/10 flex items-center justify-center">
              <Star className="w-8 h-8 text-primary" />
            </div>
            <CardTitle className="text-3xl">Daily Challenge</CardTitle>
            <CardDescription>Complete today's challenge for special rewards!</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {completed ? (
              <div className="text-center py-8 space-y-4">
                <div className="w-20 h-20 mx-auto rounded-full bg-green-500/10 flex items-center justify-center">
                  <Trophy className="w-10 h-10 text-green-500" />
                </div>
                <h3 className="text-2xl font-bold text-green-500">Challenge Completed!</h3>
                <p className="text-muted-foreground">Come back tomorrow for a new challenge</p>
              </div>
            ) : (
              <>
                <div className="grid md:grid-cols-2 gap-6">
                  <Card className="p-6">
                    <div className="flex items-center gap-3 mb-4">
                      <Brain className="w-8 h-8 text-primary" />
                      <div>
                        <h3 className="font-bold">Challenge Details</h3>
                        <p className="text-sm text-muted-foreground">Today's requirements</p>
                      </div>
                    </div>
                    <div className="space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-muted-foreground">Difficulty:</span>
                        <span className="font-medium">{getDifficultyLabel(challenge.difficulty)}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-muted-foreground">Time Control:</span>
                        <span className="font-medium">{getTimeControlLabel(challenge.time_control)}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-muted-foreground">Target Score:</span>
                        <span className="font-bold text-primary">{challenge.target_score}+ correct</span>
                      </div>
                    </div>
                  </Card>

                  <Card className="p-6 bg-primary/5">
                    <div className="flex items-center gap-3 mb-4">
                      <Trophy className="w-8 h-8 text-primary" />
                      <div>
                        <h3 className="font-bold">Rewards</h3>
                        <p className="text-sm text-muted-foreground">For completing the challenge</p>
                      </div>
                    </div>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between p-3 rounded-lg bg-background">
                        <div className="flex items-center gap-2">
                          <Brain className="w-5 h-5 text-primary" />
                          <span className="text-sm">Practice Rating</span>
                        </div>
                        <span className="font-bold text-primary">+{challenge.reward_practice_rating}</span>
                      </div>
                      <div className="flex items-center justify-between p-3 rounded-lg bg-background">
                        <div className="flex items-center gap-2">
                          <Zap className="w-5 h-5 text-primary" />
                          <span className="text-sm">Competitive Rating</span>
                        </div>
                        <span className="font-bold text-primary">+{challenge.reward_iq_rating}</span>
                      </div>
                    </div>
                  </Card>
                </div>

                <div className="text-center space-y-4">
                  <p className="text-sm text-muted-foreground">
                    Complete the challenge by scoring at least {challenge.target_score} correct answers
                  </p>
                  <Button onClick={startChallenge} size="lg" className="w-full md:w-auto px-12">
                    <Clock className="w-4 h-4 mr-2" />
                    Start Challenge
                  </Button>
                </div>
              </>
            )}
          </CardContent>
        </Card>

        <SmallBannerAd />
      </div>
    </div>
  );
};

export default DailyChallenge;
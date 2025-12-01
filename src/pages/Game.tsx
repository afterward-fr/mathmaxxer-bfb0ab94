import { useState, useEffect, useCallback } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { Brain, Trophy, Clock } from "lucide-react";
import { useAchievements } from "@/hooks/useAchievements";
import { z } from "zod";
import InterstitialAd from "@/components/InterstitialAd";

interface Question {
  id: string;
  question: string;
}

const answerSchema = z.string().trim().min(1, "Answer cannot be empty").max(200, "Answer must be less than 200 characters");

const Game = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const difficulty = searchParams.get("difficulty") || "beginner";
  const timeControl = (searchParams.get("timeControl") || "5+5").replace(/\s/g, "+");
  const matchId = searchParams.get("matchId");
  const mode = searchParams.get("mode") || "solo";
  const isMultiplayer = mode === "multiplayer";
  
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [userAnswer, setUserAnswer] = useState("");
  const [score, setScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(0);
  const [gameStarted, setGameStarted] = useState(false);
  const [gameEnded, setGameEnded] = useState(false);
  const [loading, setLoading] = useState(true);
  const [gameSessionId, setGameSessionId] = useState<string | null>(null);
  const [showInterstitialAd, setShowInterstitialAd] = useState(false);
  const [matchResult, setMatchResult] = useState<{
    won: boolean;
    ratingChange: number;
    opponentScore: number;
  } | null>(null);
  const [practiceResult, setPracticeResult] = useState<{
    ratingChange: number;
  } | null>(null);
  const { checkAndAwardAchievements } = useAchievements();

  const [totalTime, totalQuestions] = timeControl.split("+").map(Number);

  useEffect(() => {
    loadQuestions();
  }, [difficulty]);

  useEffect(() => {
    if (gameStarted && !gameEnded && timeLeft > 0) {
      const timer = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            endGame();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      return () => clearInterval(timer);
    }
  }, [gameStarted, gameEnded, timeLeft]);

  const loadQuestions = async () => {
    try {
      const { data, error } = await supabase
        .rpc("get_questions", {
          p_difficulty: difficulty,
          p_limit: totalQuestions,
        });

      if (error) throw error;

      setQuestions(data || []);
      setLoading(false);
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to load questions",
      });
      setLoading(false);
    }
  };

  const startGame = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "You must be logged in to play",
      });
      navigate("/auth");
      return;
    }

    // For multiplayer, we don't create a game session, we use the match
    if (!isMultiplayer) {
      // Create game session for solo games
      const { data: session, error } = await supabase
        .from("game_sessions")
        .insert({
          user_id: user.id,
          difficulty,
          time_control: timeControl,
          total_questions: totalQuestions,
        })
        .select()
        .single();

      if (error || !session) {
        toast({
          variant: "destructive",
          title: "Error",
          description: "Failed to start game session",
        });
        return;
      }

      setGameSessionId(session.id);
    }

    setGameStarted(true);
    setTimeLeft(totalTime * 60);
  };

  const submitAnswer = useCallback(async () => {
    const currentQuestion = questions[currentQuestionIndex];
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user || (!gameSessionId && !isMultiplayer) || (isMultiplayer && !matchId)) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Session error",
      });
      return;
    }

    // Validate answer input
    const validation = answerSchema.safeParse(userAnswer.trim());
    
    if (!validation.success) {
      toast({
        title: "Invalid Answer",
        description: validation.error.errors[0].message,
        variant: "destructive",
      });
      return;
    }
    
    // Use server-side answer verification
    const { data: isCorrect, error } = await supabase.rpc('verify_answer', {
      p_question_id: currentQuestion.id,
      user_answer: validation.data
    });
 
    if (error) {
      console.error("verify_answer RPC error", error);
      // Handle rate limit error specifically
      if (error.message?.includes('Rate limit exceeded')) {
        toast({
          title: "Too Many Attempts",
          description: "Please wait a minute before trying again",
          variant: "destructive",
        });
      } else if (error.message?.includes('Authentication required')) {
        toast({
          title: "Login Required",
          description: "Please log in again to continue playing",
          variant: "destructive",
        });
        navigate("/auth");
      } else {
        toast({
          title: "Error",
          description: `Failed to verify answer: ${error.message ?? 'Unknown error'}`,
          variant: "destructive",
        });
      }
      return;
    }

    // Log answer to database for server-side score calculation
    const tableName = isMultiplayer ? "match_answers" : "game_answers";
    const sessionField = isMultiplayer ? "match_id" : "game_session_id";
    const sessionId = isMultiplayer ? matchId : gameSessionId;

    const { error: logError } = await supabase
      .from(tableName as any)
      .insert({
        [sessionField]: sessionId,
        question_id: currentQuestion.id,
        user_answer: userAnswer.trim(),
        is_correct: isCorrect,
        user_id: user.id,
      });

    if (logError) {
      console.error("Failed to log answer:", logError);
    }

    if (isCorrect) {
      setScore((prev) => prev + 1);
      toast({
        title: "Correct! ✓",
        description: "+1 point",
      });
    } else {
      toast({
        variant: "destructive",
        title: "Wrong answer",
        description: "Try the next question!",
      });
    }

    setUserAnswer("");

    if (currentQuestionIndex + 1 >= questions.length) {
      endGame();
    } else {
      setCurrentQuestionIndex((prev) => prev + 1);
    }
  }, [currentQuestionIndex, questions, userAnswer, gameSessionId]);

  const endGame = async () => {
    setGameEnded(true);
    
    if (isMultiplayer && matchId) {
      // Handle multiplayer match completion
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error("Not authenticated");

        // Get opponent's score
        const { data: answers } = await supabase
          .from("match_answers")
          .select("user_id, is_correct")
          .eq("match_id", matchId);

        if (!answers) throw new Error("Failed to load match answers");

        // Calculate both players' scores
        const myScore = answers.filter(a => a.user_id === user.id && a.is_correct).length;
        const opponentAnswers = answers.filter(a => a.user_id !== user.id);
        const opponentScore = opponentAnswers.filter(a => a.is_correct).length;

        // Get match to determine player positions
        const { data: match } = await supabase
          .from("matches")
          .select("player1_id, player2_id")
          .eq("id", matchId)
          .single();

        if (!match) throw new Error("Match not found");

        const player1Score = match.player1_id === user.id ? myScore : opponentScore;
        const player2Score = match.player2_id === user.id ? myScore : opponentScore;

        // Call edge function to complete match
        const { data: result, error } = await supabase.functions.invoke('complete-match', {
          body: {
            matchId,
            player1Score,
            player2Score,
          },
        });

        if (error) throw error;

        const won = result.winnerId === user.id;
        const isDraw = result.winnerId === null;
        const ratingChange = match.player1_id === user.id 
          ? result.player1RatingChange 
          : result.player2RatingChange;

        setScore(myScore);
        setMatchResult({
          won,
          ratingChange,
          opponentScore,
        });

        toast({
          title: isDraw ? "Match Draw!" : (won ? "Victory! 🎉" : "Defeat"),
          description: `Rating: ${ratingChange > 0 ? '+' : ''}${ratingChange}`,
          variant: won ? "default" : "destructive",
        });

        // Check achievements
        const { data: profile } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", user.id)
          .single();

        const { data: matches } = await supabase
          .from("matches")
          .select("*")
          .or(`player1_id.eq.${user.id},player2_id.eq.${user.id}`)
          .eq("status", "completed")
          .order("completed_at", { ascending: false })
          .limit(20);

        if (profile) {
          await checkAndAwardAchievements({
            userId: user.id,
            profile,
            gameSessions: [],
            matches: matches || [],
          });
        }

        setShowInterstitialAd(true);
      } catch (error: any) {
        console.error("Failed to complete match:", error);
        toast({
          variant: "destructive",
          title: "Error",
          description: "Failed to save match results",
        });
      }
      return;
    }

    // Solo game completion
    if (!gameSessionId) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "No active game session",
      });
      return;
    }

    try {
      // Call edge function to complete game with rating changes
      const { data, error } = await supabase.functions.invoke('complete-solo-game', {
        body: { sessionId: gameSessionId },
      });

      if (error) throw error;

      // Update local score with server-calculated value
      setScore(data.score);
      
      const pointsChange = data.points_earned;
      setPracticeResult({
        ratingChange: pointsChange,
      });
      
      toast({
        title: "Game Complete!",
        description: pointsChange >= 0 
          ? `+${pointsChange} practice points!` 
          : `${pointsChange} practice points`,
        variant: pointsChange >= 0 ? "default" : "destructive",
      });

      // Check for achievements after game completion
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: profile } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", user.id)
          .single();

        const { data: sessions } = await supabase
          .from("game_sessions")
          .select("*")
          .eq("user_id", user.id)
          .eq("is_completed", true)
          .order("completed_at", { ascending: false })
          .limit(20);

        const { data: matches } = await supabase
          .from("matches")
          .select("*")
          .or(`player1_id.eq.${user.id},player2_id.eq.${user.id}`)
          .eq("status", "completed")
          .order("completed_at", { ascending: false })
          .limit(20);

        if (profile) {
          await checkAndAwardAchievements({
            userId: user.id,
            profile,
            gameSessions: sessions || [],
            matches: matches || [],
          });
        }
      }
      
      // Show interstitial ad after game completion
      setShowInterstitialAd(true);
    } catch (error: any) {
      console.error("Failed to complete game:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to save game results",
      });
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: "var(--gradient-primary)" }}>
        <Card className="p-8">
          <p className="text-lg">Loading questions...</p>
        </Card>
      </div>
    );
  }

  if (!gameStarted) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4" style={{ background: "var(--gradient-primary)" }}>
        <Card className="max-w-md w-full p-8 text-center space-y-6">
          <Brain className="w-16 h-16 mx-auto text-primary" />
          <div>
            <h2 className="text-2xl font-bold mb-2">Ready to Battle?</h2>
            <p className="text-muted-foreground">
              Difficulty: <span className="text-foreground font-semibold capitalize">{difficulty}</span>
            </p>
            <p className="text-muted-foreground">
              Time Control: <span className="text-foreground font-semibold">{totalTime} min / {totalQuestions} questions</span>
            </p>
          </div>
          <Button onClick={startGame} size="lg" className="w-full">
            Start Game
          </Button>
          <Button onClick={() => navigate("/")} variant="outline" className="w-full">
            Back to Menu
          </Button>
        </Card>
      </div>
    );
  }

  if (gameEnded) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4" style={{ background: "var(--gradient-primary)" }}>
        <Card className="max-w-md w-full p-8 text-center space-y-6">
          <Trophy className="w-16 h-16 mx-auto text-primary" />
          <div>
            {isMultiplayer && matchResult ? (
              <>
                <h2 className="text-3xl font-bold mb-2">
                  {matchResult.won ? "Victory! 🎉" : (score === matchResult.opponentScore ? "Draw" : "Defeat")}
                </h2>
                <div className="space-y-2 text-lg">
                  <p>Your Score: <span className="text-primary font-bold">{score}/{questions.length}</span></p>
                  <p className="text-muted-foreground">Opponent: {matchResult.opponentScore}/{questions.length}</p>
                  <p className={`font-bold ${matchResult.ratingChange > 0 ? 'text-green-500' : 'text-red-500'}`}>
                    IQ Rating: {matchResult.ratingChange > 0 ? '+' : ''}{matchResult.ratingChange}
                  </p>
                </div>
              </>
            ) : practiceResult ? (
              <>
                <h2 className="text-3xl font-bold mb-2">Game Over!</h2>
                <div className="space-y-2 text-lg">
                  <p>Your Score: <span className="text-primary font-bold">{score}/{questions.length}</span></p>
                  <p className={`font-bold ${practiceResult.ratingChange >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                    Practice Rating: {practiceResult.ratingChange > 0 ? '+' : ''}{practiceResult.ratingChange}
                  </p>
                </div>
              </>
            ) : (
              <>
                <h2 className="text-3xl font-bold mb-2">Game Over!</h2>
                <div className="space-y-2 text-lg">
                  <p>Your Score: <span className="text-primary font-bold">{score}/{questions.length}</span></p>
                </div>
              </>
            )}
          </div>
          <div className="space-y-3">
            <Button onClick={() => navigate("/")} size="lg" className="w-full">
              Back to Menu
            </Button>
            <Button onClick={() => window.location.reload()} variant="outline" className="w-full">
              Play Again
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  const currentQuestion = questions[currentQuestionIndex];
  const progress = ((currentQuestionIndex + 1) / questions.length) * 100;

  return (
    <>
      <InterstitialAd 
        isOpen={showInterstitialAd} 
        onClose={() => setShowInterstitialAd(false)}
        autoCloseDelay={5000}
      />
      
      <div className="min-h-screen flex items-center justify-center p-4" style={{ background: "var(--gradient-primary)" }}>
        <Card className="max-w-2xl w-full p-8 space-y-6">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-2 text-muted-foreground">
              <Clock className="w-5 h-5" />
              <span className="text-xl font-mono">{formatTime(timeLeft)}</span>
            </div>
            <div className="text-lg font-semibold">
              Score: <span className="text-primary">{score}</span>
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex justify-between text-sm text-muted-foreground">
              <span>Question {currentQuestionIndex + 1} of {questions.length}</span>
              <span>{Math.round(progress)}%</span>
            </div>
            <Progress value={progress} />
          </div>

          <Card className="p-8 text-center" style={{ background: "var(--gradient-game)", boxShadow: "var(--shadow-game)" }}>
            <p className="text-2xl font-bold">{currentQuestion?.question}</p>
          </Card>

          <form onSubmit={(e) => { e.preventDefault(); submitAnswer(); }} className="space-y-4">
            <Input
              type="text"
              placeholder="Enter your answer..."
              value={userAnswer}
              onChange={(e) => setUserAnswer(e.target.value)}
              className="text-lg text-center"
              autoFocus
            />
            <Button type="submit" size="lg" className="w-full" disabled={!userAnswer.trim()}>
              Submit Answer
            </Button>
          </form>
        </Card>
      </div>
    </>
  );
};

export default Game;

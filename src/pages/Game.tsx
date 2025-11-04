import { useState, useEffect, useCallback } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { Brain, Trophy, Clock } from "lucide-react";

interface Question {
  id: string;
  question: string;
}

const Game = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const difficulty = searchParams.get("difficulty") || "beginner";
  const timeControl = searchParams.get("timeControl") || "5+5";
  
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [userAnswer, setUserAnswer] = useState("");
  const [score, setScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(0);
  const [gameStarted, setGameStarted] = useState(false);
  const [gameEnded, setGameEnded] = useState(false);
  const [loading, setLoading] = useState(true);
  const [gameSessionId, setGameSessionId] = useState<string | null>(null);

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
        .from("questions_public")
        .select("id, question, difficulty")
        .eq("difficulty", difficulty as any)
        .limit(totalQuestions);

      if (error) throw error;

      setQuestions(data || []);
      setLoading(false);
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to load questions",
      });
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

    // Create game session
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
    setGameStarted(true);
    setTimeLeft(totalTime * 60);
  };

  const submitAnswer = useCallback(async () => {
    const currentQuestion = questions[currentQuestionIndex];
    
    // Use server-side answer verification
    const { data: isCorrect, error } = await supabase.rpc('verify_answer', {
      question_id: currentQuestion.id,
      user_answer: userAnswer.trim()
    });

    if (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to verify answer",
      });
      return;
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
  }, [currentQuestionIndex, questions, userAnswer]);

  const endGame = async () => {
    setGameEnded(true);
    
    if (!gameSessionId) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "No active game session",
      });
      return;
    }

    // Update the session score before completing
    await supabase
      .from("game_sessions")
      .update({ score })
      .eq("id", gameSessionId);

    // Call secure function to complete game and update profile
    const { data, error } = await supabase.rpc("complete_game", {
      p_session_id: gameSessionId,
    });

    if (error) {
      console.error("Failed to complete game:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to save game results",
      });
      return;
    }

    if (data && typeof data === 'object' && 'success' in data && data.success) {
      const result = data as { success: boolean; points_earned: number; new_rating: number; total_games: number };
      toast({
        title: "Game Complete!",
        description: `You earned ${result.points_earned} IQ points!`,
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
            <h2 className="text-3xl font-bold mb-2">Game Over!</h2>
            <div className="space-y-2 text-lg">
              <p>Your Score: <span className="text-primary font-bold">{score}/{questions.length}</span></p>
              <p className="text-muted-foreground">IQ Points Earned: +{score * 10}</p>
            </div>
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
  );
};

export default Game;

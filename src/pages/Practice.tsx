import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { BookOpen, ArrowLeft, Brain, Zap, Clock, Target, Star } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface Topic {
  id: string;
  name: string;
  description: string | null;
  icon: string;
  color: string;
}

const Practice = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState<any>(null);
  const [topics, setTopics] = useState<Topic[]>([]);
  const [selectedTopic, setSelectedTopic] = useState<string | null>(null);
  const [difficulty, setDifficulty] = useState("beginner");
  const [timeControl, setTimeControl] = useState("5+5");
  const [gameMode, setGameMode] = useState("standard");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) {
        navigate("/auth");
      } else {
        setUser(session.user);
        loadTopics();
      }
    });
  }, [navigate]);

  const loadTopics = async () => {
    try {
      const { data } = await supabase
        .from("question_topics")
        .select("*")
        .order("name");

      setTopics(data || []);
    } catch (error) {
      console.error("Error loading topics:", error);
    } finally {
      setLoading(false);
    }
  };

  const startGame = () => {
    const params = new URLSearchParams({
      difficulty,
      timeControl,
      mode: gameMode,
    });
    
    if (selectedTopic) {
      params.set("topic", selectedTopic);
    }
    
    navigate(`/game?${params.toString()}`);
  };

  const gameModes = [
    {
      id: "standard",
      name: "Standard",
      description: "Answer questions at your own pace within the time limit",
      icon: Brain,
    },
    {
      id: "speed",
      name: "Speed Round",
      description: "10 seconds per question - think fast!",
      icon: Zap,
    },
    {
      id: "survival",
      name: "Survival",
      description: "3 lives - how far can you go?",
      icon: Target,
    },
  ];

  if (loading) {
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
        <div className="flex items-center gap-4">
          <Button onClick={() => navigate("/")} variant="ghost" size="icon">
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div>
            <h1 className="text-2xl md:text-3xl font-bold flex items-center gap-2">
              <BookOpen className="w-8 h-8 text-primary" />
              Practice Mode
            </h1>
            <p className="text-muted-foreground">Improve your skills with targeted practice</p>
          </div>
        </div>

        <Tabs defaultValue="topics" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="topics">By Topic</TabsTrigger>
            <TabsTrigger value="modes">Game Modes</TabsTrigger>
          </TabsList>

          {/* Topics Tab */}
          <TabsContent value="topics" className="space-y-6">
            <Card style={{ boxShadow: "var(--shadow-card)" }}>
              <CardHeader>
                <CardTitle>Choose a Topic</CardTitle>
                <CardDescription>Focus your practice on specific math areas</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <button
                    onClick={() => setSelectedTopic(null)}
                    className={`p-4 rounded-lg text-center transition-all ${
                      selectedTopic === null
                        ? "bg-primary text-primary-foreground ring-2 ring-primary"
                        : "bg-secondary/50 hover:bg-secondary"
                    }`}
                  >
                    <Star className="w-8 h-8 mx-auto mb-2" />
                    <p className="font-medium">All Topics</p>
                    <p className="text-xs opacity-70">Mixed practice</p>
                  </button>
                  
                  {topics.map((topic) => (
                    <button
                      key={topic.id}
                      onClick={() => setSelectedTopic(topic.id)}
                      className={`p-4 rounded-lg text-center transition-all ${
                        selectedTopic === topic.id
                          ? "ring-2 ring-primary"
                          : "hover:opacity-80"
                      }`}
                      style={{ 
                        backgroundColor: selectedTopic === topic.id 
                          ? topic.color 
                          : `${topic.color}30`
                      }}
                    >
                      <span className="text-3xl block mb-2">{topic.icon}</span>
                      <p className="font-medium">{topic.name}</p>
                      <p className="text-xs opacity-70 line-clamp-1">{topic.description}</p>
                    </button>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Difficulty & Time Selection */}
            <div className="grid md:grid-cols-2 gap-4">
              <Card style={{ boxShadow: "var(--shadow-card)" }}>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Brain className="w-5 h-5 text-primary" />
                    Difficulty
                  </CardTitle>
                </CardHeader>
                <CardContent>
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
                </CardContent>
              </Card>

              <Card style={{ boxShadow: "var(--shadow-card)" }}>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Clock className="w-5 h-5 text-primary" />
                    Time Control
                  </CardTitle>
                </CardHeader>
                <CardContent>
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
                </CardContent>
              </Card>
            </div>

            <Button onClick={startGame} size="lg" className="w-full">
              <Brain className="w-5 h-5 mr-2" />
              Start Practice Session
            </Button>
          </TabsContent>

          {/* Game Modes Tab */}
          <TabsContent value="modes" className="space-y-6">
            <div className="grid md:grid-cols-3 gap-4">
              {gameModes.map((mode) => (
                <Card
                  key={mode.id}
                  className={`cursor-pointer transition-all ${
                    gameMode === mode.id
                      ? "border-primary ring-2 ring-primary"
                      : "hover:border-primary/50"
                  }`}
                  style={{ boxShadow: "var(--shadow-card)" }}
                  onClick={() => setGameMode(mode.id)}
                >
                  <CardHeader>
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-lg bg-primary/20 flex items-center justify-center">
                        <mode.icon className="w-6 h-6 text-primary" />
                      </div>
                      <div>
                        <CardTitle className="text-lg">{mode.name}</CardTitle>
                        {gameMode === mode.id && (
                          <Badge className="mt-1">Selected</Badge>
                        )}
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground">{mode.description}</p>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Mode-specific settings */}
            {gameMode === "speed" && (
              <Card className="border-yellow-500/50" style={{ boxShadow: "var(--shadow-card)" }}>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-yellow-500">
                    <Zap className="w-5 h-5" />
                    Speed Round Settings
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-sm text-muted-foreground">
                    In Speed Round, you have only 10 seconds to answer each question. 
                    Answer as many as you can in a row!
                  </p>
                  <div>
                    <label className="text-sm font-medium">Difficulty</label>
                    <Select value={difficulty} onValueChange={setDifficulty}>
                      <SelectTrigger className="mt-1">
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
                </CardContent>
              </Card>
            )}

            {gameMode === "survival" && (
              <Card className="border-red-500/50" style={{ boxShadow: "var(--shadow-card)" }}>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-red-500">
                    <Target className="w-5 h-5" />
                    Survival Mode Settings
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-sm text-muted-foreground">
                    You have 3 lives. Every wrong answer costs a life. 
                    Difficulty increases as you progress. How far can you go?
                  </p>
                  <div className="flex items-center gap-2 text-red-500">
                    ❤️ ❤️ ❤️
                  </div>
                </CardContent>
              </Card>
            )}

            {gameMode === "standard" && (
              <div className="grid md:grid-cols-2 gap-4">
                <Card style={{ boxShadow: "var(--shadow-card)" }}>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Brain className="w-5 h-5 text-primary" />
                      Difficulty
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
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
                  </CardContent>
                </Card>

                <Card style={{ boxShadow: "var(--shadow-card)" }}>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Clock className="w-5 h-5 text-primary" />
                      Time Control
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
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
                  </CardContent>
                </Card>
              </div>
            )}

            <Button onClick={startGame} size="lg" className="w-full">
              {gameMode === "speed" && <Zap className="w-5 h-5 mr-2" />}
              {gameMode === "survival" && <Target className="w-5 h-5 mr-2" />}
              {gameMode === "standard" && <Brain className="w-5 h-5 mr-2" />}
              Start {gameModes.find(m => m.id === gameMode)?.name} Mode
            </Button>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Practice;

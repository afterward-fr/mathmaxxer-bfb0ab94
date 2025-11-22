import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Brain, Trophy, Users, Zap } from "lucide-react";

const About = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border">
        <div className="container mx-auto px-4 py-4">
          <Button
            variant="ghost"
            onClick={() => navigate("/")}
            className="gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Home
          </Button>
        </div>
      </header>

      <main className="container mx-auto px-4 py-12 max-w-4xl">
        <h1 className="text-4xl font-bold mb-8 text-foreground">About Us</h1>
        
        <section className="space-y-8">
          <div>
            <p className="text-lg text-muted-foreground mb-6">
              We are a passionate gaming company dedicated to creating engaging and educational games that challenge minds and bring people together. Our flagship title, Math Battle, combines competitive gameplay with mental mathematics to create a unique gaming experience.
            </p>
          </div>

          <div>
            <h2 className="text-2xl font-semibold mb-4 text-foreground">Our Mission</h2>
            <p className="text-muted-foreground">
              To revolutionize learning through competitive gaming, making mental arithmetic exciting and accessible to players worldwide. We believe that learning should be fun, challenging, and rewarding.
            </p>
          </div>

          <div>
            <h2 className="text-2xl font-semibold mb-4 text-foreground">What We Offer</h2>
            <div className="grid md:grid-cols-2 gap-6">
              <div className="p-6 rounded-lg bg-card border border-border">
                <Brain className="w-8 h-8 mb-3 text-primary" />
                <h3 className="font-semibold text-lg mb-2 text-foreground">Mental Challenge</h3>
                <p className="text-muted-foreground">
                  Progressive difficulty levels that adapt to your skill, keeping you challenged and engaged.
                </p>
              </div>
              
              <div className="p-6 rounded-lg bg-card border border-border">
                <Users className="w-8 h-8 mb-3 text-primary" />
                <h3 className="font-semibold text-lg mb-2 text-foreground">Multiplayer Fun</h3>
                <p className="text-muted-foreground">
                  Compete against friends or players worldwide in real-time math battles.
                </p>
              </div>
              
              <div className="p-6 rounded-lg bg-card border border-border">
                <Trophy className="w-8 h-8 mb-3 text-primary" />
                <h3 className="font-semibold text-lg mb-2 text-foreground">Achievements</h3>
                <p className="text-muted-foreground">
                  Unlock achievements, climb leaderboards, and track your progress over time.
                </p>
              </div>
              
              <div className="p-6 rounded-lg bg-card border border-border">
                <Zap className="w-8 h-8 mb-3 text-primary" />
                <h3 className="font-semibold text-lg mb-2 text-foreground">Daily Challenges</h3>
                <p className="text-muted-foreground">
                  New challenges every day to test your skills and earn special rewards.
                </p>
              </div>
            </div>
          </div>

          <div>
            <h2 className="text-2xl font-semibold mb-4 text-foreground">Our Games</h2>
            <p className="text-muted-foreground mb-4">
              We develop multiple educational and competitive games designed to make learning enjoyable:
            </p>
            <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
              <li>Math Battle - Our flagship mental arithmetic competition game</li>
              <li>More exciting titles coming soon!</li>
            </ul>
          </div>

          <div>
            <h2 className="text-2xl font-semibold mb-4 text-foreground">Get in Touch</h2>
            <p className="text-muted-foreground mb-4">
              Have questions or feedback? We'd love to hear from you!
            </p>
            <Button onClick={() => navigate("/contact")}>
              Contact Us
            </Button>
          </div>
        </section>
      </main>
    </div>
  );
};

export default About;

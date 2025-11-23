import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import { Checkbox } from "@/components/ui/checkbox";
import mathBackground from "@/assets/math-background.jpg";

const Auth = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [username, setUsername] = useState("");
  const [loading, setLoading] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        navigate("/");
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (session) {
        navigate("/");
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (isLogin) {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (error) throw error;

        toast({
          title: "Welcome back!",
          description: "You've successfully logged in.",
        });
      } else {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: `${window.location.origin}/`,
            data: {
              username: username || email.split("@")[0],
            },
          },
        });

        if (error) throw error;

        toast({
          title: "Account created!",
          description: "Welcome to Math Battle Arena.",
        });
      }
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message,
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div 
      className="min-h-screen flex items-center justify-center p-4 bg-cover bg-center"
      style={{ backgroundImage: `url(${mathBackground})` }}
    >
      <div className="w-full max-w-md backdrop-blur-md bg-background/30 rounded-3xl border-2 border-white/20 p-8 shadow-2xl">
        <h1 className="text-4xl font-bold text-center text-white mb-8">
          {isLogin ? "login" : "register"}
        </h1>
        
        <form onSubmit={handleAuth} className="space-y-6">
          {!isLogin && (
            <div className="space-y-2">
              <label htmlFor="username" className="text-white text-sm">
                Username
              </label>
              <input
                id="username"
                type="text"
                placeholder="Choose a username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full bg-transparent border-b-2 border-white/50 text-white placeholder:text-white/60 px-1 py-2 outline-none focus:border-white transition-colors"
              />
            </div>
          )}
          
          <div className="space-y-2">
            <label htmlFor="email" className="text-white text-sm">
              {isLogin ? "Username" : "Email"}
            </label>
            <input
              id="email"
              type="email"
              placeholder={isLogin ? "" : "your@email.com"}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full bg-transparent border-b-2 border-white/50 text-white placeholder:text-white/60 px-1 py-2 outline-none focus:border-white transition-colors"
            />
          </div>
          
          <div className="space-y-2">
            <label htmlFor="password" className="text-white text-sm">
              Password
            </label>
            <input
              id="password"
              type="password"
              placeholder=""
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
              className="w-full bg-transparent border-b-2 border-white/50 text-white placeholder:text-white/60 px-1 py-2 outline-none focus:border-white transition-colors"
            />
          </div>
          
          {isLogin && (
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Checkbox 
                  id="remember" 
                  checked={rememberMe}
                  onCheckedChange={(checked) => setRememberMe(checked as boolean)}
                  className="border-white data-[state=checked]:bg-primary data-[state=checked]:border-primary"
                />
                <label htmlFor="remember" className="text-white text-sm cursor-pointer">
                  Remember me
                </label>
              </div>
              <button 
                type="button"
                className="text-white/80 hover:text-white text-sm transition-colors"
              >
                Forgot Password?
              </button>
            </div>
          )}
          
          <Button 
            type="submit" 
            className="w-full bg-white/90 hover:bg-white text-foreground font-medium py-6 rounded-xl text-lg"
            disabled={loading}
          >
            {loading ? "Please wait..." : isLogin ? "Login" : "Sign Up"}
          </Button>
        </form>
        
        <div className="mt-6 text-center">
          <button
            onClick={() => setIsLogin(!isLogin)}
            className="text-white/90 hover:text-white text-sm transition-colors"
          >
            {isLogin ? "Don't have an account? Register" : "Already have an account? Sign in"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default Auth;

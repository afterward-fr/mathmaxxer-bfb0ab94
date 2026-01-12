import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useRealtimeFriendships } from "@/hooks/useRealtimeFriendships";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import Game from "./pages/Game";
import BugReport from "./pages/BugReport";
import Multiplayer from "./pages/Multiplayer";
import Leaderboard from "./pages/Leaderboard";
import Profile from "./pages/Profile";
import DailyChallenge from "./pages/DailyChallenge";
import Friends from "./pages/Friends";
import Settings from "./pages/Settings";
import PrivacyPolicy from "./pages/PrivacyPolicy";
import About from "./pages/About";
import Contact from "./pages/Contact";
import NotFound from "./pages/NotFound";
import BannerAd from "./components/BannerAd";
import Tournaments from "./pages/Tournaments";
import Clans from "./pages/Clans";
import Referrals from "./pages/Referrals";
import Analytics from "./pages/Analytics";
import Practice from "./pages/Practice";

const queryClient = new QueryClient();


const RouteListener = () => {
  const location = useLocation();
  const showBannerAd = location.pathname !== "/auth";
  const [userId, setUserId] = useState<string | undefined>();

  // Get current user and subscribe to friendships realtime updates
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUserId(session?.user?.id);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUserId(session?.user?.id);
    });

    return () => subscription.unsubscribe();
  }, []);

  // Enable realtime notifications for friendships
  useRealtimeFriendships(userId);

  return (
    <>
      {showBannerAd && <BannerAd />}
      <Routes>
        <Route path="/" element={<Index />} />
        <Route path="/auth" element={<Auth />} />
        <Route path="/game" element={<Game />} />
        <Route path="/bug-report" element={<BugReport />} />
        <Route path="/multiplayer" element={<Multiplayer />} />
        <Route path="/leaderboard" element={<Leaderboard />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="/profile/:userId" element={<Profile />} />
        <Route path="/daily-challenge" element={<DailyChallenge />} />
        <Route path="/friends" element={<Friends />} />
        <Route path="/settings" element={<Settings />} />
        <Route path="/privacy-policy" element={<PrivacyPolicy />} />
        <Route path="/about" element={<About />} />
        <Route path="/contact" element={<Contact />} />
        <Route path="/tournaments" element={<Tournaments />} />
        <Route path="/clans" element={<Clans />} />
        <Route path="/referrals" element={<Referrals />} />
        <Route path="/analytics" element={<Analytics />} />
        <Route path="/practice" element={<Practice />} />
        {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
        <Route path="*" element={<NotFound />} />
      </Routes>
    </>
  );
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <RouteListener />
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;

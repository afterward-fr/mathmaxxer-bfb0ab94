import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom";
import { useEffect, useState } from "react";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import Game from "./pages/Game";
import BugReport from "./pages/BugReport";
import Multiplayer from "./pages/Multiplayer";
import Leaderboard from "./pages/Leaderboard";
import Profile from "./pages/Profile";
import DailyChallenge from "./pages/DailyChallenge";
import Friends from "./pages/Friends";
import NotFound from "./pages/NotFound";
import InterstitialAd from "./components/InterstitialAd";

const queryClient = new QueryClient();

const RouteListener = () => {
  const location = useLocation();
  const [showInterstitialAd, setShowInterstitialAd] = useState(false);
  const [previousPath, setPreviousPath] = useState(location.pathname);

  useEffect(() => {
    // Show ad when navigating to a different page (not on initial load)
    if (previousPath !== location.pathname && previousPath !== null) {
      setShowInterstitialAd(true);
    }
    setPreviousPath(location.pathname);
  }, [location.pathname]);

  return (
    <>
      <InterstitialAd 
        isOpen={showInterstitialAd} 
        onClose={() => setShowInterstitialAd(false)}
        autoCloseDelay={5000}
      />
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

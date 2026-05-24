import { Helmet } from "react-helmet-async";
import { useLocation, matchPath } from "react-router-dom";

const SITE = "https://mathmaxxer2025.lovable.app";
const DEFAULT_IMAGE = `${SITE}/logo.png`;

type Meta = { title: string; description: string };

const ROUTE_META: Array<{ pattern: string; meta: Meta }> = [
  { pattern: "/", meta: { title: "Math Maxxer — Compete. Learn. Dominate.", description: "Real-time competitive math battles. Earn IQ points, join clans, win tournaments, and climb the global leaderboard." } },
  { pattern: "/auth", meta: { title: "Sign In — Math Maxxer", description: "Sign in or create your Math Maxxer account to start competing in real-time math battles." } },
  { pattern: "/game", meta: { title: "Play — Math Maxxer", description: "You're in a live math battle. Solve faster than your opponent to climb the rankings." } },
  { pattern: "/multiplayer", meta: { title: "Multiplayer Matchmaking — Math Maxxer", description: "Find a real-time math opponent matched to your IQ rating and chosen difficulty." } },
  { pattern: "/leaderboard", meta: { title: "Global Leaderboard — Math Maxxer", description: "See the top Math Maxxer players ranked by competitive IQ rating and practice rating." } },
  { pattern: "/profile/:userId", meta: { title: "Player Profile — Math Maxxer", description: "View a Math Maxxer player's stats, achievements, and match history." } },
  { pattern: "/profile", meta: { title: "Your Profile — Math Maxxer", description: "Your Math Maxxer stats, achievements, and recent match history." } },
  { pattern: "/daily-challenge", meta: { title: "Daily Challenge — Math Maxxer", description: "Beat today's target score for bonus IQ and practice rating rewards." } },
  { pattern: "/friends", meta: { title: "Friends — Math Maxxer", description: "Add friends, accept requests, and challenge them to math battles." } },
  { pattern: "/settings", meta: { title: "Settings — Math Maxxer", description: "Manage your Math Maxxer account, profile picture, and preferences." } },
  { pattern: "/privacy-policy", meta: { title: "Privacy Policy — Math Maxxer", description: "How Math Maxxer collects, uses, and protects your data." } },
  { pattern: "/about", meta: { title: "About — Math Maxxer", description: "Math Maxxer is a competitive math quiz game with real-time multiplayer, tournaments, and clans." } },
  { pattern: "/contact", meta: { title: "Contact — Math Maxxer", description: "Get in touch with the Math Maxxer team for support, feedback, or partnership inquiries." } },
  { pattern: "/tournaments", meta: { title: "Weekly Tournaments — Math Maxxer", description: "Compete in weekly Math Maxxer tournaments for prizes, glory, and leaderboard placement." } },
  { pattern: "/clans", meta: { title: "Clans — Math Maxxer", description: "Join or create a Math Maxxer clan, climb the clan rankings, and play together." } },
  { pattern: "/referrals", meta: { title: "Refer Friends — Math Maxxer", description: "Share your Math Maxxer referral code and earn bonus rating for every signup." } },
  { pattern: "/analytics", meta: { title: "Your Analytics — Math Maxxer", description: "Track your Math Maxxer performance: accuracy, speed, streaks, and topic breakdowns." } },
  { pattern: "/practice", meta: { title: "Practice Mode — Math Maxxer", description: "Practice math by topic, speed round, or survival mode at your chosen difficulty." } },
  { pattern: "/bug-report", meta: { title: "Bug Reports — Math Maxxer", description: "Report a bug or track the status of issues you've already submitted." } },
];

const DEFAULT_META: Meta = {
  title: "Math Maxxer — Competitive Math Quiz Game",
  description: "Real-time competitive math battles. Earn IQ points and climb the global leaderboard.",
};

const RouteMeta = () => {
  const location = useLocation();
  const matched = ROUTE_META.find(r => matchPath({ path: r.pattern, end: true }, location.pathname));
  const meta = matched?.meta ?? DEFAULT_META;
  const url = `${SITE}${location.pathname}`;

  return (
    <Helmet>
      <title>{meta.title}</title>
      <meta name="description" content={meta.description} />
      <link rel="canonical" href={url} />
      <meta property="og:title" content={meta.title} />
      <meta property="og:description" content={meta.description} />
      <meta property="og:url" content={url} />
      <meta property="og:type" content="website" />
      <meta property="og:image" content={DEFAULT_IMAGE} />
      <meta name="twitter:title" content={meta.title} />
      <meta name="twitter:description" content={meta.description} />
      <meta name="twitter:image" content={DEFAULT_IMAGE} />
    </Helmet>
  );
};

export default RouteMeta;

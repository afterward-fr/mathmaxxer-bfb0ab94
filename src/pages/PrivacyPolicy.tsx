import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";

const PrivacyPolicy = () => {
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
        <h1 className="text-4xl font-bold mb-8 text-foreground">Privacy Policy</h1>
        
        <section className="space-y-6 text-muted-foreground">
          <div>
            <p className="mb-4">Last updated: {new Date().toLocaleDateString()}</p>
            <p>
              This Privacy Policy describes how we collect, use, and handle your information when you use our games and services.
            </p>
          </div>

          <div>
            <h2 className="text-2xl font-semibold mb-3 text-foreground">Information We Collect</h2>
            <p className="mb-2">We collect the following types of information:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Account information (username, email address)</li>
              <li>Game statistics and performance data</li>
              <li>Profile information including avatars you upload</li>
              <li>Social features data (friends list, match history)</li>
            </ul>
          </div>

          <div>
            <h2 className="text-2xl font-semibold mb-3 text-foreground">How We Use Your Information</h2>
            <p className="mb-2">We use your information to:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Provide and improve our games and services</li>
              <li>Enable multiplayer and social features</li>
              <li>Track game progress and achievements</li>
              <li>Communicate important updates and notifications</li>
              <li>Ensure fair play and prevent cheating</li>
            </ul>
          </div>

          <div>
            <h2 className="text-2xl font-semibold mb-3 text-foreground">Data Security</h2>
            <p>
              We implement appropriate security measures to protect your personal information. Your data is stored securely and we use industry-standard encryption for sensitive information.
            </p>
          </div>

          <div>
            <h2 className="text-2xl font-semibold mb-3 text-foreground">Third-Party Services</h2>
            <p className="mb-2">Our games may include third-party services such as:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Advertising networks (Google AdMob)</li>
              <li>Analytics services to improve user experience</li>
            </ul>
          </div>

          <div>
            <h2 className="text-2xl font-semibold mb-3 text-foreground">Children's Privacy</h2>
            <p>
              Our services are not directed to children under 13. We do not knowingly collect personal information from children under 13.
            </p>
          </div>

          <div>
            <h2 className="text-2xl font-semibold mb-3 text-foreground">Your Rights</h2>
            <p className="mb-2">You have the right to:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Access your personal data</li>
              <li>Request data correction or deletion</li>
              <li>Opt out of marketing communications</li>
              <li>Export your game data</li>
            </ul>
          </div>

          <div>
            <h2 className="text-2xl font-semibold mb-3 text-foreground">Contact Us</h2>
            <p>
              If you have questions about this Privacy Policy, please visit our Contact page or email us at privacy@mathbattle.com
            </p>
          </div>
        </section>
      </main>
    </div>
  );
};

export default PrivacyPolicy;

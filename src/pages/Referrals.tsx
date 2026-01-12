import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Gift, ArrowLeft, Copy, Users, Star, Check } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import SmallBannerAd from "@/components/SmallBannerAd";

interface ReferralCode {
  id: string;
  code: string;
  uses: number;
  max_uses: number;
  reward_per_referral: number;
}

interface Referral {
  id: string;
  referred_id: string;
  reward_claimed: boolean;
  created_at: string;
  referred_profile?: {
    username: string;
    avatar_url: string | null;
  };
}

const Referrals = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [user, setUser] = useState<any>(null);
  const [referralCode, setReferralCode] = useState<ReferralCode | null>(null);
  const [referrals, setReferrals] = useState<Referral[]>([]);
  const [inputCode, setInputCode] = useState("");
  const [copied, setCopied] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) {
        navigate("/auth");
      } else {
        setUser(session.user);
        loadReferralData(session.user.id);
      }
    });
  }, [navigate]);

  const loadReferralData = async (userId: string) => {
    try {
      // Load or create referral code
      let { data: codeData } = await supabase
        .from("referral_codes")
        .select("*")
        .eq("user_id", userId)
        .single();

      if (!codeData) {
        // Generate unique code
        const code = generateCode(userId);
        const { data: newCode, error } = await supabase
          .from("referral_codes")
          .insert({ user_id: userId, code })
          .select()
          .single();

        if (!error) {
          codeData = newCode;
        }
      }

      setReferralCode(codeData);

      // Load referrals
      const { data: referralsData } = await supabase
        .from("referrals")
        .select("*")
        .eq("referrer_id", userId)
        .order("created_at", { ascending: false });

      if (referralsData) {
        const referredIds = referralsData.map(r => r.referred_id);
        const { data: profiles } = await supabase
          .from("profiles")
          .select("id, username, avatar_url")
          .in("id", referredIds);

        const referralsWithProfiles = referralsData.map(r => ({
          ...r,
          referred_profile: profiles?.find(p => p.id === r.referred_id),
        }));

        setReferrals(referralsWithProfiles);
      }
    } catch (error) {
      console.error("Error loading referral data:", error);
    } finally {
      setLoading(false);
    }
  };

  const generateCode = (userId: string) => {
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
    const prefix = "MATH";
    let code = prefix;
    for (let i = 0; i < 6; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return code;
  };

  const copyCode = () => {
    if (referralCode) {
      navigator.clipboard.writeText(referralCode.code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      toast({
        title: "Copied!",
        description: "Referral code copied to clipboard",
      });
    }
  };

  const applyReferralCode = async () => {
    if (!user || !inputCode.trim()) return;

    try {
      // Find the referral code
      const { data: codeData, error: codeError } = await supabase
        .from("referral_codes")
        .select("*")
        .eq("code", inputCode.trim().toUpperCase())
        .single();

      if (codeError || !codeData) {
        toast({
          title: "Invalid Code",
          description: "This referral code doesn't exist",
          variant: "destructive",
        });
        return;
      }

      if (codeData.user_id === user.id) {
        toast({
          title: "Invalid Code",
          description: "You can't use your own referral code",
          variant: "destructive",
        });
        return;
      }

      // Check if already referred
      const { data: existingReferral } = await supabase
        .from("referrals")
        .select("id")
        .eq("referred_id", user.id)
        .single();

      if (existingReferral) {
        toast({
          title: "Already Referred",
          description: "You've already used a referral code",
          variant: "destructive",
        });
        return;
      }

      // Create referral
      await supabase.from("referrals").insert({
        referrer_id: codeData.user_id,
        referred_id: user.id,
        referral_code_id: codeData.id,
      });

      // Update referral code uses
      await supabase
        .from("referral_codes")
        .update({ uses: codeData.uses + 1 })
        .eq("id", codeData.id);

      // Give rewards to both users
      const reward = codeData.reward_per_referral;

      // Reward the referred user
      const { data: myProfile } = await supabase
        .from("profiles")
        .select("practice_rating")
        .eq("id", user.id)
        .single();

      if (myProfile) {
        await supabase
          .from("profiles")
          .update({ practice_rating: myProfile.practice_rating + reward })
          .eq("id", user.id);
      }

      // Reward the referrer
      const { data: referrerProfile } = await supabase
        .from("profiles")
        .select("practice_rating")
        .eq("id", codeData.user_id)
        .single();

      if (referrerProfile) {
        await supabase
          .from("profiles")
          .update({ practice_rating: referrerProfile.practice_rating + reward })
          .eq("id", codeData.user_id);
      }

      toast({
        title: "🎉 Referral Applied!",
        description: `You earned +${reward} Practice Rating!`,
      });

      setInputCode("");
    } catch (error) {
      console.error("Error applying referral:", error);
      toast({
        title: "Error",
        description: "Failed to apply referral code",
        variant: "destructive",
      });
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: "var(--gradient-primary)" }}>
        <Card className="p-8">
          <p className="text-lg">Loading...</p>
        </Card>
      </div>
    );
  }

  const totalEarned = referrals.length * (referralCode?.reward_per_referral || 50);

  return (
    <div className="min-h-screen p-4 md:p-8" style={{ background: "var(--gradient-primary)" }}>
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Button onClick={() => navigate("/")} variant="ghost" size="icon">
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div>
            <h1 className="text-2xl md:text-3xl font-bold flex items-center gap-2">
              <Gift className="w-8 h-8 text-primary" />
              Refer Friends
            </h1>
            <p className="text-muted-foreground">Earn rewards for each friend you invite</p>
          </div>
        </div>

        <SmallBannerAd />

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4">
          <Card style={{ boxShadow: "var(--shadow-card)" }}>
            <CardContent className="p-6 text-center">
              <Users className="w-8 h-8 mx-auto mb-2 text-primary" />
              <p className="text-3xl font-bold">{referrals.length}</p>
              <p className="text-sm text-muted-foreground">Friends Referred</p>
            </CardContent>
          </Card>
          <Card style={{ boxShadow: "var(--shadow-card)" }}>
            <CardContent className="p-6 text-center">
              <Star className="w-8 h-8 mx-auto mb-2 text-yellow-500" />
              <p className="text-3xl font-bold text-yellow-500">+{totalEarned}</p>
              <p className="text-sm text-muted-foreground">Points Earned</p>
            </CardContent>
          </Card>
          <Card style={{ boxShadow: "var(--shadow-card)" }}>
            <CardContent className="p-6 text-center">
              <Gift className="w-8 h-8 mx-auto mb-2 text-primary" />
              <p className="text-3xl font-bold">+{referralCode?.reward_per_referral || 50}</p>
              <p className="text-sm text-muted-foreground">Per Referral</p>
            </CardContent>
          </Card>
        </div>

        {/* Your Code */}
        <Card style={{ boxShadow: "var(--shadow-game)" }}>
          <CardHeader>
            <CardTitle>Your Referral Code</CardTitle>
            <CardDescription>Share this code with friends to earn rewards</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-2">
              <div className="flex-1 p-4 bg-secondary/50 rounded-lg text-center">
                <p className="text-2xl font-mono font-bold tracking-wider">
                  {referralCode?.code || "Loading..."}
                </p>
              </div>
              <Button onClick={copyCode} variant="outline" size="lg">
                {copied ? <Check className="w-5 h-5" /> : <Copy className="w-5 h-5" />}
              </Button>
            </div>
            <p className="text-sm text-muted-foreground text-center">
              {referralCode?.uses || 0} / {referralCode?.max_uses || 100} uses
            </p>
          </CardContent>
        </Card>

        {/* Apply Code */}
        <Card style={{ boxShadow: "var(--shadow-card)" }}>
          <CardHeader>
            <CardTitle>Have a Referral Code?</CardTitle>
            <CardDescription>Enter a friend's code to get bonus points</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex gap-2">
              <Input
                value={inputCode}
                onChange={(e) => setInputCode(e.target.value.toUpperCase())}
                placeholder="Enter code..."
                className="font-mono text-lg tracking-wider"
              />
              <Button onClick={applyReferralCode} disabled={!inputCode.trim()}>
                Apply
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Referral History */}
        <Card style={{ boxShadow: "var(--shadow-card)" }}>
          <CardHeader>
            <CardTitle>Your Referrals</CardTitle>
            <CardDescription>Friends who used your code</CardDescription>
          </CardHeader>
          <CardContent>
            {referrals.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Users className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>No referrals yet. Share your code to get started!</p>
              </div>
            ) : (
              <div className="space-y-3">
                {referrals.map((referral) => (
                  <div
                    key={referral.id}
                    className="flex items-center justify-between p-3 rounded-lg bg-secondary/50"
                  >
                    <div className="flex items-center gap-3">
                      <Avatar className="w-10 h-10">
                        <AvatarImage src={referral.referred_profile?.avatar_url || undefined} />
                        <AvatarFallback>
                          {referral.referred_profile?.username?.slice(0, 2).toUpperCase() || "?"}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-medium">{referral.referred_profile?.username || "Unknown"}</p>
                        <p className="text-xs text-muted-foreground">
                          {new Date(referral.created_at).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    <p className="font-bold text-green-500">
                      +{referralCode?.reward_per_referral || 50} pts
                    </p>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Referrals;

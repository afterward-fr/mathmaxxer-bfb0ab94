import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Users, ArrowLeft, Shield, Crown, Plus, Search, Star, LogOut } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface Clan {
  id: string;
  name: string;
  description: string | null;
  icon: string;
  banner_color: string;
  owner_id: string;
  total_rating: number;
  member_count: number;
  max_members: number;
  is_public: boolean;
}

interface ClanMember {
  id: string;
  user_id: string;
  role: string;
  contribution_points: number;
  profile?: {
    username: string;
    avatar_url: string | null;
    iq_rating: number;
    practice_rating: number;
  };
}

const Clans = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [user, setUser] = useState<any>(null);
  const [clans, setClans] = useState<Clan[]>([]);
  const [myClan, setMyClan] = useState<Clan | null>(null);
  const [clanMembers, setClanMembers] = useState<ClanMember[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [newClanName, setNewClanName] = useState("");
  const [newClanDescription, setNewClanDescription] = useState("");
  const [newClanIcon, setNewClanIcon] = useState("⚔️");
  const [loading, setLoading] = useState(true);

  const icons = ["⚔️", "🏰", "🐉", "🦁", "🔥", "⚡", "💎", "🌟", "🎯", "🏆"];

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) {
        navigate("/auth");
      } else {
        setUser(session.user);
        loadData(session.user.id);
      }
    });
  }, [navigate]);

  const loadData = async (userId: string) => {
    try {
      // Check if user is in a clan
      const { data: membership } = await supabase
        .from("clan_members")
        .select("clan_id")
        .eq("user_id", userId)
        .single();

      if (membership) {
        // Load user's clan
        const { data: clanData } = await supabase
          .from("clans")
          .select("*")
          .eq("id", membership.clan_id)
          .single();

        if (clanData) {
          setMyClan(clanData);
          loadClanMembers(clanData.id);
        }
      }

      // Load all public clans
      const { data: allClans } = await supabase
        .from("clans")
        .select("*")
        .eq("is_public", true)
        .order("total_rating", { ascending: false });

      setClans(allClans || []);
    } catch (error) {
      console.error("Error loading clans:", error);
    } finally {
      setLoading(false);
    }
  };

  const loadClanMembers = async (clanId: string) => {
    const { data: members } = await supabase
      .from("clan_members")
      .select("*")
      .eq("clan_id", clanId)
      .order("contribution_points", { ascending: false });

    if (members) {
      const userIds = members.map(m => m.user_id);
      const { data: profiles } = await supabase
        .from("profiles")
        .select("id, username, avatar_url, iq_rating, practice_rating")
        .in("id", userIds);

      const membersWithProfiles = members.map(m => ({
        ...m,
        profile: profiles?.find(p => p.id === m.user_id),
      }));

      setClanMembers(membersWithProfiles);
    }
  };

  const createClan = async () => {
    if (!user || !newClanName.trim()) return;

    try {
      const { data: newClan, error } = await supabase
        .from("clans")
        .insert({
          name: newClanName.trim(),
          description: newClanDescription.trim() || null,
          icon: newClanIcon,
          owner_id: user.id,
        })
        .select()
        .single();

      if (error) throw error;

      // Add creator as owner member
      await supabase.from("clan_members").insert({
        clan_id: newClan.id,
        user_id: user.id,
        role: "owner",
      });

      setMyClan(newClan);
      loadClanMembers(newClan.id);
      setShowCreateDialog(false);
      setNewClanName("");
      setNewClanDescription("");

      toast({
        title: "🏰 Clan Created!",
        description: `${newClan.name} is ready for battle!`,
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to create clan",
        variant: "destructive",
      });
    }
  };

  const joinClan = async (clan: Clan) => {
    if (!user) return;

    try {
      await supabase.from("clan_members").insert({
        clan_id: clan.id,
        user_id: user.id,
      });

      // Update member count
      await supabase
        .from("clans")
        .update({ member_count: clan.member_count + 1 })
        .eq("id", clan.id);

      setMyClan({ ...clan, member_count: clan.member_count + 1 });
      loadClanMembers(clan.id);

      toast({
        title: "⚔️ Joined Clan!",
        description: `Welcome to ${clan.name}!`,
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to join clan",
        variant: "destructive",
      });
    }
  };

  const leaveClan = async () => {
    if (!user || !myClan) return;

    try {
      await supabase
        .from("clan_members")
        .delete()
        .eq("user_id", user.id)
        .eq("clan_id", myClan.id);

      // Update member count
      await supabase
        .from("clans")
        .update({ member_count: myClan.member_count - 1 })
        .eq("id", myClan.id);

      setMyClan(null);
      setClanMembers([]);

      toast({
        title: "Left Clan",
        description: "You have left the clan",
      });
    } catch (error) {
      console.error("Error leaving clan:", error);
    }
  };

  const filteredClans = clans.filter(c =>
    c.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: "var(--gradient-primary)" }}>
        <Card className="p-8">
          <p className="text-lg">Loading clans...</p>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-4 md:p-8" style={{ background: "var(--gradient-primary)" }}>
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button onClick={() => navigate("/")} variant="ghost" size="icon">
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div>
              <h1 className="text-2xl md:text-3xl font-bold flex items-center gap-2">
                <Shield className="w-8 h-8 text-primary" />
                Clans
              </h1>
              <p className="text-muted-foreground">Join forces with other players</p>
            </div>
          </div>
          {!myClan && (
            <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="w-4 h-4 mr-2" />
                  Create Clan
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Create a New Clan</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 mt-4">
                  <div>
                    <label className="text-sm font-medium">Clan Icon</label>
                    <div className="flex flex-wrap gap-2 mt-2">
                      {icons.map((icon) => (
                        <button
                          key={icon}
                          onClick={() => setNewClanIcon(icon)}
                          className={`w-10 h-10 rounded-lg text-xl flex items-center justify-center transition-all ${
                            newClanIcon === icon
                              ? "bg-primary text-primary-foreground ring-2 ring-primary"
                              : "bg-secondary hover:bg-secondary/80"
                          }`}
                        >
                          {icon}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <label className="text-sm font-medium">Clan Name</label>
                    <Input
                      value={newClanName}
                      onChange={(e) => setNewClanName(e.target.value)}
                      placeholder="Enter clan name..."
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium">Description (optional)</label>
                    <Textarea
                      value={newClanDescription}
                      onChange={(e) => setNewClanDescription(e.target.value)}
                      placeholder="Describe your clan..."
                      className="mt-1"
                    />
                  </div>
                  <Button onClick={createClan} className="w-full" disabled={!newClanName.trim()}>
                    Create Clan
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          )}
        </div>

        {myClan ? (
          // My Clan View
          <div className="space-y-6">
            <Card style={{ boxShadow: "var(--shadow-game)" }}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-4">
                    <div
                      className="w-16 h-16 rounded-xl flex items-center justify-center text-3xl"
                      style={{ backgroundColor: myClan.banner_color }}
                    >
                      {myClan.icon}
                    </div>
                    <div>
                      <CardTitle className="text-2xl">{myClan.name}</CardTitle>
                      <CardDescription>{myClan.description || "No description"}</CardDescription>
                    </div>
                  </div>
                  <Button variant="outline" size="sm" onClick={leaveClan}>
                    <LogOut className="w-4 h-4 mr-2" />
                    Leave
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-3 gap-4 mb-6">
                  <div className="text-center p-4 rounded-lg bg-secondary/50">
                    <Users className="w-6 h-6 mx-auto mb-2 text-primary" />
                    <p className="text-2xl font-bold">{myClan.member_count}</p>
                    <p className="text-sm text-muted-foreground">Members</p>
                  </div>
                  <div className="text-center p-4 rounded-lg bg-secondary/50">
                    <Star className="w-6 h-6 mx-auto mb-2 text-yellow-500" />
                    <p className="text-2xl font-bold text-yellow-500">{myClan.total_rating}</p>
                    <p className="text-sm text-muted-foreground">Total Rating</p>
                  </div>
                  <div className="text-center p-4 rounded-lg bg-secondary/50">
                    <Crown className="w-6 h-6 mx-auto mb-2 text-primary" />
                    <p className="text-2xl font-bold">#{clans.findIndex(c => c.id === myClan.id) + 1}</p>
                    <p className="text-sm text-muted-foreground">Rank</p>
                  </div>
                </div>

                <h3 className="text-lg font-semibold mb-4">Members</h3>
                <div className="space-y-2">
                  {clanMembers.map((member) => (
                    <div
                      key={member.id}
                      className="flex items-center justify-between p-3 rounded-lg bg-secondary/50"
                    >
                      <div className="flex items-center gap-3">
                        <Avatar className="w-10 h-10">
                          <AvatarImage src={member.profile?.avatar_url || undefined} />
                          <AvatarFallback>
                            {member.profile?.username?.slice(0, 2).toUpperCase() || "?"}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium flex items-center gap-2">
                            {member.profile?.username}
                            {member.role === "owner" && <Crown className="w-4 h-4 text-yellow-500" />}
                            {member.role === "admin" && <Shield className="w-4 h-4 text-primary" />}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            IQ: {member.profile?.iq_rating} | Practice: {member.profile?.practice_rating}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-primary">{member.contribution_points}</p>
                        <p className="text-xs text-muted-foreground">contribution</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        ) : (
          // Browse Clans View
          <div className="space-y-6">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
              <Input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search clans..."
                className="pl-10"
              />
            </div>

            <Tabs defaultValue="leaderboard">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="leaderboard">Top Clans</TabsTrigger>
                <TabsTrigger value="browse">Browse All</TabsTrigger>
              </TabsList>

              <TabsContent value="leaderboard" className="space-y-4">
                {filteredClans.slice(0, 10).map((clan, index) => (
                  <Card
                    key={clan.id}
                    className="cursor-pointer hover:border-primary/50 transition-colors"
                    onClick={() => joinClan(clan)}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <span className="text-lg font-bold w-8 text-center">
                            {index === 0 ? "🥇" : index === 1 ? "🥈" : index === 2 ? "🥉" : `#${index + 1}`}
                          </span>
                          <div
                            className="w-12 h-12 rounded-lg flex items-center justify-center text-2xl"
                            style={{ backgroundColor: clan.banner_color }}
                          >
                            {clan.icon}
                          </div>
                          <div>
                            <p className="font-semibold">{clan.name}</p>
                            <p className="text-sm text-muted-foreground">
                              {clan.member_count} members
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-bold text-primary">{clan.total_rating}</p>
                          <p className="text-xs text-muted-foreground">total rating</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </TabsContent>

              <TabsContent value="browse" className="grid md:grid-cols-2 gap-4">
                {filteredClans.map((clan) => (
                  <Card
                    key={clan.id}
                    className="cursor-pointer hover:border-primary/50 transition-colors"
                    onClick={() => joinClan(clan)}
                  >
                    <CardHeader className="pb-2">
                      <div className="flex items-center gap-3">
                        <div
                          className="w-10 h-10 rounded-lg flex items-center justify-center text-xl"
                          style={{ backgroundColor: clan.banner_color }}
                        >
                          {clan.icon}
                        </div>
                        <div>
                          <CardTitle className="text-lg">{clan.name}</CardTitle>
                          <CardDescription className="text-xs">
                            {clan.member_count}/{clan.max_members} members
                          </CardDescription>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-muted-foreground mb-2 line-clamp-2">
                        {clan.description || "No description"}
                      </p>
                      <Badge variant="secondary">{clan.total_rating} pts</Badge>
                    </CardContent>
                  </Card>
                ))}
              </TabsContent>
            </Tabs>
          </div>
        )}
      </div>
    </div>
  );
};

export default Clans;

import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ArrowLeft, Users, Search, UserPlus } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import FriendsList from "@/components/FriendsList";
import FriendRequests from "@/components/FriendRequests";
import SentFriendRequests from "@/components/SentFriendRequests";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { UserCheck, UserX, Inbox } from "lucide-react";
import { z } from "zod";

const searchQuerySchema = z.string().trim().min(1, "Search query cannot be empty").max(50, "Search query must be less than 50 characters");

const Friends = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [user, setUser] = useState<any>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [searching, setSearching] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  const [pendingRequests, setPendingRequests] = useState<any[]>([]);
  const [loadingRequests, setLoadingRequests] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) {
        navigate("/auth");
      } else {
        setUser(session.user);
      }
    });
  }, [navigate]);

  useEffect(() => {
    if (user?.id) {
      loadPendingRequests();
    }
  }, [user?.id, refreshKey]);

  const loadPendingRequests = async () => {
    try {
      const { data, error } = await supabase
        .from("friendships")
        .select(`
          *,
          requester:user_id (id, username, iq_rating, practice_rating, avatar_url)
        `)
        .eq("friend_id", user.id)
        .eq("status", "pending");

      if (error) throw error;
      setPendingRequests(data || []);
    } catch (error) {
      console.error("Error loading friend requests:", error);
    } finally {
      setLoadingRequests(false);
    }
  };

  const acceptRequest = async (friendshipId: string) => {
    try {
      const { error } = await supabase
        .from("friendships")
        .update({ status: "accepted" })
        .eq("id", friendshipId);

      if (error) throw error;

      toast({
        title: "Friend request accepted!",
        description: "You are now friends",
      });

      loadPendingRequests();
      handleRequestUpdate();
    } catch (error) {
      console.error("Error accepting request:", error);
      toast({
        title: "Error",
        description: "Failed to accept friend request",
        variant: "destructive",
      });
    }
  };

  const declineRequest = async (friendshipId: string) => {
    try {
      const { error } = await supabase
        .from("friendships")
        .delete()
        .eq("id", friendshipId);

      if (error) throw error;

      toast({
        title: "Friend request declined",
        description: "Request has been removed",
      });

      loadPendingRequests();
    } catch (error) {
      console.error("Error declining request:", error);
      toast({
        title: "Error",
        description: "Failed to decline friend request",
        variant: "destructive",
      });
    }
  };

  const searchUsers = async () => {
    // Validate search query
    const validation = searchQuerySchema.safeParse(searchQuery.trim());
    
    if (!validation.success) {
      toast({
        title: "Invalid Search",
        description: validation.error.errors[0].message,
        variant: "destructive",
      });
      return;
    }

    setSearching(true);
    try {
      // Get all profiles matching search
      const { data: profiles, error: profilesError } = await supabase
        .from("profiles")
        .select("*")
        .ilike("username", `%${searchQuery}%`)
        .neq("id", user.id)
        .limit(10);

      if (profilesError) throw profilesError;

      // Get existing friendships to filter out
      const { data: friendships, error: friendshipsError } = await supabase
        .from("friendships")
        .select("user_id, friend_id")
        .or(`user_id.eq.${user.id},friend_id.eq.${user.id}`);

      if (friendshipsError) throw friendshipsError;

      // Filter out users with existing friendship relationships
      const friendshipUserIds = new Set(
        friendships?.flatMap(f => [f.user_id, f.friend_id]) || []
      );
      
      const filteredResults = profiles?.filter(
        profile => !friendshipUserIds.has(profile.id)
      ) || [];

      setSearchResults(filteredResults);
    } catch (error) {
      console.error("Error searching users:", error);
      toast({
        title: "Error",
        description: "Failed to search users",
        variant: "destructive",
      });
    } finally {
      setSearching(false);
    }
  };

  const sendFriendRequest = async (friendId: string) => {
    try {
      const { error } = await supabase
        .from("friendships")
        .insert({
          user_id: user.id,
          friend_id: friendId,
          status: "pending",
        });

      if (error) throw error;

      toast({
        title: "Friend request sent!",
        description: "Wait for them to accept your request",
      });

      // Remove from search results
      setSearchResults(prev => prev.filter(u => u.id !== friendId));
    } catch (error: any) {
      console.error("Error sending friend request:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to send friend request",
        variant: "destructive",
      });
    }
  };

  const handleRequestUpdate = () => {
    setRefreshKey(prev => prev + 1);
  };

  if (!user) {
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
        <Button onClick={() => navigate("/")} variant="outline">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Home
        </Button>

        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
            <Users className="w-6 h-6 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl md:text-3xl font-bold">Friends</h1>
            <p className="text-sm text-muted-foreground">Connect and challenge your friends</p>
          </div>
        </div>

        {/* Search Users */}
        <Card style={{ boxShadow: "var(--shadow-game)" }}>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Search className="w-5 h-5" />
              Find Friends
            </CardTitle>
            <CardDescription>Search for users by username</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-4">
              <div className="flex gap-2">
                <Input
                  placeholder="Search username..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && searchUsers()}
                />
                <Button onClick={searchUsers} disabled={searching}>
                  <Search className="w-4 h-4 mr-2" />
                  Search
                </Button>
              </div>

              {searchResults.length > 0 && (
                <div className="space-y-2">
                  {searchResults.map((profile) => (
                    <div
                      key={profile.id}
                      className="flex items-center justify-between p-4 rounded-lg bg-secondary/50"
                    >
                      <div className="flex items-center gap-3">
                        <Avatar className="w-10 h-10 border-2 border-primary/20">
                          <AvatarImage src={profile.avatar_url || undefined} alt={profile.username} />
                          <AvatarFallback className="bg-primary/10">
                            {profile.username.slice(0, 2).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium">{profile.username}</p>
                          <p className="text-sm text-muted-foreground">
                            IQ Rating: {profile.iq_rating}
                          </p>
                        </div>
                      </div>
                      <Button onClick={() => sendFriendRequest(profile.id)} size="sm">
                        <UserPlus className="w-4 h-4 mr-2" />
                        Add Friend
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Pending Friend Requests */}
            {!loadingRequests && pendingRequests.length > 0 && (
              <div className="border-t pt-6">
                <div className="flex items-center gap-2 mb-4">
                  <Inbox className="w-5 h-5 text-primary" />
                  <h3 className="font-semibold">Pending Requests ({pendingRequests.length})</h3>
                </div>
                <div className="space-y-2">
                  {pendingRequests.map((request) => (
                    <div
                      key={request.id}
                      className="flex items-center justify-between p-4 rounded-lg bg-secondary/50"
                    >
                      <div className="flex items-center gap-3">
                        <Avatar className="w-10 h-10 border-2 border-primary/20">
                          <AvatarImage src={request.requester.avatar_url || undefined} alt={request.requester.username} />
                          <AvatarFallback className="bg-primary/10">
                            {request.requester.username.slice(0, 2).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium">{request.requester.username}</p>
                          <p className="text-sm text-muted-foreground">
                            IQ Rating: {request.requester.iq_rating}
                          </p>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button onClick={() => acceptRequest(request.id)} size="sm">
                          <UserCheck className="w-4 h-4 mr-2" />
                          Accept
                        </Button>
                        <Button
                          onClick={() => declineRequest(request.id)}
                          size="sm"
                          variant="outline"
                        >
                          <UserX className="w-4 h-4 mr-2" />
                          Decline
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Sent Requests */}
        <SentFriendRequests userId={user.id} />

        {/* Friends List */}
        <FriendsList userId={user.id} key={refreshKey} />
      </div>
    </div>
  );
};

export default Friends;
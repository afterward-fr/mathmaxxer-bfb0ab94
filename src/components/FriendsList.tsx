import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Users, Swords, Trash2, User } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface FriendsListProps {
  userId: string;
}

const FriendsList = ({ userId }: FriendsListProps) => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [friends, setFriends] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [friendToDelete, setFriendToDelete] = useState<string | null>(null);

  useEffect(() => {
    loadFriends();
  }, [userId]);

  const loadFriends = async () => {
    try {
      const { data, error } = await supabase
        .from("friendships")
        .select(`
          *,
          friend:friend_id (id, username, iq_rating, practice_rating),
          requester:user_id (id, username, iq_rating, practice_rating)
        `)
        .eq("status", "accepted")
        .or(`user_id.eq.${userId},friend_id.eq.${userId}`);

      if (error) throw error;

      // Map to get the friend's profile (not the current user)
      const friendsData = data.map((friendship) => {
        const isFriend = friendship.friend_id === userId;
        return {
          friendshipId: friendship.id,
          profile: isFriend ? friendship.requester : friendship.friend,
        };
      });

      setFriends(friendsData);
    } catch (error) {
      console.error("Error loading friends:", error);
    } finally {
      setLoading(false);
    }
  };

  const removeFriend = async (friendshipId: string) => {
    try {
      const { error } = await supabase
        .from("friendships")
        .delete()
        .eq("id", friendshipId);

      if (error) throw error;

      toast({
        title: "Friend removed",
        description: "Successfully removed friend",
      });

      loadFriends();
    } catch (error) {
      console.error("Error removing friend:", error);
      toast({
        title: "Error",
        description: "Failed to remove friend",
        variant: "destructive",
      });
    } finally {
      setFriendToDelete(null);
    }
  };

  const challengeFriend = (friendId: string) => {
    navigate(`/multiplayer?friendId=${friendId}`);
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="text-center py-8">
          <p className="text-muted-foreground">Loading friends...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card style={{ boxShadow: "var(--shadow-game)" }}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="w-5 h-5" />
            My Friends ({friends.length})
          </CardTitle>
          <CardDescription>Your accepted friend connections</CardDescription>
        </CardHeader>
        <CardContent>
          {friends.length === 0 ? (
            <div className="text-center py-8">
              <Users className="w-12 h-12 mx-auto mb-4 text-muted-foreground opacity-50" />
              <p className="text-muted-foreground">No friends yet</p>
              <p className="text-sm text-muted-foreground">Search for users to add friends</p>
            </div>
          ) : (
            <div className="space-y-2">
              {friends.map(({ friendshipId, profile }) => (
                <div
                  key={friendshipId}
                  className="flex items-center justify-between p-4 rounded-lg bg-secondary/50"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                      <User className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <p className="font-medium">{profile.username}</p>
                      <p className="text-sm text-muted-foreground">
                        IQ: {profile.iq_rating} • Practice: {profile.practice_rating}
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      onClick={() => challengeFriend(profile.id)}
                      size="sm"
                      variant="default"
                    >
                      <Swords className="w-4 h-4 mr-2" />
                      Challenge
                    </Button>
                    <Button
                      onClick={() => setFriendToDelete(friendshipId)}
                      size="sm"
                      variant="outline"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <AlertDialog open={!!friendToDelete} onOpenChange={() => setFriendToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove Friend?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to remove this friend? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={() => friendToDelete && removeFriend(friendToDelete)}>
              Remove
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

export default FriendsList;
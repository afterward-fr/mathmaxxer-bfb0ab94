import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { UserCheck, UserX, Inbox } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";

interface FriendRequestsProps {
  userId: string;
  onUpdate: () => void;
}

const FriendRequests = ({ userId, onUpdate }: FriendRequestsProps) => {
  const { toast } = useToast();
  const [requests, setRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadRequests();
  }, [userId]);

  const loadRequests = async () => {
    try {
      const { data, error } = await supabase
        .from("friendships")
        .select(`
          *,
          requester:user_id (id, username, iq_rating, practice_rating)
        `)
        .eq("friend_id", userId)
        .eq("status", "pending");

      if (error) throw error;
      setRequests(data || []);
    } catch (error) {
      console.error("Error loading friend requests:", error);
    } finally {
      setLoading(false);
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

      loadRequests();
      onUpdate();
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

      loadRequests();
    } catch (error) {
      console.error("Error declining request:", error);
      toast({
        title: "Error",
        description: "Failed to decline friend request",
        variant: "destructive",
      });
    }
  };

  if (loading || requests.length === 0) {
    return null;
  }

  return (
    <Card style={{ boxShadow: "var(--shadow-game)" }}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Inbox className="w-5 h-5" />
          Friend Requests ({requests.length})
        </CardTitle>
        <CardDescription>Pending friend requests</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          {requests.map((request) => (
            <div
              key={request.id}
              className="flex items-center justify-between p-4 rounded-lg bg-secondary/50"
            >
              <div>
                <p className="font-medium">{request.requester.username}</p>
                <p className="text-sm text-muted-foreground">
                  IQ Rating: {request.requester.iq_rating}
                </p>
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
      </CardContent>
    </Card>
  );
};

export default FriendRequests;
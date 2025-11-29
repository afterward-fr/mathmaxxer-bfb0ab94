import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { UserX, Send } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";

interface SentFriendRequestsProps {
  userId: string;
}

const SentFriendRequests = ({ userId }: SentFriendRequestsProps) => {
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
          recipient:friend_id (id, username, iq_rating, practice_rating)
        `)
        .eq("user_id", userId)
        .eq("status", "pending");

      if (error) throw error;
      setRequests(data || []);
    } catch (error) {
      console.error("Error loading sent requests:", error);
    } finally {
      setLoading(false);
    }
  };

  const cancelRequest = async (friendshipId: string) => {
    try {
      const { error } = await supabase
        .from("friendships")
        .delete()
        .eq("id", friendshipId);

      if (error) throw error;

      toast({
        title: "Request cancelled",
        description: "Friend request has been cancelled",
      });

      loadRequests();
    } catch (error) {
      console.error("Error cancelling request:", error);
      toast({
        title: "Error",
        description: "Failed to cancel friend request",
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
          <Send className="w-5 h-5" />
          Sent Requests ({requests.length})
        </CardTitle>
        <CardDescription>Pending requests you've sent</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          {requests.map((request) => (
            <div
              key={request.id}
              className="flex items-center justify-between p-4 rounded-lg bg-secondary/50"
            >
              <div>
                <p className="font-medium">{request.recipient.username}</p>
                <p className="text-sm text-muted-foreground">
                  IQ Rating: {request.recipient.iq_rating}
                </p>
              </div>
              <Button
                onClick={() => cancelRequest(request.id)}
                size="sm"
                variant="outline"
              >
                <UserX className="w-4 h-4 mr-2" />
                Cancel
              </Button>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

export default SentFriendRequests;

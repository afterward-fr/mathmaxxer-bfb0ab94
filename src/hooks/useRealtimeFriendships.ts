import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { RealtimeChannel } from "@supabase/supabase-js";

export const useRealtimeFriendships = (userId: string | undefined) => {
  const { toast } = useToast();
  const [channel, setChannel] = useState<RealtimeChannel | null>(null);

  useEffect(() => {
    if (!userId) return;

    // Subscribe to friendships changes
    const friendshipsChannel = supabase
      .channel('friendships-changes')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'friendships',
          filter: `friend_id=eq.${userId}`,
        },
        async (payload) => {
          // New friend request received
          const { data: requesterProfile } = await supabase
            .from('profiles')
            .select('username')
            .eq('id', payload.new.user_id)
            .single();

          if (requesterProfile) {
            toast({
              title: "New Friend Request! 🎉",
              description: `${requesterProfile.username} wants to be your friend`,
            });
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'friendships',
          filter: `user_id=eq.${userId}`,
        },
        async (payload) => {
          // Friend request accepted
          if (payload.new.status === 'accepted' && payload.old.status === 'pending') {
            const { data: friendProfile } = await supabase
              .from('profiles')
              .select('username')
              .eq('id', payload.new.friend_id)
              .single();

            if (friendProfile) {
              toast({
                title: "Friend Request Accepted! 🎊",
                description: `${friendProfile.username} accepted your friend request`,
              });
            }
          }
        }
      )
      .subscribe();

    setChannel(friendshipsChannel);

    return () => {
      if (friendshipsChannel) {
        supabase.removeChannel(friendshipsChannel);
      }
    };
  }, [userId, toast]);

  return channel;
};

import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useNavigate } from "react-router-dom";

interface JoinRoomDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function JoinRoomDialog({ open, onOpenChange }: JoinRoomDialogProps) {
  const [inviteCode, setInviteCode] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleJoin = async () => {
    if (!inviteCode.trim()) {
      toast.error("Please enter an invite code");
      return;
    }

    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      // Find room by invite code
      const { data: room, error: roomError } = await supabase
        .from("rooms")
        .select("id")
        .eq("invite_code", inviteCode.trim())
        .single();

      if (roomError) throw new Error("Invalid invite code");

      // Join room
      const { error: joinError } = await supabase
        .from("room_members")
        .insert({
          room_id: room.id,
          user_id: user.id,
        });

      if (joinError) {
        if (joinError.code === "23505") {
          toast.info("You're already in this room!");
        } else {
          throw joinError;
        }
      } else {
        toast.success("Joined room!");
      }

      onOpenChange(false);
      setInviteCode("");
      navigate(`/room/${room.id}`);
    } catch (error: any) {
      toast.error(error.message || "Failed to join room");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Join a Room</DialogTitle>
          <DialogDescription>
            Enter an invite code to join a trading bias tracker
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 pt-4">
          <div className="space-y-2">
            <Label htmlFor="inviteCode">Invite Code</Label>
            <Input
              id="inviteCode"
              placeholder="abc123de"
              value={inviteCode}
              onChange={(e) => setInviteCode(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleJoin()}
            />
          </div>
          <Button onClick={handleJoin} className="w-full" disabled={loading}>
            {loading ? "Joining..." : "Join Room"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

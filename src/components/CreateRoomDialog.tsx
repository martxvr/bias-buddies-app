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

interface CreateRoomDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CreateRoomDialog({ open, onOpenChange }: CreateRoomDialogProps) {
  const [roomName, setRoomName] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleCreate = async () => {
    if (!roomName.trim()) {
      toast.error("Please enter a room name");
      return;
    }

    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const { data: room, error } = await supabase
        .from("rooms")
        .insert({
          name: roomName,
          owner_id: user.id,
        })
        .select()
        .single();

      if (error) throw error;

      toast.success("Room created!");
      setRoomName("");
      onOpenChange(false);
      setTimeout(() => navigate(`/room/${room.id}`), 100);
    } catch (error: any) {
      toast.error(error.message || "Failed to create room");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create a Room</DialogTitle>
          <DialogDescription>
            Create a shared trading bias tracker that others can join
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 pt-4">
          <div className="space-y-2">
            <Label htmlFor="roomName">Room Name</Label>
            <Input
              id="roomName"
              placeholder="My Trading Room"
              value={roomName}
              onChange={(e) => setRoomName(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleCreate()}
            />
          </div>
          <Button onClick={handleCreate} className="w-full" disabled={loading}>
            {loading ? "Creating..." : "Create Room"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

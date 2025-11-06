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
      toast.error("Voer een room naam in");
      return;
    }

    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      // Check if user already has 5 rooms
      const { data: existingRooms, error: countError } = await supabase
        .from("rooms")
        .select("id")
        .eq("owner_id", user.id);

      if (countError) throw countError;

      if (existingRooms && existingRooms.length >= 5) {
        toast.error("Je kan maximaal 5 rooms maken");
        setLoading(false);
        return;
      }

      // Check if room name already exists for this user
      const { data: duplicateRoom, error: duplicateError } = await supabase
        .from("rooms")
        .select("id")
        .eq("owner_id", user.id)
        .eq("name", roomName.trim())
        .maybeSingle();

      if (duplicateError) throw duplicateError;

      if (duplicateRoom) {
        toast.error("Je hebt al een room met deze naam");
        setLoading(false);
        return;
      }

      const { data: room, error } = await supabase
        .from("rooms")
        .insert({
          name: roomName.trim(),
          owner_id: user.id,
        })
        .select()
        .single();

      if (error) throw error;

      toast.success("Room succesvol aangemaakt!");
      setRoomName("");
      onOpenChange(false);
      setTimeout(() => navigate(`/room/${room.id}`), 100);
    } catch (error: any) {
      toast.error(error.message || "Fout bij aanmaken room");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Nieuwe Room Maken</DialogTitle>
          <DialogDescription>
            Maak een gedeelde trading bias tracker waar anderen kunnen joinen
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 pt-4">
          <div className="space-y-2">
            <Label htmlFor="roomName">Room Naam</Label>
            <Input
              id="roomName"
              placeholder="Mijn Trading Room"
              value={roomName}
              onChange={(e) => setRoomName(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleCreate()}
            />
            <p className="text-xs text-muted-foreground">
              Je kan maximaal 5 rooms maken
            </p>
          </div>
          <Button onClick={handleCreate} className="w-full" disabled={loading}>
            {loading ? "Bezig..." : "Maak Room"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

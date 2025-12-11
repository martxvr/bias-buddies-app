import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Trash2, LogIn, Copy, Loader2 } from "lucide-react";
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

interface Room {
  id: string;
  name: string;
  invite_code: string;
  created_at: string;
}

interface MyRoomsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function MyRoomsDialog({ open, onOpenChange }: MyRoomsDialogProps) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [rooms, setRooms] = useState<Room[]>([]);
  const [loading, setLoading] = useState(false);
  const [deleteRoom, setDeleteRoom] = useState<Room | null>(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    if (open && user) {
      fetchRooms();
    }
  }, [open, user]);

  const fetchRooms = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("rooms")
        .select("*")
        .eq("owner_id", user.id)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setRooms(data || []);
    } catch (error) {
      console.error("Error fetching rooms:", error);
      toast.error("Kon rooms niet laden");
    } finally {
      setLoading(false);
    }
  };

  const handleJoinRoom = (room: Room) => {
    onOpenChange(false);
    navigate(`/room/${room.id}`);
  };

  const handleCopyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    toast.success("Invite code gekopieerd!");
  };

  const handleDeleteRoom = async () => {
    if (!deleteRoom) return;
    setDeleting(true);
    try {
      // Delete related data first (room_members, room_bias, room_bias_votes, room_messages, etc.)
      await supabase.from("room_members").delete().eq("room_id", deleteRoom.id);
      await supabase.from("room_bias").delete().eq("room_id", deleteRoom.id);
      await supabase.from("room_bias_votes").delete().eq("room_id", deleteRoom.id);
      await supabase.from("room_messages").delete().eq("room_id", deleteRoom.id);
      await supabase.from("room_sessions").delete().eq("room_id", deleteRoom.id);
      await supabase.from("favorite_rooms").delete().eq("room_id", deleteRoom.id);
      await supabase.from("notifications").delete().eq("room_id", deleteRoom.id);
      await supabase.from("scheduled_sessions").delete().eq("room_id", deleteRoom.id);
      
      // Delete the room itself
      const { error } = await supabase.from("rooms").delete().eq("id", deleteRoom.id);
      if (error) throw error;

      toast.success("Room verwijderd!");
      setRooms(rooms.filter((r) => r.id !== deleteRoom.id));
      setDeleteRoom(null);
    } catch (error) {
      console.error("Error deleting room:", error);
      toast.error("Kon room niet verwijderen");
    } finally {
      setDeleting(false);
    }
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Mijn Rooms</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 max-h-[60vh] overflow-y-auto">
            {loading ? (
              <div className="flex justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : rooms.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">
                Je hebt nog geen rooms aangemaakt
              </p>
            ) : (
              rooms.map((room) => (
                <div
                  key={room.id}
                  className="flex items-center justify-between p-3 rounded-lg border bg-card"
                >
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">{room.name}</p>
                    <p className="text-xs text-muted-foreground">
                      Code: {room.invite_code}
                    </p>
                  </div>
                  <div className="flex items-center gap-1 ml-2">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleCopyCode(room.invite_code)}
                      title="Kopieer code"
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleJoinRoom(room)}
                      title="Join room"
                    >
                      <LogIn className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setDeleteRoom(room)}
                      className="text-destructive hover:text-destructive"
                      title="Verwijder room"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))
            )}
          </div>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deleteRoom} onOpenChange={(open) => !open && setDeleteRoom(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Room verwijderen?</AlertDialogTitle>
            <AlertDialogDescription>
              Weet je zeker dat je "{deleteRoom?.name}" wilt verwijderen? Dit verwijdert ook alle berichten, stemmen en geschiedenis. Dit kan niet ongedaan worden gemaakt.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Annuleren</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteRoom}
              disabled={deleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              Verwijderen
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

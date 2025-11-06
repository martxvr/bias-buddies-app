import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Settings, Trash2, Users, Copy } from "lucide-react";
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
  owner_id: string;
  invite_code: string;
  created_at: string;
}

interface RoomMember {
  id: string;
  user_id: string;
  joined_at: string;
  profiles: {
    username: string;
  };
}

const RoomManagement = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [rooms, setRooms] = useState<Room[]>([]);
  const [selectedRoom, setSelectedRoom] = useState<Room | null>(null);
  const [members, setMembers] = useState<RoomMember[]>([]);
  const [deleteRoomId, setDeleteRoomId] = useState<string | null>(null);

  useEffect(() => {
    if (!user) {
      navigate("/auth");
      return;
    }

    loadRooms();
  }, [user, navigate]);

  const loadRooms = async () => {
    if (!user) return;

    const { data: ownedRooms } = await supabase
      .from("rooms")
      .select("*")
      .eq("owner_id", user.id);

    const { data: memberRooms } = await supabase
      .from("room_members")
      .select("room_id, rooms(*)")
      .eq("user_id", user.id);

    const allRooms = [
      ...(ownedRooms || []),
      ...(memberRooms?.map((m: any) => m.rooms).filter(Boolean) || []),
    ];

    const uniqueRooms = Array.from(
      new Map(allRooms.map((room) => [room.id, room])).values()
    );

    setRooms(uniqueRooms);
  };

  const loadMembers = async (roomId: string) => {
    const { data } = await supabase
      .from("room_members")
      .select("*, profiles(username)")
      .eq("room_id", roomId);

    setMembers(data || []);
  };

  const handleRoomSelect = (room: Room) => {
    setSelectedRoom(room);
    loadMembers(room.id);
  };

  const handleDeleteRoom = async (roomId: string) => {
    try {
      const { error } = await supabase
        .from("rooms")
        .delete()
        .eq("id", roomId);

      if (error) throw error;

      toast.success("Room verwijderd");
      setDeleteRoomId(null);
      setSelectedRoom(null);
      loadRooms();
    } catch (error: any) {
      toast.error(error.message || "Fout bij verwijderen room");
    }
  };

  const handleCopyInviteCode = (code: string) => {
    navigator.clipboard.writeText(code);
    toast.success("Invite code gekopieerd!");
  };

  const isOwner = (room: Room) => room.owner_id === user?.id;

  if (!user) return null;

  return (
    <div className="flex min-h-screen bg-background p-4">
      <div className="w-full max-w-6xl mx-auto space-y-6">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-foreground mb-2">Room Beheer</h1>
          <p className="text-muted-foreground">Beheer je rooms en members</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Rooms List */}
          <Card>
            <CardHeader>
              <CardTitle>Mijn Rooms ({rooms.length}/5)</CardTitle>
              <CardDescription>Klik op een room om details te zien</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              {rooms.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">
                  Geen rooms gevonden
                </p>
              ) : (
                rooms.map((room) => (
                  <div
                    key={room.id}
                    className={`p-4 rounded-lg border cursor-pointer transition-colors ${
                      selectedRoom?.id === room.id
                        ? "bg-accent border-primary"
                        : "hover:bg-accent/50"
                    }`}
                    onClick={() => handleRoomSelect(room)}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Settings className="h-4 w-4" />
                        <span className="font-medium">{room.name}</span>
                      </div>
                      {isOwner(room) && (
                        <Badge variant="secondary">Owner</Badge>
                      )}
                    </div>
                  </div>
                ))
              )}
            </CardContent>
          </Card>

          {/* Room Details */}
          <Card>
            <CardHeader>
              <CardTitle>Room Details</CardTitle>
              <CardDescription>
                {selectedRoom ? "Bekijk en beheer room informatie" : "Selecteer een room"}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {selectedRoom ? (
                <>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">Room Naam:</span>
                      <span className="text-sm">{selectedRoom.name}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">Invite Code:</span>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleCopyInviteCode(selectedRoom.invite_code)}
                      >
                        <Copy className="h-3 w-3 mr-1" />
                        {selectedRoom.invite_code}
                      </Button>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">Aangemaakt:</span>
                      <span className="text-sm">
                        {new Date(selectedRoom.created_at).toLocaleDateString("nl-NL")}
                      </span>
                    </div>
                  </div>

                  <div className="pt-4 border-t">
                    <div className="flex items-center gap-2 mb-3">
                      <Users className="h-4 w-4" />
                      <span className="font-medium">Members ({members.length})</span>
                    </div>
                    <div className="space-y-2">
                      {members.length === 0 ? (
                        <p className="text-sm text-muted-foreground">Geen members</p>
                      ) : (
                        members.map((member) => (
                          <div
                            key={member.id}
                            className="flex items-center justify-between p-2 rounded bg-accent/50"
                          >
                            <span className="text-sm">{member.profiles.username}</span>
                            <span className="text-xs text-muted-foreground">
                              {new Date(member.joined_at).toLocaleDateString("nl-NL")}
                            </span>
                          </div>
                        ))
                      )}
                    </div>
                  </div>

                  <div className="pt-4 space-y-2">
                    <Button
                      variant="default"
                      className="w-full"
                      onClick={() => navigate(`/room/${selectedRoom.id}`)}
                    >
                      Open Room
                    </Button>
                    {isOwner(selectedRoom) && (
                      <Button
                        variant="destructive"
                        className="w-full"
                        onClick={() => setDeleteRoomId(selectedRoom.id)}
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        Verwijder Room
                      </Button>
                    )}
                  </div>
                </>
              ) : (
                <p className="text-center text-muted-foreground py-8">
                  Selecteer een room om details te zien
                </p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      <AlertDialog open={!!deleteRoomId} onOpenChange={(open) => !open && setDeleteRoomId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Room verwijderen</AlertDialogTitle>
            <AlertDialogDescription>
              Weet je zeker dat je deze room wilt verwijderen? Deze actie kan niet ongedaan worden gemaakt.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuleren</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteRoomId && handleDeleteRoom(deleteRoomId)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Verwijderen
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default RoomManagement;

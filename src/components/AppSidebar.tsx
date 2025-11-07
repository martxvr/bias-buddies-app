import { useState, useEffect } from "react";
import { User, Home, Plus, LogIn, LogOut, Settings, Trash2, FolderKanban } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
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
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarFooter,
  useSidebar,
} from "@/components/ui/sidebar";
import { CreateRoomDialog } from "./CreateRoomDialog";
import { JoinRoomDialog } from "./JoinRoomDialog";
import { Button } from "./ui/button";
import { Separator } from "./ui/separator";

interface Room {
  id: string;
  name: string;
  owner_id: string;
}

export function AppSidebar() {
  const { state } = useSidebar();
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const [rooms, setRooms] = useState<Room[]>([]);
  const [createRoomOpen, setCreateRoomOpen] = useState(false);
  const [joinRoomOpen, setJoinRoomOpen] = useState(false);
  const [deleteRoomId, setDeleteRoomId] = useState<string | null>(null);
  const isCollapsed = state === "collapsed";

  useEffect(() => {
    if (!user) return;

    const loadRooms = async () => {
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

    loadRooms();
  }, [user]);

  const handleCreateRoom = () => {
    if (!user) {
      navigate("/auth");
      return;
    }
    setCreateRoomOpen(true);
  };

  const handleJoinRoom = () => {
    if (!user) {
      navigate("/auth");
      return;
    }
    setJoinRoomOpen(true);
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
      
      // Refresh rooms
      if (user) {
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
      }
    } catch (error: any) {
      toast.error(error.message || "Fout bij verwijderen room");
    }
  };

  return (
    <>
      <Sidebar className={isCollapsed ? "w-14" : "w-64"}>
        <SidebarContent>
          <SidebarGroup>
            <SidebarGroupLabel>Navigatie</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                <SidebarMenuItem>
                  <SidebarMenuButton asChild>
                    <button onClick={() => navigate("/")}>
                      <Home className="h-4 w-4" />
                      {!isCollapsed && <span>Home</span>}
                    </button>
                  </SidebarMenuButton>
                </SidebarMenuItem>
                {user && (
                  <>
                    <SidebarMenuItem>
                      <SidebarMenuButton asChild>
                        <button onClick={() => navigate("/profile")}>
                          <User className="h-4 w-4" />
                          {!isCollapsed && <span>Profiel</span>}
                        </button>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                    <SidebarMenuItem>
                      <SidebarMenuButton asChild>
                        <button onClick={() => navigate("/rooms")}>
                          <FolderKanban className="h-4 w-4" />
                          {!isCollapsed && <span>Room Beheer</span>}
                        </button>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  </>
                )}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>

          {user && (
            <>
              <Separator className="my-2" />
              <SidebarGroup>
                <SidebarGroupLabel>Mijn Rooms ({rooms.length})</SidebarGroupLabel>
                <SidebarGroupContent>
                  <SidebarMenu>
                    {rooms.map((room) => (
                      <SidebarMenuItem key={room.id}>
                        <SidebarMenuButton asChild className="justify-between group">
                          <div className="flex items-center w-full">
                            <button 
                              onClick={() => navigate(`/room/${room.id}`)} 
                              className="flex items-center gap-2 flex-1"
                            >
                              <Settings className="h-4 w-4" />
                              {!isCollapsed && <span>{room.name}</span>}
                            </button>
                            {!isCollapsed && room.owner_id === user?.id && (
                              <button
                                onClick={(e) => {
                                  e.preventDefault();
                                  setDeleteRoomId(room.id);
                                }}
                                className="opacity-0 group-hover:opacity-100 p-1 hover:bg-destructive/10 rounded transition-opacity"
                                aria-label="Verwijder room"
                              >
                                <Trash2 className="h-3 w-3 text-destructive" />
                              </button>
                            )}
                          </div>
                        </SidebarMenuButton>
                      </SidebarMenuItem>
                    ))}
                  </SidebarMenu>
                  {!isCollapsed && (
                    <div className="mt-2 space-y-1 px-2">
                      <Button
                        variant="outline"
                        size="sm"
                        className="w-full justify-start"
                        onClick={handleCreateRoom}
                      >
                        <Plus className="h-4 w-4 mr-2" />
                        Maak Room
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="w-full justify-start"
                        onClick={handleJoinRoom}
                      >
                        <LogIn className="h-4 w-4 mr-2" />
                        Join Room
                      </Button>
                    </div>
                  )}
                </SidebarGroupContent>
              </SidebarGroup>
            </>
          )}
        </SidebarContent>

        <SidebarFooter>
          {user ? (
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton onClick={signOut}>
                  <LogOut className="h-4 w-4" />
                  {!isCollapsed && <span>Uitloggen</span>}
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          ) : (
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton onClick={() => navigate("/auth")}>
                  <LogIn className="h-4 w-4" />
                  {!isCollapsed && <span>Inloggen</span>}
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          )}
        </SidebarFooter>
      </Sidebar>

      <CreateRoomDialog open={createRoomOpen} onOpenChange={setCreateRoomOpen} />
      <JoinRoomDialog open={joinRoomOpen} onOpenChange={setJoinRoomOpen} />
      
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
    </>
  );
}

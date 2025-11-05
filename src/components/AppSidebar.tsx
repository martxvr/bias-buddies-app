import { useState, useEffect } from "react";
import { User, Home, Plus, LogIn, LogOut, Settings } from "lucide-react";
import { NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
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

  return (
    <>
      <Sidebar className={isCollapsed ? "w-14" : "w-64"}>
        <SidebarContent>
          <SidebarGroup>
            <SidebarGroupLabel>Navigation</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                <SidebarMenuItem>
                  <SidebarMenuButton asChild>
                    <NavLink to="/" end>
                      <Home className="h-4 w-4" />
                      {!isCollapsed && <span>Home</span>}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
                {user && (
                  <SidebarMenuItem>
                    <SidebarMenuButton asChild>
                    <NavLink to="/profile">
                      <User className="h-4 w-4" />
                      {!isCollapsed && <span>Profile</span>}
                    </NavLink>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                )}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>

          {user && (
            <>
              <Separator className="my-2" />
              <SidebarGroup>
                <SidebarGroupLabel>Rooms</SidebarGroupLabel>
                <SidebarGroupContent>
                  <SidebarMenu>
                    {rooms.map((room) => (
                      <SidebarMenuItem key={room.id}>
                        <SidebarMenuButton asChild>
                        <NavLink to={`/room/${room.id}`}>
                          <Settings className="h-4 w-4" />
                          {!isCollapsed && <span>{room.name}</span>}
                        </NavLink>
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
                        Create Room
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
                  {!isCollapsed && <span>Logout</span>}
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          ) : (
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton onClick={() => navigate("/auth")}>
                  <LogIn className="h-4 w-4" />
                  {!isCollapsed && <span>Login</span>}
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          )}
        </SidebarFooter>
      </Sidebar>

      <CreateRoomDialog open={createRoomOpen} onOpenChange={setCreateRoomOpen} />
      <JoinRoomDialog open={joinRoomOpen} onOpenChange={setJoinRoomOpen} />
    </>
  );
}

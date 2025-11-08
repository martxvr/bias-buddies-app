import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { ThemeToggle } from "./ThemeToggle";
import { CreateRoomDialog } from "./CreateRoomDialog";
import { JoinRoomDialog } from "./JoinRoomDialog";
import { Button } from "./ui/button";
import { Home, User, LogIn, LogOut, FolderKanban, Volume2, VolumeX, Menu } from "lucide-react";
import { NotificationCenter } from "./NotificationCenter";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Sheet,
  SheetContent,
  SheetTrigger,
} from "@/components/ui/sheet";
import { getMuted, setMuted } from "@/hooks/useSound";

export const Header = () => {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const [createRoomOpen, setCreateRoomOpen] = useState(false);
  const [joinRoomOpen, setJoinRoomOpen] = useState(false);
  const [muted, setMutedState] = useState<boolean>(() => getMuted());
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const toggleMute = () => {
    const next = !muted;
    setMutedState(next);
    setMuted(next);
  };

  return (
    <>
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-14 items-center justify-between px-4">
          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-1">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate("/")}
              aria-label="Home"
            >
              <Home className="h-5 w-5" />
            </Button>
            
            {user && (
              <>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" aria-label="Rooms">
                      <FolderKanban className="h-5 w-5" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="start">
                    <DropdownMenuItem onClick={() => setCreateRoomOpen(true)}>
                      Create Room
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setJoinRoomOpen(true)}>
                      Join Room
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>

                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => navigate("/profile")}
                  aria-label="Profiel"
                >
                  <User className="h-5 w-5" />
                </Button>
              </>
            )}
          </div>

          {/* Mobile Menu Button */}
          <div className="md:hidden">
            <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" aria-label="Menu">
                  <Menu className="h-5 w-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="w-64">
                <nav className="flex flex-col gap-4 mt-8">
                  <Button
                    variant="ghost"
                    className="justify-start"
                    onClick={() => {
                      navigate("/");
                      setMobileMenuOpen(false);
                    }}
                  >
                    <Home className="h-5 w-5 mr-2" />
                    Home
                  </Button>
                  
                  {user && (
                    <>
                      <Button
                        variant="ghost"
                        className="justify-start"
                        onClick={() => {
                          setCreateRoomOpen(true);
                          setMobileMenuOpen(false);
                        }}
                      >
                        <FolderKanban className="h-5 w-5 mr-2" />
                        Create Room
                      </Button>
                      
                      <Button
                        variant="ghost"
                        className="justify-start"
                        onClick={() => {
                          setJoinRoomOpen(true);
                          setMobileMenuOpen(false);
                        }}
                      >
                        <FolderKanban className="h-5 w-5 mr-2" />
                        Join Room
                      </Button>
                      
                      <Button
                        variant="ghost"
                        className="justify-start"
                        onClick={() => {
                          navigate("/profile");
                          setMobileMenuOpen(false);
                        }}
                      >
                        <User className="h-5 w-5 mr-2" />
                        Profile
                      </Button>
                    </>
                  )}
                </nav>
              </SheetContent>
            </Sheet>
          </div>

          {/* Right Side Actions */}
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="icon"
              onClick={toggleMute}
              aria-label={muted ? "Unmute" : "Mute"}
            >
              {muted ? <VolumeX className="h-5 w-5" /> : <Volume2 className="h-5 w-5" />}
            </Button>
            
            {user && <NotificationCenter />}
            
            <ThemeToggle />
            
            {user ? (
              <Button
                variant="ghost"
                size="icon"
                onClick={signOut}
                aria-label="Uitloggen"
              >
                <LogOut className="h-5 w-5" />
              </Button>
            ) : (
              <Button
                variant="ghost"
                size="icon"
                onClick={() => navigate("/auth")}
                aria-label="Inloggen"
              >
                <LogIn className="h-5 w-5" />
              </Button>
            )}
          </div>
        </div>
      </header>

      <CreateRoomDialog open={createRoomOpen} onOpenChange={setCreateRoomOpen} />
      <JoinRoomDialog open={joinRoomOpen} onOpenChange={setJoinRoomOpen} />
    </>
  );
};

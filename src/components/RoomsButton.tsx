import { Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface RoomsButtonProps {
  onCreateRoom: () => void;
  onJoinRoom: () => void;
}

export function RoomsButton({ onCreateRoom, onJoinRoom }: RoomsButtonProps) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="absolute top-4 left-4">
          <Users className="h-5 w-5" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start">
        <DropdownMenuItem onClick={onCreateRoom}>
          Create Room
        </DropdownMenuItem>
        <DropdownMenuItem onClick={onJoinRoom}>
          Join Room
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

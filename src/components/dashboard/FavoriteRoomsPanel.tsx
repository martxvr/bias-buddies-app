import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Star, Users, ExternalLink } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface FavoriteRoom {
  id: string;
  room_id: string;
  created_at: string;
  room: {
    id: string;
    name: string;
    invite_code: string;
  };
}

export function FavoriteRoomsPanel({ userId, detailed }: { userId?: string; detailed?: boolean }) {
  const [favorites, setFavorites] = useState<FavoriteRoom[]>([]);
  const navigate = useNavigate();

  useEffect(() => {
    if (userId) {
      loadFavorites();
    }
  }, [userId]);

  const loadFavorites = async () => {
    const { data } = await supabase
      .from("favorite_rooms")
      .select(`
        *,
        room:rooms(id, name, invite_code)
      `)
      .eq("user_id", userId)
      .order("created_at", { ascending: false });

    if (data) setFavorites(data as any);
  };

  const removeFavorite = async (favoriteId: string) => {
    await supabase.from("favorite_rooms").delete().eq("id", favoriteId);
    loadFavorites();
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Star className="h-5 w-5" />
          Favoriete Rooms
        </CardTitle>
        <CardDescription>Je meest bezochte rooms</CardDescription>
      </CardHeader>
      <CardContent>
        {favorites.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            Nog geen favoriete rooms toegevoegd
          </p>
        ) : (
          <div className="space-y-2">
            {favorites.map((favorite) => (
              <div
                key={favorite.id}
                className="flex items-center justify-between p-3 rounded-lg border hover:bg-accent"
              >
                <div className="flex items-center gap-3">
                  <Users className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="font-medium">{favorite.room.name}</p>
                    <p className="text-xs text-muted-foreground">
                      Code: {favorite.room.invite_code}
                    </p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => navigate(`/room/${favorite.room_id}`)}
                  >
                    <ExternalLink className="h-4 w-4" />
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => removeFavorite(favorite.id)}
                  >
                    <Star className="h-4 w-4 fill-current" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

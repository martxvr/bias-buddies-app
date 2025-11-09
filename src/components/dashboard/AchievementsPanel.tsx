import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import * as LucideIcons from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { nl } from "date-fns/locale";

interface Achievement {
  id: string;
  name: string;
  description: string;
  icon: string;
  category: string;
  requirement_value: number;
}

interface UserAchievement {
  id: string;
  achievement_id: string;
  unlocked_at: string;
  achievement: Achievement;
}

export function AchievementsPanel({ userId, detailed }: { userId?: string; detailed?: boolean }) {
  const [achievements, setAchievements] = useState<UserAchievement[]>([]);
  const [allAchievements, setAllAchievements] = useState<Achievement[]>([]);

  useEffect(() => {
    if (userId) {
      loadAchievements();
      loadAllAchievements();
    }
  }, [userId]);

  const loadAchievements = async () => {
    const { data } = await supabase
      .from("user_achievements")
      .select(`
        *,
        achievement:achievements(*)
      `)
      .eq("user_id", userId)
      .order("unlocked_at", { ascending: false });

    if (data) setAchievements(data as any);
  };

  const loadAllAchievements = async () => {
    const { data } = await supabase
      .from("achievements")
      .select("*")
      .order("category");

    if (data) setAllAchievements(data);
  };

  const getIcon = (iconName: string) => {
    const Icon = (LucideIcons as any)[iconName.charAt(0).toUpperCase() + iconName.slice(1).replace(/-/g, '')];
    return Icon ? <Icon className="h-6 w-6" /> : <LucideIcons.Trophy className="h-6 w-6" />;
  };

  const unlockedIds = achievements.map((a) => a.achievement_id);
  const locked = allAchievements.filter((a) => !unlockedIds.includes(a.id));

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <LucideIcons.Award className="h-5 w-5" />
          Achievements
        </CardTitle>
        <CardDescription>
          {achievements.length} / {allAchievements.length} ontgrendeld
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {/* Unlocked Achievements */}
          <div className="space-y-3">
            <h3 className="text-sm font-medium">Ontgrendeld</h3>
            {achievements.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                Nog geen achievements ontgrendeld
              </p>
            ) : (
              <div className="grid grid-cols-1 gap-3">
                {achievements.map((userAch) => (
                  <div
                    key={userAch.id}
                    className="flex items-start gap-3 p-3 rounded-lg border bg-accent/50"
                  >
                    <div className="text-primary">{getIcon(userAch.achievement.icon)}</div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <p className="font-medium">{userAch.achievement.description}</p>
                        <Badge variant="secondary" className="text-xs">
                          {userAch.achievement.category}
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Ontgrendeld{" "}
                        {formatDistanceToNow(new Date(userAch.unlocked_at), {
                          addSuffix: true,
                          locale: nl,
                        })}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Locked Achievements (only in detailed view) */}
          {detailed && locked.length > 0 && (
            <div className="space-y-3">
              <h3 className="text-sm font-medium">Nog te ontgrendelen</h3>
              <div className="grid grid-cols-1 gap-3">
                {locked.map((ach) => (
                  <div
                    key={ach.id}
                    className="flex items-start gap-3 p-3 rounded-lg border opacity-50"
                  >
                    <div className="text-muted-foreground">{getIcon(ach.icon)}</div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <p className="font-medium">{ach.description}</p>
                        <Badge variant="outline" className="text-xs">
                          {ach.category}
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Vereist: {ach.requirement_value}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

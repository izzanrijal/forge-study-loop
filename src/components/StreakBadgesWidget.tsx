
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface BadgeType {
  id: string;
  name: string;
  description: string;
  earned: boolean;
  icon: string;
}

interface StreakBadgesWidgetProps {
  currentStreak: number;
  badges: BadgeType[];
}

export function StreakBadgesWidget({ currentStreak, badges }: StreakBadgesWidgetProps) {
  const earnedBadges = badges.filter(badge => badge.earned);
  
  return (
    <Card className="rounded-xl shadow-md">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg">Streak & Achievements</CardTitle>
        <CardDescription>
          Your learning consistency and milestones
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Current Streak */}
          <div className="text-center p-4 bg-primary/5 rounded-xl">
            <div className="text-2xl font-space-grotesk font-bold text-primary mb-1">
              {currentStreak}
            </div>
            <div className="text-sm text-ash">Day Streak</div>
          </div>

          {/* Badges Grid */}
          <div>
            <h4 className="font-medium mb-3 text-sm">Recent Badges</h4>
            <div className="grid grid-cols-4 gap-2">
              {badges.slice(0, 8).map((badge) => (
                <div
                  key={badge.id}
                  className={`aspect-square rounded-xl border-2 flex items-center justify-center text-lg transition-all ${
                    badge.earned
                      ? 'border-primary/20 bg-primary/10'
                      : 'border-border bg-muted opacity-50'
                  }`}
                  title={badge.earned ? badge.name : 'Locked'}
                >
                  {badge.earned ? badge.icon : '🔒'}
                </div>
              ))}
            </div>
            <div className="text-xs text-ash mt-2 text-center">
              {earnedBadges.length} of {badges.length} earned
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

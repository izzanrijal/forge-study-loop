
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useNavigate } from "react-router-dom";
import { useBadges } from "@/hooks/useBadges";
import { useUserProfile } from "@/hooks/useRealData";

interface StreakBadgesWidgetProps {
  streakCount?: number;
  totalMasteryPoints?: number;
}

export function StreakBadgesWidget({ streakCount, totalMasteryPoints }: StreakBadgesWidgetProps) {
  const navigate = useNavigate();
  const { data: userProfile } = useUserProfile();
  const { data: badges = [] } = useBadges();
  
  const currentStreak = streakCount ?? userProfile?.streak_count ?? 0;
  const earnedBadges = badges.filter(badge => badge.earned);

  const handleViewProgress = () => {
    navigate('/progress');
  };

  const handleBadgeClick = (badge: any) => {
    if (badge.earned) {
      console.log('Badge details:', badge);
      // Could show badge details modal in future
    }
  };
  
  return (
    <Card className="rounded-xl shadow-md cursor-pointer hover:shadow-lg transition-shadow" onClick={handleViewProgress}>
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
            <div className="text-2xl font-bold text-primary mb-1">
              {currentStreak}
            </div>
            <div className="text-sm text-muted-foreground">Day Streak</div>
          </div>

          {/* Badges Grid */}
          <div>
            <h4 className="font-medium mb-3 text-sm">Recent Badges</h4>
            <div className="grid grid-cols-4 gap-2">
              {badges.slice(0, 8).map((badge) => (
                <div
                  key={badge.id}
                  className={`aspect-square rounded-xl border-2 flex items-center justify-center text-lg transition-all cursor-pointer hover:scale-105 ${
                    badge.earned
                      ? 'border-primary/20 bg-primary/10'
                      : 'border-border bg-muted opacity-50'
                  }`}
                  title={badge.earned ? badge.name : 'Locked'}
                  onClick={(e) => {
                    e.stopPropagation();
                    handleBadgeClick(badge);
                  }}
                >
                  {badge.earned ? badge.icon : '🔒'}
                </div>
              ))}
            </div>
            <div className="text-xs text-muted-foreground mt-2 text-center">
              {earnedBadges.length} of {badges.length} earned
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

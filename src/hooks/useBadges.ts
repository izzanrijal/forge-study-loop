
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/hooks/useAuth';
import { useUserProfile, useStudySessions } from '@/hooks/useRealData';

export interface Badge {
  id: string;
  name: string;
  description: string;
  earned: boolean;
  icon: string;
  requirement: number;
  type: 'streak' | 'mastery' | 'sessions' | 'accuracy';
}

export function useBadges() {
  const { user } = useAuth();
  const { data: userProfile } = useUserProfile();
  const { data: studySessions } = useStudySessions();

  return useQuery({
    queryKey: ['badges', user?.id, userProfile?.streak_count, userProfile?.total_mastery_points],
    queryFn: () => {
      if (!userProfile || !studySessions) return [];

      const totalSessions = studySessions.length;
      const averageAccuracy = studySessions.length > 0 
        ? studySessions.reduce((acc, session) => acc + session.accuracy, 0) / studySessions.length 
        : 0;

      const badges: Badge[] = [
        // Streak Badges
        {
          id: 'streak-3',
          name: 'Getting Started',
          description: '3 day streak',
          earned: userProfile.streak_count >= 3,
          icon: '🔥',
          requirement: 3,
          type: 'streak'
        },
        {
          id: 'streak-7',
          name: 'Week Warrior',
          description: '7 day streak',
          earned: userProfile.streak_count >= 7,
          icon: '⚡',
          requirement: 7,
          type: 'streak'
        },
        {
          id: 'streak-30',
          name: 'Monthly Master',
          description: '30 day streak',
          earned: userProfile.streak_count >= 30,
          icon: '👑',
          requirement: 30,
          type: 'streak'
        },
        {
          id: 'streak-100',
          name: 'Centurion',
          description: '100 day streak',
          earned: userProfile.streak_count >= 100,
          icon: '💎',
          requirement: 100,
          type: 'streak'
        },
        // Mastery Badges
        {
          id: 'mastery-100',
          name: 'First Steps',
          description: '100 mastery points',
          earned: userProfile.total_mastery_points >= 100,
          icon: '⭐',
          requirement: 100,
          type: 'mastery'
        },
        {
          id: 'mastery-500',
          name: 'Knowledge Seeker',
          description: '500 mastery points',
          earned: userProfile.total_mastery_points >= 500,
          icon: '🌟',
          requirement: 500,
          type: 'mastery'
        },
        {
          id: 'mastery-1000',
          name: 'Scholar',
          description: '1000 mastery points',
          earned: userProfile.total_mastery_points >= 1000,
          icon: '🎓',
          requirement: 1000,
          type: 'mastery'
        },
        {
          id: 'mastery-5000',
          name: 'Expert',
          description: '5000 mastery points',
          earned: userProfile.total_mastery_points >= 5000,
          icon: '🏆',
          requirement: 5000,
          type: 'mastery'
        }
      ];

      return badges;
    },
    enabled: !!user && !!userProfile,
  });
}

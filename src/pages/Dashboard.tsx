
import { TopBar } from "@/components/TopBar";
import { TodaysReviewCard } from "@/components/TodaysReviewCard";
import { RecommendedLOCard } from "@/components/RecommendedLOCard";
import { StreakBadgesWidget } from "@/components/StreakBadgesWidget";
import { UploadCard } from "@/components/UploadCard";

// Mock data - in real app this would come from API/state management
const mockLearningObjectives = [
  {
    id: '1',
    title: 'Understanding React Hooks Fundamentals',
    priority: 'High' as const,
    masteryPercent: 65,
    source: 'react-advanced-patterns.pdf'
  },
  {
    id: '2',
    title: 'Database Normalization Principles',
    priority: 'Medium' as const,
    masteryPercent: 40,
    source: 'database-design-guide.pdf'
  },
  {
    id: '3',
    title: 'Async/Await Error Handling',
    priority: 'Low' as const,
    masteryPercent: 85,
    source: 'javascript-patterns.pdf'
  }
];

const mockBadges = [
  { id: '1', name: 'First Steps', description: 'Complete first review', earned: true, icon: '🚀' },
  { id: '2', name: 'Week Warrior', description: '7 day streak', earned: true, icon: '⚡' },
  { id: '3', name: 'Speed Demon', description: 'Fast answers', earned: true, icon: '💨' },
  { id: '4', name: 'Scholar', description: '100 questions', earned: false, icon: '📚' },
  { id: '5', name: 'Perfectionist', description: '90% accuracy', earned: false, icon: '🎯' },
  { id: '6', name: 'Dedicated', description: '30 day streak', earned: false, icon: '🔥' },
  { id: '7', name: 'Expert', description: 'Master 10 topics', earned: false, icon: '🏆' },
  { id: '8', name: 'Consistent', description: 'Daily practice', earned: false, icon: '📈' },
];

export default function Dashboard() {
  return (
    <div className="min-h-screen bg-background">
      <TopBar title="Dashboard" streak={12} />
      
      <div className="p-6 max-w-7xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Main Content */}
          <div className="lg:col-span-2 space-y-6">
            <TodaysReviewCard dueCount={23} estimatedMinutes={15} />
            <RecommendedLOCard learningObjectives={mockLearningObjectives} />
            <UploadCard />
          </div>

          {/* Right Column - Sidebar Widgets */}
          <div className="space-y-6">
            <StreakBadgesWidget currentStreak={12} badges={mockBadges} />
          </div>
        </div>
      </div>
    </div>
  );
}

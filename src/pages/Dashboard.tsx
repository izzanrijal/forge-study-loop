
import { TopBar } from "@/components/TopBar";
import { TodaysReviewCard } from "@/components/TodaysReviewCard";
import { RecommendedLOCard } from "@/components/RecommendedLOCard";
import { StreakBadgesWidget } from "@/components/StreakBadgesWidget";
import { UploadCard } from "@/components/UploadCard";
import { mockLearningObjectives, mockBadges, mockUser } from "@/data/mockData";

export default function Dashboard() {
  // In a real app, this data would come from API calls or state management
  const dueQuestionsCount = 23;
  const estimatedReviewTime = 15;

  return (
    <div className="min-h-screen bg-background">
      <TopBar title="Dashboard" streak={mockUser.streak} />
      
      <div className="p-6 max-w-7xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Main Content */}
          <div className="lg:col-span-2 space-y-6">
            <TodaysReviewCard 
              dueCount={dueQuestionsCount} 
              estimatedMinutes={estimatedReviewTime} 
            />
            <RecommendedLOCard learningObjectives={mockLearningObjectives} />
            <UploadCard />
          </div>

          {/* Right Column - Sidebar Widgets */}
          <div className="space-y-6">
            <StreakBadgesWidget 
              currentStreak={mockUser.streak} 
              badges={mockBadges} 
            />
          </div>
        </div>
      </div>
    </div>
  );
}

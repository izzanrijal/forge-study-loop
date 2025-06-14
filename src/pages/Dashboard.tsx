
import { TodaysReviewCard } from "@/components/TodaysReviewCard";
import { RecommendedLOCard } from "@/components/RecommendedLOCard";
import { StreakBadgesWidget } from "@/components/StreakBadgesWidget";
import { UploadCard } from "@/components/UploadCard";
import { Layout } from "@/components/Layout";
import { mockLearningObjectives, mockBadges, mockUser } from "@/data/mockData";

export default function Dashboard() {
  // In a real app, this data would come from API calls or state management
  const dueQuestionsCount = 23;
  const estimatedReviewTime = 15;

  return (
    <Layout>
      <div className="p-6 max-w-7xl mx-auto">
        <div className="mb-6">
          <h1 className="text-2xl font-bold">Dashboard</h1>
          <p className="text-muted-foreground">Welcome back! Ready to learn?</p>
        </div>
        
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
    </Layout>
  );
}

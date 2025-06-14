
import { TodaysReviewCard } from "@/components/TodaysReviewCard";
import { RecommendedLOCard } from "@/components/RecommendedLOCard";
import { StreakBadgesWidget } from "@/components/StreakBadgesWidget";
import { UploadCard } from "@/components/UploadCard";
import { Layout } from "@/components/Layout";
import { EmptyState } from "@/components/EmptyState";
import { useLearningObjectives, useDueQuestionsCount, useStudySessions } from "@/hooks/useRealData";
import { mockBadges, mockUser } from "@/data/mockData";
import { Skeleton } from "@/components/ui/skeleton";

export default function Dashboard() {
  const { data: learningObjectives, isLoading: loLoadingLO } = useLearningObjectives();
  const { data: dueQuestionsCount, isLoading: loadingDue } = useDueQuestionsCount();
  const { data: studySessions, isLoading: loadingSessions } = useStudySessions();

  const estimatedReviewTime = Math.max(Math.ceil((dueQuestionsCount || 0) * 0.5), 1);
  const hasLearningObjectives = learningObjectives && learningObjectives.length > 0;
  const hasStudySessions = studySessions && studySessions.length > 0;

  return (
    <Layout>
      <div className="p-6 max-w-7xl mx-auto">
        <div className="mb-6">
          <h1 className="text-2xl font-bold">Dashboard</h1>
          <p className="text-muted-foreground">Selamat datang kembali! Siap untuk belajar?</p>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {loadingDue ? (
              <Skeleton className="h-32 w-full rounded-xl" />
            ) : (
              <TodaysReviewCard 
                dueCount={dueQuestionsCount || 0} 
                estimatedMinutes={estimatedReviewTime} 
              />
            )}
            
            {loLoadingLO ? (
              <Skeleton className="h-48 w-full rounded-xl" />
            ) : hasLearningObjectives ? (
              <RecommendedLOCard learningObjectives={learningObjectives} />
            ) : (
              <EmptyState 
                type="learning-objectives"
                title="Belum Ada Learning Objectives"
                description="Upload dokumen PDF pertama Anda untuk mulai membuat learning objectives dan soal-soal latihan secara otomatis."
              />
            )}
            
            <UploadCard />
          </div>

          {/* Right Column - Sidebar Widgets */}
          <div className="space-y-6">
            <StreakBadgesWidget 
              currentStreak={mockUser.streak} 
              badges={mockBadges} 
            />
            
            {loadingSessions ? (
              <Skeleton className="h-32 w-full rounded-xl" />
            ) : !hasStudySessions ? (
              <EmptyState 
                type="study-sessions"
                title="Mulai Perjalanan Belajar"
                description="Belum ada sesi belajar. Mulai sesi pertama untuk melacak progress Anda."
              />
            ) : null}
          </div>
        </div>
      </div>
    </Layout>
  );
}

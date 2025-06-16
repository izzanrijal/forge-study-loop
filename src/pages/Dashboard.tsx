
import { Layout } from "@/components/Layout";
import { TodaysReviewCard } from "@/components/TodaysReviewCard";
import { RecommendedLOCard } from "@/components/RecommendedLOCard";
import { UploadCard } from "@/components/UploadCard";
import { StreakBadgesWidget } from "@/components/StreakBadgesWidget";
import { EmptyState } from "@/components/EmptyState";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, BookOpen, Target, TrendingUp } from "lucide-react";
import { Link } from "react-router-dom";
import { useRealData, useDueQuestionsCount } from "@/hooks/useRealData";

export default function Dashboard() {
  const { 
    learningObjectives, 
    pdfs, 
    userProfile, 
    isLoading 
  } = useRealData();
  
  const { data: dueCount = 0, isLoading: dueLoading } = useDueQuestionsCount();

  if (isLoading || dueLoading) {
    return (
      <Layout>
        <div className="p-6">
          <div className="animate-pulse space-y-6">
            <div className="h-8 bg-gray-200 rounded w-1/3"></div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <div key={i} className="h-48 bg-gray-200 rounded-lg"></div>
              ))}
            </div>
          </div>
        </div>
      </Layout>
    );
  }

  const hasData = pdfs.length > 0 || learningObjectives.length > 0;

  if (!hasData) {
    return (
      <Layout>
        <div className="p-6">
          <EmptyState 
            title="Welcome to RecallForge!"
            description="Start your learning journey by uploading your first PDF document. We'll extract learning objectives and create personalized study sessions for you."
            actionLabel="Upload Your First PDF"
            actionLink="/upload"
            icon={BookOpen}
          />
        </div>
      </Layout>
    );
  }

  // Transform database learning objectives to frontend format
  const transformedLearningObjectives = learningObjectives.map(lo => ({
    id: lo.id,
    title: lo.title,
    description: lo.description || "",
    priority: lo.priority,
    masteryPercent: Math.round(lo.mastery_level * 100),
    source: lo.pdfs?.filename || "Unknown Source",
    pageRange: lo.page_range || "",
    tags: []
  }));

  // Calculate estimated review time (2 minutes per question)
  const estimatedMinutes = Math.max(1, Math.round(dueCount * 2));

  // Get recommended learning objectives (low mastery or high priority)
  const recommendedLOs = transformedLearningObjectives
    .filter(lo => lo.priority === "High" || lo.masteryPercent < 50)
    .slice(0, 4); // Show up to 4 recommendations

  const hasActionableItems = dueCount > 0 || recommendedLOs.length > 0;

  return (
    <Layout>
      <main className="p-4 sm:p-6 space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold">
              Welcome back{userProfile?.full_name ? `, ${userProfile.full_name}` : ''}!
            </h1>
            <p className="text-muted-foreground mt-1">
              Ready to continue your learning journey?
            </p>
          </div>
          <Link to="/upload">
            <Button className="gap-2 w-full sm:w-auto">
              <Plus className="w-4 h-4" />
              Upload PDF
            </Button>
          </Link>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total PDFs</CardTitle>
              <BookOpen className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{pdfs.length}</div>
              <p className="text-xs text-muted-foreground">
                Documents uploaded
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Learning Objectives</CardTitle>
              <Target className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{learningObjectives.length}</div>
              <p className="text-xs text-muted-foreground">
                Topics to master
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Average Mastery</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {transformedLearningObjectives.length > 0 
                  ? `${Math.round(transformedLearningObjectives.reduce((acc, lo) => acc + lo.masteryPercent, 0) / transformedLearningObjectives.length)}%`
                  : 'N/A'}
              </div>
              <p className="text-xs text-muted-foreground">
                Across all topics
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
          {/* Left & Center Column */}
          <div className="lg:col-span-2 space-y-6">
            {dueCount > 0 && (
              <section>
                <h2 className="text-xl font-semibold mb-4">Today's Reviews</h2>
                <TodaysReviewCard 
                  dueCount={dueCount} 
                  estimatedMinutes={estimatedMinutes}
                />
              </section>
            )}

            {recommendedLOs.length > 0 && (
              <section>
                <h2 className="text-xl font-semibold mb-4">Recommended for You</h2>
                <div className="grid gap-4 sm:grid-cols-2">
                  {recommendedLOs.map((lo) => (
                    <RecommendedLOCard key={lo.id} learningObjectives={[lo]} />
                  ))}
                </div>
              </section>
            )}
            
            {!hasActionableItems && (
              <Card className="h-full flex flex-col justify-center items-center text-center p-6">
                <CardHeader>
                  <div className="mx-auto bg-green-100 rounded-full p-3 w-fit">
                    <TrendingUp className="h-8 w-8 text-green-600" />
                  </div>
                  <CardTitle className="mt-4">All Caught Up!</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">You have no pending reviews and all your high-priority learning objectives are mastered. Great job!</p>
                  <p className="mt-4">You can always <Link to="/upload" className="text-primary hover:underline font-semibold">upload more documents</Link> to generate new learning objectives.</p>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Right Column */}
          <aside className="space-y-6">
            <UploadCard />
            <StreakBadgesWidget 
              streakCount={userProfile?.streak_count || 0}
              totalMasteryPoints={userProfile?.total_mastery_points || 0}
            />
          </aside>
        </div>
      </main>
    </Layout>
  );
}

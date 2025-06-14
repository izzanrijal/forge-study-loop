
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
    .slice(0, 2);

  return (
    <Layout>
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold">
              Welcome back{userProfile?.full_name ? `, ${userProfile.full_name}` : ''}!
            </h1>
            <p className="text-muted-foreground mt-1">
              Ready to continue your learning journey?
            </p>
          </div>
          <Link to="/upload">
            <Button className="gap-2">
              <Plus className="w-4 h-4" />
              Upload PDF
            </Button>
          </Link>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
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
                  ? Math.round(transformedLearningObjectives.reduce((acc, lo) => acc + lo.masteryPercent, 0) / transformedLearningObjectives.length)
                  : 0}%
              </div>
              <p className="text-xs text-muted-foreground">
                Across all topics
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column */}
          <div className="lg:col-span-2 space-y-6">
            {/* Today's Reviews - Only show if there are due questions */}
            {dueCount > 0 && (
              <div className="space-y-4">
                <h2 className="text-xl font-semibold">Today's Reviews</h2>
                <TodaysReviewCard 
                  dueCount={dueCount} 
                  estimatedMinutes={estimatedMinutes}
                />
              </div>
            )}

            {/* Recommended Learning Objectives */}
            {recommendedLOs.length > 0 && (
              <div className="space-y-4">
                <h2 className="text-xl font-semibold">Recommended for You</h2>
                <div className="grid gap-4">
                  {recommendedLOs.map((lo) => (
                    <RecommendedLOCard key={lo.id} learningObjectives={[lo]} />
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Right Column */}
          <div className="space-y-6">
            <UploadCard />
            <StreakBadgesWidget 
              streakCount={userProfile?.streak_count || 0}
              totalMasteryPoints={userProfile?.total_mastery_points || 0}
            />
          </div>
        </div>
      </div>
    </Layout>
  );
}

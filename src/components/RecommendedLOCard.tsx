
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { ChevronRight, BookOpen } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface LearningObjective {
  id: string;
  title: string;
  priority: 'High' | 'Medium' | 'Low';
  masteryPercent: number;
  source: string;
}

interface RecommendedLOCardProps {
  learningObjectives: LearningObjective[];
}

const priorityColors = {
  High: 'bg-red-500/10 text-red-700 dark:text-red-400',
  Medium: 'bg-yellow-500/10 text-yellow-700 dark:text-yellow-400',
  Low: 'bg-green-500/10 text-green-700 dark:text-green-400',
};

export function RecommendedLOCard({ learningObjectives }: RecommendedLOCardProps) {
  const navigate = useNavigate();

  const handleLearningObjectiveClick = (lo: LearningObjective) => {
    console.log('Navigating to learning objective:', lo.id);
    navigate('/study', { state: { learningObjective: lo } });
  };

  return (
    <Card className="rounded-xl shadow-md">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg">Recommended Learning Objectives</CardTitle>
        <CardDescription>
          Focus areas based on your progress and AI analysis
        </CardDescription>
      </CardHeader>
      <CardContent>
        {learningObjectives.length === 0 ? (
          <div className="text-center py-8 text-ash">
            <BookOpen className="w-8 h-8 mx-auto mb-3 opacity-50" />
            <p>Upload a PDF to get started with learning objectives</p>
          </div>
        ) : (
          <div className="space-y-3">
            {learningObjectives.map((lo) => (
              <div
                key={lo.id}
                className="p-4 rounded-xl border border-border hover:bg-accent/50 transition-colors cursor-pointer group"
                onClick={() => handleLearningObjectiveClick(lo)}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-2">
                      <h4 className="font-medium truncate">{lo.title}</h4>
                      <Badge 
                        variant="secondary" 
                        className={`text-xs rounded-lg ${priorityColors[lo.priority]}`}
                      >
                        {lo.priority}
                      </Badge>
                    </div>
                    <p className="text-xs text-ash mb-3">From: {lo.source}</p>
                    <div className="space-y-1">
                      <div className="flex justify-between text-xs">
                        <span className="text-ash">Mastery</span>
                        <span className="font-medium">{lo.masteryPercent}%</span>
                      </div>
                      <Progress value={lo.masteryPercent} className="h-1.5" />
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-ash group-hover:text-foreground transition-colors ml-3" />
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}


import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { BookOpen, Target, Clock } from "lucide-react";

interface StudyProgressProps {
  learningObjective: any;
  currentIndex: number;
  total: number;
  mode: 'study' | 'test';
  timeSpent?: number;
}

export function StudyProgress({ learningObjective, currentIndex, total, mode, timeSpent }: StudyProgressProps) {
  const progress = total > 0 ? ((currentIndex + 1) / total) * 100 : 0;

  return (
    <Card className="rounded-xl border border-border">
      <CardContent className="p-4">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            {mode === 'study' ? (
              <BookOpen className="w-5 h-5 text-blue-600" />
            ) : (
              <Target className="w-5 h-5 text-primary" />
            )}
            <div>
              <h3 className="font-semibold text-sm">{learningObjective.title}</h3>
              <p className="text-xs text-ash">
                {mode === 'study' ? 'Study Session' : 'Repetition Test'}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="secondary" className={`rounded-xl ${
              learningObjective.priority === 'High' ? 'bg-red-500/10 text-red-700 dark:text-red-400' :
              learningObjective.priority === 'Medium' ? 'bg-yellow-500/10 text-yellow-700 dark:text-yellow-400' :
              'bg-green-500/10 text-green-700 dark:text-green-400'
            }`}>
              {learningObjective.priority} Priority
            </Badge>
            {total > 0 && (
              <Badge variant="outline" className="rounded-xl">
                {currentIndex + 1} of {total}
              </Badge>
            )}
          </div>
        </div>
        
        {total > 0 && (
          <div className="space-y-2">
            <div className="flex justify-between text-xs">
              <span className="text-ash">Progress</span>
              <span className="font-medium">{Math.round(progress)}%</span>
            </div>
            <Progress value={progress} className="h-2" />
          </div>
        )}

        {timeSpent && (
          <div className="flex items-center gap-2 mt-3 text-xs text-ash">
            <Clock className="w-3 h-3" />
            <span>Time spent: {Math.floor(timeSpent / 60)}:{(timeSpent % 60).toString().padStart(2, '0')}</span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

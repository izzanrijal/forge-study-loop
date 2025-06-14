
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { BookOpen, Target, Trophy, Clock, CheckCircle } from "lucide-react";
import { Link } from "react-router-dom";

interface CompletionScreenProps {
  mode: 'study' | 'test';
  results?: {
    totalQuestions: number;
    correctAnswers: number;
    accuracy: number;
    timeSpent: number;
    masteryGained: number;
  };
}

export function CompletionScreen({ mode, results }: CompletionScreenProps) {
  return (
    <div className="text-center py-8">
      <div className="mb-6">
        <div className={`w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4 ${
          mode === 'study' ? 'bg-blue-500/10' : 'bg-green-500/10'
        }`}>
          {mode === 'study' ? (
            <BookOpen className="w-10 h-10 text-blue-600" />
          ) : (
            <Trophy className="w-10 h-10 text-green-600" />
          )}
        </div>
        <h3 className="text-2xl font-space-grotesk font-bold mb-2">
          {mode === 'study' ? 'Study Session Completed!' : 'Test Completed!'}
        </h3>
        <p className="text-ash mb-6">
          {mode === 'study' 
            ? 'Great job! You\'ve finished reading the material.' 
            : 'Excellent work! Your answers have been recorded for spaced repetition.'}
        </p>
      </div>

      {mode === 'test' && results && (
        <Card className="rounded-xl border border-border mb-6 max-w-md mx-auto">
          <CardContent className="p-6">
            <h4 className="font-semibold mb-4">Your Results</h4>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-ash">Questions:</span>
                  <span className="font-medium">{results.totalQuestions}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-ash">Correct:</span>
                  <span className="font-medium text-green-600">{results.correctAnswers}</span>
                </div>
              </div>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-ash">Accuracy:</span>
                  <Badge variant={results.accuracy >= 80 ? "default" : "secondary"} className="rounded-xl">
                    {results.accuracy}%
                  </Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-ash">Time:</span>
                  <div className="flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    <span className="font-medium">{Math.floor(results.timeSpent / 60)}m</span>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="mt-4 pt-4 border-t border-border">
              <div className="flex items-center justify-between">
                <span className="text-ash">Mastery Gained:</span>
                <div className="flex items-center gap-1">
                  <Target className="w-4 h-4 text-primary" />
                  <span className="font-medium text-primary">+{results.masteryGained}%</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="flex gap-3 justify-center">
        <Link to="/">
          <Button variant="outline" className="rounded-xl">
            Dashboard
          </Button>
        </Link>
        <Link to="/study">
          <Button className="rounded-xl bg-primary hover:bg-primary/90">
            {mode === 'study' ? 'Take Test Now' : 'Study More'}
          </Button>
        </Link>
      </div>
    </div>
  );
}

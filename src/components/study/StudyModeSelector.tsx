
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { BookOpen, Brain, Clock, Target } from "lucide-react";

interface StudyModeSelectorProps {
  learningObjective: any;
  onModeSelect: (mode: 'study' | 'test') => void;
  availableQuestions: number;
}

export function StudyModeSelector({ learningObjective, onModeSelect, availableQuestions }: StudyModeSelectorProps) {
  return (
    <div className="space-y-6">
      <div className="text-center mb-8">
        <h2 className="text-2xl font-space-grotesk font-bold mb-3">Choose Your Learning Mode</h2>
        <p className="text-ash text-lg">How would you like to study this topic?</p>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Study Mode */}
        <Card className="rounded-xl shadow-md hover:shadow-lg transition-all cursor-pointer border-2 hover:border-primary/20" 
              onClick={() => onModeSelect('study')}>
          <CardHeader className="text-center pb-4">
            <div className="w-16 h-16 bg-blue-500/10 rounded-full flex items-center justify-center mx-auto mb-4">
              <BookOpen className="w-8 h-8 text-blue-600" />
            </div>
            <CardTitle className="text-xl">Study Session</CardTitle>
            <CardDescription>Read and learn the material</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-sm">
                <BookOpen className="w-4 h-4 text-blue-600" />
                <span>Read learning material</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <Brain className="w-4 h-4 text-blue-600" />
                <span>Understand concepts</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <Target className="w-4 h-4 text-blue-600" />
                <span>Self-paced learning</span>
              </div>
            </div>
            <Button className="w-full rounded-xl bg-blue-600 hover:bg-blue-700">
              Start Study Session
            </Button>
          </CardContent>
        </Card>

        {/* Test Mode */}
        <Card className="rounded-xl shadow-md hover:shadow-lg transition-all cursor-pointer border-2 hover:border-primary/20" 
              onClick={() => onModeSelect('test')}>
          <CardHeader className="text-center pb-4">
            <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
              <Brain className="w-8 h-8 text-primary" />
            </div>
            <CardTitle className="text-xl">Repetition Test</CardTitle>
            <CardDescription>MCQ test with spaced repetition</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-sm">
                <Target className="w-4 h-4 text-primary" />
                <span>Multiple choice questions</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <Clock className="w-4 h-4 text-primary" />
                <span>Spaced repetition algorithm</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <Brain className="w-4 h-4 text-primary" />
                <span>Test mastery & retention</span>
              </div>
            </div>
            <div className="flex items-center justify-between text-xs text-ash mb-3">
              <span>Available Questions:</span>
              <Badge variant="outline" className="rounded-xl">
                {availableQuestions}
              </Badge>
            </div>
            <Button className="w-full rounded-xl bg-primary hover:bg-primary/90">
              Start Repetition Test
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

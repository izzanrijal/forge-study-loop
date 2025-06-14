
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";

interface RepetitionTestProps {
  questions: any[];
  currentQuestionIndex: number;
  onAnswerSubmit: (answer: string) => void;
  onDifficultyResponse: (difficulty: 'easy' | 'medium' | 'hard') => void;
  phase: 'question' | 'answered';
}

export function RepetitionTest({ 
  questions, 
  currentQuestionIndex, 
  onAnswerSubmit, 
  onDifficultyResponse, 
  phase 
}: RepetitionTestProps) {
  const [selectedAnswer, setSelectedAnswer] = useState<string>('');
  const currentQuestion = questions[currentQuestionIndex];

  if (!currentQuestion) return null;

  const handleSubmit = () => {
    onAnswerSubmit(selectedAnswer);
  };

  const progress = ((currentQuestionIndex + 1) / questions.length) * 100;

  return (
    <div className="space-y-6">
      {/* Progress Bar */}
      <div className="space-y-2">
        <div className="flex justify-between text-sm">
          <span className="text-ash">Question Progress</span>
          <span className="font-medium">{currentQuestionIndex + 1} of {questions.length}</span>
        </div>
        <Progress value={progress} className="h-2" />
      </div>

      {/* Question Card */}
      <Card className="rounded-xl border-2 border-primary/20">
        <CardContent className="p-6">
          <div className="prose prose-sm max-w-none">
            <h3 className="font-space-grotesk font-semibold mb-4 text-primary">
              Question {currentQuestionIndex + 1}
            </h3>
            <p className="text-foreground leading-relaxed text-lg mb-6">
              {currentQuestion.content}
            </p>

            <div className="space-y-4">
              <RadioGroup 
                value={selectedAnswer} 
                onValueChange={setSelectedAnswer} 
                disabled={phase === 'answered'}
              >
                <div className="flex items-center space-x-2 p-3 rounded-lg border hover:bg-muted/50">
                  <RadioGroupItem value="a" id="option-a" />
                  <Label htmlFor="option-a" className="flex-1 cursor-pointer">
                    Option A: This is the first possible answer choice
                  </Label>
                </div>
                <div className="flex items-center space-x-2 p-3 rounded-lg border hover:bg-muted/50">
                  <RadioGroupItem value="b" id="option-b" />
                  <Label htmlFor="option-b" className="flex-1 cursor-pointer">
                    Option B: This is the second possible answer choice
                  </Label>
                </div>
                <div className="flex items-center space-x-2 p-3 rounded-lg border hover:bg-muted/50">
                  <RadioGroupItem value="c" id="option-c" />
                  <Label htmlFor="option-c" className="flex-1 cursor-pointer">
                    Option C: This is the third possible answer choice
                  </Label>
                </div>
                <div className="flex items-center space-x-2 p-3 rounded-lg border hover:bg-muted/50">
                  <RadioGroupItem value="d" id="option-d" />
                  <Label htmlFor="option-d" className="flex-1 cursor-pointer">
                    Option D: This is the fourth possible answer choice
                  </Label>
                </div>
                <div className="flex items-center space-x-2 p-3 rounded-lg border border-ash/30 hover:bg-muted/50">
                  <RadioGroupItem value="unknown" id="option-unknown" />
                  <Label htmlFor="option-unknown" className="flex-1 cursor-pointer text-ash">
                    I don't know the answer
                  </Label>
                </div>
              </RadioGroup>
            </div>

            {phase === 'answered' && (
              <div className="mt-6 p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
                <h4 className="font-semibold mb-2 text-green-800 dark:text-green-200">Correct Answer</h4>
                <p className="text-green-700 dark:text-green-300 leading-relaxed">
                  {currentQuestion.answer}
                </p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Action Buttons */}
      <div className="flex justify-center">
        {phase === 'question' ? (
          <Button 
            className="rounded-xl bg-primary hover:bg-primary/90 px-8"
            onClick={handleSubmit}
            disabled={!selectedAnswer}
          >
            Submit Answer
          </Button>
        ) : (
          <div className="flex gap-3">
            <Button 
              variant="outline" 
              className="rounded-xl"
              onClick={() => onDifficultyResponse('hard')}
            >
              Hard
            </Button>
            <Button 
              variant="outline" 
              className="rounded-xl"
              onClick={() => onDifficultyResponse('medium')}
            >
              Medium
            </Button>
            <Button 
              className="rounded-xl bg-primary hover:bg-primary/90"
              onClick={() => onDifficultyResponse('easy')}
            >
              Easy
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}

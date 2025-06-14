
import { TopBar } from "@/components/TopBar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, BookOpen } from "lucide-react";
import { Link, useLocation } from "react-router-dom";
import { mockLearningObjectives, mockQuestions } from "@/data/mockData";
import { useState } from "react";

export default function Study() {
  const location = useLocation();
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [showAnswer, setShowAnswer] = useState(false);
  
  // Get learning objective from navigation state or use default
  const learningObjective = location.state?.learningObjective || mockLearningObjectives[0];
  const relatedQuestions = mockQuestions.filter(q => q.learningObjectiveId === learningObjective.id);
  const currentQuestion = relatedQuestions[currentQuestionIndex];

  const handleShowAnswer = () => {
    setShowAnswer(true);
  };

  const handleNextQuestion = () => {
    if (currentQuestionIndex < relatedQuestions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
      setShowAnswer(false);
    } else {
      console.log('Study session completed!');
      // Navigate back to dashboard with completion message
    }
  };

  const handleDifficultyResponse = (difficulty: 'easy' | 'medium' | 'hard') => {
    console.log(`User rated question as: ${difficulty}`);
    // This would update spaced repetition algorithm
    handleNextQuestion();
  };

  return (
    <div className="min-h-screen bg-background">
      <TopBar title="Study Session" />
      
      <div className="p-6 max-w-4xl mx-auto">
        <div className="mb-6">
          <Link to="/" className="inline-flex items-center gap-2 text-ash hover:text-foreground transition-colors">
            <ArrowLeft className="w-4 h-4" />
            Back to Dashboard
          </Link>
        </div>

        <Card className="rounded-xl shadow-md">
          <CardHeader className="border-b border-border">
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-3">
                <BookOpen className="w-5 h-5 text-primary" />
                {learningObjective.title}
              </CardTitle>
              <div className="flex items-center gap-2">
                <Badge variant="secondary" className={`rounded-xl ${
                  learningObjective.priority === 'High' ? 'bg-red-500/10 text-red-700 dark:text-red-400' :
                  learningObjective.priority === 'Medium' ? 'bg-yellow-500/10 text-yellow-700 dark:text-yellow-400' :
                  'bg-green-500/10 text-green-700 dark:text-green-400'
                }`}>
                  {learningObjective.priority} Priority
                </Badge>
                <Badge variant="outline" className="rounded-xl">
                  {currentQuestionIndex + 1} of {relatedQuestions.length}
                </Badge>
              </div>
            </div>
          </CardHeader>
          
          <CardContent className="p-6">
            {currentQuestion ? (
              <div className="space-y-6">
                <div className="prose prose-sm max-w-none">
                  <h3 className="font-space-grotesk font-semibold mb-4">Question</h3>
                  <p className="text-foreground leading-relaxed text-lg">
                    {currentQuestion.content}
                  </p>
                </div>

                {showAnswer && (
                  <div className="prose prose-sm max-w-none">
                    <h3 className="font-space-grotesk font-semibold mb-4">Answer</h3>
                    <div className="bg-muted p-4 rounded-lg">
                      <p className="text-foreground leading-relaxed">
                        {currentQuestion.answer}
                      </p>
                    </div>
                  </div>
                )}
                
                <div className="flex justify-between items-center pt-6 border-t border-border">
                  <div className="text-sm text-ash">
                    From: {learningObjective.source} • Difficulty: {currentQuestion.difficulty}
                  </div>
                  
                  <div className="flex gap-3">
                    {!showAnswer ? (
                      <Button 
                        className="rounded-xl bg-primary hover:bg-primary/90"
                        onClick={handleShowAnswer}
                      >
                        Show Answer
                      </Button>
                    ) : (
                      <div className="flex gap-2">
                        <Button 
                          variant="outline" 
                          className="rounded-xl"
                          onClick={() => handleDifficultyResponse('hard')}
                        >
                          Hard
                        </Button>
                        <Button 
                          variant="outline" 
                          className="rounded-xl"
                          onClick={() => handleDifficultyResponse('medium')}
                        >
                          Medium
                        </Button>
                        <Button 
                          className="rounded-xl bg-primary hover:bg-primary/90"
                          onClick={() => handleDifficultyResponse('easy')}
                        >
                          Easy
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center py-8">
                <p className="text-ash mb-4">No questions available for this learning objective.</p>
                <Link to="/">
                  <Button className="rounded-xl">Return to Dashboard</Button>
                </Link>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

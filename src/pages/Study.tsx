
import { TopBar } from "@/components/TopBar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { ArrowLeft, BookOpen, Clock } from "lucide-react";
import { Link, useLocation } from "react-router-dom";
import { mockLearningObjectives, mockQuestions } from "@/data/mockData";
import { useState } from "react";

type StudyPhase = 'reading' | 'question' | 'answered' | 'completed';

export default function Study() {
  const location = useLocation();
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [phase, setPhase] = useState<StudyPhase>('reading');
  const [selectedAnswer, setSelectedAnswer] = useState<string>('');
  const [readingTime, setReadingTime] = useState(0);
  
  // Get learning objective from navigation state or use default
  const learningObjective = location.state?.learningObjective || mockLearningObjectives[0];
  const relatedQuestions = mockQuestions.filter(q => q.learningObjectiveId === learningObjective.id);
  const currentQuestion = relatedQuestions[currentQuestionIndex];

  // Start reading timer when component mounts
  useState(() => {
    const timer = setInterval(() => {
      if (phase === 'reading') {
        setReadingTime(prev => prev + 1);
      }
    }, 1000);
    return () => clearInterval(timer);
  });

  const handleFinishReading = () => {
    setPhase('question');
  };

  const handleAnswerSubmit = () => {
    if (selectedAnswer) {
      setPhase('answered');
    }
  };

  const handleDifficultyResponse = (difficulty: 'easy' | 'medium' | 'hard') => {
    console.log(`User rated question as: ${difficulty}, answered: ${selectedAnswer}`);
    // This would update spaced repetition algorithm
    
    if (currentQuestionIndex < relatedQuestions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
      setSelectedAnswer('');
      setPhase('reading');
      setReadingTime(0);
    } else {
      setPhase('completed');
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
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
                {phase === 'reading' && (
                  <Badge variant="outline" className="rounded-xl flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {formatTime(readingTime)}
                  </Badge>
                )}
              </div>
            </div>
          </CardHeader>
          
          <CardContent className="p-6">
            {phase === 'completed' ? (
              <div className="text-center py-8">
                <div className="mb-4">
                  <div className="w-16 h-16 bg-green-500/10 rounded-full flex items-center justify-center mx-auto mb-4">
                    <BookOpen className="w-8 h-8 text-green-600" />
                  </div>
                  <h3 className="text-xl font-semibold mb-2">Study Session Completed!</h3>
                  <p className="text-ash mb-6">Great job! You've completed all questions for this learning objective.</p>
                </div>
                <Link to="/">
                  <Button className="rounded-xl bg-primary hover:bg-primary/90">
                    Return to Dashboard
                  </Button>
                </Link>
              </div>
            ) : currentQuestion ? (
              <div className="space-y-6">
                {phase === 'reading' && (
                  <div className="prose prose-sm max-w-none">
                    <h3 className="font-space-grotesk font-semibold mb-4">Reading Material</h3>
                    <div className="bg-muted p-6 rounded-lg mb-6">
                      <p className="text-foreground leading-relaxed text-base mb-4">
                        This section covers the fundamental concepts related to {learningObjective.title.toLowerCase()}. 
                        Understanding these principles is crucial for mastering the topic.
                      </p>
                      <p className="text-foreground leading-relaxed text-base mb-4">
                        React Hooks provide a powerful way to manage state and side effects in functional components. 
                        The useState hook allows you to add state to functional components, while useEffect enables 
                        you to perform side effects such as data fetching, subscriptions, or manually changing the DOM.
                      </p>
                      <p className="text-foreground leading-relaxed text-base">
                        Key concepts include: understanding when to use different hooks, proper dependency arrays 
                        for useEffect, and avoiding common pitfalls like infinite re-renders. These fundamentals 
                        form the basis for building robust React applications.
                      </p>
                    </div>
                    
                    <div className="flex justify-end">
                      <Button 
                        className="rounded-xl bg-primary hover:bg-primary/90"
                        onClick={handleFinishReading}
                      >
                        I've Finished Reading
                      </Button>
                    </div>
                  </div>
                )}

                {(phase === 'question' || phase === 'answered') && (
                  <div className="prose prose-sm max-w-none">
                    <h3 className="font-space-grotesk font-semibold mb-4">Question</h3>
                    <p className="text-foreground leading-relaxed text-lg mb-6">
                      {currentQuestion.content}
                    </p>

                    <div className="space-y-4">
                      <RadioGroup value={selectedAnswer} onValueChange={setSelectedAnswer} disabled={phase === 'answered'}>
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
                      <div className="mt-6 p-4 bg-muted rounded-lg">
                        <h4 className="font-semibold mb-2">Correct Answer</h4>
                        <p className="text-foreground leading-relaxed">
                          {currentQuestion.answer}
                        </p>
                      </div>
                    )}
                  </div>
                )}
                
                <div className="flex justify-between items-center pt-6 border-t border-border">
                  <div className="text-sm text-ash">
                    From: {learningObjective.source} • Difficulty: {currentQuestion.difficulty}
                  </div>
                  
                  <div className="flex gap-3">
                    {phase === 'question' ? (
                      <Button 
                        className="rounded-xl bg-primary hover:bg-primary/90"
                        onClick={handleAnswerSubmit}
                        disabled={!selectedAnswer}
                      >
                        Submit Answer
                      </Button>
                    ) : phase === 'answered' ? (
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
                    ) : null}
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

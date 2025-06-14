import { Card, CardContent } from "@/components/ui/card";
import { ArrowLeft } from "lucide-react";
import { Link, useLocation } from "react-router-dom";
import { mockLearningObjectives, mockQuestions } from "@/data/mockData";
import { useState } from "react";
import { StudyModeSelector } from "@/components/study/StudyModeSelector";
import { ReadingMode } from "@/components/study/ReadingMode";
import { RepetitionTest } from "@/components/study/RepetitionTest";
import { StudyProgress } from "@/components/study/StudyProgress";
import { CompletionScreen } from "@/components/study/CompletionScreen";
import { Layout } from "@/components/Layout";
import type { StudyMode, StudyPhase } from "@/types/study";

export default function Study() {
  const location = useLocation();
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [phase, setPhase] = useState<StudyPhase>('mode-selection');
  const [mode, setMode] = useState<StudyMode>('study');
  const [selectedAnswer, setSelectedAnswer] = useState<string>('');
  const [testResults, setTestResults] = useState<any>(null);
  
  // Get learning objective from navigation state or use default
  const learningObjective = location.state?.learningObjective || mockLearningObjectives[0];
  const relatedQuestions = mockQuestions.filter(q => q.learningObjectiveId === learningObjective.id);
  const currentQuestion = relatedQuestions[currentQuestionIndex];

  const handleModeSelect = (selectedMode: StudyMode) => {
    setMode(selectedMode);
    setPhase(selectedMode === 'study' ? 'reading' : 'question');
  };

  const handleFinishReading = () => {
    setPhase('question');
  };

  const handleAnswerSubmit = (answer: string) => {
    setSelectedAnswer(answer);
    setPhase('answered');
  };

  const handleDifficultyResponse = (difficulty: 'easy' | 'medium' | 'hard') => {
    console.log(`User rated question as: ${difficulty}, answered: ${selectedAnswer}`);
    
    if (currentQuestionIndex < relatedQuestions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
      setSelectedAnswer('');
      setPhase(mode === 'study' ? 'reading' : 'question');
    } else {
      // Calculate results for test mode
      if (mode === 'test') {
        setTestResults({
          totalQuestions: relatedQuestions.length,
          correctAnswers: Math.floor(relatedQuestions.length * 0.8), // Mock data
          accuracy: 80,
          timeSpent: 900, // 15 minutes
          masteryGained: 12
        });
      }
      setPhase('completed');
    }
  };

  return (
    <Layout>
      <div className="p-6 max-w-4xl mx-auto">
        <div className="mb-6">
          <Link to="/" className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors">
            <ArrowLeft className="w-4 h-4" />
            Back to Dashboard
          </Link>
        </div>

        {/* Progress Header - Only show after mode selection */}
        {phase !== 'mode-selection' && phase !== 'completed' && (
          <div className="mb-6">
            <StudyProgress 
              learningObjective={learningObjective}
              currentIndex={currentQuestionIndex}
              total={mode === 'study' ? relatedQuestions.length : relatedQuestions.length}
              mode={mode}
            />
          </div>
        )}

        <Card className="rounded-xl shadow-md">
          <CardContent className="p-6">
            {phase === 'mode-selection' && (
              <StudyModeSelector 
                learningObjective={learningObjective}
                onModeSelect={handleModeSelect}
                availableQuestions={relatedQuestions.length}
              />
            )}

            {phase === 'completed' ? (
              <CompletionScreen 
                mode={mode}
                results={mode === 'test' ? testResults : undefined}
              />
            ) : phase === 'reading' && mode === 'study' ? (
              <ReadingMode 
                learningObjective={learningObjective}
                onFinishReading={handleFinishReading}
              />
            ) : (phase === 'question' || phase === 'answered') && currentQuestion ? (
              <RepetitionTest 
                questions={relatedQuestions}
                currentQuestionIndex={currentQuestionIndex}
                onAnswerSubmit={handleAnswerSubmit}
                onDifficultyResponse={handleDifficultyResponse}
                phase={phase as 'question' | 'answered'}
              />
            ) : relatedQuestions.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-muted-foreground mb-4">No questions available for this learning objective.</p>
                <Link to="/">
                  <button className="rounded-xl bg-primary hover:bg-primary/90 text-white px-6 py-2">
                    Return to Dashboard
                  </button>
                </Link>
              </div>
            ) : null}
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
}

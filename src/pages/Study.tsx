
import { Card, CardContent } from "@/components/ui/card";
import { ArrowLeft } from "lucide-react";
import { Link, useLocation } from "react-router-dom";
import { useState } from "react";
import { StudyModeSelector } from "@/components/study/StudyModeSelector";
import { ReadingMode } from "@/components/study/ReadingMode";
import { RepetitionTest } from "@/components/study/RepetitionTest";
import { StudyProgress } from "@/components/study/StudyProgress";
import { CompletionScreen } from "@/components/study/CompletionScreen";
import { EmptyState } from "@/components/EmptyState";
import { Layout } from "@/components/Layout";
import { useRealData } from "@/hooks/useRealData";
import { useQuestions } from "@/hooks/useSupabaseData";
import type { StudyMode, StudyPhase } from "@/types/study";
import { BookOpen } from "lucide-react";

export default function Study() {
  const location = useLocation();
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [phase, setPhase] = useState<StudyPhase>('mode-selection');
  const [mode, setMode] = useState<StudyMode>('study');
  const [selectedAnswer, setSelectedAnswer] = useState<string>('');
  const [testResults, setTestResults] = useState<any>(null);
  
  // Get real data from database
  const { learningObjectives, isLoading } = useRealData();
  
  // Get learning objective from navigation state or use first available
  const learningObjective = location.state?.learningObjective || learningObjectives[0];
  
  // Get questions for the selected learning objective
  const { data: questions = [], isLoading: questionsLoading } = useQuestions(
    learningObjective?.id || ''
  );
  
  const currentQuestion = questions[currentQuestionIndex];

  // Show loading state
  if (isLoading || questionsLoading) {
    return (
      <Layout>
        <div className="p-6">
          <div className="animate-pulse space-y-6">
            <div className="h-8 bg-gray-200 rounded w-1/3"></div>
            <div className="h-96 bg-gray-200 rounded-lg"></div>
          </div>
        </div>
      </Layout>
    );
  }

  // Show empty state if no learning objectives exist
  if (!learningObjectives.length) {
    return (
      <Layout>
        <div className="p-6 max-w-4xl mx-auto">
          <div className="mb-6">
            <Link to="/" className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors">
              <ArrowLeft className="w-4 h-4" />
              Back to Dashboard
            </Link>
          </div>
          
          <EmptyState 
            title="No Learning Objectives Available"
            description="You need to upload a PDF document first to create learning objectives and start studying."
            actionLabel="Upload Your First PDF"
            actionLink="/upload"
            icon={BookOpen}
            type="upload"
          />
        </div>
      </Layout>
    );
  }

  // Show empty state if no questions available for the learning objective
  if (learningObjective && questions.length === 0) {
    return (
      <Layout>
        <div className="p-6 max-w-4xl mx-auto">
          <div className="mb-6">
            <Link to="/" className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors">
              <ArrowLeft className="w-4 h-4" />
              Back to Dashboard
            </Link>
          </div>
          
          <EmptyState 
            title="No Questions Available"
            description={`No questions have been generated for "${learningObjective.title}" yet. Questions are created automatically during PDF processing.`}
            actionLabel="Go to Dashboard"
            actionLink="/"
            icon={BookOpen}
            type="general"
          />
        </div>
      </Layout>
    );
  }

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
    
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
      setSelectedAnswer('');
      setPhase(mode === 'study' ? 'reading' : 'question');
    } else {
      // Calculate results for test mode
      if (mode === 'test') {
        setTestResults({
          totalQuestions: questions.length,
          correctAnswers: Math.floor(questions.length * 0.8), // Mock calculation
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
              total={questions.length}
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
                availableQuestions={questions.length}
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
                questions={questions}
                currentQuestionIndex={currentQuestionIndex}
                onAnswerSubmit={handleAnswerSubmit}
                onDifficultyResponse={handleDifficultyResponse}
                phase={phase as 'question' | 'answered'}
              />
            ) : null}
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
}

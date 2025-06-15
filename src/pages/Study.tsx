
import { Card, CardContent } from "@/components/ui/card";
import { ArrowLeft } from "lucide-react";
import { Link, useLocation, useSearchParams } from "react-router-dom";
import { useState, useEffect } from "react";
import { StudyModeSelector } from "@/components/study/StudyModeSelector";
import { ReadingMode } from "@/components/study/ReadingMode";
import { RepetitionTest } from "@/components/study/RepetitionTest";
import { StudyProgress } from "@/components/study/StudyProgress";
import { CompletionScreen } from "@/components/study/CompletionScreen";
import { EmptyState } from "@/components/EmptyState";
import { Layout } from "@/components/Layout";
import { useRealData } from "@/hooks/useRealData";
import { useQuestions } from "@/hooks/useSupabaseData";
import { useStudySession } from "@/hooks/useStudySession";
import { useQuestionPool } from "@/hooks/useQuestionPool";
import { useAnonymousStudy } from "@/hooks/useAnonymousStudy";
import type { StudyMode, StudyPhase } from "@/types/study";
import { BookOpen } from "lucide-react";

export default function Study() {
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [phase, setPhase] = useState<StudyPhase>('mode-selection');
  const [mode, setMode] = useState<StudyMode>('study');
  const [selectedAnswer, setSelectedAnswer] = useState<string>('');
  const [testResults, setTestResults] = useState<any>(null);
  const [studyQuestions, setStudyQuestions] = useState<any[]>([]);
  const [currentSessionId, setCurrentSessionId] = useState<string>('');
  
  // Hooks
  const { learningObjectives, isLoading } = useRealData();
  const { createStudySession, updateStudySession, recordStudyAttempt } = useStudySession();
  const { getUniqueQuestions } = useQuestionPool();
  const { startAnonymousStudy, studyData: anonymousData, submitAnonymousAnswer } = useAnonymousStudy();
  
  // Check for anonymous study parameters
  const anonymousToken = searchParams.get('anonymous_token');
  const loId = searchParams.get('lo_id');
  const isAnonymousMode = Boolean(anonymousToken && loId);
  
  // Get learning objective
  const learningObjective = isAnonymousMode 
    ? anonymousData?.learningObjective 
    : location.state?.learningObjective || learningObjectives[0];
  
  // Get questions for the selected learning objective
  const { data: allQuestions = [], isLoading: questionsLoading } = useQuestions(
    learningObjective?.id || ''
  );

  // Initialize anonymous study if needed
  useEffect(() => {
    if (isAnonymousMode && anonymousToken && loId && !anonymousData) {
      startAnonymousStudy(anonymousToken, loId);
    }
  }, [isAnonymousMode, anonymousToken, loId, anonymousData, startAnonymousStudy]);

  const currentQuestion = studyQuestions[currentQuestionIndex];

  // Show loading state
  if (isLoading || questionsLoading || (isAnonymousMode && !anonymousData)) {
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
  if (!isAnonymousMode && !learningObjectives.length) {
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

  const availableQuestions = isAnonymousMode ? anonymousData?.questions || [] : allQuestions;

  // Show empty state if no questions available for the learning objective
  if (learningObjective && availableQuestions.length === 0) {
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

  const handleModeSelect = async (selectedMode: StudyMode) => {
    setMode(selectedMode);
    
    try {
      // Create study session
      const sessionData = await createStudySession(
        selectedMode,
        availableQuestions.length,
        isAnonymousMode,
        isAnonymousMode ? anonymousToken : undefined
      );
      setCurrentSessionId(sessionData.id);
      
      // Get unique questions for this session
      const uniqueQuestions = await getUniqueQuestions(
        learningObjective.id,
        selectedMode,
        selectedMode === 'study' ? 10 : 15
      );
      setStudyQuestions(uniqueQuestions);
      
      // Always start with reading phase - show ALL content first
      setPhase('reading');
    } catch (error) {
      console.error('Error starting session:', error);
    }
  };

  const handleFinishReading = () => {
    // After reading ALL content, go to questions
    setPhase('question');
  };

  const handleAnswerSubmit = (answer: string) => {
    setSelectedAnswer(answer);
    setPhase('answered');
  };

  const handleDifficultyResponse = async (difficulty: 'easy' | 'medium' | 'hard') => {
    const isCorrect = selectedAnswer === currentQuestion.correct_answer;
    const responseTime = 30; // Default response time, you can track actual time
    
    try {
      // Record study attempt
      if (isAnonymousMode && anonymousData) {
        await submitAnonymousAnswer(
          currentSessionId,
          currentQuestion.id,
          selectedAnswer,
          isCorrect,
          responseTime
        );
      } else {
        await recordStudyAttempt(
          currentSessionId,
          currentQuestion.id,
          selectedAnswer,
          isCorrect,
          responseTime,
          difficulty
        );
      }
    } catch (error) {
      console.error('Error recording attempt:', error);
    }
    
    if (currentQuestionIndex < studyQuestions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
      setSelectedAnswer('');
      setPhase('question'); // Stay in question phase, no more reading
    } else {
      // Calculate final results
      const correctAnswers = Math.floor(studyQuestions.length * 0.8); // Mock calculation
      const accuracy = (correctAnswers / studyQuestions.length) * 100;
      
      // Update session
      try {
        await updateStudySession(currentSessionId, {
          correct_answers: correctAnswers,
          accuracy: accuracy,
          time_spent: 900, // 15 minutes mock
          mastery_gained: Math.floor(accuracy / 10),
          completed_at: new Date().toISOString()
        });
      } catch (error) {
        console.error('Error updating session:', error);
      }
      
      if (mode === 'test') {
        setTestResults({
          totalQuestions: studyQuestions.length,
          correctAnswers: correctAnswers,
          accuracy: accuracy,
          timeSpent: 900,
          masteryGained: Math.floor(accuracy / 10)
        });
      }
      setPhase('completed');
    }
  };

  return (
    <Layout>
      <div className="p-6 max-w-4xl mx-auto">
        {!isAnonymousMode && (
          <div className="mb-6">
            <Link to="/" className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors">
              <ArrowLeft className="w-4 h-4" />
              Back to Dashboard
            </Link>
          </div>
        )}

        {/* Progress Header - Only show during questions */}
        {phase === 'question' || phase === 'answered' ? (
          <div className="mb-6">
            <StudyProgress 
              learningObjective={learningObjective}
              currentIndex={currentQuestionIndex}
              total={studyQuestions.length}
              mode={mode}
            />
          </div>
        ) : null}

        <Card className="rounded-xl shadow-md">
          <CardContent className="p-6">
            {phase === 'mode-selection' && (
              <StudyModeSelector 
                learningObjective={learningObjective}
                onModeSelect={handleModeSelect}
                availableQuestions={availableQuestions.length}
              />
            )}

            {phase === 'completed' ? (
              <CompletionScreen 
                mode={mode}
                results={mode === 'test' ? testResults : undefined}
              />
            ) : phase === 'reading' ? (
              <ReadingMode 
                learningObjective={learningObjective}
                onFinishReading={handleFinishReading}
              />
            ) : (phase === 'question' || phase === 'answered') && currentQuestion ? (
              <RepetitionTest 
                questions={studyQuestions}
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

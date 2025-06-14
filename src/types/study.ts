
export type StudyMode = 'study' | 'test';
export type StudyPhase = 'mode-selection' | 'reading' | 'question' | 'answered' | 'completed';

export interface StudySession {
  mode: StudyMode;
  phase: StudyPhase;
  currentQuestionIndex: number;
  selectedAnswer: string;
  startTime: Date;
  answers: Array<{
    questionId: string;
    selectedAnswer: string;
    isCorrect: boolean;
    responseTime: number;
  }>;
}

export interface TestResult {
  totalQuestions: number;
  correctAnswers: number;
  accuracy: number;
  timeSpent: number;
  masteryGained: number;
}


// Centralized mock data that will serve as API specification guidance
// This data structure should match the expected API responses

export interface User {
  id: string;
  email: string;
  name: string;
  streak: number;
  totalQuestions: number;
  accuracy: number;
  joinDate: string;
}

export interface LearningObjective {
  id: string;
  title: string;
  priority: 'High' | 'Medium' | 'Low';
  masteryPercent: number;
  source: string;
  sourceType: 'pdf' | 'upload';
  createdAt: string;
  dueDate?: string;
  tags: string[];
}

export interface ReviewSession {
  id: string;
  date: string;
  questions: number;
  accuracy: number;
  timeSpent: number; // minutes
  masteryGained: number;
  learningObjectiveId: string;
}

export interface Question {
  id: string;
  content: string;
  answer: string;
  learningObjectiveId: string;
  difficulty: 'easy' | 'medium' | 'hard';
  nextReviewDate: string;
  repetitionCount: number;
  lastReviewed?: string;
}

export interface Badge {
  id: string;
  name: string;
  description: string;
  earned: boolean;
  icon: string;
  unlockedAt?: string;
  requirement: string;
}

export interface ProgressData {
  date: string;
  mastery: number;
  questionsAnswered: number;
  timeSpent: number;
}

// Mock data instances
export const mockUser: User = {
  id: 'user-1',
  email: 'user@example.com',
  name: 'John Doe',
  streak: 12,
  totalQuestions: 247,
  accuracy: 85,
  joinDate: '2024-01-01'
};

export const mockLearningObjectives: LearningObjective[] = [
  {
    id: 'lo-1',
    title: 'Understanding React Hooks Fundamentals',
    priority: 'High',
    masteryPercent: 65,
    source: 'react-advanced-patterns.pdf',
    sourceType: 'pdf',
    createdAt: '2024-01-15',
    dueDate: '2024-02-15',
    tags: ['react', 'javascript', 'frontend']
  },
  {
    id: 'lo-2',
    title: 'Database Normalization Principles',
    priority: 'Medium',
    masteryPercent: 40,
    source: 'database-design-guide.pdf',
    sourceType: 'pdf',
    createdAt: '2024-01-10',
    tags: ['database', 'sql', 'design']
  },
  {
    id: 'lo-3',
    title: 'Async/Await Error Handling',
    priority: 'Low',
    masteryPercent: 85,
    source: 'javascript-patterns.pdf',
    sourceType: 'pdf',
    createdAt: '2024-01-05',
    tags: ['javascript', 'async', 'error-handling']
  }
];

export const mockReviewSessions: ReviewSession[] = [
  { id: 'rs-1', date: '2024-02-12', questions: 23, accuracy: 87, timeSpent: 15, masteryGained: 5, learningObjectiveId: 'lo-1' },
  { id: 'rs-2', date: '2024-02-11', questions: 15, accuracy: 92, timeSpent: 12, masteryGained: 8, learningObjectiveId: 'lo-2' },
  { id: 'rs-3', date: '2024-02-10', questions: 31, accuracy: 79, timeSpent: 20, masteryGained: 3, learningObjectiveId: 'lo-1' },
  { id: 'rs-4', date: '2024-02-09', questions: 18, accuracy: 95, timeSpent: 10, masteryGained: 12, learningObjectiveId: 'lo-3' },
  { id: 'rs-5', date: '2024-02-08', questions: 27, accuracy: 84, timeSpent: 18, masteryGained: 6, learningObjectiveId: 'lo-2' },
];

export const mockBadges: Badge[] = [
  { id: 'b-1', name: 'First Steps', description: 'Complete first review', earned: true, icon: '🚀', unlockedAt: '2024-01-02', requirement: 'Complete 1 review session' },
  { id: 'b-2', name: 'Week Warrior', description: '7 day streak', earned: true, icon: '⚡', unlockedAt: '2024-01-09', requirement: 'Maintain 7-day streak' },
  { id: 'b-3', name: 'Speed Demon', description: 'Fast answers', earned: true, icon: '💨', unlockedAt: '2024-01-20', requirement: 'Average < 30s per question' },
  { id: 'b-4', name: 'Scholar', description: '100 questions', earned: false, icon: '📚', requirement: 'Answer 100 questions total' },
  { id: 'b-5', name: 'Perfectionist', description: '90% accuracy', earned: false, icon: '🎯', requirement: 'Achieve 90% accuracy in session' },
  { id: 'b-6', name: 'Dedicated', description: '30 day streak', earned: false, icon: '🔥', requirement: 'Maintain 30-day streak' },
  { id: 'b-7', name: 'Expert', description: 'Master 10 topics', earned: false, icon: '🏆', requirement: 'Reach 90% mastery in 10 topics' },
  { id: 'b-8', name: 'Consistent', description: 'Daily practice', earned: false, icon: '📈', requirement: 'Study every day for 2 weeks' },
];

export const mockProgressData: ProgressData[] = [
  { date: '2024-01-01', mastery: 20, questionsAnswered: 5, timeSpent: 10 },
  { date: '2024-01-08', mastery: 35, questionsAnswered: 12, timeSpent: 25 },
  { date: '2024-01-15', mastery: 45, questionsAnswered: 18, timeSpent: 30 },
  { date: '2024-01-22', mastery: 60, questionsAnswered: 25, timeSpent: 40 },
  { date: '2024-01-29', mastery: 75, questionsAnswered: 30, timeSpent: 45 },
  { date: '2024-02-05', mastery: 82, questionsAnswered: 35, timeSpent: 50 },
  { date: '2024-02-12', mastery: 78, questionsAnswered: 40, timeSpent: 55 },
];

export const mockQuestions: Question[] = [
  {
    id: 'q-1',
    content: 'Based on the reading material, what is the primary purpose of the useEffect hook in React?',
    answer: 'The useEffect hook is used to perform side effects in functional components, such as data fetching, subscriptions, or manually changing the DOM. It allows you to execute code after the component renders.',
    learningObjectiveId: 'lo-1',
    difficulty: 'medium',
    nextReviewDate: '2024-02-13',
    repetitionCount: 3,
    lastReviewed: '2024-02-10'
  },
  {
    id: 'q-2',
    content: 'According to the reading, what is a common pitfall when using React Hooks that developers should avoid?',
    answer: 'A common pitfall is creating infinite re-renders, often caused by incorrect dependency arrays in useEffect or improper state updates that trigger unnecessary re-renders.',
    learningObjectiveId: 'lo-1',
    difficulty: 'hard',
    nextReviewDate: '2024-02-14',
    repetitionCount: 1,
    lastReviewed: '2024-02-12'
  },
  {
    id: 'q-3',
    content: 'From the reading material, explain the relationship between useState and functional components.',
    answer: 'useState allows you to add state to functional components, which previously could only be achieved using class components. It provides a way to store and update values that persist between re-renders.',
    learningObjectiveId: 'lo-1',
    difficulty: 'easy',
    nextReviewDate: '2024-02-13',
    repetitionCount: 2,
    lastReviewed: '2024-02-11'
  },
  {
    id: 'q-4',
    content: 'Based on the database reading, what is the main goal of database normalization?',
    answer: 'Database normalization aims to reduce data redundancy and improve data integrity by organizing data into separate, related tables following specific normal forms.',
    learningObjectiveId: 'lo-2',
    difficulty: 'medium',
    nextReviewDate: '2024-02-14',
    repetitionCount: 1,
    lastReviewed: '2024-02-12'
  }
];

// API endpoint specifications (for future development)
export const apiSpecs = {
  endpoints: {
    // User endpoints
    'GET /api/user/profile': 'Returns User object',
    'PUT /api/user/profile': 'Updates user profile, expects User object',
    
    // Learning Objectives endpoints
    'GET /api/learning-objectives': 'Returns LearningObjective[]',
    'POST /api/learning-objectives': 'Creates new learning objective from PDF',
    'GET /api/learning-objectives/:id': 'Returns specific LearningObjective',
    'PUT /api/learning-objectives/:id': 'Updates learning objective',
    'DELETE /api/learning-objectives/:id': 'Deletes learning objective',
    
    // Review Session endpoints
    'GET /api/review-sessions': 'Returns ReviewSession[] for user',
    'POST /api/review-sessions': 'Creates new review session',
    'GET /api/review-sessions/:id': 'Returns specific ReviewSession',
    
    // Questions endpoints
    'GET /api/questions/due': 'Returns Question[] that are due for review',
    'POST /api/questions/:id/answer': 'Submits answer and updates spaced repetition',
    'GET /api/questions/by-objective/:id': 'Returns questions for learning objective',
    
    // Progress endpoints
    'GET /api/progress/chart': 'Returns ProgressData[] for charts',
    'GET /api/progress/badges': 'Returns Badge[] for user',
    'GET /api/progress/stats': 'Returns overall user statistics',
    
    // File upload endpoints
    'POST /api/upload/pdf': 'Uploads PDF and generates learning objectives'
  }
};

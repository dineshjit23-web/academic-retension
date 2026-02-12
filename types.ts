
export enum Difficulty {
  EASY = 'Easy',
  MEDIUM = 'Medium',
  HARD = 'Hard'
}

export interface ReviewSession {
  id: string;
  date: string;
  score: number; // 0-100
  timeSpent: number; // minutes
}

export interface Concept {
  id: string;
  title: string;
  subject: string;
  description: string;
  difficulty: Difficulty;
  lastReviewed: string;
  nextReviewDate: string;
  retentionScore: number; // 0-100 current estimate
  reviews: ReviewSession[];
  status: 'Mastered' | 'Reviewing' | 'New' | 'Fading';
}

export interface StudentStats {
  totalConcepts: number;
  averageRetention: number;
  studyStreak: number;
  conceptsDueToday: number;
}

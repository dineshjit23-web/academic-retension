
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
  mastery?: 'Beginner' | 'Intermediate' | 'Advanced';
}

export interface StudentStats {
  totalConcepts: number;
  averageRetention: number;
  studyStreak: number;
  conceptsDueToday: number;
}

export interface Attendance {
  id: string;
  user_id: string;
  date: string;
  status: 'Present' | 'Absent';
  semester: string;
}

export interface Assignment {
  id: string;
  user_id: string;
  title: string;
  subject: string;
  due_date: string;
  status: 'Pending' | 'Submitted';
  marks?: number;
  semester: string;
}

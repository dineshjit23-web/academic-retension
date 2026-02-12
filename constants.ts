
import { Difficulty, Concept } from './types';

export const INITIAL_CONCEPTS: Concept[] = [
  {
    id: '1',
    title: 'Newton\'s Third Law',
    subject: 'Physics',
    description: 'For every action, there is an equal and opposite reaction.',
    difficulty: Difficulty.EASY,
    lastReviewed: '2023-10-25',
    nextReviewDate: '2023-11-15',
    retentionScore: 85,
    reviews: [
      { id: 'r1', date: '2023-10-25', score: 90, timeSpent: 10 }
    ],
    status: 'Mastered'
  },
  {
    id: '2',
    title: 'Photosynthesis',
    subject: 'Biology',
    description: 'The process by which green plants and some other organisms use sunlight to synthesize foods from carbon dioxide and water.',
    difficulty: Difficulty.MEDIUM,
    lastReviewed: '2023-10-20',
    nextReviewDate: '2023-10-28',
    retentionScore: 62,
    reviews: [
      { id: 'r2', date: '2023-10-10', score: 80, timeSpent: 15 },
      { id: 'r3', date: '2023-10-20', score: 45, timeSpent: 20 }
    ],
    status: 'Fading'
  },
  {
    id: '3',
    title: 'Binary Search Algorithm',
    subject: 'Computer Science',
    description: 'An efficient algorithm for finding an item from a sorted list of items.',
    difficulty: Difficulty.HARD,
    lastReviewed: '2023-10-27',
    nextReviewDate: '2023-11-01',
    retentionScore: 78,
    reviews: [
      { id: 'r4', date: '2023-10-27', score: 85, timeSpent: 30 }
    ],
    status: 'Reviewing'
  }
];

export const SUBJECTS = ['Physics', 'Biology', 'Computer Science', 'History', 'Mathematics', 'Literature'];

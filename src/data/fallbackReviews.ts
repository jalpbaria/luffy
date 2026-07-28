import { Review } from '../types';

// Sample fallback reviews for platform demonstration and default verification testing
export const fallbackReviews: Review[] = [
  // User 1 (e.g. React / TypeScript skill)
  {
    id: 'rev-demo-1',
    bookingId: 'booking-demo-1',
    teacherId: 'user-1',
    learnerId: 'user-2',
    learnerName: 'Alex Rivera',
    skillName: 'React Development',
    rating: 5,
    teachingQuality: 5,
    communication: 5,
    helpfulness: 5,
    punctuality: 5,
    comment: 'Exceptional React session! Explained state hooks and performance tuning effortlessly.',
    createdAt: '2026-06-10T10:00:00.000Z'
  },
  {
    id: 'rev-demo-2',
    bookingId: 'booking-demo-2',
    teacherId: 'user-1',
    learnerId: 'user-3',
    learnerName: 'Sarah Chen',
    skillName: 'React Development',
    rating: 5,
    teachingQuality: 5,
    communication: 5,
    helpfulness: 5,
    punctuality: 5,
    comment: 'Great custom component breakdown and real-world project advice.',
    createdAt: '2026-06-15T14:30:00.000Z'
  },
  {
    id: 'rev-demo-3',
    bookingId: 'booking-demo-3',
    teacherId: 'user-1',
    learnerId: 'user-4',
    learnerName: 'Marcus Vance',
    skillName: 'React Development',
    rating: 4,
    teachingQuality: 4,
    communication: 5,
    helpfulness: 5,
    punctuality: 4,
    comment: 'Patience and solid codebase walkthrough. Highly recommended!',
    createdAt: '2026-06-20T11:00:00.000Z'
  },
  // User 2 (Python Programming)
  {
    id: 'rev-demo-4',
    bookingId: 'booking-demo-4',
    teacherId: 'user-2',
    learnerId: 'user-1',
    learnerName: 'Jordan Taylor',
    skillName: 'Python Programming',
    rating: 5,
    teachingQuality: 5,
    communication: 5,
    helpfulness: 5,
    punctuality: 5,
    comment: 'Amazing Python data structures lesson! Very clear and helpful.',
    createdAt: '2026-06-01T09:00:00.000Z'
  },
  {
    id: 'rev-demo-5',
    bookingId: 'booking-demo-5',
    teacherId: 'user-2',
    learnerId: 'user-3',
    learnerName: 'Sarah Chen',
    skillName: 'Python Programming',
    rating: 5,
    teachingQuality: 5,
    communication: 5,
    helpfulness: 5,
    punctuality: 5,
    comment: 'Awesome tutor! Helped me debug complex async functions.',
    createdAt: '2026-06-05T16:00:00.000Z'
  },
  {
    id: 'rev-demo-6',
    bookingId: 'booking-demo-6',
    teacherId: 'user-2',
    learnerId: 'user-4',
    learnerName: 'Marcus Vance',
    skillName: 'Python Programming',
    rating: 5,
    teachingQuality: 5,
    communication: 5,
    helpfulness: 5,
    punctuality: 5,
    comment: 'Super clear explanations of list comprehensions and OOP concepts.',
    createdAt: '2026-06-12T13:00:00.000Z'
  }
];

import { UserProfile, Booking, AppNotification, ProgressTrack } from '../types';

export const fallbackUsers: UserProfile[] = [
  {
    id: 'user-alex-chen',
    name: 'Alex Chen',
    email: 'alex.chen@example.com',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150',
    bio: 'Senior Full Stack Engineer & Open Source Contributor. Passionate about React, TypeScript, and modern Web Architecture.',
    education: 'B.S. Computer Science, Stanford University',
    experience: '8+ years leading frontend & backend systems at scale.',
    languages: ['English', 'Mandarin'],
    availability: ['Morning', 'Evening'],
    skillLevel: 'Expert',
    portfolio: { github: 'https://github.com', linkedin: 'https://linkedin.com' },
    skillsOffered: [
      { name: 'React & TypeScript Architecture', category: 'Development', level: 'Expert' },
      { name: 'Node.js API Design', category: 'Development', level: 'Expert' }
    ],
    skillsWanted: [
      { name: 'Conversational Spanish', category: 'Language', level: 'Beginner' },
      { name: 'UI/UX Design Systems', category: 'Design', level: 'Intermediate' }
    ],
    rating: 4.9,
    reviewsCount: 18,
    successfulExchanges: 12,
    timeZone: 'EST',
    badges: [
      { id: 'b1', name: 'Master Tutor', icon: '🏆', description: 'Taught 10+ successful sessions', dateEarned: '2026-01-10' },
      { id: 'b2', name: 'Verified Instructor', icon: '⚡', description: 'Passed peer review', dateEarned: '2026-01-15' }
    ],
    hasSeenOnboarding: true,
    lastActive: new Date(Date.now() - 5 * 60 * 1000).toISOString()
  },
  {
    id: 'user-maria-garcia',
    name: 'Maria Garcia',
    email: 'maria.garcia@example.com',
    avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150',
    bio: 'Native Spanish instructor & UX Designer based in Madrid. Love helping peers learn fluent Spanish while improving my coding skills.',
    education: 'M.A. Applied Linguistics & Visual Design',
    experience: '6 years teaching language immersion & UI design.',
    languages: ['Spanish', 'English'],
    availability: ['Afternoon', 'Evening'],
    skillLevel: 'Expert',
    portfolio: { behance: 'https://behance.net', linkedin: 'https://linkedin.com' },
    skillsOffered: [
      { name: 'Conversational Spanish', category: 'Language', level: 'Expert' },
      { name: 'Figma UI/UX Systems', category: 'Design', level: 'Expert' }
    ],
    skillsWanted: [
      { name: 'React & TypeScript Architecture', category: 'Development', level: 'Intermediate' },
      { name: 'Python Data Science', category: 'Data Science', level: 'Beginner' }
    ],
    rating: 5.0,
    reviewsCount: 24,
    successfulExchanges: 19,
    timeZone: 'CET',
    badges: [
      { id: 'b3', name: 'Polyglot Guru', icon: '🌍', description: 'Taught 20+ language classes', dateEarned: '2026-01-05' }
    ],
    hasSeenOnboarding: true,
    lastActive: new Date(Date.now() - 35 * 60 * 1000).toISOString()
  },
  {
    id: 'user-liam-johnson',
    name: 'Liam Johnson',
    email: 'liam.j@example.com',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150',
    bio: 'Product Designer & Design Systems enthusiast. Specialized in Figma, prototyping, and accessibility.',
    education: 'B.A. Graphic Design, RISD',
    experience: '5 years crafting digital products.',
    languages: ['English'],
    availability: ['Morning', 'Afternoon'],
    skillLevel: 'Expert',
    portfolio: { portfolioUrl: 'https://example.com' },
    skillsOffered: [
      { name: 'Figma UI/UX Systems', category: 'Design', level: 'Expert' },
      { name: 'Brand Identity', category: 'Design', level: 'Intermediate' }
    ],
    skillsWanted: [
      { name: 'Node.js API Design', category: 'Development', level: 'Beginner' }
    ],
    rating: 4.8,
    reviewsCount: 14,
    successfulExchanges: 9,
    timeZone: 'PST',
    badges: [],
    hasSeenOnboarding: true,
    lastActive: new Date(Date.now() - 3 * 3600 * 1000).toISOString()
  },
  {
    id: 'user-priya-patel',
    name: 'Priya Patel',
    email: 'priya.patel@example.com',
    avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150',
    bio: 'Data Scientist & Machine Learning practitioner. Excited to swap Python ML insights for digital marketing strategies.',
    education: 'M.S. Analytics, Columbia University',
    experience: '4 years building ML pipelines.',
    languages: ['English', 'Hindi'],
    availability: ['Evening'],
    skillLevel: 'Intermediate',
    portfolio: { github: 'https://github.com' },
    skillsOffered: [
      { name: 'Python Data Science', category: 'Data Science', level: 'Expert' },
      { name: 'Machine Learning Basics', category: 'Data Science', level: 'Intermediate' }
    ],
    skillsWanted: [
      { name: 'Digital Marketing & SEO', category: 'Business', level: 'Beginner' }
    ],
    rating: 4.95,
    reviewsCount: 11,
    successfulExchanges: 8,
    timeZone: 'EST',
    badges: [],
    hasSeenOnboarding: true,
    lastActive: new Date(Date.now() - 26 * 3600 * 1000).toISOString()
  }
];

export const fallbackBookings: Booking[] = [];
export const fallbackNotifications: AppNotification[] = [];
export const fallbackProgress: ProgressTrack[] = [];


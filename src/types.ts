export interface Skill {
  name: string;
  category: string;
  level: 'Beginner' | 'Intermediate' | 'Expert';
}

export interface Portfolio {
  github?: string;
  behance?: string;
  linkedin?: string;
  portfolioUrl?: string;
}

export interface Badge {
  id: string;
  name: string;
  icon: string;
  description: string;
  dateEarned: string;
}

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  avatar: string;
  bio: string;
  education: string;
  experience: string;
  languages: string[];
  availability: ('Morning' | 'Afternoon' | 'Evening')[];
  skillLevel: 'Beginner' | 'Intermediate' | 'Expert';
  portfolio: Portfolio;
  skillsOffered: Skill[];
  skillsWanted: Skill[];
  rating: number;
  reviewsCount: number;
  successfulExchanges: number;
  credits: number;
  timeZone: string;
  badges: Badge[];
}

export type LearningOption =
  | 'Live 1-on-1 Session'
  | 'Group Session'
  | 'Chat Guidance'
  | 'Notes & Resources'
  | 'Recorded Video'
  | 'Project-Based Learning';

export interface Booking {
  id: string;
  teacherId: string;
  teacherName: string;
  learnerId: string;
  learnerName: string;
  skillName: string;
  category: string;
  learningOption: LearningOption;
  date: string; // YYYY-MM-DD
  timeSlot: 'Morning' | 'Afternoon' | 'Evening';
  status: 'pending' | 'confirmed' | 'completed' | 'cancelled' | 'rescheduled';
  notes?: string;
  createdAt: string;
}

export interface Message {
  id: string;
  senderId: string;
  receiverId: string;
  text: string;
  fileUrl?: string;
  fileName?: string;
  timestamp: string;
}

export interface Review {
  id: string;
  bookingId: string;
  teacherId: string;
  learnerId: string;
  learnerName: string;
  rating: number; // 1-5
  teachingQuality: number; // 1-5
  communication: number; // 1-5
  helpfulness: number; // 1-5
  punctuality: number; // 1-5
  comment: string;
  createdAt: string;
}

export interface AppNotification {
  id: string;
  userId: string;
  title: string;
  message: string;
  type: 'match' | 'request' | 'upcoming' | 'message' | 'credit' | 'system';
  read: boolean;
  timestamp: string;
}

export interface ProgressTrack {
  userId: string;
  skillName: string;
  lessonsTotal: number;
  lessonsCompleted: number;
  completionPercentage: number;
  badgesEarned: string[];
  lastActive: string;
}

export interface DBState {
  users: UserProfile[];
  bookings: Booking[];
  messages: Message[];
  reviews: Review[];
  notifications: AppNotification[];
  progress: ProgressTrack[];
}

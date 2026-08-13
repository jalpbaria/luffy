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
  xp: number;
  loginStreak: number;
  longestStreak: number;
  timeZone: string;
  badges: Badge[];
  hasSeenOnboarding?: boolean;
  lastActive?: string;
}

export type LearningOption =
  | 'Live 1-on-1 Session'
  | 'Group Session'
  | 'Chat Guidance'
  | 'Notes & Resources'
  | 'Recorded Video'
  | 'Project-Based Learning';

export type LiveSessionStatus = 'scheduled' | 'waiting' | 'live' | 'ended' | 'cancelled';

export interface LiveSession {
  id: string;
  bookingId: string;
  teacherId: string;
  learnerId: string;
  status: LiveSessionStatus;
  startTime: string; // ISO timestamp
  endTime?: string;  // ISO timestamp
  createdAt: string;
  teacherJoined?: boolean;
  learnerJoined?: boolean;
  hasBothJoined?: boolean;
}

export interface Booking {
  id: string;
  teacherId: string;
  teacherName: string;
  learnerId: string;
  learnerName: string;
  skillName: string;
  category: string;
  skillLevel?: string;
  learningOption: LearningOption;
  date: string; // YYYY-MM-DD
  timeSlot: 'Morning' | 'Afternoon' | 'Evening';
  scheduledTime?: string; // ISO datetime string for exact scheduled appointment time
  status: 'pending' | 'confirmed' | 'completed' | 'cancelled' | 'rescheduled';
  notes?: string;
  createdAt: string;
  completedAt?: string; // ISO datetime string when session was marked completed
  cancelledAt?: string; // ISO datetime string when session was marked cancelled
  reminderSent?: boolean;
  joinReminderSent?: boolean;
  cancellationReason?: string;
  isLateCancellation?: boolean;
  isNoShow?: boolean;
  noShowParticipantId?: string;
}

export interface Message {
  id: string;
  senderId: string;
  receiverId: string;
  text: string;
  fileUrl?: string;
  fileName?: string;
  fileSize?: number;
  fileType?: string;
  timestamp: string;
  status?: 'sent' | 'delivered' | 'read';
  replyToMessageId?: string;
  reactions?: Record<string, string[]>;
  deletedForEveryone?: boolean;
  deletedForSender?: boolean;
  deletedForReceiver?: boolean;
  isForwarded?: boolean;
}

export interface Review {
  id: string;
  bookingId: string;
  teacherId: string;
  learnerId: string;
  learnerName: string;
  skillName: string;
  rating: number; // 1-5
  teachingQuality?: number; // 1-5
  communication?: number; // 1-5
  helpfulness?: number; // 1-5
  punctuality?: number; // 1-5
  comment: string;
  createdAt: string;
}

export interface AppNotification {
  id: string;
  userId: string;
  title: string;
  message: string;
  type: 'match' | 'request' | 'upcoming' | 'message' | 'credit' | 'system' | 'call';
  bookingId?: string;
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

export interface Challenge {
  id: string;
  title: string;
  description: string;
  rewardXp: number;
  currentProgress: number;
  targetProgress: number;
  isCompleted: boolean;
  type: 'daily' | 'weekly';
  category: string;
  icon: string;
}

export interface Certificate {
  id: string;
  title: string;
  recipientName: string;
  skillName: string;
  issueDate: string;
  certificateCode: string;
  issuer: string;
}

export interface LeaderboardEntry {
  rank: number;
  user: UserProfile;
  xp: number;
  streak: number;
  swaps: number;
  badgesCount: number;
}

export interface GamificationToast {
  id: string;
  type: 'xp' | 'badge' | 'level' | 'certificate' | 'challenge';
  title: string;
  message: string;
  xpAmount?: number;
  badgeName?: string;
  icon?: string;
}

export interface DBState {
  users: UserProfile[];
  bookings: Booking[];
  messages: Message[];
  reviews: Review[];
  notifications: AppNotification[];
  progress: ProgressTrack[];
  liveSessions?: LiveSession[];
}

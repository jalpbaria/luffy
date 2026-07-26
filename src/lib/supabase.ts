import { createClient } from '@supabase/supabase-js';
import { UserProfile, Booking, AppNotification, Message, LiveSession } from '../types';

const metaEnv = (import.meta as any).env || {};
const supabaseUrl = metaEnv.VITE_SUPABASE_URL || 'https://your-project.supabase.co';
const supabaseAnonKey = metaEnv.VITE_SUPABASE_ANON_KEY || 'your-anon-key';

if (!metaEnv.VITE_SUPABASE_URL || !metaEnv.VITE_SUPABASE_ANON_KEY) {
  console.warn(
    'Supabase environment variables (VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY) are missing. Please configure them in your settings.'
  );
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export function mapSupabaseToProfile(row: any): UserProfile {
  return {
    id: row.id,
    name: row.name || '',
    email: row.email || '',
    avatar: row.avatar || '',
    bio: row.bio || '',
    education: row.education || '',
    experience: row.experience || '',
    languages: Array.isArray(row.languages) ? row.languages : [],
    availability: Array.isArray(row.availability) ? row.availability : [],
    skillLevel: row.skill_level || 'Beginner',
    portfolio: row.portfolio || {},
    skillsOffered: Array.isArray(row.skills_offered) ? row.skills_offered : [],
    skillsWanted: Array.isArray(row.skills_wanted) ? row.skills_wanted : [],
    rating: typeof row.rating === 'number' ? row.rating : parseFloat(row.rating || '5.0'),
    reviewsCount: row.reviews_count || 0,
    successfulExchanges: row.successful_exchanges || 0,
    credits: row.credits || 0,
    timeZone: row.time_zone || 'EST',
    badges: Array.isArray(row.badges) ? row.badges : [],
    hasSeenOnboarding: row.has_seen_onboarding ?? true
  };
}

export function mapProfileToSupabase(profile: UserProfile): any {
  return {
    id: profile.id,
    name: profile.name,
    email: profile.email,
    avatar: profile.avatar,
    bio: profile.bio,
    education: profile.education,
    experience: profile.experience,
    languages: profile.languages,
    availability: profile.availability,
    skill_level: profile.skillLevel,
    portfolio: profile.portfolio,
    skills_offered: profile.skillsOffered,
    skills_wanted: profile.skillsWanted,
    skills: { 
      skillsOffered: profile.skillsOffered, 
      skillsWanted: profile.skillsWanted 
    },
    role: 'user',
    rating: profile.rating,
    reviews_count: profile.reviewsCount,
    successful_exchanges: profile.successfulExchanges,
    credits: profile.credits,
    time_zone: profile.timeZone,
    badges: profile.badges,
    has_seen_onboarding: profile.hasSeenOnboarding ?? false
  };
}

export function mapSupabaseToBooking(row: any): Booking {
  return {
    id: row.id,
    teacherId: row.teacher_id,
    teacherName: row.teacher_name,
    learnerId: row.learner_id,
    learnerName: row.learner_name,
    skillName: row.skill_name,
    category: row.category,
    learningOption: row.learning_option,
    date: row.date,
    timeSlot: row.time_slot,
    scheduledTime: row.scheduled_time || undefined,
    status: row.status,
    notes: row.notes || undefined,
    createdAt: row.created_at || new Date().toISOString(),
    completedAt: row.completed_at || undefined,
    cancelledAt: row.cancelled_at || undefined
  };
}

export function mapBookingToSupabase(booking: Booking): any {
  const row: any = {
    teacher_id: booking.teacherId,
    teacher_name: booking.teacherName,
    learner_id: booking.learnerId,
    learner_name: booking.learnerName,
    skill_name: booking.skillName,
    category: booking.category,
    learning_option: booking.learningOption,
    date: booking.date,
    time_slot: booking.timeSlot,
    scheduled_time: booking.scheduledTime || null,
    status: booking.status,
    notes: booking.notes || null,
    completed_at: booking.completedAt || null,
    cancelled_at: booking.cancelledAt || null,
  };
  // Only assign ID if it is a valid uuid
  if (booking.id && !booking.id.startsWith('booking-')) {
    row.id = booking.id;
  }
  return row;
}

export function mapSupabaseToNotification(row: any): AppNotification {
  return {
    id: row.id,
    userId: row.user_id,
    title: row.title,
    message: row.message,
    type: row.type,
    bookingId: row.booking_id || undefined,
    read: row.read,
    timestamp: row.timestamp || new Date().toISOString()
  };
}

export function mapNotificationToSupabase(notif: AppNotification): any {
  const row: any = {
    user_id: notif.userId,
    title: notif.title,
    message: notif.message,
    type: notif.type,
    booking_id: notif.bookingId || null,
    read: notif.read,
    timestamp: notif.timestamp
  };
  // Only assign ID if it is a valid uuid
  if (notif.id && !notif.id.startsWith('notif-')) {
    row.id = notif.id;
  }
  return row;
}

export function mapSupabaseToMessage(row: any): Message {
  return {
    id: row.id,
    senderId: row.sender_id,
    receiverId: row.receiver_id,
    text: row.text,
    fileUrl: row.file_url || undefined,
    fileName: row.file_name || undefined,
    timestamp: row.timestamp || new Date().toISOString()
  };
}

export function mapMessageToSupabase(msg: Message): any {
  const row: any = {
    sender_id: msg.senderId,
    receiver_id: msg.receiverId,
    text: msg.text,
    file_url: msg.fileUrl || null,
    file_name: msg.fileName || null,
    timestamp: msg.timestamp
  };
  if (msg.id && !msg.id.startsWith('msg-')) {
    row.id = msg.id;
  }
  return row;
}

export function mapSupabaseToLiveSession(row: any): LiveSession {
  return {
    id: row.id,
    bookingId: row.booking_id,
    teacherId: row.teacher_id,
    learnerId: row.learner_id,
    status: row.status || 'scheduled',
    startTime: row.start_time || new Date().toISOString(),
    endTime: row.end_time || undefined,
    createdAt: row.created_at || new Date().toISOString()
  };
}

export function mapLiveSessionToSupabase(session: LiveSession): any {
  const row: any = {
    booking_id: session.bookingId,
    teacher_id: session.teacherId,
    learner_id: session.learnerId,
    status: session.status,
    start_time: session.startTime,
    end_time: session.endTime || null,
    created_at: session.createdAt
  };
  if (session.id && !session.id.startsWith('session-')) {
    row.id = session.id;
  }
  return row;
}



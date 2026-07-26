import { supabase, mapSupabaseToLiveSession, mapLiveSessionToSupabase } from './supabase';
import { Booking, LiveSession, LiveSessionStatus } from '../types';

/**
 * SQL Schema definition for Supabase database creation and RLS setup.
 */
export const LIVE_SESSIONS_SQL_SCHEMA = `
-- SQL Migration for Supabase Database
CREATE TABLE IF NOT EXISTS public.live_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id TEXT UNIQUE NOT NULL,
  teacher_id TEXT NOT NULL,
  learner_id TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'waiting', 'live', 'ended', 'cancelled')),
  start_time TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  end_time TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE public.live_sessions ENABLE ROW LEVEL SECURITY;

-- Security Policy: Only the teacher or learner belonging to the booking can access the session
DROP POLICY IF EXISTS "Users can access their own live sessions" ON public.live_sessions;
CREATE POLICY "Users can access their own live sessions"
ON public.live_sessions
FOR ALL
USING (auth.uid()::text = teacher_id OR auth.uid()::text = learner_id)
WITH CHECK (auth.uid()::text = teacher_id OR auth.uid()::text = learner_id);
`;

function generateRoomId(): string {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return `room-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
}

function computeStartTime(dateStr: string, timeSlot: string, scheduledTime?: string): string {
  if (scheduledTime) {
    const d = new Date(scheduledTime);
    if (!isNaN(d.getTime())) return d.toISOString();
  }
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) {
      return new Date().toISOString();
    }
    // Adjust hour according to timeSlot
    if (timeSlot === 'Morning') d.setHours(9, 0, 0, 0);
    else if (timeSlot === 'Afternoon') d.setHours(14, 0, 0, 0);
    else if (timeSlot === 'Evening') d.setHours(19, 0, 0, 0);
    return d.toISOString();
  } catch {
    return new Date().toISOString();
  }
}

export interface SessionGateResult {
  status: 'too_early' | 'joinable' | 'passed';
  startTime: Date;
  windowStart: Date;
  windowEnd: Date;
  formattedTime: string;
  formattedDate: string;
}

export function getSessionGateStatus(booking: Booking): SessionGateResult {
  let startTime: Date;
  if (booking.scheduledTime) {
    startTime = new Date(booking.scheduledTime);
    if (isNaN(startTime.getTime())) {
      startTime = fallbackStartTime(booking);
    }
  } else {
    startTime = fallbackStartTime(booking);
  }

  // 10 minutes before through 60 minutes after
  const windowStart = new Date(startTime.getTime() - 10 * 60 * 1000);
  const windowEnd = new Date(startTime.getTime() + 60 * 60 * 1000);
  const now = new Date();

  let status: 'too_early' | 'joinable' | 'passed';
  if (now.getTime() < windowStart.getTime()) {
    status = 'too_early';
  } else if (now.getTime() > windowEnd.getTime()) {
    status = 'passed';
  } else {
    status = 'joinable';
  }

  const formattedTime = startTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  const formattedDate = startTime.toLocaleDateString([], { month: 'short', day: 'numeric' });

  return { status, startTime, windowStart, windowEnd, formattedTime, formattedDate };
}

function fallbackStartTime(booking: Booking): Date {
  const d = new Date(booking.date);
  if (isNaN(d.getTime())) return new Date();
  if (booking.timeSlot === 'Morning') d.setHours(9, 0, 0, 0);
  else if (booking.timeSlot === 'Afternoon') d.setHours(14, 0, 0, 0);
  else if (booking.timeSlot === 'Evening') d.setHours(19, 0, 0, 0);
  else d.setHours(12, 0, 0, 0);
  return d;
}

/**
 * Ensures exactly ONE live session exists for a given booking in Supabase.
 * Idempotent: checks for existing session by booking_id before creating.
 * Throws an error if Supabase query or insert fails.
 */
export async function getOrCreateLiveSessionForBooking(booking: Booking): Promise<LiveSession> {
  // 1. Try fetching existing session from Supabase
  const { data, error } = await supabase
    .from('live_sessions')
    .select('*')
    .eq('booking_id', booking.id)
    .maybeSingle();

  if (error) {
    console.error('[LiveSessions] Error querying live session from database:', error);
    throw new Error(`Failed to check existing live session: ${error.message}`);
  }

  if (data) {
    return mapSupabaseToLiveSession(data);
  }

  // 2. Create new LiveSession record
  const newSession: LiveSession = {
    id: generateRoomId(),
    bookingId: booking.id,
    teacherId: booking.teacherId,
    learnerId: booking.learnerId,
    status: 'scheduled',
    startTime: computeStartTime(booking.date, booking.timeSlot, booking.scheduledTime),
    createdAt: new Date().toISOString()
  };

  // 3. Insert into Supabase
  const { data: insertedData, error: insertError } = await supabase
    .from('live_sessions')
    .insert([mapLiveSessionToSupabase(newSession)])
    .select()
    .single();

  if (insertError) {
    console.error('[LiveSessions] Failed to insert live session into database:', insertError);
    throw new Error(`Failed to create live session in database: ${insertError.message}`);
  }

  if (!insertedData) {
    throw new Error('Failed to create live session: No data returned from database.');
  }

  return mapSupabaseToLiveSession(insertedData);
}

/**
 * Fetches all live sessions for a user (as teacher or learner) directly from Supabase.
 */
export async function fetchLiveSessionsForUser(userId: string): Promise<LiveSession[]> {
  try {
    const { data, error } = await supabase
      .from('live_sessions')
      .select('*')
      .or(`teacher_id.eq.${userId},learner_id.eq.${userId}`);

    if (error) {
      console.error('[LiveSessions] Failed to fetch live sessions from Supabase:', error.message);
      return [];
    }

    if (data && Array.isArray(data)) {
      return data.map(mapSupabaseToLiveSession);
    }
  } catch (err: any) {
    console.error('[LiveSessions] Failed to fetch live sessions from Supabase:', err);
  }

  return [];
}

/**
 * Updates status of a live session in Supabase.
 * Throws an error if the update fails.
 */
export async function updateLiveSessionStatus(
  sessionId: string,
  status: LiveSessionStatus,
  extra?: { endTime?: string }
): Promise<void> {
  const updatePayload: any = { status };
  if (extra?.endTime) {
    updatePayload.end_time = extra.endTime;
  }

  const { error } = await supabase
    .from('live_sessions')
    .update(updatePayload)
    .eq('id', sessionId);

  if (error) {
    console.error('[LiveSessions] Supabase status update error:', error.message);
    throw new Error(`Failed to update live session status in database: ${error.message}`);
  }
}

/**
 * Retrieves a session by ID directly from Supabase and enforces security permission checking.
 * Only teacher and learner can access.
 */
export async function getLiveSessionById(sessionId: string, userId: string): Promise<LiveSession | null> {
  const { data, error } = await supabase
    .from('live_sessions')
    .select('*')
    .eq('id', sessionId)
    .maybeSingle();

  if (error) {
    console.error('[LiveSessions] Error fetching session by id:', error.message);
    throw new Error(`Failed to fetch session: ${error.message}`);
  }

  if (!data) return null;

  const session = mapSupabaseToLiveSession(data);

  // Security enforcement: verify userId is teacher or learner
  if (session.teacherId !== userId && session.learnerId !== userId) {
    console.warn(`[LiveSessions] Security violation: User ${userId} attempted to access room ${sessionId}`);
    return null;
  }

  return session;
}


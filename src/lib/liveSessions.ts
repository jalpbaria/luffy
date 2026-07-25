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

function computeStartTime(dateStr: string, timeSlot: string): string {
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

/**
 * Ensures exactly ONE live session exists for a given booking.
 * Idempotent: checks for existing session by booking_id before creating.
 */
export async function getOrCreateLiveSessionForBooking(booking: Booking): Promise<LiveSession> {
  const localCacheKey = `local_live_sessions_${booking.teacherId}`;
  
  // 1. Try fetching existing session from Supabase
  try {
    const { data, error } = await supabase
      .from('live_sessions')
      .select('*')
      .eq('booking_id', booking.id)
      .maybeSingle();

    if (!error && data) {
      const session = mapSupabaseToLiveSession(data);
      saveToLocalCache(session);
      return session;
    }
  } catch (err) {
    console.warn('[LiveSessions] Supabase query failed, checking local cache:', err);
  }

  // 2. Check local storage cache
  const cachedSessions = getLocalCacheForUser(booking.teacherId).concat(getLocalCacheForUser(booking.learnerId));
  const existingCached = cachedSessions.find(s => s.bookingId === booking.id);
  if (existingCached) {
    return existingCached;
  }

  // 3. Create new LiveSession record
  const newSession: LiveSession = {
    id: generateRoomId(),
    bookingId: booking.id,
    teacherId: booking.teacherId,
    learnerId: booking.learnerId,
    status: 'scheduled',
    startTime: computeStartTime(booking.date, booking.timeSlot),
    createdAt: new Date().toISOString()
  };

  // 4. Insert into Supabase
  try {
    const { data: insertedData, error: insertError } = await supabase
      .from('live_sessions')
      .insert([mapLiveSessionToSupabase(newSession)])
      .select()
      .maybeSingle();

    if (!insertError && insertedData) {
      const createdSession = mapSupabaseToLiveSession(insertedData);
      saveToLocalCache(createdSession);
      return createdSession;
    }
  } catch (err) {
    console.warn('[LiveSessions] Failed to insert into Supabase live_sessions, persisting locally:', err);
  }

  // Fallback to local storage persistence
  saveToLocalCache(newSession);
  return newSession;
}

/**
 * Fetches all live sessions for a user (as teacher or learner).
 */
export async function fetchLiveSessionsForUser(userId: string): Promise<LiveSession[]> {
  try {
    const { data, error } = await supabase
      .from('live_sessions')
      .select('*')
      .or(`teacher_id.eq.${userId},learner_id.eq.${userId}`);

    if (!error && data && Array.isArray(data)) {
      const sessions = data.map(mapSupabaseToLiveSession);
      sessions.forEach(saveToLocalCache);
      return sessions;
    }
  } catch (err) {
    console.warn('[LiveSessions] Failed to fetch live sessions from Supabase:', err);
  }

  return getLocalCacheForUser(userId);
}

/**
 * Updates status of a live session.
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

  try {
    const { error } = await supabase
      .from('live_sessions')
      .update(updatePayload)
      .eq('id', sessionId);

    if (error) {
      console.warn('[LiveSessions] Supabase status update error:', error);
    }
  } catch (err) {
    console.warn('[LiveSessions] Exception during status update:', err);
  }

  // Update local cache across all local keys
  updateLocalCacheSession(sessionId, status, extra?.endTime);
}

/**
 * Retrieves a session by ID and enforces security permission checking.
 * Only teacher and learner can access.
 */
export async function getLiveSessionById(sessionId: string, userId: string): Promise<LiveSession | null> {
  let session: LiveSession | null = null;

  try {
    const { data, error } = await supabase
      .from('live_sessions')
      .select('*')
      .eq('id', sessionId)
      .maybeSingle();

    if (!error && data) {
      session = mapSupabaseToLiveSession(data);
    }
  } catch (err) {
    console.warn('[LiveSessions] Error fetching session by id:', err);
  }

  if (!session) {
    const cached = findSessionInLocalCache(sessionId);
    if (cached) session = cached;
  }

  if (!session) return null;

  // Security enforcement: verify userId is teacher or learner
  if (session.teacherId !== userId && session.learnerId !== userId) {
    console.warn(`[LiveSessions] Security violation: User ${userId} attempted to access room ${sessionId}`);
    return null;
  }

  return session;
}

// Local cache helpers
function saveToLocalCache(session: LiveSession): void {
  const teacherKey = `local_live_sessions_${session.teacherId}`;
  const learnerKey = `local_live_sessions_${session.learnerId}`;

  [teacherKey, learnerKey].forEach(key => {
    try {
      const raw = localStorage.getItem(key);
      const list: LiveSession[] = raw ? JSON.parse(raw) : [];
      const idx = list.findIndex(s => s.id === session.id || s.bookingId === session.bookingId);
      if (idx >= 0) {
        list[idx] = { ...list[idx], ...session };
      } else {
        list.push(session);
      }
      localStorage.setItem(key, JSON.stringify(list));
    } catch (e) {
      console.warn('Local storage write failed:', e);
    }
  });
}

function getLocalCacheForUser(userId: string): LiveSession[] {
  try {
    const raw = localStorage.getItem(`local_live_sessions_${userId}`);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function findSessionInLocalCache(sessionId: string): LiveSession | null {
  try {
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith('local_live_sessions_')) {
        const raw = localStorage.getItem(key);
        if (raw) {
          const list: LiveSession[] = JSON.parse(raw);
          const found = list.find(s => s.id === sessionId);
          if (found) return found;
        }
      }
    }
  } catch {}
  return null;
}

function updateLocalCacheSession(sessionId: string, status: LiveSessionStatus, endTime?: string): void {
  try {
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith('local_live_sessions_')) {
        const raw = localStorage.getItem(key);
        if (raw) {
          const list: LiveSession[] = JSON.parse(raw);
          let updated = false;
          const newList = list.map(s => {
            if (s.id === sessionId) {
              updated = true;
              return {
                ...s,
                status,
                endTime: endTime || s.endTime
              };
            }
            return s;
          });
          if (updated) {
            localStorage.setItem(key, JSON.stringify(newList));
          }
        }
      }
    }
  } catch {}
}

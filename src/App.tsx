import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence, useReducedMotion } from 'motion/react';
import { 
  Compass, LayoutDashboard, MessageSquare, Brain, User, 
  Sparkles, Globe, LogOut, ArrowLeftRight, Award, Flame, RefreshCw, Home,
  Check, AlertCircle, Mail, X, BookOpen, PhoneCall, Lock
} from 'lucide-react';
import { UserProfile, Booking, AppNotification, ProgressTrack, Review, Skill, LiveSession } from './types';
import { getOrCreateLiveSessionForBooking, fetchLiveSessionsForUser, updateLiveSessionStatus, getSessionGateStatus, computeStartTime } from './lib/liveSessions';

// Import our modular components
import DashboardView from './components/DashboardView';
import ExploreView from './components/ExploreView';
import ChatView from './components/ChatView';
import ProfileView from './components/ProfileView';
import StudyHubView from './components/StudyHubView';
import SkillPathView from './components/SkillPathView';
import LoginView from './components/LoginView';
import LiveSessionRoomView from './components/LiveSessionRoomView';
import CreditsView from './components/CreditsView';
import OnboardingTour from './components/OnboardingTour';
import { GamificationHubView } from './components/GamificationHubView';
import { GamificationOverlay } from './components/GamificationCelebration';
import { triggerCelebrationConfetti } from './lib/gamification';
import { GamificationToast, Badge as GamificationBadge } from './types';
import { Navbar } from './components/Navbar';
import { InitialAppLoader } from './components/motion';
import { AmbientBackground } from './components/layout';
import { supabase, mapSupabaseToProfile, mapProfileToSupabase, mapSupabaseToBooking, mapBookingToSupabase, mapSupabaseToNotification, mapNotificationToSupabase, mapSupabaseToReview, mapReviewToSupabase } from './lib/supabase';
import { useAuth } from './contexts/AuthContext';
import { fallbackUsers } from './data/fallbackUsers';



export default function App() {
  const { signOut } = useAuth();
  const prefersReducedMotion = useReducedMotion();
  const [activeTab, setActiveTab] = useState<'dashboard' | 'explore' | 'chat' | 'study-hub' | 'skill-path' | 'gamification' | 'credits' | 'profile' | 'live-room'>('dashboard');
  const [allUsers, setAllUsers] = useState<UserProfile[]>([]);
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);

  // Gamification overlay state
  const [gamificationToasts, setGamificationToasts] = useState<GamificationToast[]>([]);
  const [unlockedBadge, setUnlockedBadge] = useState<GamificationBadge | null>(null);

  const triggerRewardToast = (title: string, message: string, xpAmount: number = 50, icon: string = '⚡') => {
    triggerCelebrationConfetti();
    const id = `toast-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`;
    const newToast: GamificationToast = {
      id,
      type: 'xp',
      title,
      message,
      xpAmount,
      icon
    };
    setGamificationToasts(prev => [newToast, ...prev]);

    // Auto dismiss toast after 4.5 seconds
    setTimeout(() => {
      setGamificationToasts(prev => prev.filter(t => t.id !== id));
    }, 4500);
  };
  
  // User specific data
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [progress, setProgress] = useState<ProgressTrack[]>([]);
  const [liveSessions, setLiveSessions] = useState<LiveSession[]>([]);
  const [allReviews, setAllReviews] = useState<Review[]>([]);

  // Active live classroom session
  const [activeLiveSessionBooking, setActiveLiveSessionBooking] = useState<Booking | null>(null);
  const [activeLiveSessionData, setActiveLiveSessionData] = useState<LiveSession | null>(null);
  const [incomingCall, setIncomingCall] = useState<{ bookingId: string; callerName: string } | null>(null);

  // Chat messaging contacts filter state
  const [messagePartnerIds, setMessagePartnerIds] = useState<Set<string>>(new Set());
  const [sessionInitiatedChatIds, setSessionInitiatedChatIds] = useState<Set<string>>(new Set());
  const [initialActiveContactId, setInitialActiveContactId] = useState<string | null>(null);
  
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [accountDeletedNotice, setAccountDeletedNotice] = useState('');
  const [showOnboardingTour, setShowOnboardingTour] = useState(false);

  useEffect(() => {
    if (currentUser && currentUser.hasSeenOnboarding === false) {
      setShowOnboardingTour(true);
    }
  }, [currentUser?.id, currentUser?.hasSeenOnboarding]);

  const handleCompleteOnboarding = async () => {
    setShowOnboardingTour(false);
    if (!currentUser) return;

    const updatedUser = { ...currentUser, hasSeenOnboarding: true };
    setCurrentUser(updatedUser);

    try {
      await supabase
        .from('profiles')
        .update({ has_seen_onboarding: true })
        .eq('id', currentUser.id);
    } catch (err) {
      console.warn('Failed to update has_seen_onboarding in Supabase:', err);
    }

    setAllUsers(prev => prev.map(u => u.id === currentUser.id ? updatedUser : u));
  };

  const handleStartLiveSession = async (booking: Booking) => {
    if (!currentUser) {
      alert('Please log in to join the live session.');
      return;
    }

    // 1. Check user is actually the teacher or learner for this booking
    const isParticipant = currentUser.id === booking.teacherId || currentUser.id === booking.learnerId;
    if (!isParticipant) {
      alert('Access Denied: You are not a participant in this booking session.');
      return;
    }

    // 2. Check booking status (cancelled, completed, or unconfirmed)
    if (booking.status === 'cancelled') {
      alert('Cannot join: This session booking has been cancelled.');
      return;
    }

    if (booking.status === 'completed') {
      alert('This live classroom session has already been completed.');
      return;
    }

    if (booking.status !== 'confirmed' && booking.status !== 'rescheduled') {
      try {
        const { data: latestData } = await supabase.from('bookings').select('*').eq('id', booking.id).single();
        if (latestData) {
          const freshBooking = mapSupabaseToBooking(latestData);
          if (freshBooking.status === 'confirmed' || freshBooking.status === 'rescheduled') {
            booking = freshBooking;
          } else {
            alert(`Cannot join: This booking status is currently "${freshBooking.status}". Only confirmed or rescheduled sessions can launch the live classroom.`);
            return;
          }
        } else {
          alert(`Cannot join: This booking status is currently "${booking.status}". Only confirmed or rescheduled sessions can launch the live classroom.`);
          return;
        }
      } catch (e) {
        alert(`Cannot join: This booking status is currently "${booking.status}". Only confirmed or rescheduled sessions can launch the live classroom.`);
        return;
      }
    }

    // 5. Check scheduled session time window (10 min before to 60 min after)
    const gate = getSessionGateStatus(booking);
    if (gate.status === 'too_early') {
      alert(`This session starts at ${gate.formattedTime}. You can join 10 minutes before.`);
      return;
    }
    if (gate.status === 'passed') {
      alert("This session's scheduled time has passed.");
      return;
    }

    try {
      setIsLoading(true);
      const session = await getOrCreateLiveSessionForBooking(booking);

      if (session.status === 'cancelled') {
        alert('Cannot join: The live session has been cancelled.');
        return;
      }

      if (session.status === 'ended') {
        alert('This live session has ended.');
        return;
      }

      setActiveLiveSessionBooking(booking);
      setActiveLiveSessionData(session);
      setActiveTab('live-room');

      // Send incoming call notification to the other participant
      const otherParticipantId = booking.teacherId === currentUser.id ? booking.learnerId : booking.teacherId;
      try {
        const { error: notifErr } = await supabase.from('notifications').insert({
          user_id: otherParticipantId,
          title: `Incoming call from ${currentUser.name}`,
          message: `${currentUser.name} started a live classroom session for your booking. Join now to connect.`,
          type: 'call',
          booking_id: booking.id,
          read: false,
          timestamp: new Date().toISOString()
        });
        if (notifErr) {
          console.warn('[App] Failed to insert call notification for recipient:', notifErr.message);
        }
      } catch (notifErr) {
        console.warn('[App] Error sending call notification:', notifErr);
      }
    } catch (err) {
      console.error('Failed to launch live session:', err);
      alert('Failed to connect to live classroom. Please check your network connection.');
    } finally {
      setIsLoading(false);
    }
  };

  // Password recovery modal state
  const [showPasswordResetModal, setShowPasswordResetModal] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [resetError, setResetError] = useState('');
  const [resetSuccess, setResetSuccess] = useState('');
  const [isResetting, setIsResetting] = useState(false);

  const [userLoadError, setUserLoadError] = useState<string | null>(null);
  const [syncError, setSyncError] = useState<string | null>(null);

  // Initial Load: Fetch all user profiles from DB and check active session
  useEffect(() => {
    const initApp = async () => {
      try {
        let data: UserProfile[] = [];
        try {
          const { data: dbRows, error: dbError } = await supabase.from('profiles').select('*');
          if (dbError) throw dbError;
          if (dbRows && Array.isArray(dbRows) && dbRows.length > 0) {
            data = dbRows.map(mapSupabaseToProfile);
          } else {
            data = fallbackUsers;
          }
          setUserLoadError(null);
        } catch (err) {
          console.warn('Supabase profiles fetch unavailable, using default swappers:', err);
          data = fallbackUsers;
          setUserLoadError(null);
        }
        setAllUsers(data);

        // Fetch All Reviews for Verified Skill calculating
        let loadedReviews: Review[] = [];
        try {
          const { data: dbRevRows, error: dbRevErr } = await supabase.from('reviews').select('*');
          if (!dbRevErr && dbRevRows && Array.isArray(dbRevRows)) {
            loadedReviews = dbRevRows.map(mapSupabaseToReview);
          }
        } catch (err) {
          console.warn('Supabase reviews fetch failed:', err);
          loadedReviews = [];
        }
        setAllReviews(loadedReviews);
        
        // Check Supabase Auth Session
        let initialUser = null;
        try {
          const { data: { session } } = await supabase.auth.getSession();
          if (session?.user) {
            const userId = session.user.id;
            const userEmail = session.user.email?.toLowerCase().trim();
            initialUser = data.find((u: any) => u.id === userId || u.email?.toLowerCase().trim() === userEmail);
            
            if (!initialUser) {
              console.error(`Account data not found in profiles table for session user ID ${userId} (${userEmail}). Please contact support.`);
            }
          }
        } catch (sessionErr) {
          console.warn('Could not retrieve Supabase session:', sessionErr);
        }

        if (initialUser) {
          setCurrentUser(initialUser);
          await loadUserSpecificData(initialUser.id);
        } else {
          setCurrentUser(null);
        }
      } catch (err) {
        console.error('Error initializing platform:', err);
      } finally {
        setIsLoading(false);
      }
    };

    initApp();

    // Listen for auth state changes (e.g. password recovery events)
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'PASSWORD_RECOVERY') {
        setShowPasswordResetModal(true);
        setResetError('');
        setResetSuccess('');
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  // Periodic last_active update for logged in user
  useEffect(() => {
    if (!currentUser?.id) return;

    const updateLastActive = async () => {
      const nowIso = new Date().toISOString();
      try {
        await supabase.from('profiles').update({ last_active: nowIso }).eq('id', currentUser.id);
      } catch (err) {
        // Silent catch if table/column missing
      }
    };

    updateLastActive();
    const interval = setInterval(updateLastActive, 60000);
    return () => clearInterval(interval);
  }, [currentUser?.id]);

  // Record daily login RPC call once per session when currentUser is loaded
  const hasRecordedDailyLoginRef = useRef<string | null>(null);

  useEffect(() => {
    if (!currentUser?.id) return;
    if (hasRecordedDailyLoginRef.current === currentUser.id) return;

    const recordDailyLogin = async () => {
      try {
        hasRecordedDailyLoginRef.current = currentUser.id;
        const { data, error } = await supabase.rpc('record_daily_login');
        if (error) {
          console.warn('record_daily_login RPC call error:', error.message);
          return;
        }

        if (data && data.awarded) {
          const xpGained = data.xp_gained || 50;
          const streakCount = data.streak || 1;

          triggerRewardToast(
            'Daily Login Reward!',
            `+${xpGained} XP — Daily login!`,
            xpGained,
            '⚡'
          );

          if (data.streak_bonus) {
            setTimeout(() => {
              triggerCelebrationConfetti();
              triggerRewardToast(
                'Streak Bonus Unlocked!',
                `🔥 ${streakCount}-day streak bonus!`,
                100,
                '🔥'
              );
            }, 600);
          }

          // Fetch updated profile to refresh currentUser state with new XP/Streak
          const { data: profileRow } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', currentUser.id)
            .single();

          if (profileRow) {
            const freshUser = mapSupabaseToProfile(profileRow);
            setCurrentUser(freshUser);
            setAllUsers(prev => prev.map(u => u.id === currentUser.id ? freshUser : u));
          }
        }
      } catch (err) {
        console.warn('Error recording daily login:', err);
      }
    };

    recordDailyLogin();
  }, [currentUser?.id]);

  // Set up Supabase Realtime subscription for notifications when currentUser changes
  useEffect(() => {
    if (!currentUser?.id) return;

    const channel = supabase
      .channel(`realtime-notifications-${currentUser.id}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${currentUser.id}`,
        },
        (payload) => {
          console.log('Realtime notification change received:', payload);
          if (payload.eventType === 'INSERT') {
            const newNotif = mapSupabaseToNotification(payload.new);
            setNotifications((prev) => {
              if (prev.some((n) => n.id === newNotif.id)) return prev;
              return [newNotif, ...prev];
            });

            if (newNotif.type === 'call' && newNotif.bookingId) {
              const callerName = newNotif.title.startsWith('Incoming call from ')
                ? newNotif.title.replace('Incoming call from ', '').trim()
                : 'Someone';
              setIncomingCall({
                bookingId: newNotif.bookingId,
                callerName: callerName || 'A user'
              });
            }
          } else if (payload.eventType === 'UPDATE') {
            const updatedNotif = mapSupabaseToNotification(payload.new);
            setNotifications((prev) => prev.map((n) => (n.id === updatedNotif.id ? updatedNotif : n)));
          } else if (payload.eventType === 'DELETE') {
            const deletedId = payload.old.id;
            setNotifications((prev) => prev.filter((n) => n.id !== deletedId));
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [currentUser?.id]);

  // Set up Supabase Realtime subscription for bookings when currentUser changes
  useEffect(() => {
    if (!currentUser?.id) return;

    const handleBookingPayload = (payload: any) => {
      console.log('Realtime booking change received:', payload);
      if (payload.eventType === 'INSERT') {
        const newBooking = mapSupabaseToBooking(payload.new);
        setBookings((prev) => {
          if (prev.some((b) => b.id === newBooking.id)) return prev;
          return [newBooking, ...prev];
        });
      } else if (payload.eventType === 'UPDATE') {
        const updatedBooking = mapSupabaseToBooking(payload.new);
        setBookings((prev) => prev.map((b) => (b.id === updatedBooking.id ? updatedBooking : b)));
      } else if (payload.eventType === 'DELETE') {
        const deletedId = payload.old?.id;
        if (!deletedId) return;
        setBookings((prev) => prev.filter((b) => b.id !== deletedId));
      }
    };

    const channel = supabase
      .channel(`realtime-bookings-${currentUser.id}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'bookings',
          filter: `teacher_id=eq.${currentUser.id}`,
        },
        handleBookingPayload
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'bookings',
          filter: `learner_id=eq.${currentUser.id}`,
        },
        handleBookingPayload
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [currentUser?.id]);

  // Fetch message partner IDs when currentUser changes and subscribe to realtime message events
  useEffect(() => {
    if (!currentUser?.id) {
      setMessagePartnerIds(new Set());
      return;
    }

    const fetchMessagePartners = async () => {
      try {
        const { data, error } = await supabase
          .from('messages')
          .select('sender_id, receiver_id')
          .or(`sender_id.eq.${currentUser.id},receiver_id.eq.${currentUser.id}`);

        if (error) {
          console.error('Error fetching message partner IDs:', error);
          return;
        }

        if (data && Array.isArray(data)) {
          const partnerIds = new Set<string>();
          data.forEach((msg: { sender_id: string; receiver_id: string }) => {
            if (msg.sender_id === currentUser.id && msg.receiver_id && msg.receiver_id !== currentUser.id) {
              partnerIds.add(msg.receiver_id);
            } else if (msg.receiver_id === currentUser.id && msg.sender_id && msg.sender_id !== currentUser.id) {
              partnerIds.add(msg.sender_id);
            }
          });
          setMessagePartnerIds(partnerIds);

          // Check for any partner IDs not currently in allUsers and fetch their profiles
          const missingPartnerIds = Array.from(partnerIds).filter(
            id => !allUsers.some(u => u.id === id)
          );
          if (missingPartnerIds.length > 0) {
            const { data: missingProfiles } = await supabase
              .from('profiles')
              .select('*')
              .in('id', missingPartnerIds);
            if (missingProfiles && missingProfiles.length > 0) {
              const mapped = missingProfiles.map(mapSupabaseToProfile);
              setAllUsers(prev => {
                const existingIds = new Set(prev.map(u => u.id));
                const toAdd = mapped.filter(m => !existingIds.has(m.id));
                return toAdd.length > 0 ? [...prev, ...toAdd] : prev;
              });
            }
          }
        }
      } catch (err) {
        console.error('Failed to load message partner IDs:', err);
      }
    };

    fetchMessagePartners();

    // Subscribe to realtime messages to automatically add new conversation contacts live
    const channel = supabase
      .channel(`realtime-message-partners-${currentUser.id}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
        },
        (payload) => {
          const newMsg = payload.new;
          if (newMsg) {
            let partnerId: string | null = null;
            if (newMsg.sender_id === currentUser.id && newMsg.receiver_id && newMsg.receiver_id !== currentUser.id) {
              partnerId = newMsg.receiver_id;
            } else if (newMsg.receiver_id === currentUser.id && newMsg.sender_id && newMsg.sender_id !== currentUser.id) {
              partnerId = newMsg.sender_id;
            }

            if (partnerId) {
              setMessagePartnerIds((prev) => {
                if (prev.has(partnerId!)) return prev;
                const next = new Set(prev);
                next.add(partnerId!);
                return next;
              });

              // Ensure the partner's profile exists in allUsers state
              setAllUsers((prevUsers) => {
                if (!prevUsers.some((u) => u.id === partnerId)) {
                  supabase
                    .from('profiles')
                    .select('*')
                    .eq('id', partnerId)
                    .single()
                    .then(({ data: profileRow }) => {
                      if (profileRow) {
                        const newProfile = mapSupabaseToProfile(profileRow);
                        setAllUsers((curr) => {
                          if (curr.some((u) => u.id === newProfile.id)) return curr;
                          return [...curr, newProfile];
                        });
                      }
                    });
                }
                return prevUsers;
              });
            }
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [currentUser?.id]);

  // Periodic check (every 60 seconds) for 15-minute upcoming session reminders
  useEffect(() => {
    if (!currentUser?.id) return;

    const checkUpcomingSessionReminders = async () => {
      const now = Date.now();
      const fifteenMinsMs = 15 * 60 * 1000;

      // 1. 15-minute before starting reminder
      const upcomingToRemind = bookings.filter((b) => {
        if (b.status !== 'confirmed' && b.status !== 'rescheduled') return false;
        if (b.reminderSent) return false;

        const startTimeIso = computeStartTime(b.date, b.timeSlot, b.scheduledTime);
        const startTimeMs = new Date(startTimeIso).getTime();
        const diffMs = startTimeMs - now;

        // Starting within 15 minutes (diffMs <= 15 minutes) and not ended long ago (diffMs >= -2 minutes)
        return diffMs <= fifteenMinsMs && diffMs >= -2 * 60 * 1000;
      });

      for (const booking of upcomingToRemind) {
        // Mark locally first to prevent duplicate execution in current cycle
        setBookings((prev) =>
          prev.map((b) => (b.id === booking.id ? { ...b, reminderSent: true } : b))
        );

        // Update Supabase
        try {
          await supabase
            .from('bookings')
            .update({ reminder_sent: true })
            .eq('id', booking.id);
        } catch (err) {
          console.warn('Could not update reminder_sent on booking in Supabase:', err);
        }

        const reminderMessage = `Your session for ${booking.skillName} starts in 15 minutes!`;

        // Create notification objects for teacher and learner
        const notifTeacher: AppNotification = {
          id: `notif-rem-t-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
          userId: booking.teacherId,
          title: 'Session Starting Soon!',
          message: reminderMessage,
          type: 'match',
          bookingId: booking.id,
          read: false,
          timestamp: new Date().toISOString()
        };

        const notifLearner: AppNotification = {
          id: `notif-rem-l-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
          userId: booking.learnerId,
          title: 'Session Starting Soon!',
          message: reminderMessage,
          type: 'match',
          bookingId: booking.id,
          read: false,
          timestamp: new Date().toISOString()
        };

        // Insert into Supabase notifications table
        try {
          await supabase.from('notifications').insert([
            mapNotificationToSupabase(notifTeacher),
            mapNotificationToSupabase(notifLearner)
          ]);
        } catch (err) {
          console.warn('Could not insert 15-minute session reminder notifications:', err);
        }

        // Add to local state if applicable for current user
        setNotifications((prev) => {
          const newNotifs: AppNotification[] = [];
          if (booking.teacherId === currentUser.id && !prev.some((n) => n.id === notifTeacher.id)) {
            newNotifs.push(notifTeacher);
          }
          if (booking.learnerId === currentUser.id && !prev.some((n) => n.id === notifLearner.id)) {
            newNotifs.push(notifLearner);
          }
          return newNotifs.length > 0 ? [...newNotifs, ...prev] : prev;
        });
      }

      // 2. Second reminder: "You can join now" notification when join window opens
      const joinableToRemind = bookings.filter((b) => {
        if (b.status !== 'confirmed' && b.status !== 'rescheduled') return false;
        if (b.joinReminderSent) return false;

        const gate = getSessionGateStatus(b);
        return gate.status === 'joinable';
      });

      for (const booking of joinableToRemind) {
        setBookings((prev) =>
          prev.map((b) => (b.id === booking.id ? { ...b, joinReminderSent: true } : b))
        );

        try {
          await supabase
            .from('bookings')
            .update({ join_reminder_sent: true })
            .eq('id', booking.id);
        } catch (err) {
          console.warn('Could not update join_reminder_sent on booking in Supabase:', err);
        }

        const joinMessage = `The live 1-on-1 session room for ${booking.skillName} is now open! You can join now and enter the green room.`;

        const notifTeacher: AppNotification = {
          id: `notif-join-t-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
          userId: booking.teacherId,
          title: 'You Can Join Now! 🔴',
          message: joinMessage,
          type: 'upcoming',
          bookingId: booking.id,
          read: false,
          timestamp: new Date().toISOString()
        };

        const notifLearner: AppNotification = {
          id: `notif-join-l-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
          userId: booking.learnerId,
          title: 'You Can Join Now! 🔴',
          message: joinMessage,
          type: 'upcoming',
          bookingId: booking.id,
          read: false,
          timestamp: new Date().toISOString()
        };

        try {
          await supabase.from('notifications').insert([
            mapNotificationToSupabase(notifTeacher),
            mapNotificationToSupabase(notifLearner)
          ]);
        } catch (err) {
          console.warn('Could not insert join-now session reminder notifications:', err);
        }

        setNotifications((prev) => {
          const newNotifs: AppNotification[] = [];
          if (booking.teacherId === currentUser.id && !prev.some((n) => n.id === notifTeacher.id)) {
            newNotifs.push(notifTeacher);
          }
          if (booking.learnerId === currentUser.id && !prev.some((n) => n.id === notifLearner.id)) {
            newNotifs.push(notifLearner);
          }
          return newNotifs.length > 0 ? [...newNotifs, ...prev] : prev;
        });
      }

      // 3. Third check: Join window passed (status === 'passed')
      const passedToEvaluate = bookings.filter((b) => {
        if (b.status !== 'confirmed' && b.status !== 'rescheduled') return false;
        const gate = getSessionGateStatus(b);
        return gate.status === 'passed';
      });

      for (const booking of passedToEvaluate) {
        try {
          // Fetch live_sessions record for this booking
          const { data: lsData } = await supabase
            .from('live_sessions')
            .select('has_both_joined')
            .eq('booking_id', booking.id)
            .maybeSingle();

          const hasBothJoined = lsData?.has_both_joined ?? false;

          if (hasBothJoined) {
            // Conclude as completed normally
            await handleUpdateBookingStatus(booking.id, 'completed', currentUser.id);
          } else {
            // Set is_no_show to true on booking
            await handleMarkNoShow(booking.id);
          }
        } catch (err) {
          console.warn('Error evaluating passed session status:', err);
        }
      }
    };

    // Run immediately and every 60 seconds
    checkUpcomingSessionReminders();
    const interval = setInterval(checkUpcomingSessionReminders, 60000);

    return () => clearInterval(interval);
  }, [currentUser?.id, bookings]);

  const handleMarkNoShow = async (bookingId: string) => {
    try {
      const booking = bookings.find((b) => b.id === bookingId);
      if (!booking) return;

      const { error } = await supabase
        .from('bookings')
        .update({ is_no_show: true, status: 'completed', completed_at: new Date().toISOString() })
        .eq('id', bookingId);

      if (error) {
        console.warn('Error setting is_no_show in Supabase:', error);
      }

      setBookings((prev) =>
        prev.map((b) =>
          b.id === bookingId ? { ...b, isNoShow: true, status: 'completed', completedAt: new Date().toISOString() } : b
        )
      );

      // Create notifications for both parties
      const notifMsg = `The join window for ${booking.skillName} has closed. A no-show was logged because both participants did not join.`;
      await supabase.from('notifications').insert([
        {
          user_id: booking.teacherId,
          title: 'Session Window Closed - No-Show Flagged ⚠️',
          message: notifMsg,
          type: 'request',
          booking_id: booking.id,
          read: false,
          timestamp: new Date().toISOString()
        },
        {
          user_id: booking.learnerId,
          title: 'Session Window Closed - No-Show Flagged ⚠️',
          message: notifMsg,
          type: 'request',
          booking_id: booking.id,
          read: false,
          timestamp: new Date().toISOString()
        }
      ]);
    } catch (err) {
      console.error('Failed to mark booking as no-show:', err);
    }
  };

  const handleLogin = async (user: UserProfile) => {
    setIsLoading(true);
    try {
      setCurrentUser(user);
      await loadUserSpecificData(user.id);
    } catch (err) {
      console.error('Error logging in:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRegister = async (newUserPayload: any): Promise<{ success: boolean; error?: string }> => {
    try {
      const fullPayload: UserProfile = {
        ...newUserPayload,
        rating: 5,
        reviewsCount: 0,
        successfulExchanges: 0,
        badges: [],
        hasSeenOnboarding: false
      };
      const mappedRow = mapProfileToSupabase(fullPayload);
      const { data: dbData, error: dbError } = await supabase
        .from('profiles')
        .upsert(mappedRow)
        .select('*');
        
      if (dbError) {
        return { success: false, error: dbError.message || 'Database registration failed.' };
      }

      if (!dbData || !dbData[0]) {
        return { success: false, error: 'Registration failed: profile could not be created in database.' };
      }

      const registeredUser = {
        ...mapSupabaseToProfile(dbData[0]),
        hasSeenOnboarding: false
      };

      setIsLoading(true);

      let updatedUsers = [...allUsers];
      if (!updatedUsers.some(u => u.id === registeredUser.id)) {
        updatedUsers.push(registeredUser);
      }

      setAllUsers(updatedUsers);
      setCurrentUser(registeredUser);
      setShowOnboardingTour(true);
      await loadUserSpecificData(registeredUser.id);
      setIsLoading(false);
      return { success: true };
    } catch (err: any) {
      console.error('Error registering:', err);
      return { success: false, error: err.message || 'Error registering account.' };
    }
  };

  const handleLogout = async () => {
    try {
      await signOut();
    } catch (err) {
      console.warn('Error signing out of Supabase:', err);
    }
    setCurrentUser(null);
  };

  const handleDeleteAccount = async (password: string): Promise<{ success: boolean; error?: string }> => {
    if (!currentUser) {
      return { success: false, error: 'No active user session.' };
    }

    try {
      // 1. Verify re-entered password using Supabase Auth re-authentication
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email: currentUser.email.toLowerCase().trim(),
        password: password,
      });

      if (authError || !authData?.user) {
        return { 
          success: false, 
          error: authError?.message || 'Incorrect password. Verification failed.' 
        };
      }

      const userId = currentUser.id;

      // 2. Cancel future/pending bookings where user is teacher or learner
      try {
        await supabase
          .from('bookings')
          .update({ status: 'cancelled' })
          .or(`teacher_id.eq.${userId},learner_id.eq.${userId}`);
      } catch (bErr) {
        console.warn('Booking cancellation error during account delete:', bErr);
      }

      // 3. Delete notifications for this user
      try {
        await supabase
          .from('notifications')
          .delete()
          .eq('user_id', userId);
      } catch (nErr) {
        console.warn('Notification cleanup error during account delete:', nErr);
      }

      // 4. Delete user's sent or received messages
      try {
        await supabase
          .from('messages')
          .delete()
          .or(`sender_id.eq.${userId},receiver_id.eq.${userId}`);
      } catch (mErr) {
        console.warn('Message cleanup error during account delete:', mErr);
      }

      // 5. Delete profile row from public.profiles table
      const { error: profileError } = await supabase
        .from('profiles')
        .delete()
        .eq('id', userId);

      if (profileError) {
        console.error('Profiles table deletion failed:', profileError);
        return { 
          success: false, 
          error: `Failed to delete profile record: ${profileError.message}` 
        };
      }

      // 6. Invoke Edge Function to delete auth user from auth.users (if deployed)
      try {
        const { error: edgeFuncError } = await supabase.functions.invoke('delete-user', {
          body: { userId }
        });
        if (edgeFuncError) {
          console.warn('Edge function execution warning:', edgeFuncError);
        }
      } catch (edgeErr) {
        console.warn('Edge function invoke error:', edgeErr);
      }

      // 7. Perform sign-out and local state cleanup
      await signOut();

      const updatedUsers = allUsers.filter(u => u.id !== userId);
      setAllUsers(updatedUsers);

      setCurrentUser(null);
      setBookings([]);
      setNotifications([]);
      setProgress([]);
      setAccountDeletedNotice('Your account has been deleted successfully.');
      setActiveTab('dashboard');

      return { success: true };
    } catch (err: any) {
      console.error('Account deletion error:', err);
      return { 
        success: false, 
        error: err.message || 'An unexpected error occurred while deleting your account.' 
      };
    }
  };

  const handlePasswordUpdateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setResetError('');
    setResetSuccess('');
    setIsResetting(true);

    if (newPassword.length < 6) {
      setResetError('Password must be at least 6 characters long.');
      setIsResetting(false);
      return;
    }

    try {
      const { error } = await supabase.auth.updateUser({ password: newPassword });
      if (error) {
        setResetError(error.message);
      } else {
        setResetSuccess('Your password has been updated successfully!');
        setNewPassword('');
      }
    } catch (err: any) {
      setResetError(err.message || 'An error occurred. Please try again.');
    } finally {
      setIsResetting(false);
    }
  };

  const loadUserSpecificData = async (userId: string) => {
    try {
      // 0. Refresh Current User Profile (to ensure credits and state are up-to-date)
      try {
        const { data: profileRow, error: profErr } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', userId)
          .single();
        if (!profErr && profileRow) {
          const freshUser = mapSupabaseToProfile(profileRow);
          setCurrentUser(freshUser);
          setAllUsers((prev) => prev.map((u) => (u.id === userId ? freshUser : u)));
        }
      } catch (pErr) {
        console.warn('Supabase profile refresh failed:', pErr);
      }

      // 1. Fetch Bookings
      let bookData: Booking[] = [];
      try {
        const { data: dbRows, error: dbError } = await supabase
          .from('bookings')
          .select('*')
          .or(`teacher_id.eq.${userId},learner_id.eq.${userId}`);
        if (dbError) throw dbError;

        if (dbRows && Array.isArray(dbRows)) {
          bookData = dbRows.map(mapSupabaseToBooking);
        }
      } catch (err) {
        console.warn('Supabase bookings fetch failed:', err);
        bookData = [];
      }
      setBookings(bookData);

      // Ensure confirmed or rescheduled Live 1-on-1 bookings have a private live session initialized
      bookData.forEach(async (b) => {
        if ((b.status === 'confirmed' || b.status === 'rescheduled') && b.learningOption === 'Live 1-on-1 Session') {
          try {
            await getOrCreateLiveSessionForBooking(b);
          } catch {}
        }
      });

      // 2. Fetch Notifications
      let notifData: AppNotification[] = [];
      try {
        const { data: dbRows, error: dbError } = await supabase
          .from('notifications')
          .select('*')
          .eq('user_id', userId)
          .order('timestamp', { ascending: false });
        if (dbError) throw dbError;

        if (dbRows && Array.isArray(dbRows)) {
          notifData = dbRows.map(mapSupabaseToNotification);
        }
      } catch (err) {
        console.warn('Supabase notifications fetch failed:', err);
        notifData = [];
      }
      setNotifications(notifData);

      // 3. Compute Learning Progress from completed bookings
      const completedForLearner = bookData.filter(b => b.learnerId === userId && b.status === 'completed');
      const countsMap = new Map<string, number>();
      completedForLearner.forEach(b => {
        countsMap.set(b.skillName, (countsMap.get(b.skillName) || 0) + 1);
      });
      const progData: ProgressTrack[] = [];
      countsMap.forEach((count, skillName) => {
        const lessonsCompleted = Math.min(4, count);
        progData.push({
          userId,
          skillName,
          lessonsTotal: 4,
          lessonsCompleted,
          completionPercentage: Math.round((lessonsCompleted / 4) * 100),
          badgesEarned: lessonsCompleted >= 4 ? ['grad'] : [],
          lastActive: new Date().toISOString()
        });
      });
      setProgress(progData);

      // 4. Fetch Live Sessions
      try {
        const userLiveSessions = await fetchLiveSessionsForUser(userId);
        setLiveSessions(userLiveSessions);
      } catch (lsErr) {
        console.warn('Failed to fetch live sessions:', lsErr);
      }
    } catch (err) {
      console.error('Error loading user-specific data:', err);
    }
  };

  const handleBookSession = async (
    targetSwapper: UserProfile,
    skill: Skill,
    learningOption: string,
    date: string,
    timeSlot: 'Morning' | 'Afternoon' | 'Evening',
    notes: string,
    scheduledTime?: string,
    swapRole: 'learn' | 'teach' = 'learn'
  ) => {
    if (!currentUser) return;

    const teacherUser = swapRole === 'teach' ? currentUser : targetSwapper;
    const learnerUser = swapRole === 'teach' ? targetSwapper : currentUser;

    const teacherOffered = teacherUser.skillsOffered?.find(
      s => s.name.toLowerCase().trim() === skill.name.toLowerCase().trim()
    );
    const resolvedSkillLevel = teacherOffered?.level || skill.level || 'Intermediate';

    const bookingPayload: Booking = {
      id: `booking-${Date.now()}`,
      teacherId: teacherUser.id,
      teacherName: teacherUser.name,
      learnerId: learnerUser.id,
      learnerName: learnerUser.name,
      skillName: skill.name,
      category: skill.category,
      skillLevel: resolvedSkillLevel,
      learningOption: learningOption as any,
      date,
      timeSlot,
      scheduledTime,
      status: 'pending',
      notes,
      createdAt: new Date().toISOString()
    };

    try {
      // 1. Insert booking row into Supabase bookings table
      const mappedBooking = mapBookingToSupabase(bookingPayload);
      const { data: insertedBooking, error: insertError } = await supabase
        .from('bookings')
        .insert(mappedBooking)
        .select()
        .single();

      if (insertError) {
        alert(`Booking failed: ${insertError.message}`);
        return;
      }

      const createdBookingId = insertedBooking?.id || bookingPayload.id;

      // 2. Create notifications using Supabase
      // Notification to target user
      const { error: notif1Err } = await supabase.from('notifications').insert({
        user_id: targetSwapper.id,
        title: swapRole === 'teach' ? 'Session Offer Received' : 'New Session Request',
        message: swapRole === 'teach' 
          ? `${currentUser.name} offered to teach you ${skill.name}.`
          : `${currentUser.name} wants to book a session with you for ${skill.name}.`,
        type: 'request',
        booking_id: createdBookingId,
        read: false,
        timestamp: new Date().toISOString()
      });
      if (notif1Err) console.warn('Recipient notification warning:', notif1Err.message);

      // Notification to Current User
      const { error: notif2Err } = await supabase.from('notifications').insert({
        user_id: currentUser.id,
        title: swapRole === 'teach' ? 'Teaching Offer Sent' : 'Session Requested',
        message: swapRole === 'teach'
          ? `You offered to teach ${targetSwapper.name} ${skill.name}.`
          : `You requested a session with ${targetSwapper.name} for ${skill.name}.`,
        type: 'request',
        booking_id: createdBookingId,
        read: false,
        timestamp: new Date().toISOString()
      });
      if (notif2Err) console.warn('User notification warning:', notif2Err.message);

      await syncAllState();
    } catch (err: any) {
      console.error('Booking operation failed:', err);
      alert(`Booking failed: ${err.message || 'An error occurred during booking.'}`);
    }
  };

  const handleUpdateBookingStatus = async (
    bookingId: string,
    status: Booking['status'],
    actionUserId: string,
    extraFields?: Partial<Booking>
  ) => {
    let updateSucceeded = false;
    try {
      const booking = bookings.find(b => b.id === bookingId);
      if (!booking) throw new Error('Booking not found in local state');

      // 1. Update status on Supabase bookings table
      const updatePayload: any = { status };
      const nowIso = new Date().toISOString();
      if (status === 'completed') {
        updatePayload.completed_at = nowIso;
      } else if (status === 'cancelled') {
        updatePayload.cancelled_at = nowIso;
        if (extraFields?.cancellationReason !== undefined) {
          updatePayload.cancellation_reason = extraFields.cancellationReason;
        }
        if (extraFields?.isLateCancellation !== undefined) {
          updatePayload.is_late_cancellation = extraFields.isLateCancellation;
        }
      }
      if (extraFields?.notes !== undefined) updatePayload.notes = extraFields.notes;
      if (extraFields?.date !== undefined) updatePayload.date = extraFields.date;
      if (extraFields?.timeSlot !== undefined) updatePayload.time_slot = extraFields.timeSlot;
      if (extraFields?.scheduledTime !== undefined) updatePayload.scheduled_time = extraFields.scheduledTime;

      const { error: updateError } = await supabase
        .from('bookings')
        .update(updatePayload)
        .eq('id', bookingId);

      if (updateError) throw updateError;

      // 2. Perform actions depending on the transitioned state
      const oldStatus = booking.status;

      if (status === 'completed' && oldStatus !== 'completed') {
        // Teacher increases successful exchanges count
        const teacher = allUsers.find(u => u.id === booking.teacherId);
        if (teacher) {
          const updatedTeacher = {
            ...teacher,
            successfulExchanges: teacher.successfulExchanges + 1
          };

          // Teacher reward badge: First Swap
          if (updatedTeacher.successfulExchanges === 1 && !updatedTeacher.badges.some(b => b.id === 'first-swap')) {
            updatedTeacher.badges = [
              ...updatedTeacher.badges,
              {
                id: 'first-swap',
                name: 'First Swap',
                icon: 'Users',
                description: 'Successfully completed first skill exchange',
                dateEarned: new Date().toISOString().split('T')[0]
              }
            ];
          }

          const { error: teacherError } = await supabase
            .from('profiles')
            .update(mapProfileToSupabase(updatedTeacher))
            .eq('id', teacher.id);

          if (teacherError) console.warn('Failed to update teacher profile upon completion:', teacherError);
        }

        // Update learning progress tracker
        try {
          const completedForLearner = bookings
            .map(b => b.id === bookingId ? { ...b, status } : b)
            .filter(b => b.learnerId === booking.learnerId && b.status === 'completed');
          
          const countsMap = new Map<string, number>();
          completedForLearner.forEach(b => {
            countsMap.set(b.skillName, (countsMap.get(b.skillName) || 0) + 1);
          });
          const progressList: ProgressTrack[] = [];
          countsMap.forEach((count, skillName) => {
            const lessonsCompleted = Math.min(4, count);
            progressList.push({
              userId: booking.learnerId,
              skillName,
              lessonsTotal: 4,
              lessonsCompleted,
              completionPercentage: Math.round((lessonsCompleted / 4) * 100),
              badgesEarned: lessonsCompleted >= 4 ? ['grad'] : [],
              lastActive: new Date().toISOString()
            });
          });

          if (currentUser && currentUser.id === booking.learnerId) {
            setProgress(progressList);
          }
        } catch (progErr) {
          console.warn('Failed to update progress tracker:', progErr);
        }

        // If booking is completed, update connected live session if exists
        try {
          const liveSession = await getOrCreateLiveSessionForBooking(booking);
          await updateLiveSessionStatus(liveSession.id, 'ended', { endTime: new Date().toISOString() });
        } catch (lsErr) {
          console.warn('[App] Error marking live session ended:', lsErr);
        }

        // Add notifications
        await supabase.from('notifications').insert([
          {
            user_id: booking.teacherId,
            title: 'Session Completed!',
            message: `Great job! You completed the exchange with ${booking.learnerName}.`,
            type: 'match',
            booking_id: booking.id,
            read: false,
            timestamp: new Date().toISOString()
          },
          {
            user_id: booking.learnerId,
            title: 'Session Completed!',
            message: `Your session for ${booking.skillName} is complete. Please leave a review!`,
            type: 'match',
            booking_id: booking.id,
            read: false,
            timestamp: new Date().toISOString()
          }
        ]);

      } else if (status === 'cancelled' && oldStatus !== 'cancelled') {
        const cancellationReason = extraFields?.cancellationReason;
        const isLateCancellation = extraFields?.isLateCancellation ?? false;

        // 1. Immediately invalidate any connected live session record so no stray join succeeds
        try {
          await supabase
            .from('live_sessions')
            .update({ status: 'cancelled' })
            .eq('booking_id', booking.id);
        } catch (lsErr) {
          console.warn('[App] Error invalidating connected live session on cancel:', lsErr);
        }

        // 3. Notify the other participant immediately in real-time
        const notifierId = booking.learnerId === actionUserId ? booking.teacherId : booking.learnerId;
        const actionUserName = booking.learnerId === actionUserId ? booking.learnerName : booking.teacherName;
        const reasonPart = cancellationReason ? ` Reason: "${cancellationReason}"` : '';
        const latePart = isLateCancellation ? ' (Late cancellation - within 30 mins)' : '';

        await supabase.from('notifications').insert({
          user_id: notifierId,
          title: 'Session Cancelled',
          message: `${actionUserName} cancelled the session for ${booking.skillName}.${latePart}${reasonPart}`,
          type: 'request',
          booking_id: booking.id,
          read: false,
          timestamp: new Date().toISOString()
        });

      } else if (status === 'rescheduled') {
        const notifierId = booking.learnerId === actionUserId ? booking.teacherId : booking.learnerId;
        const actionUserName = booking.learnerId === actionUserId ? booking.learnerName : booking.teacherName;

        try {
          await getOrCreateLiveSessionForBooking({
            ...booking,
            date: extraFields?.date || booking.date,
            timeSlot: extraFields?.timeSlot || booking.timeSlot,
            scheduledTime: extraFields?.scheduledTime || booking.scheduledTime
          });
        } catch (lsErr) {
          console.warn('[App] Failed creating/updating LiveSession on reschedule:', lsErr);
        }

        await supabase.from('notifications').insert({
          user_id: notifierId,
          title: 'Session Rescheduled',
          message: `${actionUserName} rescheduled the session for ${booking.skillName} to ${extraFields?.date || booking.date} (${extraFields?.timeSlot || booking.timeSlot}).`,
          type: 'upcoming',
          booking_id: booking.id,
          read: false,
          timestamp: new Date().toISOString()
        });

      } else if (status === 'confirmed') {
        // Create or retrieve the private live session for this booking
        let sessionRoomId = '';
        try {
          const liveSession = await getOrCreateLiveSessionForBooking(booking);
          sessionRoomId = liveSession.id;
          console.log('[App] Created/verified LiveSession for booking:', booking.id, 'Room:', sessionRoomId);
        } catch (lsErr) {
          console.warn('[App] Failed creating LiveSession on confirmation:', lsErr);
        }

        if (oldStatus === 'pending') {
          await supabase.from('notifications').insert({
            user_id: booking.learnerId,
            title: 'Booking Confirmed!',
            message: `${booking.teacherName} accepted your session for ${booking.skillName} on ${extraFields?.date || booking.date}. Private live session room is ready.`,
            type: 'upcoming',
            booking_id: booking.id,
            read: false,
            timestamp: new Date().toISOString()
          });
        }
      }

      setBookings(prev => prev.map(b => {
        if (b.id === bookingId) {
          return {
            ...b,
            status,
            completedAt: status === 'completed' ? nowIso : b.completedAt,
            cancelledAt: status === 'cancelled' ? nowIso : b.cancelledAt,
            ...(extraFields || {})
          };
        }
        return b;
      }));

      await syncAllState();
    } catch (err: any) {
      console.error('Failed to update booking status:', err);
      alert(`Failed to update booking status: ${err.message || 'Database update error occurred.'}`);
    }
  };

  const handleLeaveReview = async (reviewData: Omit<Review, 'id' | 'createdAt'>) => {
    try {
      const newReview: Review = {
        id: `review-${Date.now()}`,
        ...reviewData,
        createdAt: new Date().toISOString()
      };

      // 1. Insert review into Supabase 'reviews' table
      try {
        const mappedReview = mapReviewToSupabase(newReview);
        const { data: insertedRev } = await supabase
          .from('reviews')
          .insert([mappedReview])
          .select();
        if (insertedRev && insertedRev[0]?.id) {
          newReview.id = insertedRev[0].id;
        }
      } catch (revInsertErr) {
        console.warn('Could not insert to Supabase reviews table:', revInsertErr);
      }

      // 2. Update local reviews state immediately
      setAllReviews(prev => [newReview, ...prev]);

      // Fetch the teacher profile first to make sure we have up-to-date count and rating
      const { data: teacherProfile, error: fetchErr } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', reviewData.teacherId)
        .single();
      
      if (!fetchErr && teacherProfile) {
        const currentCount = teacherProfile.reviews_count || 0;
        const currentRating = typeof teacherProfile.rating === 'number' ? teacherProfile.rating : parseFloat(teacherProfile.rating || '5.0');
        const newCount = currentCount + 1;
        const newRating = Number(((currentRating * currentCount + reviewData.rating) / newCount).toFixed(1));

        // Update the teacher profile in Supabase
        await supabase
          .from('profiles')
          .update({
            reviews_count: newCount,
            rating: newRating
          })
          .eq('id', reviewData.teacherId);
      }

      // Also insert review notification to Supabase
      await supabase.from('notifications').insert({
        user_id: reviewData.teacherId,
        title: 'New Review Received!',
        message: `${reviewData.learnerName} left you a ${reviewData.rating}-star review for ${reviewData.skillName || 'your session'}: "${reviewData.comment.substring(0, 40)}..."`,
        type: 'match',
        read: false,
        timestamp: new Date().toISOString()
      });

      await syncAllState();
    } catch (err: any) {
      console.error('Failed to submit review:', err);
      alert(`Failed to submit review: ${err.message || 'Database error occurred.'}`);
    }
  };

  const handleMarkNotificationRead = async (notifId: string) => {
    try {
      if (!notifId.startsWith('notif-')) {
        const { error } = await supabase
          .from('notifications')
          .update({ read: true })
          .eq('id', notifId);
        if (error) {
          console.error('Supabase notification read update failed:', error.message);
          return;
        }
      }

      setNotifications(prev => prev.map(n => n.id === notifId ? { ...n, read: true } : n));
    } catch (err) {
      console.error('Error marking notification as read:', err);
    }
  };

  const handleDeleteNotification = async (notifId: string) => {
    try {
      if (!notifId.startsWith('notif-')) {
        const { error } = await supabase
          .from('notifications')
          .delete()
          .eq('id', notifId);
        if (error) {
          console.error('Supabase notification delete failed:', error.message);
          return;
        }
      }

      setNotifications(prev => prev.filter(n => n.id !== notifId));
    } catch (err) {
      console.error('Error deleting notification:', err);
    }
  };

  const handleSaveProfile = async (updatedProfile: UserProfile) => {
    if (!currentUser) return;
    setIsSaving(true);

    try {
      const mappedRow = mapProfileToSupabase(updatedProfile);
      const { data: dbData, error: dbError } = await supabase
        .from('profiles')
        .upsert(mappedRow)
        .select('*');

      if (dbError) throw dbError;

      if (!dbData || !dbData[0]) {
        throw new Error('Profile update returned no data from database');
      }

      const savedUser = mapSupabaseToProfile(dbData[0]);
      setCurrentUser(savedUser);

      // Refresh the complete users list
      const { data: dbRows, error: fetchUsersErr } = await supabase.from('profiles').select('*');
      if (!fetchUsersErr && dbRows) {
        const mappedUsers = dbRows.map(mapSupabaseToProfile);
        setAllUsers(mappedUsers);
      }
    } catch (err: any) {
      console.error('Failed to save profile to database:', err);
      alert(`Failed to save profile: ${err.message || 'Database operation failed'}`);
    } finally {
      setIsSaving(false);
    }
  };

  const syncAllState = async () => {
    if (!currentUser) return;
    
    try {
      setSyncError(null);
      // Refresh list of users
      let uData: UserProfile[] = [];
      try {
        const { data: dbRows, error: dbError } = await supabase.from('profiles').select('*');
        if (!dbError && dbRows && dbRows.length > 0) {
          uData = dbRows.map(mapSupabaseToProfile);
        } else {
          uData = fallbackUsers;
        }
      } catch (err) {
        uData = fallbackUsers;
      }
      setAllUsers(uData);

      // Refresh current user stats (e.g. swaps count)
      const freshCurrentUser = uData.find((u: any) => u.id === currentUser.id);
      if (freshCurrentUser) {
        setCurrentUser(freshCurrentUser);
      }

      // Refresh active bookings, notifications, and progress
      await loadUserSpecificData(currentUser.id);
    } catch (err: any) {
      console.error('Supabase sync failed:', err);
      setSyncError('Sync failed. Please check your network connection.');
    }
  };

  const handleSelectRecommendedSkill = (skillName: string, category: string) => {
    // We navigate to explorer with preset category/search preloaded inside ExploreView
    setActiveTab('explore');
  };

  // Contacts list (only users with confirmed bookings, message history, or session-initiated chat)
  const contacts = allUsers.filter(u => {
    if (!currentUser || u.id === currentUser.id) return false;

    // 1. Confirmed or rescheduled booking between them and currentUser
    const hasConfirmedBooking = bookings.some(
      b => (b.status === 'confirmed' || b.status === 'rescheduled') &&
        ((b.teacherId === currentUser.id && b.learnerId === u.id) ||
         (b.learnerId === currentUser.id && b.teacherId === u.id))
    );

    // 2. In message partner IDs
    const hasMessaged = messagePartnerIds.has(u.id);

    // 3. In session initiated chat IDs
    const hasInitiatedChat = sessionInitiatedChatIds.has(u.id);

    return hasConfirmedBooking || hasMessaged || hasInitiatedChat;
  });

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-black gap-4 text-white">
        <InitialAppLoader />
        <div className="relative flex items-center justify-center">
          <div className="w-12 h-12 rounded-full border-2 border-violet-500/20 border-t-violet-500 animate-spin" />
        </div>
        <div className="text-center space-y-1">
          <h2 className="font-sans font-medium text-white tracking-tight text-base">Loading SkillSwap Platform...</h2>
          <p className="text-text-muted text-xs">Synchronizing swapper index and availability calendars</p>
        </div>
      </div>
    );
  }

  if (!currentUser) {
    return (
      <AmbientBackground className="min-h-screen flex flex-col font-sans text-slate-100 antialiased justify-between selection:bg-violet-500/30 selection:text-violet-200">
        <InitialAppLoader />
        <div className="flex-1 flex items-center justify-center w-full">
          <LoginView 
            onLogin={handleLogin} 
            onRegister={handleRegister} 
            allUsers={allUsers}
            accountDeletedNotice={accountDeletedNotice}
          />
        </div>
        <footer className="bg-surface-base/80 border-t border-white/5 py-4 text-center text-[11px] text-text-dim font-medium backdrop-blur-md">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <p>© 2026 Skill Swap Platform. Built for mutual skill barters. No money required.</p>
          </div>
        </footer>
      </AmbientBackground>
    );
  }

  return (
    <AmbientBackground className="flex flex-col min-h-screen text-slate-100 font-sans antialiased selection:bg-violet-500/30 selection:text-violet-200">
      <InitialAppLoader />
      
      {/* Redesigned Floating Glass Navigation */}
      <Navbar
        activeTab={activeTab === 'live-room' ? 'dashboard' : activeTab}
        setActiveTab={(tab) => setActiveTab(tab)}
        currentUser={currentUser}
        notifications={notifications}
        onMarkNotificationRead={handleMarkNotificationRead}
        onDeleteNotification={handleDeleteNotification}
        onSync={syncAllState}
        onLogout={handleLogout}
        onUpdateBookingStatus={handleUpdateBookingStatus}
        onStartLiveSession={handleStartLiveSession}
        bookings={bookings}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-2.5 sm:px-6 lg:px-8 py-4 sm:py-8 relative z-10">
        {userLoadError && (
          <div className="mb-4 p-3 bg-rose-500/10 border border-rose-500/30 text-rose-300 rounded-xl text-sm flex items-center justify-between">
            <span>{userLoadError}</span>
            <button onClick={() => window.location.reload()} className="px-3 py-1 bg-rose-600 text-white rounded text-xs font-semibold hover:bg-rose-700">Refresh Page</button>
          </div>
        )}

        {syncError && (
          <div className="mb-4 p-3 bg-amber-500/10 border border-amber-500/30 text-amber-300 rounded-xl text-sm flex items-center justify-between">
            <span>{syncError}</span>
            <button onClick={() => setSyncError(null)} className="text-xs text-amber-300 underline font-semibold">Dismiss</button>
          </div>
        )}

        <AnimatePresence mode="wait" initial={false}>
          <motion.div
            key={activeTab}
            initial={prefersReducedMotion ? { opacity: 0 } : { opacity: 0, y: 12, scale: 0.995, filter: 'blur(3px)' }}
            animate={prefersReducedMotion ? { opacity: 1 } : { opacity: 1, y: 0, scale: 1, filter: 'blur(0px)' }}
            exit={prefersReducedMotion ? { opacity: 0 } : { opacity: 0, y: -10, scale: 0.995, filter: 'blur(3px)' }}
            transition={{ duration: prefersReducedMotion ? 0.1 : 0.42, ease: [0.22, 1, 0.36, 1] }}
            className="w-full"
          >
            {activeTab === 'dashboard' && (
              <DashboardView 
                currentUser={currentUser}
                bookings={bookings}
                notifications={notifications}
                progress={progress}
                onUpdateBookingStatus={handleUpdateBookingStatus}
                onLeaveReview={handleLeaveReview}
                onMarkNotificationRead={handleMarkNotificationRead}
                onDeleteNotification={handleDeleteNotification}
                allUsers={allUsers}
                onStartLiveSession={handleStartLiveSession}
                onNavigateToExplore={() => setActiveTab('explore')}
                onNavigateToGamification={() => setActiveTab('gamification')}
                onNavigateToSkillPath={() => setActiveTab('skill-path')}
                allReviews={allReviews}
              />
            )}

            {activeTab === 'live-room' && activeLiveSessionBooking && activeLiveSessionData && (
              <LiveSessionRoomView 
                booking={activeLiveSessionBooking}
                liveSession={activeLiveSessionData}
                currentUser={currentUser}
                otherUser={
                  allUsers.find(u => u.id === (currentUser.id === activeLiveSessionBooking.teacherId ? activeLiveSessionBooking.learnerId : activeLiveSessionBooking.teacherId))
                  || {
                    id: currentUser.id === activeLiveSessionBooking.teacherId ? activeLiveSessionBooking.learnerId : activeLiveSessionBooking.teacherId,
                    name: currentUser.id === activeLiveSessionBooking.teacherId ? activeLiveSessionBooking.learnerName : activeLiveSessionBooking.teacherName,
                    email: 'swapper@exchange.com',
                    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150',
                    skillsToTeach: [],
                    skillsToLearn: [],
                    completedSwapsCount: 0,
                    badges: []
                  }
                }
                allUsers={allUsers}
                allReviews={allReviews}
                onLeaveReview={handleLeaveReview}
                onBookAnotherSession={(teacher, skill, option, date, slot, notes) => handleBookSession(teacher, skill, option, date, slot, notes)}
                onMarkSessionCompleted={async (bookingId) => {
                  await handleUpdateBookingStatus(bookingId, 'completed', currentUser.id);
                }}
                onMarkSessionNoShow={async (bookingId) => {
                  await handleMarkNoShow(bookingId);
                }}
                onLeave={() => {
                  setActiveLiveSessionBooking(null);
                  setActiveLiveSessionData(null);
                  setActiveTab('dashboard');
                }}
              />
            )}

            {activeTab === 'explore' && (
              <ExploreView 
                currentUser={currentUser}
                users={allUsers}
                onBookSession={handleBookSession}
                onOpenChat={(id) => {
                  setSessionInitiatedChatIds(prev => new Set(prev).add(id));
                  setInitialActiveContactId(id);
                  setActiveTab('chat');
                }}
                isLoading={isLoading}
                allReviews={allReviews}
              />
            )}

            {activeTab === 'chat' && (
              <ChatView 
                currentUser={currentUser}
                contacts={contacts}
                initialActiveContactId={initialActiveContactId}
                bookings={bookings}
              />
            )}

            {activeTab === 'profile' && (
              <ProfileView 
                currentUser={currentUser}
                onSaveProfile={handleSaveProfile}
                isSaving={isSaving}
                onLogout={handleLogout}
                onDeleteAccount={handleDeleteAccount}
                allReviews={allReviews}
              />
            )}

            {activeTab === 'study-hub' && (
              <StudyHubView 
                currentUser={currentUser}
                onNavigateToExplore={(skillQuery) => {
                  setActiveTab('explore');
                }}
              />
            )}

            {activeTab === 'skill-path' && (
              <SkillPathView 
                currentUser={currentUser} 
                onNavigateToExplore={(skillQuery) => {
                  setActiveTab('explore');
                }}
              />
            )}

            {activeTab === 'gamification' && (
              <GamificationHubView 
                currentUser={currentUser}
                allUsers={allUsers}
                bookings={bookings}
                onRewardClaimed={(xpAmount, title) => {
                  triggerRewardToast('Quest Completed!', `You completed "${title}" and earned rewards!`, xpAmount, '🏆');
                }}
                onNavigateToExplore={() => setActiveTab('explore')}
              />
            )}

            {activeTab === 'credits' && (
              <CreditsView 
                currentUser={currentUser}
                onRefreshProfile={() => loadUserSpecificData(currentUser.id)}
              />
            )}
          </motion.div>
        </AnimatePresence>
      </main>

      {/* Gamification Overlay for Toasts and Badge Popups */}
      <GamificationOverlay
        toasts={gamificationToasts}
        unlockedBadge={unlockedBadge}
        onDismissToast={(id) => setGamificationToasts(prev => prev.filter(t => t.id !== id))}
        onCloseBadgeModal={() => setUnlockedBadge(null)}
      />

      {/* Humble Footer */}
      <footer className="mt-auto bg-zinc-950 border-t border-zinc-900/80 py-6 text-center text-xs text-zinc-500 font-medium">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-5 h-5 rounded-md bg-indigo-500/20 text-indigo-400 flex items-center justify-center font-bold text-xs">⇆</div>
            <span className="font-semibold text-zinc-300">SkillSwap SaaS 2026</span>
          </div>
          <p>© 2026 ExchangeYourSkill. Built for mutual skill barters. No money required.</p>
        </div>
      </footer>

      {/* Incoming Call Banner / Modal */}
      {incomingCall && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-[120] w-[92%] max-w-md bg-zinc-900 text-white rounded-2xl p-4 shadow-2xl border border-indigo-500/40 flex items-center justify-between gap-3 animate-in fade-in slide-in-from-top-4 duration-200">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-full bg-indigo-600 flex items-center justify-center shrink-0 animate-pulse">
              <PhoneCall className="w-5 h-5 text-white" />
            </div>
            <div className="min-w-0">
              <h4 className="font-bold text-sm truncate text-white">Incoming Live Call</h4>
              <p className="text-xs text-zinc-300 truncate">
                <span className="font-semibold text-white">{incomingCall.callerName}</span> is calling you
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={async () => {
                let targetBooking = bookings.find(b => b.id === incomingCall.bookingId);
                if (!targetBooking && incomingCall.bookingId) {
                  try {
                    const { data } = await supabase.from('bookings').select('*').eq('id', incomingCall.bookingId).single();
                    if (data) targetBooking = mapSupabaseToBooking(data);
                  } catch (err) {
                    console.warn('Could not fetch booking for incoming call:', err);
                  }
                }
                if (targetBooking) {
                  handleStartLiveSession(targetBooking);
                } else {
                  alert('Booking for this call could not be found.');
                }
                setIncomingCall(null);
              }}
              className="px-3 py-1.5 bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-xs rounded-xl transition cursor-pointer flex items-center gap-1.5 shadow-md"
            >
              <PhoneCall className="w-3.5 h-3.5" />
              Join Call
            </button>
            <button
              onClick={() => setIncomingCall(null)}
              className="px-2.5 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-medium text-xs rounded-xl transition cursor-pointer"
            >
              Dismiss
            </button>
          </div>
        </div>
      )}

      {/* Password Reset Recovery Modal */}
      {showPasswordResetModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center z-[100] p-4">
          <div className="bg-zinc-900 rounded-[24px] max-w-sm w-full p-6 shadow-2xl border border-zinc-800 flex flex-col gap-4 text-left">
            <div className="space-y-1">
              <h3 className="text-base font-bold text-white">Set New Password</h3>
              <p className="text-xs text-zinc-400">Please choose a secure new password for your account.</p>
            </div>

            {resetError && (
              <div className="p-3 bg-rose-500/10 text-rose-300 border border-rose-500/20 rounded-xl flex items-start gap-2.5 text-xs">
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-400 mt-0.5" />
                <p>{resetError}</p>
              </div>
            )}

            {resetSuccess ? (
              <div className="space-y-4">
                <div className="p-3 bg-emerald-500/10 text-emerald-300 border border-emerald-500/20 rounded-xl flex items-start gap-2.5 text-xs">
                  <Check className="w-4 h-4 shrink-0 text-emerald-400 mt-0.5" />
                  <p>{resetSuccess}</p>
                </div>
                <button
                  onClick={() => setShowPasswordResetModal(false)}
                  className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold rounded-xl text-xs cursor-pointer border-0 shadow-lg shadow-indigo-600/20"
                >
                  Close & Sign In
                </button>
              </div>
            ) : (
              <form onSubmit={handlePasswordUpdateSubmit} className="space-y-4">
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-zinc-400 uppercase tracking-wider">New Password</label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-2.5 w-4 h-4 text-zinc-500" />
                    <input
                      type="password"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="••••••••"
                      required
                      className="w-full bg-zinc-950 border border-zinc-800 rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder:text-zinc-600 focus:outline-none focus:ring-2 focus:ring-indigo-500/40 focus:border-indigo-500"
                    />
                  </div>
                </div>

                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={() => setShowPasswordResetModal(false)}
                    className="flex-1 py-2.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-semibold rounded-xl text-xs cursor-pointer border-0"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isResetting}
                    className="flex-1 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold rounded-xl text-xs cursor-pointer border-0 disabled:opacity-50 shadow-lg shadow-indigo-600/20"
                  >
                    {isResetting ? 'Saving...' : 'Update Password'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* New User Onboarding Tour Modal */}
      {showOnboardingTour && (
        <OnboardingTour
          userName={currentUser?.name}
          onComplete={handleCompleteOnboarding}
        />
      )}

    </AmbientBackground>
  );
}

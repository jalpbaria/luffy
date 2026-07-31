import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
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
import OnboardingTour from './components/OnboardingTour';
import { GamificationHubView } from './components/GamificationHubView';
import { GamificationOverlay } from './components/GamificationCelebration';
import { triggerCelebrationConfetti } from './lib/gamification';
import { GamificationToast, Badge as GamificationBadge } from './types';
import { Navbar } from './components/Navbar';
import { supabase, mapSupabaseToProfile, mapProfileToSupabase, mapSupabaseToBooking, mapBookingToSupabase, mapSupabaseToNotification, mapNotificationToSupabase, mapSupabaseToReview, mapReviewToSupabase } from './lib/supabase';
import { useAuth } from './contexts/AuthContext';

// Fallback mock data when API is unreachable
import { fallbackUsers, fallbackBookings, fallbackNotifications, fallbackProgress } from './data/fallbackUsers';
import { fallbackReviews } from './data/fallbackReviews';



export default function App() {
  const { signOut } = useAuth();
  const [activeTab, setActiveTab] = useState<'dashboard' | 'explore' | 'chat' | 'study-hub' | 'skill-path' | 'gamification' | 'profile' | 'live-room'>('dashboard');
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
      alert(`Cannot join: This booking status is currently "${booking.status}". Only confirmed or rescheduled sessions can launch the live classroom.`);
      return;
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
            throw new Error('No users returned from Supabase profiles table');
          }
          // Merge any locally created users that aren't in the server list yet
          const savedLocalUsers = localStorage.getItem('local_users');
          if (savedLocalUsers) {
            try {
              const localUsers = JSON.parse(savedLocalUsers);
              if (Array.isArray(localUsers)) {
                localUsers.forEach((lu: any) => {
                  if (lu && lu.id && !data.some((su: any) => su.id === lu.id)) {
                    data.push(lu);
                  }
                });
              }
            } catch {}
          }
          // Also update local storage cache with the merged list
          localStorage.setItem('local_users', JSON.stringify(data));
        } catch (err) {
          console.warn('Supabase profiles fetch failed, loading from local fallback:', err);
          const savedLocalUsers = localStorage.getItem('local_users');
          if (savedLocalUsers) {
            try {
              data = JSON.parse(savedLocalUsers);
            } catch {
              data = fallbackUsers;
            }
          } else {
            data = fallbackUsers;
            localStorage.setItem('local_users', JSON.stringify(fallbackUsers));
          }
        }
        setAllUsers(data);

        // Fetch All Reviews for Verified Skill calculating
        let loadedReviews: Review[] = [];
        try {
          const { data: dbRevRows, error: dbRevErr } = await supabase.from('reviews').select('*');
          if (!dbRevErr && dbRevRows && Array.isArray(dbRevRows)) {
            loadedReviews = dbRevRows.map(mapSupabaseToReview);
          } else {
            throw new Error('No reviews returned from Supabase');
          }
        } catch {
          const savedReviews = localStorage.getItem('local_all_reviews');
          if (savedReviews) {
            try {
              loadedReviews = JSON.parse(savedReviews);
            } catch {
              loadedReviews = fallbackReviews;
            }
          } else {
            loadedReviews = fallbackReviews;
            localStorage.setItem('local_all_reviews', JSON.stringify(fallbackReviews));
          }
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

        // No local fallback. Access requires an active Supabase Auth session.
        
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
              const updated = [newNotif, ...prev];
              localStorage.setItem(`local_notifications_${currentUser.id}`, JSON.stringify(updated));
              return updated;
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
            setNotifications((prev) => {
              const updated = prev.map((n) => (n.id === updatedNotif.id ? updatedNotif : n));
              localStorage.setItem(`local_notifications_${currentUser.id}`, JSON.stringify(updated));
              return updated;
            });
          } else if (payload.eventType === 'DELETE') {
            const deletedId = payload.old.id;
            setNotifications((prev) => {
              const updated = prev.filter((n) => n.id !== deletedId);
              localStorage.setItem(`local_notifications_${currentUser.id}`, JSON.stringify(updated));
              return updated;
            });
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
          const updated = [newBooking, ...prev];
          localStorage.setItem(`local_bookings_${currentUser.id}`, JSON.stringify(updated));
          return updated;
        });
      } else if (payload.eventType === 'UPDATE') {
        const updatedBooking = mapSupabaseToBooking(payload.new);
        setBookings((prev) => {
          const updated = prev.map((b) => (b.id === updatedBooking.id ? updatedBooking : b));
          localStorage.setItem(`local_bookings_${currentUser.id}`, JSON.stringify(updated));
          return updated;
        });
      } else if (payload.eventType === 'DELETE') {
        const deletedId = payload.old?.id;
        if (!deletedId) return;
        setBookings((prev) => {
          const updated = prev.filter((b) => b.id !== deletedId);
          localStorage.setItem(`local_bookings_${currentUser.id}`, JSON.stringify(updated));
          return updated;
        });
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

  // Fetch message partner IDs when currentUser changes
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
            if (msg.sender_id === currentUser.id && msg.receiver_id !== currentUser.id) {
              partnerIds.add(msg.receiver_id);
            } else if (msg.receiver_id === currentUser.id && msg.sender_id !== currentUser.id) {
              partnerIds.add(msg.sender_id);
            }
          });
          setMessagePartnerIds(partnerIds);
        }
      } catch (err) {
        console.error('Failed to load message partner IDs:', err);
      }
    };

    fetchMessagePartners();
  }, [currentUser?.id]);

  // Periodic check (every 60 seconds) for 15-minute upcoming session reminders
  useEffect(() => {
    if (!currentUser?.id) return;

    const checkUpcomingSessionReminders = async () => {
      const now = Date.now();
      const fifteenMinsMs = 15 * 60 * 1000;

      // Find confirmed or rescheduled bookings starting within 15 minutes that haven't had a reminder sent
      const upcomingToRemind = bookings.filter((b) => {
        if (b.status !== 'confirmed' && b.status !== 'rescheduled') return false;
        if (b.reminderSent) return false;

        const startTimeIso = computeStartTime(b.date, b.timeSlot, b.scheduledTime);
        const startTimeMs = new Date(startTimeIso).getTime();
        const diffMs = startTimeMs - now;

        // Starting within 15 minutes (diffMs <= 15 minutes) and not ended long ago (diffMs >= -2 minutes)
        return diffMs <= fifteenMinsMs && diffMs >= -2 * 60 * 1000;
      });

      if (upcomingToRemind.length === 0) return;

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
          if (newNotifs.length > 0) {
            const updated = [...newNotifs, ...prev];
            localStorage.setItem(`local_notifications_${currentUser.id}`, JSON.stringify(updated));
            return updated;
          }
          return prev;
        });
      }
    };

    // Run immediately and every 60 seconds
    checkUpcomingSessionReminders();
    const interval = setInterval(checkUpcomingSessionReminders, 60000);

    return () => clearInterval(interval);
  }, [currentUser?.id, bookings]);

  const handleLogin = async (user: UserProfile) => {
    setIsLoading(true);
    try {
      localStorage.setItem('logged_in_user_id', user.id);
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
        credits: 5,
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
      localStorage.setItem('local_users', JSON.stringify(updatedUsers));

      localStorage.setItem('logged_in_user_id', registeredUser.id);
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
    localStorage.removeItem('logged_in_user_id');
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
      localStorage.setItem('local_users', JSON.stringify(updatedUsers));
      localStorage.removeItem('logged_in_user_id');
      localStorage.removeItem('saved_user');

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
        } else {
          throw new Error('No bookings returned');
        }
        localStorage.setItem(`local_bookings_${userId}`, JSON.stringify(bookData));
      } catch (err) {
        console.warn('Supabase bookings fetch failed, loading from cache/fallback:', err);
        const savedBookings = localStorage.getItem(`local_bookings_${userId}`);
        if (savedBookings) {
          bookData = JSON.parse(savedBookings);
        } else {
          bookData = fallbackBookings.filter(b => b.teacherId === userId || b.learnerId === userId);
          localStorage.setItem(`local_bookings_${userId}`, JSON.stringify(bookData));
        }
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
        } else {
          throw new Error('No notifications returned');
        }
        localStorage.setItem(`local_notifications_${userId}`, JSON.stringify(notifData));
      } catch (err) {
        console.warn('Supabase notifications fetch failed, loading from cache/fallback:', err);
        const savedNotifs = localStorage.getItem(`local_notifications_${userId}`);
        if (savedNotifs) {
          notifData = JSON.parse(savedNotifs);
        } else {
          notifData = fallbackNotifications.filter(n => n.userId === userId);
          localStorage.setItem(`local_notifications_${userId}`, JSON.stringify(notifData));
        }
      }
      setNotifications(notifData);

      // 3. Fetch Learning Progress
      let progData;
      const savedProg = localStorage.getItem(`local_progress_${userId}`);
      if (savedProg) {
        progData = JSON.parse(savedProg);
      } else {
        progData = fallbackProgress.filter(p => p.userId === userId);
        localStorage.setItem(`local_progress_${userId}`, JSON.stringify(progData));
      }
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
    teacher: UserProfile,
    skill: Skill,
    learningOption: string,
    date: string,
    timeSlot: 'Morning' | 'Afternoon' | 'Evening',
    notes: string,
    scheduledTime?: string
  ) => {
    if (!currentUser) return;

    if (currentUser.credits < 1) {
      alert('Insufficient credits to book this session.');
      return;
    }

    const bookingPayload: Booking = {
      id: `booking-${Date.now()}`,
      teacherId: teacher.id,
      teacherName: teacher.name,
      learnerId: currentUser.id,
      learnerName: currentUser.name,
      skillName: skill.name,
      category: skill.category,
      learningOption: learningOption as any,
      date,
      timeSlot,
      scheduledTime,
      status: 'pending',
      notes,
      createdAt: new Date().toISOString()
    };

    try {
      // 1. Deduct 1 credit from learner profile in Supabase
      const updatedLearner = {
        ...currentUser,
        credits: Math.max(0, currentUser.credits - 1)
      };

      const { error: profileError } = await supabase
        .from('profiles')
        .update(mapProfileToSupabase(updatedLearner))
        .eq('id', currentUser.id);

      if (profileError) {
        alert(`Booking failed: ${profileError.message}`);
        return;
      }

      // 2. Insert booking row into Supabase bookings table
      const mappedBooking = mapBookingToSupabase(bookingPayload);
      const { error: insertError } = await supabase
        .from('bookings')
        .insert(mappedBooking);

      if (insertError) {
        // Rollback credit deduction if possible
        await supabase
          .from('profiles')
          .update(mapProfileToSupabase(currentUser))
          .eq('id', currentUser.id);
        alert(`Booking failed: ${insertError.message}`);
        return;
      }

      // 3. Create notifications using Supabase
      // Notification to Teacher
      const { error: notif1Err } = await supabase.from('notifications').insert({
        user_id: teacher.id,
        title: 'New Session Request',
        message: `${currentUser.name} wants to book a session with you for ${skill.name}.`,
        type: 'request',
        read: false,
        timestamp: new Date().toISOString()
      });
      if (notif1Err) console.warn('Teacher notification warning:', notif1Err.message);

      // Notification to Learner
      const { error: notif2Err } = await supabase.from('notifications').insert({
        user_id: currentUser.id,
        title: 'Session Requested',
        message: `You requested a session with ${teacher.name} for ${skill.name}. 1 credit reserved.`,
        type: 'credit',
        read: false,
        timestamp: new Date().toISOString()
      });
      if (notif2Err) console.warn('Learner notification warning:', notif2Err.message);

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
        // Teacher earns 1 credit and increases successful exchanges count
        const teacher = allUsers.find(u => u.id === booking.teacherId);
        if (teacher) {
          const updatedTeacher = {
            ...teacher,
            credits: teacher.credits + 1,
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
          const savedProg = localStorage.getItem(`local_progress_${booking.learnerId}`);
          let progressList = savedProg ? JSON.parse(savedProg) : [];
          if (!Array.isArray(progressList)) progressList = [];
          
          const existingProgIndex = progressList.findIndex((p: any) => p.skillName === booking.skillName);

          if (existingProgIndex === -1) {
            // Create a brand new progress tracker in local storage
            const newProg = {
              id: `progress-${Date.now()}`,
              userId: booking.learnerId,
              skillName: booking.skillName,
              lessonsTotal: 4,
              lessonsCompleted: 1,
              completionPercentage: 25,
              badgesEarned: [],
              lastActive: new Date().toISOString()
            };
            progressList.push(newProg);
          } else {
            // Update existing progress tracker
            const existingProg = progressList[existingProgIndex];
            const lessonsCompleted = Math.min(existingProg.lessonsTotal, existingProg.lessonsCompleted + 1);
            const completionPercentage = Math.round((lessonsCompleted / existingProg.lessonsTotal) * 100);
            const badgesEarned = [...existingProg.badgesEarned];

            // Earn graduation badge if completed
            if (completionPercentage === 100 && !badgesEarned.includes('grad')) {
              badgesEarned.push('grad');

              // Add graduate badge to learner's profile
              const learner = allUsers.find(u => u.id === booking.learnerId);
              if (learner && !learner.badges.some(b => b.id === 'grad-badge')) {
                const updatedLearner = {
                  ...learner,
                  badges: [
                    ...learner.badges,
                    {
                      id: 'grad-badge',
                      name: `${booking.skillName} Grad`,
                      icon: 'GraduationCap',
                      description: `Successfully completed all sessions of ${booking.skillName}`,
                      dateEarned: new Date().toISOString().split('T')[0]
                    }
                  ]
                };

                const { error: learnerError } = await supabase
                  .from('profiles')
                  .update(mapProfileToSupabase(updatedLearner))
                  .eq('id', learner.id);

                if (learnerError) console.warn('Failed to add graduation badge to learner profile:', learnerError);
              }
            }

            progressList[existingProgIndex] = {
              ...existingProg,
              lessonsCompleted,
              completionPercentage,
              badgesEarned,
              lastActive: new Date().toISOString()
            };
          }

          localStorage.setItem(`local_progress_${booking.learnerId}`, JSON.stringify(progressList));
          
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
            title: 'Credits Earned!',
            message: `You earned 1 credit for completing the exchange with ${booking.learnerName}.`,
            type: 'credit',
            read: false,
            timestamp: new Date().toISOString()
          },
          {
            user_id: booking.learnerId,
            title: 'Session Completed!',
            message: `Your session for ${booking.skillName} is complete. Please leave a review!`,
            type: 'match',
            read: false,
            timestamp: new Date().toISOString()
          }
        ]);

      } else if (status === 'cancelled' && oldStatus !== 'cancelled') {
        // Mark connected live session as cancelled
        try {
          const liveSession = await getOrCreateLiveSessionForBooking(booking);
          await updateLiveSessionStatus(liveSession.id, 'cancelled');
        } catch (lsErr) {
          console.warn('[App] Error cancelling connected live session:', lsErr);
        }

        // Refund 1 credit to learner profile
        const learner = allUsers.find(u => u.id === booking.learnerId);
        if (learner) {
          const updatedLearner = {
            ...learner,
            credits: learner.credits + 1
          };

          const { error: learnerError } = await supabase
            .from('profiles')
            .update(mapProfileToSupabase(updatedLearner))
            .eq('id', learner.id);

          if (learnerError) console.warn('Failed to refund learner credit:', learnerError);
        }

        // Refund notification to learner
        await supabase.from('notifications').insert({
          user_id: booking.learnerId,
          title: 'Session Cancelled (Refunded)',
          message: `Your booking for ${booking.skillName} was cancelled. 1 credit has been returned.`,
          type: 'credit',
          read: false,
          timestamp: new Date().toISOString()
        });

        // Notify other party
        const notifierId = booking.learnerId === actionUserId ? booking.teacherId : booking.learnerId;
        const actionUserName = booking.learnerId === actionUserId ? booking.learnerName : booking.teacherName;

        await supabase.from('notifications').insert({
          user_id: notifierId,
          title: 'Session Cancelled',
          message: `${actionUserName} cancelled the session for ${booking.skillName}.`,
          type: 'request',
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

      // 2. Update local reviews state and local cache immediately
      setAllReviews(prev => {
        const updated = [newReview, ...prev];
        localStorage.setItem('local_all_reviews', JSON.stringify(updated));
        return updated;
      });

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

      setNotifications(prev => {
        const next = prev.map(n => n.id === notifId ? { ...n, read: true } : n);
        if (currentUser) {
          localStorage.setItem(`local_notifications_${currentUser.id}`, JSON.stringify(next));
        }
        return next;
      });
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

      setNotifications(prev => {
        const next = prev.filter(n => n.id !== notifId);
        if (currentUser) {
          localStorage.setItem(`local_notifications_${currentUser.id}`, JSON.stringify(next));
        }
        return next;
      });
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
        localStorage.setItem('local_users', JSON.stringify(mappedUsers));
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
      // Refresh list of users
      const { data: dbRows, error: dbError } = await supabase.from('profiles').select('*');
      if (dbError) throw dbError;
      const uData = (dbRows || []).map(mapSupabaseToProfile);
      setAllUsers(uData);

      // Refresh current user stats (e.g. credits, swaps count)
      const freshCurrentUser = uData.find((u: any) => u.id === currentUser.id);
      if (freshCurrentUser) {
        setCurrentUser(freshCurrentUser);
      }

      // Refresh active bookings, notifications, and progress
      await loadUserSpecificData(currentUser.id);
    } catch (err) {
      console.warn('Supabase sync failed, continuing offline:', err);
      // Retrieve locally saved values
      const savedLocalUsers = localStorage.getItem('local_users');
      if (savedLocalUsers) {
        try {
          const uData = JSON.parse(savedLocalUsers);
          setAllUsers(uData);
          const freshCurrentUser = uData.find((u: any) => u.id === currentUser.id);
          if (freshCurrentUser) {
            setCurrentUser(freshCurrentUser);
          }
        } catch {}
      }
      await loadUserSpecificData(currentUser.id);
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
      <div className="flex flex-col items-center justify-center min-h-screen bg-slate-50 gap-4">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-indigo-600 border-t-transparent shadow-sm"></div>
        <div className="text-center space-y-1">
          <h2 className="font-sans font-medium text-slate-800 tracking-tight text-lg">Loading Skill Swap Platform...</h2>
          <p className="text-slate-500 text-xs">Preparing swapper index and scheduling calendars.</p>
        </div>
      </div>
    );
  }

  if (!currentUser) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col font-sans text-slate-700 antialiased justify-between">
        <div className="flex-1 flex items-center justify-center">
          <LoginView 
            onLogin={handleLogin} 
            onRegister={handleRegister} 
            allUsers={allUsers}
            accountDeletedNotice={accountDeletedNotice}
          />
        </div>
        <footer className="bg-white border-t border-slate-200 py-4 text-center text-[10px] text-slate-400 font-medium">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <p>© 2026 Skill Swap Platform. Built for mutual skill barters. No money required. Powered by Spark Economy.</p>
          </div>
        </footer>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-slate-900 flex flex-col font-sans antialiased selection:bg-indigo-500/20 selection:text-indigo-900">
      
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
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-2.5 sm:px-6 lg:px-8 py-4 sm:py-8">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -5 }}
            transition={{ duration: 0.15 }}
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
                    credits: 1,
                    completedSwapsCount: 0,
                    badges: []
                  }
                }
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
              />
            )}

            {activeTab === 'skill-path' && (
              <SkillPathView currentUser={currentUser} />
            )}

            {activeTab === 'gamification' && (
              <GamificationHubView 
                currentUser={currentUser}
                allUsers={allUsers}
                onRewardClaimed={(xpAmount, title) => {
                  triggerRewardToast('Quest Completed!', `You completed "${title}" and earned rewards!`, xpAmount, '🏆');
                }}
                onNavigateToExplore={() => setActiveTab('explore')}
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
          <p>© 2026 ExchangeYourSkill. Built for mutual skill barters. No money required. Powered by Spark Economy.</p>
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
              onClick={() => {
                const targetBooking = bookings.find(b => b.id === incomingCall.bookingId);
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

    </div>
  );
}

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Compass, LayoutDashboard, MessageSquare, Brain, User, 
  Sparkles, Globe, LogOut, ArrowLeftRight, Award, Flame, RefreshCw, Home,
  Check, AlertCircle
} from 'lucide-react';
import { UserProfile, Booking, AppNotification, ProgressTrack, Review, Skill } from './types';

// Import our modular components
import DashboardView from './components/DashboardView';
import ExploreView from './components/ExploreView';
import ChatView from './components/ChatView';
import ProfileView from './components/ProfileView';
import AIRecommendations from './components/AIRecommendations';
import LoginView from './components/LoginView';
import { supabase, mapSupabaseToProfile, mapProfileToSupabase, mapSupabaseToBooking, mapBookingToSupabase, mapSupabaseToNotification } from './lib/supabase';

// Fallback mock data when API is unreachable
import { fallbackUsers, fallbackBookings, fallbackNotifications, fallbackProgress } from './data/fallbackUsers';



export default function App() {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'explore' | 'chat' | 'profile' | 'ai-recs'>('dashboard');
  const [allUsers, setAllUsers] = useState<UserProfile[]>([]);
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);
  
  // User specific data
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [progress, setProgress] = useState<ProgressTrack[]>([]);
  
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

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
        
        // Check Supabase Auth Session
        let initialUser = null;
        try {
          const { data: { session } } = await supabase.auth.getSession();
          if (session?.user) {
            const userEmail = session.user.email?.toLowerCase().trim();
            initialUser = data.find((u: any) => u.email?.toLowerCase().trim() === userEmail);
            
            if (!initialUser) {
              // Create dynamic profile if user exists in Supabase Auth but not in JSON db
              const uniqueId = session.user.id;
              const dummyProfile: UserProfile = {
                id: uniqueId,
                name: session.user.email?.split('@')[0] || 'User',
                email: session.user.email || '',
                avatar: `https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&h=150&q=80`,
                bio: 'Self-starter on Skill Swap!',
                education: 'Self-taught practitioner',
                experience: 'Enthusiastic explorer',
                languages: ['English'],
                availability: ['Morning', 'Afternoon'] as any,
                skillLevel: 'Beginner' as any,
                portfolio: {},
                skillsOffered: [],
                skillsWanted: [],
                timeZone: 'EST',
                rating: 5,
                reviewsCount: 0,
                successfulExchanges: 0,
                credits: 5,
                badges: []
              };
              
              try {
                const mappedRow = mapProfileToSupabase(dummyProfile);
                const { error: insertErr } = await supabase.from('profiles').upsert(mappedRow);
                if (!insertErr) {
                  initialUser = dummyProfile;
                  data.push(initialUser);
                  setAllUsers([...data]);
                } else {
                  initialUser = dummyProfile;
                }
              } catch {
                initialUser = dummyProfile;
              }
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
      let registeredUser = null;
      try {
        const fullPayload: UserProfile = {
          ...newUserPayload,
          rating: 5,
          reviewsCount: 0,
          successfulExchanges: 0,
          credits: 5,
          badges: []
        };
        const mappedRow = mapProfileToSupabase(fullPayload);
        const { data: dbData, error: dbError } = await supabase
          .from('profiles')
          .upsert(mappedRow)
          .select('*');
          
        if (dbError) throw dbError;
        if (dbData && dbData[0]) {
          registeredUser = mapSupabaseToProfile(dbData[0]);
        }
      } catch (e) {
        console.warn('Supabase registration failed, performing local registration instead:', e);
      }

      setIsLoading(true);

      // Add to list of all users
      let updatedUsers = [...allUsers];
      if (registeredUser) {
        // If server register succeeded, make sure we merge it
        if (!updatedUsers.some(u => u.id === registeredUser.id)) {
          updatedUsers.push(registeredUser);
        }
      } else {
        // Local register fallback
        const localNewUser: UserProfile = {
          ...newUserPayload,
          rating: 5,
          reviewsCount: 0,
          successfulExchanges: 0,
          credits: 5,
          badges: []
        };
        registeredUser = localNewUser;
        if (!updatedUsers.some(u => u.id === localNewUser.id)) {
          updatedUsers.push(localNewUser);
        }
      }

      setAllUsers(updatedUsers);
      localStorage.setItem('local_users', JSON.stringify(updatedUsers));

      localStorage.setItem('logged_in_user_id', registeredUser.id);
      setCurrentUser(registeredUser);
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
      await supabase.auth.signOut();
    } catch (err) {
      console.warn('Error signing out of Supabase:', err);
    }
    localStorage.removeItem('logged_in_user_id');
    setCurrentUser(null);
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
    notes: string
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
      status: 'pending',
      notes,
      createdAt: new Date().toISOString()
    };

    let bookingSucceeded = false;
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

      if (profileError) throw profileError;

      // 2. Insert booking row into Supabase bookings table
      const mappedBooking = mapBookingToSupabase(bookingPayload);
      const { error: insertError } = await supabase
        .from('bookings')
        .insert(mappedBooking);

      if (insertError) throw insertError;

      // 3. Create notifications using Supabase
      // Notification to Teacher
      await supabase.from('notifications').insert({
        user_id: teacher.id,
        title: 'New Session Request',
        message: `${currentUser.name} wants to book a session with you for ${skill.name}.`,
        type: 'request',
        read: false,
        timestamp: new Date().toISOString()
      });

      // Notification to Learner
      await supabase.from('notifications').insert({
        user_id: currentUser.id,
        title: 'Session Requested',
        message: `You requested a session with ${teacher.name} for ${skill.name}. 1 credit reserved.`,
        type: 'credit',
        read: false,
        timestamp: new Date().toISOString()
      });

      bookingSucceeded = true;
    } catch (err) {
      console.warn('API booking failed, registering local booking:', err);
    }

    if (!bookingSucceeded) {
      // Create local fallback booking
      const localBooking: Booking = {
        id: `local-booking-${Date.now()}`,
        teacherId: teacher.id,
        teacherName: teacher.name,
        learnerId: currentUser.id,
        learnerName: currentUser.name,
        skillName: skill.name,
        category: skill.category,
        learningOption: learningOption as any,
        date,
        timeSlot,
        notes,
        status: 'pending',
        createdAt: new Date().toISOString()
      };

      const currentBookings = [...bookings, localBooking];
      setBookings(currentBookings);
      localStorage.setItem(`local_bookings_${currentUser.id}`, JSON.stringify(currentBookings));

      // Also deduct 1 credit from currentUser locally
      const updatedUser = {
        ...currentUser,
        credits: Math.max(0, currentUser.credits - 1)
      };
      setCurrentUser(updatedUser);
      const updatedUsers = allUsers.map(u => u.id === currentUser.id ? updatedUser : u);
      setAllUsers(updatedUsers);
      localStorage.setItem('local_users', JSON.stringify(updatedUsers));
      alert('Session requested successfully! (Offline Sandbox Mode)');
    } else {
      await syncAllState();
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
      const { error: updateError } = await supabase
        .from('bookings')
        .update({
          status,
          notes: extraFields?.notes || null,
          date: extraFields?.date || null,
          time_slot: extraFields?.timeSlot || null
        })
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

        await supabase.from('notifications').insert({
          user_id: notifierId,
          title: 'Session Rescheduled',
          message: `${actionUserName} rescheduled the session for ${booking.skillName} to ${extraFields?.date || booking.date} (${extraFields?.timeSlot || booking.timeSlot}).`,
          type: 'upcoming',
          read: false,
          timestamp: new Date().toISOString()
        });

      } else if (status === 'confirmed' && oldStatus === 'pending') {
        await supabase.from('notifications').insert({
          user_id: booking.learnerId,
          title: 'Booking Confirmed!',
          message: `${booking.teacherName} accepted your session for ${booking.skillName} on ${extraFields?.date || booking.date}.`,
          type: 'upcoming',
          read: false,
          timestamp: new Date().toISOString()
        });
      }

      updateSucceeded = true;
    } catch (err) {
      console.warn('Supabase update status failed, saving locally:', err);
    }

    if (!updateSucceeded && currentUser) {
      const updatedBookings = bookings.map(b => {
        if (b.id === bookingId) {
          return { ...b, status, ...extraFields };
        }
        return b;
      });
      setBookings(updatedBookings);
      localStorage.setItem(`local_bookings_${currentUser.id}`, JSON.stringify(updatedBookings));

      // If completing, we also credit the teacher
      if (status === 'completed') {
        const targetBooking = bookings.find(b => b.id === bookingId);
        if (targetBooking) {
          const updatedUsers = allUsers.map(u => {
            if (u.id === targetBooking.teacherId) {
              return { 
                ...u, 
                credits: u.credits + 1, 
                successfulExchanges: u.successfulExchanges + 1 
              };
            }
            return u;
          });
          setAllUsers(updatedUsers);
          localStorage.setItem('local_users', JSON.stringify(updatedUsers));
        }
      }
    } else {
      await syncAllState();
    }
  };

  const handleLeaveReview = async (reviewData: Omit<Review, 'id' | 'createdAt'>) => {
    try {
      // Fetch the teacher profile first to make sure we have up-to-date count and rating
      const { data: teacherProfile, error: fetchErr } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', reviewData.teacherId)
        .single();
      
      if (fetchErr) throw fetchErr;

      const currentCount = teacherProfile.reviews_count || 0;
      const currentRating = typeof teacherProfile.rating === 'number' ? teacherProfile.rating : parseFloat(teacherProfile.rating || '5.0');
      const newCount = currentCount + 1;
      const newRating = Number(((currentRating * currentCount + reviewData.rating) / newCount).toFixed(1));

      // Update the teacher profile in Supabase
      const { error: updateErr } = await supabase
        .from('profiles')
        .update({
          reviews_count: newCount,
          rating: newRating
        })
        .eq('id', reviewData.teacherId);

      if (updateErr) throw updateErr;

      // Also insert review notification to Supabase
      await supabase.from('notifications').insert({
        user_id: reviewData.teacherId,
        title: 'New Review Received!',
        message: `${reviewData.learnerName} left you a ${reviewData.rating}-star review: "${reviewData.comment.substring(0, 40)}..."`,
        type: 'match',
        read: false,
        timestamp: new Date().toISOString()
      });

      await syncAllState();
    } catch (err) {
      console.warn('Supabase review update failed, saving review locally:', err);
      
      // Fallback
      const updatedUsers = allUsers.map(u => {
        if (u.id === reviewData.teacherId) {
          const newCount = u.reviewsCount + 1;
          const newRating = Number(((u.rating * u.reviewsCount + reviewData.rating) / newCount).toFixed(1));
          return {
            ...u,
            reviewsCount: newCount,
            rating: newRating
          };
        }
        return u;
      });
      setAllUsers(updatedUsers);
      localStorage.setItem('local_users', JSON.stringify(updatedUsers));
    }
  };

  const handleMarkNotificationRead = async (notifId: string) => {
    try {
      if (!notifId.startsWith('notif-')) {
        const { error } = await supabase
          .from('notifications')
          .update({ read: true })
          .eq('id', notifId);
        if (error) throw error;
      }
    } catch (err) {
      console.warn('Supabase notification read failed, continuing offline:', err);
    }

    setNotifications(prev => {
      const next = prev.map(n => n.id === notifId ? { ...n, read: true } : n);
      if (currentUser) {
        localStorage.setItem(`local_notifications_${currentUser.id}`, JSON.stringify(next));
      }
      return next;
    });
  };

  const handleDeleteNotification = async (notifId: string) => {
    try {
      if (!notifId.startsWith('notif-')) {
        const { error } = await supabase
          .from('notifications')
          .delete()
          .eq('id', notifId);
        if (error) throw error;
      }
    } catch (err) {
      console.warn('Supabase notification delete failed, continuing offline:', err);
    }

    setNotifications(prev => {
      const next = prev.filter(n => n.id !== notifId);
      if (currentUser) {
        localStorage.setItem(`local_notifications_${currentUser.id}`, JSON.stringify(next));
      }
      return next;
    });
  };

  const handleSaveProfile = async (updatedProfile: UserProfile) => {
    if (!currentUser) return;
    setIsSaving(true);

    let saveSucceeded = false;
    try {
      const mappedRow = mapProfileToSupabase(updatedProfile);
      const { data: dbData, error: dbError } = await supabase
        .from('profiles')
        .upsert(mappedRow)
        .select('*');

      if (dbError) throw dbError;
      if (dbData && dbData[0]) {
        const savedUser = mapSupabaseToProfile(dbData[0]);
        setCurrentUser(savedUser);
        saveSucceeded = true;
      }
    } catch (err) {
      console.warn('Supabase save profile failed, performing locally:', err);
    }

    if (!saveSucceeded) {
      setCurrentUser(updatedProfile);
      const updatedUsers = allUsers.map(u => u.id === updatedProfile.id ? updatedProfile : u);
      setAllUsers(updatedUsers);
      localStorage.setItem('local_users', JSON.stringify(updatedUsers));
    } else {
      // Refresh the complete users list
      try {
        const { data: dbRows, error: dbError } = await supabase.from('profiles').select('*');
        if (!dbError && dbRows) {
          setAllUsers(dbRows.map(mapSupabaseToProfile));
        }
      } catch {
        // Fall back to local update
      }
    }
    setIsSaving(false);
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

  // Contacts list (everyone except the logged-in user)
  const contacts = allUsers.filter(u => currentUser && u.id !== currentUser.id);

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
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans text-slate-700 select-none antialiased">
      
      {/* Top Header Navigation */}
      <header className="sticky top-0 bg-white border-b border-slate-200 z-40 shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-14 flex items-center justify-between">
          
          {/* Logo / Home Button */}
          <button
            onClick={() => setActiveTab('dashboard')}
            className="flex items-center gap-2 cursor-pointer hover:opacity-90 transition-opacity bg-transparent border-0 p-0 text-left"
            title="Go to Home Dashboard"
          >
            <div className="w-8 h-8 bg-indigo-600 text-white rounded-lg flex items-center justify-center font-bold text-sm shadow-md shadow-indigo-600/10">
              ⇆
            </div>
            <div>
              <span className="font-serif font-bold text-slate-900 tracking-tight text-base leading-none block">Skill Swap Platform</span>
              <p className="text-[9px] text-slate-400 font-medium tracking-wide uppercase leading-none mt-0.5">Collaborative barter platform</p>
            </div>
          </button>

          {/* Primary Tabs */}
          <nav className="hidden md:flex items-center gap-1 text-xs font-semibold">
            <button
              onClick={() => setActiveTab('dashboard')}
              className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition cursor-pointer border-0 ${
                activeTab === 'dashboard' 
                  ? 'bg-indigo-50 text-indigo-700' 
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50 bg-transparent'
              }`}
            >
              <Home className="w-3.5 h-3.5" />
              Home
            </button>
            <button
              onClick={() => setActiveTab('explore')}
              className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition ${
                activeTab === 'explore' 
                  ? 'bg-indigo-50 text-indigo-700' 
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              <Compass className="w-3.5 h-3.5" />
              Browse Swappers
            </button>
            <button
              onClick={() => setActiveTab('chat')}
              className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition ${
                activeTab === 'chat' 
                  ? 'bg-indigo-50 text-indigo-700' 
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              <MessageSquare className="w-3.5 h-3.5" />
              Chat & Live Call
            </button>
            <button
              onClick={() => setActiveTab('ai-recs')}
              className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition ${
                activeTab === 'ai-recs' 
                  ? 'bg-indigo-50 text-indigo-700' 
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              <Brain className="w-3.5 h-3.5" />
              Skill Advisor
            </button>
            <button
              onClick={() => setActiveTab('profile')}
              className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition ${
                activeTab === 'profile' 
                  ? 'bg-indigo-50 text-indigo-700' 
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              <User className="w-3.5 h-3.5" />
              My Profile
            </button>
          </nav>

          {/* User Quick Switcher perspective */}
          <div className="flex items-center gap-3">
            <button
              onClick={syncAllState}
              className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-50 rounded-lg transition"
              title="Sync All States"
            >
              <RefreshCw className="w-4 h-4" />
            </button>

            <button
              onClick={handleLogout}
              className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition border-0 bg-transparent cursor-pointer"
              title="Log Out"
            >
              <LogOut className="w-4 h-4" />
            </button>

            <div className="flex items-center gap-2">
              <img 
                src={currentUser.avatar} 
                alt={currentUser.name} 
                referrerPolicy="no-referrer"
                className="w-7 h-7 rounded-full object-cover border border-slate-200"
              />
              <div className="hidden sm:block text-right">
                <p className="font-semibold text-slate-800 text-[10px] leading-tight truncate max-w-[100px]">{currentUser.name}</p>
                <span className="text-[9px] text-indigo-600 font-semibold bg-indigo-50 px-1 py-0.2 rounded leading-none">{currentUser.credits} Credits</span>
              </div>
            </div>
          </div>

        </div>
      </header>

      {/* Mobile Navigation Header */}
      <div className="md:hidden sticky top-14 bg-white border-b border-slate-150 z-30 flex items-center justify-around py-2.5 text-[10px] font-bold text-slate-500 shadow-xs">
        <button 
          onClick={() => setActiveTab('dashboard')}
          className={`flex flex-col items-center gap-1 ${activeTab === 'dashboard' ? 'text-indigo-600' : ''}`}
        >
          <Home className="w-4 h-4" />
          Home
        </button>
        <button 
          onClick={() => setActiveTab('explore')}
          className={`flex flex-col items-center gap-1 ${activeTab === 'explore' ? 'text-indigo-600' : ''}`}
        >
          <Compass className="w-4 h-4" />
          Swappers
        </button>
        <button 
          onClick={() => setActiveTab('chat')}
          className={`flex flex-col items-center gap-1 ${activeTab === 'chat' ? 'text-indigo-600' : ''}`}
        >
          <MessageSquare className="w-4 h-4" />
          Chat
        </button>
        <button 
          onClick={() => setActiveTab('ai-recs')}
          className={`flex flex-col items-center gap-1 ${activeTab === 'ai-recs' ? 'text-indigo-600' : ''}`}
        >
          <Brain className="w-4 h-4" />
          Advisor
        </button>
        <button 
          onClick={() => setActiveTab('profile')}
          className={`flex flex-col items-center gap-1 ${activeTab === 'profile' ? 'text-indigo-600' : ''}`}
        >
          <User className="w-4 h-4" />
          Profile
        </button>
      </div>

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
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
              />
            )}

            {activeTab === 'explore' && (
              <ExploreView 
                currentUser={currentUser}
                users={allUsers}
                onBookSession={handleBookSession}
                onOpenChat={(id) => {
                  setActiveTab('chat');
                }}
                isLoading={isLoading}
              />
            )}

            {activeTab === 'chat' && (
              <ChatView 
                currentUser={currentUser}
                contacts={contacts}
              />
            )}

            {activeTab === 'profile' && (
              <ProfileView 
                currentUser={currentUser}
                onSaveProfile={handleSaveProfile}
                isSaving={isSaving}
              />
            )}

            {activeTab === 'ai-recs' && (
              <AIRecommendations 
                currentUser={currentUser}
                onSelectRecommendedSkill={handleSelectRecommendedSkill}
              />
            )}
          </motion.div>
        </AnimatePresence>
      </main>

      {/* Humble Footer */}
      <footer className="bg-white border-t border-slate-200 py-4 text-center text-[10px] text-slate-400 font-medium">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <p>© 2026 ExchangeYourSkill. Built for mutual skill barters. No money required. Powered by Spark Economy.</p>
        </div>
      </footer>

      {/* Password Reset Recovery Modal */}
      {showPasswordResetModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center z-[100] p-4">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-xl border border-slate-100 flex flex-col gap-4 animate-in fade-in zoom-in-95 duration-150 text-left">
            <div className="space-y-1">
              <h3 className="text-base font-semibold text-slate-800">Set New Password</h3>
              <p className="text-xs text-slate-500">Please choose a secure new password for your account.</p>
            </div>

            {resetError && (
              <div className="p-3 bg-red-50 text-red-950 border border-red-200 rounded-xl flex items-start gap-2.5 text-xs">
                <AlertCircle className="w-4 h-4 shrink-0 text-red-600 mt-0.5" />
                <p>{resetError}</p>
              </div>
            )}

            {resetSuccess ? (
              <div className="space-y-4">
                <div className="p-3 bg-green-50 text-green-900 border border-green-200 rounded-xl flex items-start gap-2.5 text-xs">
                  <Check className="w-4 h-4 shrink-0 text-green-600 mt-0.5" />
                  <p>{resetSuccess}</p>
                </div>
                <button
                  onClick={() => setShowPasswordResetModal(false)}
                  className="w-full py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-lg text-xs cursor-pointer border-0"
                >
                  Close & Sign In
                </button>
              </div>
            ) : (
              <form onSubmit={handlePasswordUpdateSubmit} className="space-y-4">
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider">New Password</label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
                    <input
                      type="password"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="••••••••"
                      required
                      className="w-full bg-slate-50/50 border border-slate-200 rounded-lg pl-9 pr-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                </div>

                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={() => setShowPasswordResetModal(false)}
                    className="flex-1 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-lg text-xs cursor-pointer border-0"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isResetting}
                    className="flex-1 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-lg text-xs cursor-pointer border-0 disabled:opacity-50"
                  >
                    {isResetting ? 'Saving...' : 'Update Password'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

    </div>
  );
}

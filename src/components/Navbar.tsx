import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  LayoutDashboard,
  Compass,
  MessageSquare,
  BookOpen,
  Sparkles,
  User,
  Bell,
  Search,
  RefreshCw,
  LogOut,
  ChevronDown,
  Check,
  Trash2,
  Trophy,
  Video,
  Coins,
  X,
  CheckCheck,
  GraduationCap,
  ArrowRight,
} from 'lucide-react';
import { UserProfile, AppNotification, Booking } from '../types';
import { Avatar } from './ui/Avatar';
import { AnimatedCounter } from './motion/AnimatedCounter';
import { supabase, mapSupabaseToBooking } from '../lib/supabase';
import { motionTokens } from './motion/tokens';

export type NavTabId = 'dashboard' | 'explore' | 'chat' | 'study-hub' | 'skill-path' | 'gamification' | 'credits' | 'profile';

export interface NavbarProps {
  activeTab: NavTabId;
  setActiveTab: (tab: NavTabId) => void;
  currentUser: UserProfile;
  notifications: AppNotification[];
  onMarkNotificationRead: (id: string) => void;
  onDeleteNotification: (id: string) => void;
  onSync: () => void;
  onLogout: () => void;
  onSearchSubmit?: (query: string) => void;
  onUpdateBookingStatus?: (bookingId: string, status: Booking['status'], actionUserId: string, extra?: Partial<Booking>) => void;
  onStartLiveSession?: (booking: Booking) => void;
  bookings?: Booking[];
}

export const Navbar: React.FC<NavbarProps> = React.memo(({
  activeTab,
  setActiveTab,
  currentUser,
  notifications,
  onMarkNotificationRead,
  onDeleteNotification,
  onSync,
  onLogout,
  onSearchSubmit,
  onUpdateBookingStatus,
  onStartLiveSession,
  bookings = [],
}) => {
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isNotifOpen, setIsNotifOpen] = useState(false);
  const [isLearnOpen, setIsLearnOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSyncing, setIsSyncing] = useState(false);
  const [actionedNotifIds, setActionedNotifIds] = useState<Set<string>>(new Set());

  const profileRef = useRef<HTMLDivElement>(null);
  const notifRef = useRef<HTMLDivElement>(null);
  const learnRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  const unreadCount = notifications.filter((n) => !n.read).length;
  const isLearnActive = activeTab === 'study-hub' || activeTab === 'skill-path' || activeTab === 'gamification';

  // Handle outside click for popovers
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) {
        setIsProfileOpen(false);
      }
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
        setIsNotifOpen(false);
      }
      if (learnRef.current && !learnRef.current.contains(e.target as Node)) {
        setIsLearnOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Keyboard shortcut ⌘K / Ctrl+K for search
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setIsSearchOpen((prev) => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  useEffect(() => {
    if (isSearchOpen) {
      setTimeout(() => searchInputRef.current?.focus(), 100);
    }
  }, [isSearchOpen]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      if (onSearchSubmit) {
        onSearchSubmit(searchQuery);
      }
      setActiveTab('explore');
      setIsSearchOpen(false);
    }
  };

  const handleSyncClick = () => {
    setIsSyncing(true);
    onSync();
    setTimeout(() => setIsSyncing(false), 800);
  };

  const learnSubItems = [
    {
      id: 'study-hub' as NavTabId,
      label: 'Study Hub',
      description: 'Peer rooms, shared notes & flashcards',
      icon: BookOpen,
      badge: 'Interactive',
    },
    {
      id: 'skill-path' as NavTabId,
      label: 'AI Skill Path',
      description: 'Personalized roadmaps & milestones',
      icon: Sparkles,
      badge: 'AI Powered',
    },
    {
      id: 'gamification' as NavTabId,
      label: 'Quests & Rewards',
      description: 'Streaks, badges & swapper leaderboards',
      icon: Trophy,
      badge: 'Rewards',
    },
  ];

  return (
    <>
      {/* Top Floating Global Navigation */}
      <header className="sticky top-0 z-40 px-3 sm:px-6 pt-3.5 pb-2 transition-all">
        <div className="max-w-7xl mx-auto bg-[#0E0F17]/85 backdrop-blur-xl border border-white/[0.08] rounded-[22px] px-3.5 sm:px-5 py-2.5 shadow-[0_16px_36px_rgba(0,0,0,0.6)] flex items-center justify-between gap-3">
          
          {/* Brand Logo */}
          <button
            onClick={() => setActiveTab('dashboard')}
            className="flex items-center gap-3 bg-transparent border-0 p-0 text-left cursor-pointer group shrink-0 select-none"
          >
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-violet-600 via-purple-600 to-indigo-600 text-white flex items-center justify-center font-bold text-lg shadow-[0_0_20px_rgba(139,92,246,0.35)] group-hover:scale-105 group-hover:shadow-[0_0_28px_rgba(139,92,246,0.55)] transition-all">
              ⇆
            </div>
            <div className="hidden min-[400px]:block">
              <div className="flex items-center gap-2">
                <span className="font-bold text-white tracking-tight text-base sm:text-lg leading-none">
                  SkillSwap
                </span>
                <span className="text-[10px] font-bold text-violet-300 bg-violet-950/60 px-2 py-0.5 rounded-full border border-violet-500/30 uppercase tracking-wider">
                  2026
                </span>
              </div>
              <p className="text-[10px] font-medium text-slate-400 tracking-wide leading-none mt-1">
                Peer Skill Exchange
              </p>
            </div>
          </button>

          {/* Desktop Top-Level Navigation Items */}
          <nav className="hidden lg:flex items-center gap-1.5 bg-[#12131A]/90 p-1.5 rounded-2xl border border-white/[0.07]">
            {/* 1. Dashboard */}
            <button
              onClick={() => setActiveTab('dashboard')}
              className={`group relative px-3.5 py-1.5 rounded-xl flex items-center gap-2 text-xs font-semibold transition-colors cursor-pointer border-0 ${
                activeTab === 'dashboard' ? 'text-white' : 'text-slate-400 hover:text-white'
              }`}
            >
              {activeTab === 'dashboard' && (
                <motion.div
                  layoutId="activeNavHighlight"
                  className="absolute inset-0 bg-[#1E202E] rounded-xl shadow-[0_0_16px_rgba(139,92,246,0.18)] border border-white/[0.12]"
                  transition={motionTokens.spring.medium}
                />
              )}
              {/* Subtle hover underline */}
              {activeTab !== 'dashboard' && (
                <span className="absolute bottom-1 left-3 right-3 h-[2px] bg-violet-500/50 rounded-full scale-x-0 group-hover:scale-x-100 transition-transform duration-200 ease-out origin-center pointer-events-none" />
              )}
              <span className="relative z-10 flex items-center gap-2">
                <LayoutDashboard className={`w-4 h-4 transition-transform duration-200 group-hover:scale-110 ${activeTab === 'dashboard' ? 'text-violet-400' : 'text-slate-400'}`} />
                <span>Dashboard</span>
              </span>
            </button>

            {/* 2. Explore */}
            <button
              onClick={() => setActiveTab('explore')}
              className={`group relative px-3.5 py-1.5 rounded-xl flex items-center gap-2 text-xs font-semibold transition-colors cursor-pointer border-0 ${
                activeTab === 'explore' ? 'text-white' : 'text-slate-400 hover:text-white'
              }`}
            >
              {activeTab === 'explore' && (
                <motion.div
                  layoutId="activeNavHighlight"
                  className="absolute inset-0 bg-[#1E202E] rounded-xl shadow-[0_0_16px_rgba(139,92,246,0.18)] border border-white/[0.12]"
                  transition={motionTokens.spring.medium}
                />
              )}
              {activeTab !== 'explore' && (
                <span className="absolute bottom-1 left-3 right-3 h-[2px] bg-violet-500/50 rounded-full scale-x-0 group-hover:scale-x-100 transition-transform duration-200 ease-out origin-center pointer-events-none" />
              )}
              <span className="relative z-10 flex items-center gap-2">
                <Compass className={`w-4 h-4 transition-transform duration-200 group-hover:scale-110 ${activeTab === 'explore' ? 'text-violet-400' : 'text-slate-400'}`} />
                <span>Explore</span>
              </span>
            </button>

            {/* 3. Learn (Unified Learning / Progress Group) */}
            <div className="relative" ref={learnRef}>
              <button
                onClick={() => setIsLearnOpen((prev) => !prev)}
                className={`group relative px-3.5 py-1.5 rounded-xl flex items-center gap-2 text-xs font-semibold transition-colors cursor-pointer border-0 ${
                  isLearnActive ? 'text-white' : 'text-slate-400 hover:text-white'
                }`}
              >
                {isLearnActive && (
                  <motion.div
                    layoutId="activeNavHighlight"
                    className="absolute inset-0 bg-[#1E202E] rounded-xl shadow-[0_0_16px_rgba(139,92,246,0.18)] border border-white/[0.12]"
                    transition={motionTokens.spring.medium}
                  />
                )}
                {!isLearnActive && (
                  <span className="absolute bottom-1 left-3 right-3 h-[2px] bg-violet-500/50 rounded-full scale-x-0 group-hover:scale-x-100 transition-transform duration-200 ease-out origin-center pointer-events-none" />
                )}
                <span className="relative z-10 flex items-center gap-1.5">
                  <GraduationCap className={`w-4 h-4 transition-transform duration-200 group-hover:scale-110 ${isLearnActive ? 'text-violet-400' : 'text-slate-400'}`} />
                  <span>Learn & Progress</span>
                  <ChevronDown className={`w-3.5 h-3.5 text-slate-400 transition-transform duration-200 ${isLearnOpen ? 'rotate-180 text-white' : ''}`} />
                </span>
              </button>

              {/* Learn Dropdown Menu */}
              <AnimatePresence>
                {isLearnOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: 8, scale: 0.96 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 8, scale: 0.96 }}
                    transition={motionTokens.spring.snappy}
                    className="absolute left-0 mt-2 w-72 bg-[#12131A] rounded-2xl border border-white/[0.1] shadow-2xl shadow-black/80 overflow-hidden z-50 p-1.5"
                  >
                    <div className="p-2.5 pb-2 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                      Learning Modules
                    </div>
                    <div className="space-y-1">
                      {learnSubItems.map((item) => {
                        const Icon = item.icon;
                        const isSubActive = activeTab === item.id;
                        return (
                          <button
                            key={item.id}
                            onClick={() => {
                              setActiveTab(item.id);
                              setIsLearnOpen(false);
                            }}
                            className={`group w-full flex items-start gap-3 p-2.5 rounded-xl transition-all cursor-pointer border-0 text-left ${
                              isSubActive
                                ? 'bg-violet-950/70 border border-violet-500/30 text-white'
                                : 'bg-transparent hover:bg-white/[0.06] text-slate-300 hover:text-white'
                            }`}
                          >
                            <div className={`p-2 rounded-lg shrink-0 mt-0.5 ${
                              isSubActive ? 'bg-violet-600 text-white shadow-xs' : 'bg-[#181924] text-violet-400'
                            }`}>
                              <Icon className="w-4 h-4" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center justify-between">
                                <span className="text-xs font-bold">{item.label}</span>
                                {item.badge && (
                                  <span className="text-[9px] font-semibold text-violet-300 bg-violet-950/60 px-1.5 py-0.2 rounded border border-violet-500/20">
                                    {item.badge}
                                  </span>
                                )}
                              </div>
                              <p className="text-[11px] text-slate-400 mt-0.5 leading-snug">
                                {item.description}
                              </p>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* 4. Messages (Chat) */}
            <button
              onClick={() => setActiveTab('chat')}
              className={`group relative px-3.5 py-1.5 rounded-xl flex items-center gap-2 text-xs font-semibold transition-colors cursor-pointer border-0 ${
                activeTab === 'chat' ? 'text-white' : 'text-slate-400 hover:text-white'
              }`}
            >
              {activeTab === 'chat' && (
                <motion.div
                  layoutId="activeNavHighlight"
                  className="absolute inset-0 bg-[#1E202E] rounded-xl shadow-[0_0_16px_rgba(139,92,246,0.18)] border border-white/[0.12]"
                  transition={motionTokens.spring.medium}
                />
              )}
              {activeTab !== 'chat' && (
                <span className="absolute bottom-1 left-3 right-3 h-[2px] bg-violet-500/50 rounded-full scale-x-0 group-hover:scale-x-100 transition-transform duration-200 ease-out origin-center pointer-events-none" />
              )}
              <span className="relative z-10 flex items-center gap-2">
                <MessageSquare className={`w-4 h-4 transition-transform duration-200 group-hover:scale-110 ${activeTab === 'chat' ? 'text-violet-400' : 'text-slate-400'}`} />
                <span>Messages</span>
              </span>
            </button>
          </nav>

          {/* Right Action Controls */}
          <div className="flex items-center gap-2 sm:gap-2.5">
            
            {/* Credits Balance Badge */}
            <button
              onClick={() => setActiveTab('credits')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border transition-all text-xs font-bold cursor-pointer shrink-0 ${
                activeTab === 'credits'
                  ? 'bg-amber-950/80 text-amber-300 border-amber-500/50 shadow-[0_0_16px_rgba(245,158,11,0.25)]'
                  : 'bg-[#181924] hover:bg-[#202230] text-amber-300 border-white/[0.08] hover:border-amber-500/30'
              }`}
              title="View Credits Wallet"
            >
              <Coins className="w-4 h-4 text-amber-400" />
              <span>
                <AnimatedCounter value={currentUser.credits ?? 100} />
              </span>
            </button>

            {/* Quick Search Button */}
            <button
              onClick={() => setIsSearchOpen(true)}
              className="flex items-center gap-2 bg-[#181924] hover:bg-[#202230] text-slate-400 hover:text-slate-200 px-3 py-1.5 rounded-xl border border-white/[0.08] hover:border-white/[0.16] transition text-xs font-medium cursor-pointer"
              title="Search skills & swappers (⌘K)"
            >
              <Search className="w-3.5 h-3.5 text-slate-400" />
              <span className="hidden sm:inline">Search...</span>
              <kbd className="hidden sm:inline-flex items-center gap-0.5 bg-[#12131A] border border-white/[0.1] rounded px-1.5 py-0.2 text-[10px] font-mono text-slate-400 shadow-2xs">
                ⌘K
              </kbd>
            </button>

            {/* Sync Refresh Button */}
            <button
              onClick={handleSyncClick}
              className={`p-2 text-slate-400 hover:text-white hover:bg-white/[0.08] rounded-xl transition cursor-pointer border-0 bg-transparent ${
                isSyncing ? 'animate-spin text-violet-400' : ''
              }`}
              title="Refresh and sync data"
            >
              <RefreshCw className="w-4 h-4" />
            </button>

            {/* Notifications Popover */}
            <div className="relative" ref={notifRef}>
              <button
                onClick={() => setIsNotifOpen((prev) => !prev)}
                className="relative p-2 text-slate-400 hover:text-white hover:bg-white/[0.08] rounded-xl transition cursor-pointer border-0 bg-transparent"
                title="Notifications"
              >
                <Bell className="w-4 h-4" />
                {unreadCount > 0 && (
                  <motion.span
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="absolute top-1 right-1 w-4 h-4 bg-rose-500 text-white font-extrabold text-[9px] rounded-full flex items-center justify-center ring-2 ring-[#090A0F]"
                  >
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </motion.span>
                )}
              </button>

              {/* Notifications Dropdown */}
              <AnimatePresence>
                {isNotifOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: 8, scale: 0.96 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 8, scale: 0.96 }}
                    transition={motionTokens.spring.snappy}
                    className="absolute right-0 mt-2 w-80 sm:w-96 bg-[#12131A] rounded-2xl border border-white/[0.1] shadow-2xl shadow-black/80 overflow-hidden z-50 p-0"
                  >
                    <div className="p-4 bg-[#181924]/80 border-b border-white/[0.06] flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-white text-sm">Notifications</span>
                        {unreadCount > 0 && (
                          <span className="px-2 py-0.5 bg-violet-950/80 text-violet-300 text-[10px] font-bold rounded-full border border-violet-500/25">
                            {unreadCount} unread
                          </span>
                        )}
                      </div>
                      {notifications.length > 0 && (
                        <button
                          onClick={() => notifications.forEach((n) => onMarkNotificationRead(n.id))}
                          className="text-[11px] font-medium text-violet-400 hover:text-violet-300 cursor-pointer border-0 bg-transparent flex items-center gap-1"
                        >
                          <CheckCheck className="w-3.5 h-3.5" />
                          Mark all read
                        </button>
                      )}
                    </div>

                    <div className="max-h-80 overflow-y-auto divide-y divide-white/[0.04] p-1">
                      {notifications.length === 0 ? (
                        <div className="py-8 text-center text-slate-500 space-y-2">
                          <Bell className="w-8 h-8 mx-auto stroke-1 opacity-40" />
                          <p className="text-xs font-medium">No notifications yet</p>
                        </div>
                      ) : (
                        notifications.map((notif) => {
                          const isRequest = notif.type === 'request' && !!notif.bookingId;
                          const relatedBooking = bookings.find((b) => b.id === notif.bookingId);
                          const isActedOnLocally = actionedNotifIds.has(notif.id);
                          const bookingResolvedStatus = relatedBooking && relatedBooking.status !== 'pending' ? relatedBooking.status : null;
                          const isResolved = isActedOnLocally || !!bookingResolvedStatus;

                          const handleJoinSession = async (e?: React.MouseEvent) => {
                            if (e) e.stopPropagation();
                            onMarkNotificationRead(notif.id);
                            setIsNotifOpen(false);

                            if (!onStartLiveSession) return;

                            let target = relatedBooking;
                            if (!target && notif.bookingId) {
                              try {
                                const { data } = await supabase.from('bookings').select('*').eq('id', notif.bookingId).single();
                                if (data) target = mapSupabaseToBooking(data);
                              } catch (err) {
                                console.warn('Could not fetch booking for notification:', err);
                              }
                            }

                            if (target) {
                              onStartLiveSession(target);
                            } else {
                              setActiveTab('dashboard');
                            }
                          };

                          const canJoinRoom = !!notif.bookingId && onStartLiveSession && (
                            notif.type === 'call' ||
                            notif.type === 'match' ||
                            (relatedBooking && (relatedBooking.status === 'confirmed' || relatedBooking.status === 'rescheduled'))
                          );

                          return (
                            <div
                              key={notif.id}
                              onClick={() => {
                                if (canJoinRoom) {
                                  handleJoinSession();
                                } else {
                                  onMarkNotificationRead(notif.id);
                                }
                              }}
                              className={`p-3 rounded-xl transition flex items-start gap-3 group ${
                                notif.read ? 'bg-transparent opacity-75' : 'bg-violet-950/20'
                              } ${canJoinRoom ? 'cursor-pointer hover:bg-white/[0.06]' : ''}`}
                            >
                              <div className="w-2 h-2 rounded-full bg-violet-500 mt-2 shrink-0" style={{ opacity: notif.read ? 0 : 1 }} />
                              <div className="flex-1 min-w-0">
                                <p className="font-semibold text-white text-xs leading-snug">{notif.title}</p>
                                <p className="text-slate-400 text-[11px] mt-0.5 leading-relaxed">{notif.message}</p>

                                {/* Action buttons for pending booking request notifications */}
                                {isRequest && !isResolved && (
                                  <div className="mt-2.5 flex items-center gap-2">
                                    <button
                                      onClick={async (e) => {
                                        e.stopPropagation();
                                        if (!notif.bookingId) return;
                                        setActionedNotifIds((prev) => new Set(prev).add(notif.id));
                                        onMarkNotificationRead(notif.id);
                                        if (onUpdateBookingStatus) {
                                          await onUpdateBookingStatus(notif.bookingId, 'confirmed', currentUser.id);
                                        }
                                      }}
                                      className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-[11px] rounded-lg flex items-center gap-1 shadow-xs transition cursor-pointer border-0"
                                    >
                                      <Check className="w-3.5 h-3.5" />
                                      Accept
                                    </button>
                                    <button
                                      onClick={async (e) => {
                                        e.stopPropagation();
                                        if (!notif.bookingId) return;
                                        setActionedNotifIds((prev) => new Set(prev).add(notif.id));
                                        onMarkNotificationRead(notif.id);
                                        if (onUpdateBookingStatus) {
                                          await onUpdateBookingStatus(notif.bookingId, 'cancelled', currentUser.id);
                                        }
                                      }}
                                      className="px-2.5 py-1 bg-[#181924] hover:bg-rose-950/80 text-slate-300 hover:text-rose-200 border border-white/[0.08] font-semibold text-[11px] rounded-lg flex items-center gap-1 transition cursor-pointer"
                                    >
                                      <X className="w-3.5 h-3.5" />
                                      Decline
                                    </button>
                                  </div>
                                )}

                                {/* Resolved status indicator if already acted on */}
                                {isRequest && isResolved && (
                                  <div className="mt-2">
                                    {bookingResolvedStatus === 'confirmed' || isActedOnLocally ? (
                                      <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-300 bg-emerald-950/60 border border-emerald-500/25 px-2 py-0.5 rounded-md">
                                        <Check className="w-3 h-3" /> Confirmed
                                      </span>
                                    ) : bookingResolvedStatus === 'cancelled' ? (
                                      <span className="inline-flex items-center gap-1 text-[10px] font-bold text-slate-400 bg-white/[0.06] border border-white/[0.08] px-2 py-0.5 rounded-md">
                                        Declined
                                      </span>
                                    ) : (
                                      <span className="inline-flex items-center gap-1 text-[10px] font-bold text-violet-300 bg-violet-950/60 border border-violet-500/25 px-2 py-0.5 rounded-md">
                                        Resolved
                                      </span>
                                    )}
                                  </div>
                                )}

                                <span className="text-[10px] text-slate-500 mt-1 block">
                                  {new Date(notif.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </span>

                                {canJoinRoom && (
                                  <div className="mt-2">
                                    <button
                                      onClick={handleJoinSession}
                                      className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-[11px] rounded-lg flex items-center gap-1 shadow-xs transition cursor-pointer border-0"
                                    >
                                      <Video className="w-3.5 h-3.5" />
                                      Join Live Room
                                    </button>
                                  </div>
                                )}
                              </div>

                              <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                {!notif.read && (
                                  <button
                                    onClick={() => onMarkNotificationRead(notif.id)}
                                    className="p-1 text-violet-400 hover:bg-white/[0.08] rounded-lg cursor-pointer border-0 bg-transparent"
                                    title="Mark as read"
                                  >
                                    <Check className="w-3.5 h-3.5" />
                                  </button>
                                )}
                                <button
                                  onClick={() => onDeleteNotification(notif.id)}
                                  className="p-1 text-slate-400 hover:text-rose-400 hover:bg-rose-950/50 rounded-lg cursor-pointer border-0 bg-transparent"
                                  title="Delete"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </div>
                          );
                        })
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Profile Menu Dropdown */}
            <div className="relative" ref={profileRef}>
              <button
                onClick={() => setIsProfileOpen((prev) => !prev)}
                className="flex items-center gap-2 p-1 rounded-2xl hover:bg-white/[0.08] transition cursor-pointer border border-transparent hover:border-white/[0.08]"
              >
                <Avatar
                  src={currentUser.avatar}
                  name={currentUser.name}
                  size="sm"
                  isOnline={true}
                />
                <div className="hidden sm:block text-left pr-1">
                  <p className="font-semibold text-white text-xs leading-tight truncate max-w-[100px]">
                    {currentUser.name}
                  </p>
                  <div className="flex items-center gap-1 mt-0.5">
                    <span className="text-[10px] font-medium text-slate-400">
                      {currentUser.successfulExchanges || 0} Swaps
                    </span>
                  </div>
                </div>
                <ChevronDown className="w-3.5 h-3.5 text-slate-400 hidden sm:block" />
              </button>

              <AnimatePresence>
                {isProfileOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: 8, scale: 0.96 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 8, scale: 0.96 }}
                    transition={motionTokens.spring.snappy}
                    className="absolute right-0 mt-2 w-64 bg-[#12131A] rounded-2xl border border-white/[0.1] shadow-2xl shadow-black/80 overflow-hidden z-50 p-2"
                  >
                    {/* User Info Header */}
                    <div className="p-3 bg-[#181924] rounded-xl mb-2 border border-white/[0.06]">
                      <div className="flex items-center gap-3">
                        <Avatar
                          src={currentUser.avatar}
                          name={currentUser.name}
                          size="md"
                        />
                        <div className="min-w-0 flex-1">
                          <p className="font-bold text-white text-sm truncate">{currentUser.name}</p>
                          <p className="text-[11px] text-slate-400 truncate">{currentUser.email}</p>
                        </div>
                      </div>
                    </div>

                    {/* Menu Items */}
                    <div className="space-y-1">
                      <button
                        onClick={() => {
                          setActiveTab('profile');
                          setIsProfileOpen(false);
                        }}
                        className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold text-slate-300 hover:bg-white/[0.08] hover:text-white transition cursor-pointer border-0 bg-transparent text-left"
                      >
                        <User className="w-4 h-4 text-violet-400" />
                        <span>View My Profile</span>
                      </button>

                      <button
                        onClick={() => {
                          setActiveTab('study-hub');
                          setIsProfileOpen(false);
                        }}
                        className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold text-slate-300 hover:bg-white/[0.08] hover:text-white transition cursor-pointer border-0 bg-transparent text-left"
                      >
                        <BookOpen className="w-4 h-4 text-violet-400" />
                        <span>Study Hub & Notes</span>
                      </button>

                      <button
                        onClick={() => {
                          setActiveTab('skill-path');
                          setIsProfileOpen(false);
                        }}
                        className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold text-slate-300 hover:bg-white/[0.08] hover:text-white transition cursor-pointer border-0 bg-transparent text-left"
                      >
                        <Sparkles className="w-4 h-4 text-violet-400" />
                        <span>AI Skill Roadmap</span>
                      </button>

                      <div className="pt-1 border-t border-white/[0.06] mt-1">
                        <button
                          onClick={() => {
                            setIsProfileOpen(false);
                            onLogout();
                          }}
                          className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold text-rose-400 hover:bg-rose-950/40 transition cursor-pointer border-0 bg-transparent text-left"
                        >
                          <LogOut className="w-4 h-4 text-rose-400" />
                          <span>Log Out</span>
                        </button>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

          </div>
        </div>
      </header>

      {/* Floating Mobile Dock / Bottom Navbar */}
      <nav className="lg:hidden fixed bottom-3 left-3 right-3 z-40 bg-[#0E0F17]/90 backdrop-blur-xl border border-white/[0.08] rounded-[22px] shadow-2xl p-1.5 flex items-center justify-around">
        {[
          { id: 'dashboard' as NavTabId, label: 'Home', icon: LayoutDashboard },
          { id: 'explore' as NavTabId, label: 'Explore', icon: Compass },
          { id: 'study-hub' as NavTabId, label: 'Learn', icon: GraduationCap },
          { id: 'chat' as NavTabId, label: 'Messages', icon: MessageSquare },
          { id: 'profile' as NavTabId, label: 'Profile', icon: User },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id || (tab.id === 'study-hub' && isLearnActive);
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`group flex flex-col items-center justify-center py-1.5 px-2 rounded-xl min-w-[52px] transition-all cursor-pointer border-0 bg-transparent relative ${
                isActive ? 'text-white font-bold' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              {isActive && (
                <motion.div
                  layoutId="mobileActiveHighlight"
                  className="absolute inset-0 bg-[#1E202E] rounded-xl border border-white/[0.1]"
                  transition={motionTokens.spring.medium}
                />
              )}
              <Icon className={`w-5 h-5 relative z-10 transition-transform duration-200 group-hover:scale-110 ${isActive ? 'text-violet-400' : 'text-slate-400'}`} />
              <span className="text-[10px] tracking-tight mt-0.5 relative z-10">{tab.label}</span>
            </button>
          );
        })}
      </nav>

      {/* Global Quick Search Modal */}
      <AnimatePresence>
        {isSearchOpen && (
          <div className="fixed inset-0 z-50 flex items-start justify-center pt-20 px-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsSearchOpen(false)}
              className="fixed inset-0 bg-black/80 backdrop-blur-sm"
            />

            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: -10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: -10 }}
              transition={motionTokens.spring.medium}
              className="relative w-full max-w-xl bg-[#12131A] rounded-3xl border border-white/[0.12] shadow-2xl shadow-black/90 overflow-hidden z-10 p-4"
            >
              <form onSubmit={handleSearch} className="flex items-center gap-3">
                <Search className="w-5 h-5 text-violet-400 shrink-0" />
                <input
                  ref={searchInputRef}
                  type="text"
                  placeholder="Search skills (e.g. React, Spanish, Piano)..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-transparent text-white font-semibold text-sm sm:text-base outline-none border-0 placeholder:text-slate-500"
                />
                <button
                  type="button"
                  onClick={() => setIsSearchOpen(false)}
                  className="p-1.5 text-slate-400 hover:text-white rounded-xl hover:bg-white/[0.08] transition cursor-pointer border-0 bg-transparent"
                >
                  <X className="w-4 h-4" />
                </button>
              </form>

              <div className="mt-4 pt-3 border-t border-white/[0.06] flex items-center justify-between text-[11px] text-slate-400 font-medium">
                <span>Press <kbd className="px-1.5 py-0.5 bg-[#181924] rounded border border-white/[0.08] text-slate-300 font-mono">Enter</kbd> to search swappers</span>
                <span>Press <kbd className="px-1.5 py-0.5 bg-[#181924] rounded border border-white/[0.08] text-slate-300 font-mono">ESC</kbd> to close</span>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
});

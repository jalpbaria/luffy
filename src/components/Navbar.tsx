import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Home,
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
  Zap,
  X,
  SlidersHorizontal,
  Command,
  CheckCheck,
  Trophy,
  Video,
  Coins,
} from 'lucide-react';
import { UserProfile, AppNotification, Booking } from '../types';
import { Avatar } from './ui/Avatar';
import { Badge } from './ui/Badge';
import { AnimatedCounter } from './motion/AnimatedCounter';
import { supabase, mapSupabaseToBooking } from '../lib/supabase';

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

export const Navbar: React.FC<NavbarProps> = ({
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
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSyncing, setIsSyncing] = useState(false);
  const [actionedNotifIds, setActionedNotifIds] = useState<Set<string>>(new Set());

  const profileRef = useRef<HTMLDivElement>(null);
  const notifRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  const unreadCount = notifications.filter((n) => !n.read).length;

  // Handle outside click for dropdowns
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) {
        setIsProfileOpen(false);
      }
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
        setIsNotifOpen(false);
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

  const navTabs = [
    { id: 'dashboard' as NavTabId, label: 'Dashboard', icon: Home },
    { id: 'explore' as NavTabId, label: 'Explore', icon: Compass },
    { id: 'chat' as NavTabId, label: 'Chat', icon: MessageSquare },
    { id: 'study-hub' as NavTabId, label: 'Study Hub', icon: BookOpen },
    { id: 'skill-path' as NavTabId, label: 'AI Skill Path', icon: Sparkles },
    { id: 'gamification' as NavTabId, label: 'Rewards & Leaderboard', icon: Trophy },
    { id: 'credits' as NavTabId, label: 'Credits', icon: Coins },
    { id: 'profile' as NavTabId, label: 'Profile', icon: User },
  ];

  return (
    <>
      {/* Top Floating Glass Header */}
      <header className="sticky top-0 z-40 px-3 sm:px-6 pt-3 pb-2 transition-all">
        <div className="max-w-7xl mx-auto bg-white/90 backdrop-blur-xl border border-slate-200/90 rounded-[22px] px-3.5 sm:px-5 py-2.5 shadow-lg shadow-slate-900/5 flex items-center justify-between gap-3">
          
          {/* Brand / Logo */}
          <button
            onClick={() => setActiveTab('dashboard')}
            className="flex items-center gap-3 bg-transparent border-0 p-0 text-left cursor-pointer group shrink-0"
          >
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-indigo-600 via-purple-600 to-cyan-500 text-white flex items-center justify-center font-extrabold text-lg shadow-md shadow-indigo-500/25 group-hover:scale-105 transition-transform">
              ⇆
            </div>
            <div className="hidden min-[380px]:block">
              <div className="flex items-center gap-1.5">
                <span className="font-extrabold text-slate-900 tracking-tight text-base sm:text-lg leading-none">
                  SkillSwap
                </span>
                <span className="text-[10px] font-extrabold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded-full border border-indigo-200/80 uppercase tracking-wider">
                  2026
                </span>
              </div>
              <p className="text-[10px] font-semibold text-slate-500 tracking-wide leading-none mt-1">
                Peer Skill Exchange
              </p>
            </div>
          </button>

          {/* Center Navigation Tabs (Desktop) */}
          <nav className="hidden lg:flex items-center gap-1 bg-slate-100/90 p-1 rounded-2xl border border-slate-200/80">
            {navTabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`group relative px-3.5 py-1.5 rounded-xl flex items-center gap-2 text-xs font-bold transition-all cursor-pointer border-0 ${
                    isActive ? 'text-indigo-600' : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
                  }`}
                >
                  {isActive && (
                    <motion.div
                      layoutId="activeNavTab"
                      className="absolute inset-0 bg-white rounded-xl shadow-xs border border-slate-200/80"
                      transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                    />
                  )}
                  {/* Animated hover underline that expands from center */}
                  {!isActive && (
                    <span className="absolute bottom-1 left-3 right-3 h-[2px] bg-indigo-500/60 rounded-full scale-x-0 group-hover:scale-x-100 transition-transform duration-250 ease-out origin-center pointer-events-none" />
                  )}
                  <span className="relative z-10 flex items-center gap-2">
                    <Icon className={`w-4 h-4 transition-transform duration-200 group-hover:scale-110 ${isActive ? 'text-indigo-600' : 'text-slate-500'}`} />
                    <span>{tab.label}</span>
                  </span>
                </button>
              );
            })}
          </nav>

          {/* Right Action Controls */}
          <div className="flex items-center gap-2 sm:gap-3">
            
            {/* Credits Balance Badge */}
            <button
              onClick={() => setActiveTab('credits')}
              className="flex items-center gap-1.5 bg-amber-500/10 hover:bg-amber-500/20 text-amber-700 px-2.5 sm:px-3 py-1.5 rounded-xl border border-amber-500/30 transition text-xs font-black cursor-pointer shrink-0"
              title="View Credits Wallet"
            >
              <Coins className="w-4 h-4 text-amber-500" />
              <span>
                <AnimatedCounter value={currentUser.credits ?? 100} />
              </span>
            </button>

            {/* Quick Search Button */}
            <button
              onClick={() => setIsSearchOpen(true)}
              className="flex items-center gap-2 bg-slate-100 hover:bg-slate-200/80 text-slate-500 px-3 py-1.5 rounded-xl border border-slate-200/80 transition text-xs font-semibold cursor-pointer"
              title="Search skills & swappers (⌘K)"
            >
              <Search className="w-4 h-4 text-slate-500" />
              <span className="hidden sm:inline">Search...</span>
              <kbd className="hidden sm:inline-flex items-center gap-0.5 bg-white border border-slate-200 rounded px-1.5 py-0.2 text-[10px] font-mono text-slate-400 shadow-2xs">
                ⌘K
              </kbd>
            </button>

            {/* Sync Refresh Button */}
            <button
              onClick={handleSyncClick}
              className={`p-2 text-slate-500 hover:text-indigo-600 hover:bg-slate-100 rounded-xl transition cursor-pointer border-0 bg-transparent ${
                isSyncing ? 'animate-spin text-indigo-600' : ''
              }`}
              title="Refresh and sync data"
            >
              <RefreshCw className="w-4 h-4" />
            </button>

            {/* Notifications Popover Bell */}
            <div className="relative" ref={notifRef}>
              <button
                onClick={() => setIsNotifOpen((prev) => !prev)}
                className="relative p-2 text-slate-600 hover:text-indigo-600 hover:bg-slate-100 rounded-xl transition cursor-pointer border-0 bg-transparent"
                title="Notifications"
              >
                <Bell className="w-4 h-4" />
                {unreadCount > 0 && (
                  <motion.span
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="absolute top-1 right-1 w-4 h-4 bg-rose-500 text-white font-extrabold text-[9px] rounded-full flex items-center justify-center ring-2 ring-white"
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
                    transition={{ duration: 0.15 }}
                    className="absolute right-0 mt-2 w-80 sm:w-96 bg-white rounded-2xl border border-slate-200 shadow-2xl overflow-hidden z-50 p-0"
                  >
                    <div className="p-4 bg-slate-50 border-b border-slate-100 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="font-extrabold text-slate-900 text-sm">Notifications</span>
                        {unreadCount > 0 && (
                          <span className="px-2 py-0.5 bg-indigo-100 text-indigo-700 text-[10px] font-extrabold rounded-full">
                            {unreadCount} unread
                          </span>
                        )}
                      </div>
                      {notifications.length > 0 && (
                        <button
                          onClick={() => notifications.forEach((n) => onMarkNotificationRead(n.id))}
                          className="text-[11px] font-bold text-indigo-600 hover:text-indigo-800 cursor-pointer border-0 bg-transparent flex items-center gap-1"
                        >
                          <CheckCheck className="w-3.5 h-3.5" />
                          Mark all read
                        </button>
                      )}
                    </div>

                    <div className="max-h-80 overflow-y-auto divide-y divide-slate-100 p-1">
                      {notifications.length === 0 ? (
                        <div className="py-8 text-center text-slate-400 space-y-2">
                          <Bell className="w-8 h-8 mx-auto stroke-1 opacity-50" />
                          <p className="text-xs font-semibold">No notifications yet</p>
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
                                notif.read ? 'bg-white opacity-80' : 'bg-indigo-50/40'
                              } ${canJoinRoom ? 'cursor-pointer hover:bg-indigo-50' : ''}`}
                            >
                              <div className="w-2 h-2 rounded-full bg-indigo-600 mt-2 shrink-0" style={{ opacity: notif.read ? 0 : 1 }} />
                              <div className="flex-1 min-w-0">
                                <p className="font-bold text-slate-900 text-xs leading-snug">{notif.title}</p>
                                <p className="text-slate-600 text-[11px] mt-0.5 leading-relaxed">{notif.message}</p>

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
                                      className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[11px] rounded-lg flex items-center gap-1 shadow-xs transition cursor-pointer border-0"
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
                                      className="px-2.5 py-1 bg-slate-100 hover:bg-rose-50 text-slate-700 hover:text-rose-600 border border-slate-200 font-bold text-[11px] rounded-lg flex items-center gap-1 transition cursor-pointer"
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
                                      <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-md">
                                        <Check className="w-3 h-3" /> Confirmed
                                      </span>
                                    ) : bookingResolvedStatus === 'cancelled' ? (
                                      <span className="inline-flex items-center gap-1 text-[10px] font-bold text-slate-500 bg-slate-100 border border-slate-200 px-2 py-0.5 rounded-md">
                                        Declined
                                      </span>
                                    ) : (
                                      <span className="inline-flex items-center gap-1 text-[10px] font-bold text-indigo-700 bg-indigo-50 border border-indigo-200 px-2 py-0.5 rounded-md">
                                        Resolved
                                      </span>
                                    )}
                                  </div>
                                )}

                                <span className="text-[10px] text-slate-400 mt-1 block">
                                  {new Date(notif.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </span>

                                {canJoinRoom && (
                                  <div className="mt-2">
                                    <button
                                      onClick={handleJoinSession}
                                      className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[11px] rounded-lg flex items-center gap-1 shadow-xs transition cursor-pointer border-0"
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
                                    className="p-1 text-indigo-600 hover:bg-indigo-100 rounded-lg cursor-pointer border-0 bg-transparent"
                                    title="Mark as read"
                                  >
                                    <Check className="w-3.5 h-3.5" />
                                  </button>
                                )}
                                <button
                                  onClick={() => onDeleteNotification(notif.id)}
                                  className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg cursor-pointer border-0 bg-transparent"
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
                className="flex items-center gap-2 p-1 rounded-2xl hover:bg-slate-100 transition cursor-pointer border border-transparent hover:border-slate-200"
              >
                <Avatar
                  src={currentUser.avatar}
                  name={currentUser.name}
                  size="sm"
                  isOnline={true}
                />
                <div className="hidden sm:block text-left pr-1">
                  <p className="font-bold text-slate-900 text-xs leading-tight truncate max-w-[100px]">
                    {currentUser.name}
                  </p>
                  <div className="flex items-center gap-1 mt-0.5">
                    <span className="text-[10px] font-semibold text-slate-500">
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
                    transition={{ duration: 0.15 }}
                    className="absolute right-0 mt-2 w-64 bg-white rounded-2xl border border-slate-200 shadow-2xl overflow-hidden z-50 p-2"
                  >
                    {/* User Info Header */}
                    <div className="p-3 bg-gradient-to-br from-indigo-50 to-purple-50 rounded-xl mb-2 border border-indigo-100/60">
                      <div className="flex items-center gap-3">
                        <Avatar
                          src={currentUser.avatar}
                          name={currentUser.name}
                          size="md"
                        />
                        <div className="min-w-0 flex-1">
                          <p className="font-extrabold text-slate-900 text-sm truncate">{currentUser.name}</p>
                          <p className="text-[11px] text-slate-500 truncate">{currentUser.email}</p>
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
                        className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-bold text-slate-700 hover:bg-slate-100 hover:text-indigo-600 transition cursor-pointer border-0 bg-transparent text-left"
                      >
                        <User className="w-4 h-4 text-slate-400" />
                        <span>View My Profile</span>
                      </button>

                      <button
                        onClick={() => {
                          setActiveTab('study-hub');
                          setIsProfileOpen(false);
                        }}
                        className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-bold text-slate-700 hover:bg-slate-100 hover:text-indigo-600 transition cursor-pointer border-0 bg-transparent text-left"
                      >
                        <BookOpen className="w-4 h-4 text-slate-400" />
                        <span>Study Hub & Notes</span>
                      </button>

                      <button
                        onClick={() => {
                          setActiveTab('skill-path');
                          setIsProfileOpen(false);
                        }}
                        className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-bold text-slate-700 hover:bg-slate-100 hover:text-indigo-600 transition cursor-pointer border-0 bg-transparent text-left"
                      >
                        <Sparkles className="w-4 h-4 text-slate-400" />
                        <span>AI Skill Roadmap</span>
                      </button>

                      <div className="pt-1 border-t border-slate-100 mt-1">
                        <button
                          onClick={() => {
                            setIsProfileOpen(false);
                            onLogout();
                          }}
                          className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-bold text-rose-600 hover:bg-rose-50 transition cursor-pointer border-0 bg-transparent text-left"
                        >
                          <LogOut className="w-4 h-4 text-rose-500" />
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
      <nav className="lg:hidden fixed bottom-3 left-3 right-3 z-40 bg-white/95 backdrop-blur-xl border border-slate-200/90 rounded-[22px] shadow-2xl p-1.5 flex items-center justify-around">
        {navTabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`group flex flex-col items-center justify-center py-1.5 px-2 rounded-xl min-w-[50px] transition-all cursor-pointer border-0 bg-transparent relative ${
                isActive ? 'text-indigo-600 font-extrabold' : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              {isActive && (
                <motion.div
                  layoutId="mobileActiveTab"
                  className="absolute inset-0 bg-indigo-50 rounded-xl"
                  transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                />
              )}
              {/* Mobile underline indicator on hover */}
              {!isActive && (
                <span className="absolute bottom-1 left-2 right-2 h-[2px] bg-indigo-500/50 rounded-full scale-x-0 group-hover:scale-x-100 transition-transform duration-250 ease-out origin-center pointer-events-none" />
              )}
              <Icon className="w-5 h-5 relative z-10 transition-transform duration-200 group-hover:scale-110" />
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
              className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs"
            />

            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: -10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: -10 }}
              className="relative w-full max-w-xl bg-white rounded-3xl border border-slate-200 shadow-2xl overflow-hidden z-10 p-4"
            >
              <form onSubmit={handleSearch} className="flex items-center gap-3">
                <Search className="w-5 h-5 text-indigo-600 shrink-0" />
                <input
                  ref={searchInputRef}
                  type="text"
                  placeholder="Search skills (e.g. React, Spanish, Piano)..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-transparent text-slate-900 font-bold text-sm sm:text-base outline-none border-0 placeholder:text-slate-400"
                />
                <button
                  type="button"
                  onClick={() => setIsSearchOpen(false)}
                  className="p-1.5 text-slate-400 hover:text-slate-600 rounded-xl hover:bg-slate-100 transition cursor-pointer border-0 bg-transparent"
                >
                  <X className="w-4 h-4" />
                </button>
              </form>

              <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400 font-medium">
                <span>Press <kbd className="px-1.5 py-0.5 bg-slate-100 rounded text-slate-600 font-bold">Enter</kbd> to search swappers</span>
                <span>Press <kbd className="px-1.5 py-0.5 bg-slate-100 rounded text-slate-600 font-bold">ESC</kbd> to close</span>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
};

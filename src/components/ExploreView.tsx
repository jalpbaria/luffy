import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Search, SlidersHorizontal, Star, Award, GraduationCap, 
  MapPin, Clock, Languages, Globe, Calendar, Check, MessageSquare,
  ArrowRight, ExternalLink, X, Compass, CheckCircle2, ChevronRight,
  BookOpen, Sparkles, Send, CheckSquare, ArrowLeft, Code, RefreshCw, Layers
} from 'lucide-react';
import { UserProfile, Skill, LearningOption, Review } from '../types';
import { getSkillGuide } from '../data/skillGuides';
import { getAISkillTutorReply } from '../lib/gemini';
import { computeAllUserMatches, calculateMatch, UserMatchResult } from '../lib/matchUtils';
import { VerifiedSkillBadge } from './VerifiedSkillBadge';

interface ExploreViewProps {
  currentUser: UserProfile;
  users: UserProfile[];
  onBookSession: (teacher: UserProfile, skill: Skill, option: LearningOption, date: string, slot: 'Morning' | 'Afternoon' | 'Evening', notes: string, scheduledTime?: string) => void;
  onOpenChat: (userId: string) => void;
  isLoading: boolean;
  allReviews?: Review[];
}

const CATEGORIES = [
  'All', 'Programming', 'Graphic Design', 'Video Editing', 'Digital Marketing',
  'Photography', 'Music', 'Fitness', 'Cooking', 'Language Learning',
  'Public Speaking', 'Business'
];

const LEARNING_OPTIONS: { value: LearningOption; icon: string; desc: string }[] = [
  { value: 'Live 1-on-1 Session', icon: '📹', desc: 'Real-time interactive session via voice or video' },
  { value: 'Group Session', icon: '👥', desc: 'Join a group with other learners sharing the skill' },
  { value: 'Chat Guidance', icon: '💬', desc: 'Text guidance, asynchronous Q&A, and quick feedback' },
  { value: 'Notes & Resources', icon: '📄', desc: 'Handouts, code snippets, templates, or reading list' },
  { value: 'Recorded Video', icon: '🎥', desc: 'Pre-recorded video explaining the key concepts' },
  { value: 'Project-Based Learning', icon: '🛠', desc: 'Build a practical, real-world project together' }
];

export default function ExploreView({ currentUser, users, onBookSession, onOpenChat, isLoading, allReviews = [] }: ExploreViewProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [selectedLevel, setSelectedLevel] = useState<string>('All');
  const [selectedLanguage, setSelectedLanguage] = useState<string>('All');
  const [selectedAvailability, setSelectedAvailability] = useState<string>('All');
  const [selectedTimeZone, setSelectedTimeZone] = useState<string>('All');
  const [showFilters, setShowFilters] = useState(false);
  const [matchFilter, setMatchFilter] = useState<'all' | 'perfect' | 'partial'>('all');
  
  // Selected teacher for full details
  const [selectedTeacher, setSelectedTeacher] = useState<UserProfile | null>(null);
  const [selectedSkillToLearn, setSelectedSkillToLearn] = useState<Skill | null>(null);
  
  // Booking Form State
  const [isBookingMode, setIsBookingMode] = useState(false);
  const [chosenOption, setChosenOption] = useState<LearningOption>('Live 1-on-1 Session');
  const [bookingDate, setBookingDate] = useState('');
  const [bookingTime, setBookingTime] = useState('14:00');
  const [bookingSlot, setBookingSlot] = useState<'Morning' | 'Afternoon' | 'Evening'>('Afternoon');
  const [bookingNotes, setBookingNotes] = useState('');
  const [bookingSuccess, setBookingSuccess] = useState(false);

  // Self-Guided Learning Study Hub State
  const [activeStudySkill, setActiveStudySkill] = useState<Skill | null>(null);
  const [studyActiveTab, setStudyActiveTab] = useState<'roadmap' | 'resources' | 'coach'>('roadmap');
  const [tutorMessages, setTutorMessages] = useState<{ role: 'user' | 'model'; text: string }[]>([]);
  const [tutorInput, setTutorInput] = useState('');
  const [isTutorLoading, setIsTutorLoading] = useState(false);
  const [completedTasks, setCompletedTasks] = useState<Record<string, boolean>>(() => {
    try {
      const saved = localStorage.getItem('study_completed_tasks');
      return saved ? JSON.parse(saved) : {};
    } catch {
      return {};
    }
  });

  // Persist completed tasks locally
  useEffect(() => {
    localStorage.setItem('study_completed_tasks', JSON.stringify(completedTasks));
  }, [completedTasks]);

  const toggleTask = (taskKey: string) => {
    setCompletedTasks(prev => ({
      ...prev,
      [taskKey]: !prev[taskKey]
    }));
  };

  const handleOpenStudyHub = (skill: Skill) => {
    setActiveStudySkill(skill);
    setStudyActiveTab('roadmap');
    // Seed initial message if chat is empty
    setTutorMessages([
      { 
        role: 'model', 
        text: `Hello! I am your interactive **${skill.name}** Coach. 🎓\n\n` +
          `I am powered by Gemini. You can ask me any question about this skill, request coding exercises, structured practice plans, or typical starter advice.\n\n` +
          `*What is your current level, and what would you like to build or focus on today?*` 
      }
    ]);
  };

  const handleSendTutorMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!tutorInput.trim() || !activeStudySkill || isTutorLoading) return;

    const userMsg = tutorInput.trim();
    setTutorInput('');
    setTutorMessages(prev => [...prev, { role: 'user', text: userMsg }]);
    setIsTutorLoading(true);

    try {
      const reply = await getAISkillTutorReply(
        activeStudySkill.name,
        activeStudySkill.category,
        userMsg,
        tutorMessages.map(m => ({ role: m.role as 'user' | 'model', text: m.text }))
      );
      setTutorMessages(prev => [...prev, { role: 'model', text: reply }]);
    } catch (error) {
      console.error('Error sending message to tutor:', error);
      setTutorMessages(prev => [...prev, { 
        role: 'model', 
        text: `⚠️ I had a temporary issue connecting to the AI server. Please make sure your development environment has internet access and try again!\n\nIn the meantime, you can continue browsing the **Syllabus Roadmap** and **Official Resources (W3Schools)** on the other tabs!` 
      }]);
    } finally {
      setIsTutorLoading(false);
    }
  };

  const renderFormattedText = (text: string) => {
    const parts = text.split(/(```[\s\S]*?```)/g);
    
    return parts.map((part, index) => {
      if (part.startsWith('```')) {
        const codeLines = part.replace(/```[a-zA-Z]*\n?/, '').replace(/```$/, '').trim();
        return (
          <pre key={index} className="bg-slate-900 text-slate-100 rounded-lg p-3 font-mono text-[11px] overflow-x-auto my-2 border border-slate-800">
            <code>{codeLines}</code>
          </pre>
        );
      }

      const lines = part.split('\n');
      return (
        <div key={index} className="space-y-1.5">
          {lines.map((line, lIdx) => {
            const trimmed = line.trim();
            if (!trimmed) return <div key={lIdx} className="h-1" />;

            const isBullet = trimmed.startsWith('* ') || trimmed.startsWith('- ') || /^\d+\.\s/.test(trimmed);
            let content = trimmed;
            if (trimmed.startsWith('* ') || trimmed.startsWith('- ')) {
              content = trimmed.substring(2);
            } else if (/^\d+\.\s/.test(trimmed)) {
              const match = trimmed.match(/^(\d+\.\s)(.*)/);
              content = match ? match[2] : trimmed;
            }

            const boldParts = content.split(/(\*\*.*?\*\*)/g);
            const parsedContent = boldParts.map((bp, bIdx) => {
              if (bp.startsWith('**') && bp.endsWith('**')) {
                return <strong key={bIdx} className="font-semibold text-slate-900">{bp.slice(2, -2)}</strong>;
              }
              return bp;
            });

            if (isBullet) {
              return (
                <div key={lIdx} className="flex items-start gap-2 pl-4">
                  <span className="text-indigo-500 mt-1 shrink-0 text-sm">•</span>
                  <p className="text-slate-700 text-sm leading-relaxed">{parsedContent}</p>
                </div>
              );
            }

            return (
              <p key={lIdx} className="text-slate-700 text-sm leading-relaxed">{parsedContent}</p>
            );
          })}
        </div>
      );
    });
  };

  // Filter users based on query state & compute mutual matches
  const otherUsers = useMemo(() => users.filter(u => u.id !== currentUser?.id), [users, currentUser?.id]);

  // Compute matches for all users relative to currentUser
  const userMatches = useMemo(() => {
    return computeAllUserMatches(currentUser, users);
  }, [currentUser, users]);

  const matchMap = useMemo(() => {
    const map = new Map<string, UserMatchResult>();
    userMatches.forEach(m => map.set(m.user.id, m));
    return map;
  }, [userMatches]);

  const perfectMatches = useMemo(() => {
    return userMatches.filter(m => m.isPerfectMatch);
  }, [userMatches]);

  const partialMatches = useMemo(() => {
    return userMatches.filter(m => m.isPartialMatch);
  }, [userMatches]);
  
  const filteredUsers = useMemo(() => {
    let result = otherUsers.filter(user => {
      // Search match
      const searchLower = searchQuery.toLowerCase();
      const matchesSearch = searchQuery === '' || 
        user.name.toLowerCase().includes(searchLower) ||
        (user.bio || '').toLowerCase().includes(searchLower) ||
        (user.skillsOffered ?? []).some(s => s.name.toLowerCase().includes(searchLower)) ||
        (user.skillsWanted ?? []).some(s => s.name.toLowerCase().includes(searchLower));

      // Category match
      const matchesCategory = selectedCategory === 'All' || 
        (user.skillsOffered ?? []).some(s => s.category === selectedCategory);

      // Level match
      const matchesLevel = selectedLevel === 'All' || 
        user.skillLevel === selectedLevel ||
        (user.skillsOffered ?? []).some(s => s.level === selectedLevel);

      // Language match
      const matchesLanguage = selectedLanguage === 'All' ||
        (user.languages ?? []).some(l => l.includes(selectedLanguage));

      // Availability match
      const matchesAvailability = selectedAvailability === 'All' ||
        (user.availability ?? []).includes(selectedAvailability as any);

      // Time zone match
      const matchesTimeZone = selectedTimeZone === 'All' ||
        user.timeZone === selectedTimeZone;

      return matchesSearch && matchesCategory && matchesLevel && matchesLanguage && matchesAvailability && matchesTimeZone;
    });

    // Apply match filter if selected
    if (matchFilter === 'perfect') {
      result = result.filter(u => matchMap.get(u.id)?.isPerfectMatch);
    } else if (matchFilter === 'partial') {
      result = result.filter(u => matchMap.get(u.id)?.isPartialMatch);
    }

    // Sort by match score (Perfect matches with higher skill overlap count appear first)
    return result.sort((a, b) => {
      const scoreA = matchMap.get(a.id)?.score || 0;
      const scoreB = matchMap.get(b.id)?.score || 0;
      return scoreB - scoreA;
    });
  }, [otherUsers, searchQuery, selectedCategory, selectedLevel, selectedLanguage, selectedAvailability, selectedTimeZone, matchFilter, matchMap]);

  // Get list of unique languages and time zones across all users
  const allLanguages = Array.from(new Set(otherUsers.flatMap(u => (u.languages ?? []).map(l => l.split(' ')[0]))));
  const allTimeZones = Array.from(new Set(otherUsers.map(u => u.timeZone)));

  const handleOpenDetails = (teacher: UserProfile) => {
    setSelectedTeacher(teacher);
    setSelectedSkillToLearn((teacher?.skillsOffered ?? [])[0] || null);
    setIsBookingMode(false);
    setBookingSuccess(false);
  };

  const handleStartBooking = () => {
    setIsBookingMode(true);
    // Set default date to tomorrow and time to 14:00
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    setBookingDate(tomorrow.toISOString().split('T')[0]);
    setBookingTime('14:00');
  };

  const submitBooking = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTeacher || !selectedSkillToLearn) return;
    
    let scheduledTimeStr: string | undefined = undefined;
    if (bookingDate && bookingTime) {
      const d = new Date(`${bookingDate}T${bookingTime}:00`);
      if (!isNaN(d.getTime())) {
        scheduledTimeStr = d.toISOString();
      }
    }

    onBookSession(
      selectedTeacher,
      selectedSkillToLearn,
      chosenOption,
      bookingDate,
      bookingSlot,
      bookingNotes,
      scheduledTimeStr
    );

    setBookingSuccess(true);
    setTimeout(() => {
      setIsBookingMode(false);
      setSelectedTeacher(null);
      setBookingSuccess(false);
      setBookingNotes('');
    }, 2000);
  };

  return (
    <div id="explore-view-root" className="space-y-6">
      {/* Title section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-white">Discover Skill Swappers</h1>
          <p className="text-zinc-400 mt-1 text-sm">Find your perfect skill-sharing partner. Filter by language, level, and availability.</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="px-3.5 py-1.5 bg-indigo-500/10 border border-indigo-500/20 rounded-full text-xs font-semibold text-indigo-300 flex items-center gap-2 backdrop-blur-md">
            <span>✨ Spark Economy</span>
            <span className="font-bold bg-indigo-500/20 text-indigo-200 px-2 py-0.5 rounded-full text-[10px]">{currentUser.credits} Credits Available</span>
          </div>
        </div>
      </div>

      {/* Search and Filters bar */}
      <div className="bg-zinc-900/90 rounded-[24px] border border-zinc-800 shadow-xl p-5 space-y-4 backdrop-blur-md">
        {/* Match Fit Filter Mode Tabs */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-zinc-800 pb-4">
          <div className="flex items-center gap-1.5 bg-zinc-950/80 p-1.5 rounded-2xl border border-zinc-800/80">
            <button
              onClick={() => setMatchFilter('all')}
              className={`px-3.5 py-1.5 rounded-xl font-semibold text-xs transition cursor-pointer flex items-center gap-2 ${
                matchFilter === 'all'
                  ? 'bg-zinc-800 text-white shadow-md'
                  : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              <span>All Swappers</span>
              <span className="px-2 py-0.5 bg-zinc-900 text-zinc-300 rounded-full text-[10px] font-bold">
                {otherUsers.length}
              </span>
            </button>

            <button
              onClick={() => setMatchFilter('perfect')}
              className={`px-3.5 py-1.5 rounded-xl font-semibold text-xs transition cursor-pointer flex items-center gap-2 ${
                matchFilter === 'perfect'
                  ? 'bg-gradient-to-r from-emerald-600 via-teal-600 to-indigo-600 text-white shadow-md'
                  : 'text-emerald-400 hover:bg-emerald-500/10'
              }`}
            >
              <Sparkles className={`w-3.5 h-3.5 ${matchFilter === 'perfect' ? 'text-amber-300 fill-amber-300' : 'text-emerald-400'}`} />
              <span>Perfect Matches</span>
              <span className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold ${
                matchFilter === 'perfect' ? 'bg-black/30 text-emerald-200' : 'bg-emerald-500/20 text-emerald-300'
              }`}>
                {perfectMatches.length}
              </span>
            </button>

            <button
              onClick={() => setMatchFilter('partial')}
              className={`px-3.5 py-1.5 rounded-xl font-semibold text-xs transition cursor-pointer flex items-center gap-2 ${
                matchFilter === 'partial'
                  ? 'bg-zinc-800 text-indigo-400 shadow-md'
                  : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              <span>Partial Matches</span>
              <span className="px-2 py-0.5 bg-indigo-500/20 text-indigo-300 rounded-full text-[10px] font-bold">
                {partialMatches.length}
              </span>
            </button>
          </div>

          {perfectMatches.length > 0 && matchFilter !== 'perfect' && (
            <button
              onClick={() => setMatchFilter('perfect')}
              className="text-xs text-emerald-400 font-bold hover:underline flex items-center gap-1.5 bg-emerald-500/10 border border-emerald-500/20 px-3 py-1.5 rounded-xl cursor-pointer"
            >
              <Sparkles className="w-3.5 h-3.5 text-emerald-400 fill-emerald-400/30" />
              <span>{perfectMatches.length} Perfect Barter Match{perfectMatches.length > 1 ? 'es' : ''} Found!</span>
            </button>
          )}
        </div>

        <div className="flex gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-500 w-4 h-4" />
            <input 
              type="text" 
              placeholder="Search skills, names, bios..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-zinc-950 border border-zinc-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/40 focus:border-indigo-500 text-xs text-white placeholder:text-zinc-600"
            />
          </div>
          <button 
            onClick={() => setShowFilters(!showFilters)}
            className={`px-4 py-2.5 border rounded-xl text-xs flex items-center gap-2 font-semibold transition cursor-pointer ${
              showFilters ? 'bg-zinc-800 border-zinc-700 text-white' : 'bg-zinc-950 border-zinc-800 text-zinc-400 hover:text-white'
            }`}
          >
            <SlidersHorizontal className="w-4 h-4" />
            Filters
            {showFilters ? 'Hide' : 'Show'}
          </button>
        </div>

        {/* Categories Pills */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1.5 scrollbar-thin">
          {CATEGORIES.map(category => {
            const isSelected = selectedCategory === category;

            return (
              <button
                key={category}
                onClick={() => setSelectedCategory(category)}
                className={`px-4 py-2 rounded-full text-xs font-semibold whitespace-nowrap transition-all cursor-pointer shrink-0 ${
                  isSelected 
                    ? 'bg-gradient-to-r from-indigo-500 via-purple-500 to-cyan-500 text-white shadow-lg shadow-indigo-500/20' 
                    : 'bg-zinc-950 text-zinc-400 hover:text-white border border-zinc-800'
                }`}
              >
                {category}
              </button>
            );
          })}
        </div>

        {/* Extra Filters Panel */}
        <AnimatePresence>
          {showFilters && (
            <motion.div 
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden border-t border-zinc-800 pt-4 grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs"
            >
              <div>
                <label className="block text-zinc-400 font-semibold mb-1.5">Skill level</label>
                <select 
                  value={selectedLevel} 
                  onChange={(e) => setSelectedLevel(e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-800 text-white rounded-xl p-2.5 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                >
                  <option value="All">All Levels</option>
                  <option value="Beginner">Beginner</option>
                  <option value="Intermediate">Intermediate</option>
                  <option value="Expert">Expert</option>
                </select>
              </div>

              <div>
                <label className="block text-zinc-400 font-semibold mb-1.5">Language spoken</label>
                <select 
                  value={selectedLanguage} 
                  onChange={(e) => setSelectedLanguage(e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-800 text-white rounded-xl p-2.5 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                >
                  <option value="All">All Languages</option>
                  {allLanguages.map(lang => (
                    <option key={lang} value={lang}>{lang}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-zinc-400 font-semibold mb-1.5">Availability</label>
                <select 
                  value={selectedAvailability} 
                  onChange={(e) => setSelectedAvailability(e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-800 text-white rounded-xl p-2.5 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                >
                  <option value="All">Any Time</option>
                  <option value="Morning">Morning</option>
                  <option value="Afternoon">Afternoon</option>
                  <option value="Evening">Evening</option>
                </select>
              </div>

              <div>
                <label className="block text-zinc-400 font-semibold mb-1.5">Time Zone</label>
                <select 
                  value={selectedTimeZone} 
                  onChange={(e) => setSelectedTimeZone(e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-800 text-white rounded-xl p-2.5 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                >
                  <option value="All">Any Time Zone</option>
                  {allTimeZones.map(tz => (
                    <option key={tz} value={tz}>{tz}</option>
                  ))}
                </select>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Grid of Users */}
      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-20 text-zinc-500 gap-3">
          <div className="animate-spin rounded-full h-8 w-8 border-2 border-indigo-500 border-t-transparent"></div>
          <span className="text-sm">Loading matches...</span>
        </div>
      ) : filteredUsers.length === 0 ? (
        <div className="bg-zinc-900/80 rounded-[24px] border border-zinc-800 py-16 px-4 text-center">
          <Compass className="w-12 h-12 text-zinc-600 mx-auto mb-3" />
          <h3 className="font-bold text-white text-base">No matches found</h3>
          <p className="text-zinc-400 text-xs max-w-sm mx-auto mt-1">Try adjusting your filters, expanding your search query, or checking back later.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredUsers.map((user) => {
            const matchInfo = matchMap.get(user.id);
            const isPerfect = matchInfo?.isPerfectMatch;
            const isPartial = matchInfo?.isPartialMatch;

            return (
              <motion.div 
                key={user.id}
                layoutId={`user-card-${user.id}`}
                className={`bg-zinc-900/90 rounded-[24px] border transition-all duration-200 flex flex-col overflow-hidden cursor-pointer ${
                  isPerfect 
                    ? 'border-emerald-500/40 shadow-xl shadow-emerald-500/5 ring-1 ring-emerald-500/20' 
                    : isPartial
                    ? 'border-indigo-500/30 hover:border-indigo-500/50 shadow-xl'
                    : 'border-zinc-800 hover:border-zinc-700 shadow-lg'
                }`}
                onClick={() => handleOpenDetails(user)}
              >
                {/* Perfect Match Top Banner */}
                {isPerfect && (
                  <div className="bg-gradient-to-r from-emerald-600 via-teal-600 to-indigo-600 text-white px-4 py-2 flex items-center justify-between text-xs font-bold">
                    <span className="flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5 text-amber-300 fill-amber-300 animate-pulse" />
                      Perfect 2-Way Skill Fit
                    </span>
                    <span className="bg-white/20 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wide">
                      100% Mutual Match
                    </span>
                  </div>
                )}

                {/* Header card info */}
                <div className="p-5 flex items-start gap-4 cursor-pointer">
                  <img 
                    src={user.avatar} 
                    alt={user.name} 
                    referrerPolicy="no-referrer"
                    className={`w-14 h-14 rounded-full object-cover border-2 flex-shrink-0 ${
                      isPerfect ? 'border-emerald-400 ring-2 ring-emerald-500/30' : 'border-zinc-800'
                    }`}
                  />
                  <div className="space-y-1 min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-1.5">
                      <h3 className="font-bold text-white truncate text-base hover:text-indigo-400 transition">{user.name}</h3>
                      <span className="px-2 py-0.5 bg-zinc-800 text-zinc-300 rounded-md text-[10px] font-medium shrink-0">{user.skillLevel}</span>
                    </div>
                    
                    {/* Rating */}
                    <div className="flex items-center gap-1 text-xs text-amber-400 font-semibold">
                      <Star className="w-3.5 h-3.5 fill-current" />
                      <span>{user.rating.toFixed(1)}</span>
                      <span className="text-zinc-500 font-normal">({user.reviewsCount} reviews)</span>
                    </div>

                    {/* Timezone / Availability info */}
                    <div className="flex items-center gap-1 text-xs text-zinc-400">
                      <Globe className="w-3 h-3 text-zinc-500" />
                      <span>{user.timeZone}</span>
                      <span className="text-zinc-600">•</span>
                      <Clock className="w-3 h-3 text-zinc-500" />
                      <span className="truncate">{(user.availability ?? []).join(', ')}</span>
                    </div>
                  </div>
                </div>

                {/* Perfect Mutual Match Highlight Box */}
                {isPerfect && matchInfo && (
                  <div className="mx-5 mb-3 p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl space-y-2 text-xs">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px]">
                      <div className="bg-zinc-950/80 p-2 rounded-lg border border-emerald-500/20">
                        <span className="text-emerald-400 block text-[10px] font-extrabold uppercase tracking-wider">They Teach ➔ You Want</span>
                        <span className="font-bold text-white">
                          {matchInfo.theyTeachUserWants.map(m => m.otherSkill.name).join(', ')}
                        </span>
                      </div>
                      <div className="bg-zinc-950/80 p-2 rounded-lg border border-indigo-500/20">
                        <span className="text-indigo-400 block text-[10px] font-extrabold uppercase tracking-wider">You Teach ➔ They Want</span>
                        <span className="font-bold text-white">
                          {matchInfo.userTeachesTheyWant.map(m => m.userSkill.name).join(', ')}
                        </span>
                      </div>
                    </div>
                  </div>
                )}

                {/* Partial Match Box */}
                {isPartial && matchInfo && !isPerfect && (
                  <div className="mx-5 mb-3 p-3 bg-indigo-500/10 border border-indigo-500/20 rounded-xl text-[11px] space-y-1">
                    <span className="font-bold text-indigo-300 flex items-center gap-1">
                      <RefreshCw className="w-3 h-3 text-indigo-400" />
                      Partial Skill Match
                    </span>
                    {matchInfo.theyTeachUserWants.length > 0 && (
                      <p className="text-zinc-300">
                        They teach <strong className="text-emerald-300">{matchInfo.theyTeachUserWants.map(m => m.otherSkill.name).join(', ')}</strong> (you want)
                      </p>
                    )}
                    {matchInfo.userTeachesTheyWant.length > 0 && (
                      <p className="text-zinc-300">
                        They want <strong className="text-indigo-300">{matchInfo.userTeachesTheyWant.map(m => m.userSkill.name).join(', ')}</strong> (you teach)
                      </p>
                    )}
                  </div>
                )}

                {/* Teaching skills */}
                <div className="px-5 pb-4 flex-1 space-y-3 cursor-pointer">
                  <div>
                    <span className="text-[11px] font-bold text-zinc-500 tracking-wider uppercase">Teaches</span>
                    <div className="flex flex-wrap gap-1.5 mt-1.5">
                      {(user.skillsOffered ?? []).map((sk, idx) => (
                        <span key={idx} className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 rounded-lg text-xs font-semibold">
                          <Award className="w-3 h-3 text-indigo-400 shrink-0" />
                          <span>{sk.name}</span>
                          <VerifiedSkillBadge teacherId={user.id} skillName={sk.name} allReviews={allReviews} />
                        </span>
                      ))}
                    </div>
                  </div>

                  <div>
                    <span className="text-[11px] font-bold text-zinc-500 tracking-wider uppercase">Wants to Learn</span>
                    <div className="flex flex-wrap gap-1.5 mt-1.5">
                      {(user.skillsWanted ?? []).map((sk, idx) => (
                        <span key={idx} className="inline-flex items-center gap-1 px-2.5 py-1 bg-amber-500/10 border border-amber-500/20 text-amber-300 rounded-lg text-xs font-semibold">
                          <GraduationCap className="w-3 h-3 text-amber-400" />
                          {sk.name}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Successful Exchanges and CTA */}
                <div className="px-5 py-3.5 bg-zinc-950/80 border-t border-zinc-800 flex items-center justify-between text-xs">
                  <span className="text-zinc-400">
                    <span className="font-bold text-white">{user.successfulExchanges}</span> successful swaps
                  </span>
                  <span className="text-indigo-400 font-semibold group flex items-center gap-1 cursor-pointer">
                    View Profile <ChevronRight className="w-4 h-4 transition group-hover:translate-x-0.5" />
                  </span>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}

      {/* Teacher Profile Detail Overlay */}
      <AnimatePresence>
        {selectedTeacher && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 z-50 overflow-y-auto">
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-zinc-900 rounded-[28px] w-full max-w-2xl border border-zinc-800 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
            >
              {/* Profile Details Header */}
              <div className="p-6 border-b border-zinc-800 flex items-start justify-between bg-zinc-950/80">
                <div className="flex items-center gap-4">
                  <img 
                    src={selectedTeacher.avatar} 
                    alt={selectedTeacher.name} 
                    referrerPolicy="no-referrer"
                    className="w-16 h-16 rounded-full object-cover border-2 border-zinc-700 shadow-md"
                  />
                  <div>
                    <div className="flex items-center gap-2">
                      <h2 className="text-xl font-bold text-white">{selectedTeacher.name}</h2>
                      <span className="px-2.5 py-0.5 bg-indigo-500/20 text-indigo-300 rounded-md text-xs font-semibold border border-indigo-500/30">{selectedTeacher.skillLevel}</span>
                    </div>
                    <p className="text-zinc-400 text-xs flex items-center gap-3 mt-1">
                      <span className="flex items-center gap-1"><MapPin className="w-3.5 h-3.5 text-zinc-500" />{selectedTeacher.timeZone}</span>
                      <span>•</span>
                      <span className="flex items-center gap-1"><Languages className="w-3.5 h-3.5 text-zinc-500" />{selectedTeacher.languages.join(', ')}</span>
                    </p>
                  </div>
                </div>
                <button 
                  onClick={() => setSelectedTeacher(null)}
                  className="p-1.5 rounded-full hover:bg-zinc-800 text-zinc-400 hover:text-white transition cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Profile Details Body */}
              <div className="flex-1 overflow-y-auto p-6 space-y-6">
                {!isBookingMode ? (
                  <>
                    {/* Mutual Skill Barter Match Banner */}
                    {(() => {
                      const teacherMatch = calculateMatch(currentUser, selectedTeacher);
                      if (teacherMatch.isPerfectMatch) {
                        return (
                          <div className="p-4 bg-emerald-500/10 border border-emerald-500/30 rounded-2xl space-y-2 shadow-lg">
                            <div className="flex items-center justify-between">
                              <span className="font-extrabold text-emerald-300 text-xs flex items-center gap-1.5">
                                <Sparkles className="w-4 h-4 text-emerald-400 fill-emerald-400/30 animate-pulse" />
                                Perfect 2-Way Skill Barter Fit!
                              </span>
                              <span className="px-2.5 py-0.5 bg-emerald-600 text-white text-[10px] font-extrabold rounded-full uppercase tracking-wider">
                                100% Mutual Match
                              </span>
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs pt-1">
                              <div className="bg-zinc-950/80 p-2.5 rounded-xl border border-emerald-500/20">
                                <span className="text-emerald-400 block text-[10px] font-bold uppercase tracking-wider">They Teach (You Want)</span>
                                <span className="font-bold text-white">
                                  {teacherMatch.theyTeachUserWants.map(m => m.otherSkill.name).join(', ')}
                                </span>
                              </div>
                              <div className="bg-zinc-950/80 p-2.5 rounded-xl border border-indigo-500/20">
                                <span className="text-indigo-400 block text-[10px] font-bold uppercase tracking-wider">You Teach (They Want)</span>
                                <span className="font-bold text-white">
                                  {teacherMatch.userTeachesTheyWant.map(m => m.userSkill.name).join(', ')}
                                </span>
                              </div>
                            </div>
                          </div>
                        );
                      } else if (teacherMatch.isPartialMatch) {
                        return (
                          <div className="p-3 bg-indigo-500/10 border border-indigo-500/20 rounded-2xl text-xs space-y-1">
                            <span className="font-bold text-indigo-300 flex items-center gap-1">
                              <RefreshCw className="w-3.5 h-3.5 text-indigo-400" />
                              Partial Skill Barter Match
                            </span>
                            {teacherMatch.theyTeachUserWants.length > 0 && (
                              <p className="text-zinc-300">
                                They teach <strong className="text-emerald-300">{teacherMatch.theyTeachUserWants.map(m => m.otherSkill.name).join(', ')}</strong> which matches your wishlist.
                              </p>
                            )}
                            {teacherMatch.userTeachesTheyWant.length > 0 && (
                              <p className="text-zinc-300">
                                They want to learn <strong className="text-indigo-300">{teacherMatch.userTeachesTheyWant.map(m => m.userSkill.name).join(', ')}</strong> which you teach.
                              </p>
                            )}
                          </div>
                        );
                      }
                      return null;
                    })()}

                    {/* Bio */}
                    <div>
                      <h4 className="text-xs font-bold text-zinc-500 tracking-wider uppercase mb-1.5">Introduction</h4>
                      <p className="text-zinc-300 text-sm leading-relaxed">{selectedTeacher.bio}</p>
                    </div>

                    {/* Education & Experience */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm bg-zinc-950/80 p-4 rounded-2xl border border-zinc-800">
                      <div>
                        <span className="text-xs text-zinc-500 font-bold uppercase tracking-wider">🎓 Education</span>
                        <p className="text-zinc-200 mt-1">{selectedTeacher.education || 'No education specified'}</p>
                      </div>
                      <div>
                        <span className="text-xs text-zinc-500 font-bold uppercase tracking-wider">💼 Experience</span>
                        <p className="text-zinc-200 mt-1">{selectedTeacher.experience || 'No experience specified'}</p>
                      </div>
                    </div>

                    {/* Portfolio / Links */}
                    {Object.keys(selectedTeacher.portfolio).length > 0 && (
                      <div>
                        <h4 className="text-xs font-bold text-zinc-500 tracking-wider uppercase mb-2">Portfolio & Socials</h4>
                        <div className="flex flex-wrap gap-2">
                          {selectedTeacher.portfolio.github && (
                            <a href={selectedTeacher.portfolio.github} target="_blank" rel="noreferrer" className="flex items-center gap-1 px-3 py-1.5 border border-zinc-800 bg-zinc-950 hover:bg-zinc-800 rounded-xl text-xs font-semibold text-zinc-300 transition">
                              GitHub <ExternalLink className="w-3.5 h-3.5 text-zinc-500" />
                            </a>
                          )}
                          {selectedTeacher.portfolio.linkedin && (
                            <a href={selectedTeacher.portfolio.linkedin} target="_blank" rel="noreferrer" className="flex items-center gap-1 px-3 py-1.5 border border-zinc-800 bg-zinc-950 hover:bg-zinc-800 rounded-xl text-xs font-semibold text-zinc-300 transition">
                              LinkedIn <ExternalLink className="w-3.5 h-3.5 text-zinc-500" />
                            </a>
                          )}
                          {selectedTeacher.portfolio.behance && (
                            <a href={selectedTeacher.portfolio.behance} target="_blank" rel="noreferrer" className="flex items-center gap-1 px-3 py-1.5 border border-zinc-800 bg-zinc-950 hover:bg-zinc-800 rounded-xl text-xs font-semibold text-zinc-300 transition">
                              Behance <ExternalLink className="w-3.5 h-3.5 text-zinc-500" />
                            </a>
                          )}
                          {selectedTeacher.portfolio.portfolioUrl && (
                            <a href={selectedTeacher.portfolio.portfolioUrl} target="_blank" rel="noreferrer" className="flex items-center gap-1 px-3 py-1.5 border border-zinc-800 bg-zinc-950 hover:bg-zinc-800 rounded-xl text-xs font-semibold text-zinc-300 transition">
                              Website <ExternalLink className="w-3.5 h-3.5 text-zinc-500" />
                            </a>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Skills Selection */}
                    <div>
                      <h4 className="text-xs font-bold text-zinc-500 tracking-wider uppercase mb-2">Select a skill to learn from {selectedTeacher.name}</h4>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {(selectedTeacher?.skillsOffered ?? []).map((sk, idx) => (
                          <div 
                            key={idx}
                            onClick={() => setSelectedSkillToLearn(sk)}
                            className={`p-3 border rounded-2xl cursor-pointer transition flex items-center justify-between ${
                              selectedSkillToLearn?.name === sk.name 
                                ? 'bg-indigo-500/10 border-indigo-500 ring-1 ring-indigo-500/30' 
                                : 'bg-zinc-950 border-zinc-800 hover:border-zinc-700'
                            }`}
                          >
                            <div className="flex-1 min-w-0 pr-2">
                              <div className="flex items-center gap-1.5 flex-wrap">
                                <p className="font-bold text-white text-sm">{sk.name}</p>
                                <VerifiedSkillBadge teacherId={selectedTeacher.id} skillName={sk.name} allReviews={allReviews} />
                              </div>
                              <p className="text-[11px] text-zinc-400 mt-0.5">{sk.category} • {sk.level} level</p>
                            </div>
                            {selectedSkillToLearn?.name === sk.name && (
                              <div className="w-5 h-5 bg-indigo-500 text-white rounded-full flex items-center justify-center shrink-0">
                                <Check className="w-3.5 h-3.5 stroke-[3]" />
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>

                    {selectedSkillToLearn && (() => {
                      const guide = getSkillGuide(selectedSkillToLearn.name, selectedSkillToLearn.category);
                      return (
                        <motion.div 
                          initial={{ opacity: 0, y: 5 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="p-4 bg-indigo-500/10 border border-indigo-500/20 rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs animate-fade-in"
                        >
                          <div className="flex items-start gap-2.5">
                            <span className="text-xl bg-indigo-500/20 text-indigo-300 w-8 h-8 rounded-xl flex items-center justify-center shrink-0">📚</span>
                            <div>
                              <p className="font-bold text-white">Learn & Study on Your Own</p>
                              <p className="text-zinc-400 mt-0.5">Explore structured syllabi, direct W3Schools tutorials, and ask our AI Skill Coach any questions!</p>
                            </div>
                          </div>
                          <div className="flex flex-col sm:flex-row gap-2 shrink-0 w-full md:w-auto">
                            {guide.w3schoolsLink && (
                              <a
                                href={guide.w3schoolsLink}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold rounded-xl shadow-lg transition flex items-center justify-center gap-1.5 whitespace-nowrap text-center text-xs decoration-transparent no-underline cursor-pointer"
                              >
                                <ExternalLink className="w-3.5 h-3.5" />
                                Learn on W3Schools 🟢
                              </a>
                            )}
                            <button
                              type="button"
                              onClick={() => handleOpenStudyHub(selectedSkillToLearn)}
                              className="px-3.5 py-2 bg-zinc-800 hover:bg-zinc-700 text-white border border-zinc-700 font-semibold rounded-xl shadow-md transition flex items-center justify-center gap-1.5 whitespace-nowrap cursor-pointer"
                            >
                              <BookOpen className="w-3.5 h-3.5" />
                              Open Study Hub
                            </button>
                          </div>
                        </motion.div>
                      );
                    })()}

                    {/* Teacher Reviews Section */}
                    <div className="space-y-3 pt-2">
                      <div className="flex items-center justify-between">
                        <h4 className="text-xs font-bold text-zinc-500 tracking-wider uppercase flex items-center gap-1.5">
                          <Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
                          Student Reviews ({allReviews.filter(r => r.teacherId === selectedTeacher.id).length})
                        </h4>
                        <span className="text-xs font-bold text-amber-300 bg-amber-500/10 border border-amber-500/20 px-2.5 py-0.5 rounded-lg flex items-center gap-1">
                          ★ {selectedTeacher.rating?.toFixed(1) || '5.0'} Rating
                        </span>
                      </div>

                      {(() => {
                        const tReviews = allReviews
                          .filter(r => r.teacherId === selectedTeacher.id)
                          .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

                        if (tReviews.length === 0) {
                          return (
                            <div className="p-4 bg-zinc-950/80 border border-zinc-800 rounded-2xl text-center">
                              <p className="text-xs text-zinc-500 italic">No individual student reviews yet. Be the first to swap skills and leave a review!</p>
                            </div>
                          );
                        }

                        return (
                          <div className="space-y-2.5 max-h-60 overflow-y-auto pr-1">
                            {tReviews.map((rev) => (
                              <div key={rev.id} className="p-3 bg-zinc-950/80 border border-zinc-800 rounded-2xl text-xs space-y-1.5">
                                <div className="flex items-center justify-between">
                                  <div className="flex items-center gap-2">
                                    <span className="font-bold text-white">{rev.learnerName}</span>
                                    {rev.skillName && (
                                      <span className="px-2 py-0.5 bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 rounded-md font-semibold text-[10px]">
                                        {rev.skillName}
                                      </span>
                                    )}
                                  </div>
                                  <div className="flex items-center gap-1">
                                    <div className="flex items-center text-amber-400">
                                      {Array.from({ length: 5 }).map((_, i) => (
                                        <Star
                                          key={i}
                                          className={`w-3 h-3 ${i < rev.rating ? 'fill-amber-400 text-amber-400' : 'text-zinc-700'}`}
                                        />
                                      ))}
                                    </div>
                                    <span className="text-[10px] text-zinc-500 ml-1">
                                      {new Date(rev.createdAt).toLocaleDateString()}
                                    </span>
                                  </div>
                                </div>
                                <p className="text-zinc-300 italic leading-relaxed">{rev.comment || 'No written comment provided.'}</p>
                              </div>
                            ))}
                          </div>
                        );
                      })()}
                    </div>

                    {/* Booking Prompt */}
                    <div className="bg-gradient-to-r from-indigo-500/10 via-purple-500/10 to-pink-500/10 border border-indigo-500/20 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      <div>
                        <h5 className="font-bold text-white text-sm">Ready to make the exchange?</h5>
                        <p className="text-zinc-400 text-xs mt-0.5">Booking costs 1 Spark credit. No money required.</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <button 
                          onClick={() => onOpenChat(selectedTeacher.id)}
                          className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-white border border-zinc-700 rounded-xl font-semibold text-xs transition flex items-center gap-1.5 cursor-pointer"
                        >
                          <MessageSquare className="w-4 h-4" />
                          Chat First
                        </button>
                        <button 
                          onClick={handleStartBooking}
                          className="px-4 py-2 bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white rounded-xl font-semibold text-xs shadow-lg shadow-indigo-500/20 transition flex items-center gap-1 cursor-pointer"
                        >
                          Book Swap <ArrowRight className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </>
                ) : (
                  <form onSubmit={submitBooking} className="space-y-5">
                    {/* Progress Success State */}
                    {bookingSuccess ? (
                      <div className="text-center py-10 space-y-3">
                        <div className="w-16 h-16 bg-emerald-500/20 text-emerald-400 rounded-full flex items-center justify-center mx-auto border border-emerald-500/30 animate-bounce">
                          <CheckCircle2 className="w-10 h-10" />
                        </div>
                        <h3 className="text-lg font-bold text-white">Exchange Requested!</h3>
                        <p className="text-zinc-400 text-sm">We reserved 1 credit. {selectedTeacher.name} will review your request.</p>
                      </div>
                    ) : (
                      <>
                        <div className="p-3 bg-zinc-950/80 border border-zinc-800 rounded-xl flex items-center justify-between text-xs">
                          <div>
                            <span className="text-zinc-500">Selected Teacher: </span>
                            <span className="font-semibold text-white">{selectedTeacher.name}</span>
                          </div>
                          <div>
                            <span className="text-zinc-500">Skill: </span>
                            <span className="font-semibold text-indigo-400">{selectedSkillToLearn?.name}</span>
                          </div>
                        </div>

                        {/* Learning Options Segment */}
                        <div className="space-y-2">
                          <label className="block text-xs font-bold text-zinc-500 uppercase tracking-wider">How do you want to learn?</label>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                            {LEARNING_OPTIONS.map((opt) => (
                              <div
                                key={opt.value}
                                onClick={() => setChosenOption(opt.value)}
                                className={`p-3 border rounded-2xl cursor-pointer transition flex items-start gap-3 ${
                                  chosenOption === opt.value
                                    ? 'bg-indigo-500/10 border-indigo-500 ring-1 ring-indigo-500/30'
                                    : 'bg-zinc-950 border-zinc-800 hover:border-zinc-700'
                                }`}
                              >
                                <span className="text-2xl mt-0.5">{opt.icon}</span>
                                <div className="space-y-0.5">
                                  <p className="font-bold text-white text-xs">{opt.value}</p>
                                  <p className="text-[10px] text-zinc-400 leading-normal">{opt.desc}</p>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>

                        {/* Calendar / Date / Time */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                          <div>
                            <label className="block text-xs font-bold text-zinc-500 uppercase tracking-wider mb-1.5">Select Date & Time</label>
                            <div className="grid grid-cols-2 gap-2">
                              <input 
                                type="date" 
                                required
                                value={bookingDate}
                                onChange={(e) => setBookingDate(e.target.value)}
                                className="w-full bg-zinc-950 border border-zinc-800 text-white rounded-xl p-2.5 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500"
                              />
                              <input 
                                type="time" 
                                required
                                value={bookingTime}
                                onChange={(e) => setBookingTime(e.target.value)}
                                className="w-full bg-zinc-950 border border-zinc-800 text-white rounded-xl p-2.5 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500"
                              />
                            </div>
                          </div>
                          <div>
                            <label className="block text-xs font-bold text-zinc-500 uppercase tracking-wider mb-1.5">Time Slot Availability</label>
                            <div className="grid grid-cols-3 gap-1.5">
                              {(['Morning', 'Afternoon', 'Evening'] as const).map(slot => (
                                <button
                                  key={slot}
                                  type="button"
                                  onClick={() => setBookingSlot(slot)}
                                  className={`py-2.5 border rounded-xl text-xs font-semibold transition cursor-pointer ${
                                    bookingSlot === slot
                                      ? 'bg-indigo-600 border-indigo-500 text-white shadow-md'
                                      : selectedTeacher.availability.includes(slot)
                                        ? 'bg-zinc-950 border-zinc-800 text-zinc-300 hover:bg-zinc-800'
                                        : 'bg-zinc-950/40 border-zinc-900 text-zinc-600 cursor-not-allowed line-through'
                                  }`}
                                  disabled={!selectedTeacher.availability.includes(slot)}
                                >
                                  {slot}
                                </button>
                              ))}
                            </div>
                            <span className="text-[10px] text-zinc-500 mt-1 block">Crossed slots are not available for {selectedTeacher.name}.</span>
                          </div>
                        </div>

                        {/* Booking notes */}
                        <div>
                          <label className="block text-xs font-bold text-zinc-500 uppercase tracking-wider mb-1.5">What do you want to focus on? (Optional)</label>
                          <textarea 
                            rows={3}
                            placeholder="Introduce your level and what goals you hope to focus on during this swap..."
                            value={bookingNotes}
                            onChange={(e) => setBookingNotes(e.target.value)}
                            className="w-full bg-zinc-950 border border-zinc-800 text-white rounded-xl p-3 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500 placeholder:text-zinc-600"
                          />
                        </div>

                        {/* Submit Button */}
                        <div className="flex items-center justify-end gap-2 pt-2">
                          <button 
                            type="button"
                            onClick={() => setIsBookingMode(false)}
                            className="px-4 py-2 border border-zinc-800 bg-zinc-950 hover:bg-zinc-800 rounded-xl font-semibold text-xs text-zinc-300 transition cursor-pointer"
                          >
                            Back to Profile
                          </button>
                          <button 
                            type="submit"
                            disabled={currentUser.credits < 1}
                            className={`px-5 py-2 rounded-xl font-semibold text-xs shadow-md transition flex items-center gap-1.5 cursor-pointer ${
                              currentUser.credits >= 1 
                                ? 'bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white shadow-indigo-500/20' 
                                : 'bg-zinc-800 text-zinc-500 cursor-not-allowed'
                            }`}
                          >
                            <Calendar className="w-4 h-4" />
                            Request Session
                          </button>
                        </div>
                      </>
                    )}
                  </form>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Interactive Study Hub Overlay */}
      <AnimatePresence>
        {activeStudySkill && (() => {
          const guide = getSkillGuide(activeStudySkill.name, activeStudySkill.category);
          return (
            <div className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 z-55 overflow-y-auto">
              <motion.div 
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.95, opacity: 0 }}
                className="bg-zinc-900 rounded-[28px] w-full max-w-3xl border border-zinc-800 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
              >
                {/* Header */}
                <div className="p-6 border-b border-zinc-800 bg-zinc-950/80 flex items-start justify-between shrink-0">
                  <div className="space-y-1">
                    <button 
                      onClick={() => setActiveStudySkill(null)}
                      className="text-indigo-400 hover:text-indigo-300 text-xs font-semibold flex items-center gap-1 mb-2 group transition bg-transparent border-0 cursor-pointer"
                    >
                      <ArrowLeft className="w-3.5 h-3.5 transition group-hover:-translate-x-0.5" /> Back to Profile
                    </button>
                    <div className="flex items-center gap-2">
                      <h2 className="text-xl font-bold text-white">Study Hub: {activeStudySkill.name}</h2>
                      <span className="px-2 py-0.5 bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 rounded text-[10px] font-semibold">{activeStudySkill.level}</span>
                    </div>
                    <p className="text-zinc-400 text-xs mt-0.5">Category: <span className="font-semibold text-zinc-200">{activeStudySkill.category}</span> • Self-Paced Interactive Syllabus</p>
                  </div>
                  <button 
                    onClick={() => setActiveStudySkill(null)}
                    className="p-1 rounded-full hover:bg-zinc-800 text-zinc-400 hover:text-white transition mt-6 cursor-pointer"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                {/* Tabs selection */}
                <div className="flex border-b border-zinc-800 px-6 bg-zinc-950 shrink-0 overflow-x-auto">
                  <button
                    onClick={() => setStudyActiveTab('roadmap')}
                    className={`py-3.5 px-4 text-xs font-semibold border-b-2 transition whitespace-nowrap flex items-center gap-1.5 cursor-pointer ${
                      studyActiveTab === 'roadmap' 
                        ? 'border-indigo-500 text-indigo-400' 
                        : 'border-transparent text-zinc-400 hover:text-zinc-200'
                    }`}
                  >
                    <CheckSquare className="w-4 h-4" />
                    1. Study Roadmap & Tasks
                  </button>
                  <button
                    onClick={() => setStudyActiveTab('resources')}
                    className={`py-3.5 px-4 text-xs font-semibold border-b-2 transition whitespace-nowrap flex items-center gap-1.5 cursor-pointer ${
                      studyActiveTab === 'resources' 
                        ? 'border-indigo-500 text-indigo-400' 
                        : 'border-transparent text-zinc-400 hover:text-zinc-200'
                    }`}
                  >
                    <BookOpen className="w-4 h-4" />
                    2. Browse Tutorials ({guide.w3schoolsLink ? 'W3Schools' : 'External'})
                  </button>
                  <button
                    onClick={() => setStudyActiveTab('coach')}
                    className={`py-3.5 px-4 text-xs font-semibold border-b-2 transition whitespace-nowrap flex items-center gap-1.5 cursor-pointer ${
                      studyActiveTab === 'coach' 
                        ? 'border-indigo-500 text-indigo-400' 
                        : 'border-transparent text-zinc-400 hover:text-zinc-200'
                    }`}
                  >
                    <Sparkles className="w-4 h-4 text-indigo-400" />
                    3. AI Virtual Skill Coach
                  </button>
                </div>

                {/* Body Content */}
                <div className="flex-1 overflow-y-auto p-6 space-y-6">
                  {studyActiveTab === 'roadmap' && (
                    <div className="space-y-6">
                      {/* Overview */}
                      <div className="bg-zinc-950/80 p-4 rounded-2xl border border-zinc-800">
                        <h3 className="font-bold text-white text-sm flex items-center gap-1.5">
                          <span>💡</span> Skill Overview
                        </h3>
                        <p className="text-zinc-300 text-xs mt-1.5 leading-relaxed">{guide.description}</p>
                      </div>

                      {/* Staggered Roadmap Phases */}
                      <div className="space-y-4">
                        <h4 className="text-xs font-bold text-zinc-500 tracking-wider uppercase">Syllabus Roadmaps & Practice Tasks</h4>
                        {guide.syllabus.map((phase, pIdx) => (
                          <div key={pIdx} className="border border-zinc-800 rounded-2xl overflow-hidden bg-zinc-950/90 shadow-lg">
                            <div className="bg-zinc-900 px-4 py-2.5 border-b border-zinc-800 flex justify-between items-center text-xs">
                              <span className="font-bold text-indigo-400 uppercase tracking-wide">{phase.phase}</span>
                              <span className="font-semibold text-white">{phase.title}</span>
                            </div>
                            <div className="p-4 space-y-3">
                              {phase.tasks.map((task, tIdx) => {
                                const taskKey = `${activeStudySkill.name}-${phase.phase}-${tIdx}`;
                                const isDone = !!completedTasks[taskKey];
                                return (
                                  <label 
                                    key={tIdx} 
                                    className={`flex items-start gap-3 p-2.5 rounded-xl cursor-pointer transition text-xs border ${
                                      isDone 
                                        ? 'bg-indigo-500/10 border-indigo-500/20 text-zinc-400' 
                                        : 'bg-zinc-900/60 border-zinc-800 hover:bg-zinc-900 text-zinc-200'
                                    }`}
                                  >
                                    <input 
                                      type="checkbox" 
                                      checked={isDone}
                                      onChange={() => toggleTask(taskKey)}
                                      className="mt-0.5 rounded border-zinc-700 bg-zinc-950 text-indigo-500 focus:ring-indigo-500 w-4 h-4"
                                    />
                                    <span className={isDone ? 'line-through text-zinc-500' : ''}>{task}</span>
                                  </label>
                                );
                              })}
                            </div>
                          </div>
                        ))}
                      </div>

                      {/* Practice Project Card */}
                      <div className="bg-gradient-to-br from-indigo-500/10 via-purple-500/10 to-amber-500/10 p-5 rounded-2xl border border-indigo-500/20">
                        <div className="flex items-center gap-2">
                          <span className="text-xl">🛠️</span>
                          <h4 className="font-bold text-white text-sm">Suggested Hands-on Project: {guide.practiceProject.title}</h4>
                        </div>
                        <p className="text-zinc-300 text-xs mt-1 leading-normal">{guide.practiceProject.description}</p>
                        <div className="mt-4 space-y-2">
                          <p className="text-[10px] font-bold text-indigo-300 uppercase tracking-wider">Suggested Build Steps:</p>
                          <ol className="list-decimal pl-4 text-xs text-zinc-300 space-y-1">
                            {guide.practiceProject.steps.map((step, idx) => (
                              <li key={idx}>{step}</li>
                            ))}
                          </ol>
                        </div>
                      </div>
                    </div>
                  )}

                  {studyActiveTab === 'resources' && (
                    <div className="space-y-6">
                      {/* Direct W3Schools banner */}
                      {guide.w3schoolsLink && (
                        <div className="p-5 bg-emerald-500/10 border border-emerald-500/30 rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-4">
                          <div className="space-y-1">
                            <span className="px-2.5 py-0.5 bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 rounded-full text-[10px] font-bold uppercase tracking-wider">Recommended Practice Playground</span>
                            <h3 className="font-bold text-white text-base mt-1.5 flex items-center gap-1">
                              Learn {activeStudySkill.name} on W3Schools 🟢
                            </h3>
                            <p className="text-zinc-300 text-xs leading-relaxed">
                              Learn and execute code snippets or practice exercises in their interactive sandbox, with comprehensive testing, examples, and certifications.
                            </p>
                          </div>
                          <a 
                            href={guide.w3schoolsLink} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs rounded-xl shadow-lg transition flex items-center justify-center gap-1 shrink-0 cursor-pointer decoration-transparent no-underline"
                          >
                            Launch W3Schools <ExternalLink className="w-3.5 h-3.5" />
                          </a>
                        </div>
                      )}

                      {/* Other Curated Resources */}
                      <div className="space-y-3">
                        <h4 className="text-xs font-bold text-zinc-500 tracking-wider uppercase">More Curated Study Materials</h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {guide.otherLinks.map((link, idx) => (
                            <div key={idx} className="bg-zinc-950 border border-zinc-800 rounded-2xl p-4 flex flex-col justify-between hover:border-zinc-700 transition shadow-md">
                              <div>
                                <div className="flex items-center justify-between gap-2">
                                  <span className="text-[10px] font-bold text-indigo-400 uppercase tracking-wider">{link.siteName}</span>
                                </div>
                                <h5 className="font-bold text-white text-xs mt-1">{link.name}</h5>
                                <p className="text-zinc-400 text-[11px] mt-1.5 leading-normal">{link.description}</p>
                              </div>
                              <div className="mt-4 pt-3 border-t border-zinc-800 flex justify-end">
                                <a 
                                  href={link.url} 
                                  target="_blank" 
                                  rel="noopener noreferrer"
                                  className="text-xs font-semibold text-indigo-400 hover:text-indigo-300 flex items-center gap-1 transition group cursor-pointer"
                                >
                                  Go to Tutorial <ExternalLink className="w-3.5 h-3.5 transition group-hover:translate-x-0.5" />
                                </a>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}

                  {studyActiveTab === 'coach' && (
                    <div className="flex flex-col h-[45vh] border border-zinc-800 rounded-2xl overflow-hidden bg-zinc-950 shadow-inner">
                      {/* Message History list */}
                      <div className="flex-1 overflow-y-auto p-4 space-y-4">
                        {tutorMessages.map((msg, idx) => (
                          <div 
                            key={idx}
                            className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                          >
                            <div 
                              className={`max-w-[85%] p-3.5 rounded-2xl text-xs space-y-2 leading-relaxed shadow-md ${
                                msg.role === 'user'
                                  ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-br-none'
                                  : 'bg-zinc-900 text-zinc-200 border border-zinc-800 rounded-bl-none'
                              }`}
                            >
                              {msg.role === 'model' && (
                                <div className="flex items-center gap-1 text-[10px] font-bold text-indigo-400 tracking-wider uppercase mb-1">
                                  <Sparkles className="w-3 h-3" />
                                  AI Tutor Coach
                                </div>
                              )}
                              <div>
                                {renderFormattedText(msg.text)}
                              </div>
                            </div>
                          </div>
                        ))}

                        {/* Typing Animation Loader */}
                        {isTutorLoading && (
                          <div className="flex justify-start">
                            <div className="bg-zinc-900 border border-zinc-800 p-4 rounded-2xl rounded-bl-none shadow-md flex items-center gap-1.5 text-zinc-400">
                              <span className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-bounce"></span>
                              <span className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-bounce [animation-delay:0.2s]"></span>
                              <span className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-bounce [animation-delay:0.4s]"></span>
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Chat Input form */}
                      <form onSubmit={handleSendTutorMessage} className="p-3 bg-zinc-900 border-t border-zinc-800 flex gap-2 shrink-0">
                        <input 
                          type="text"
                          value={tutorInput}
                          onChange={(e) => setTutorInput(e.target.value)}
                          placeholder={`Ask anything about ${activeStudySkill.name}...`}
                          disabled={isTutorLoading}
                          className="flex-1 bg-zinc-950 border border-zinc-800 text-white rounded-xl px-3.5 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500 placeholder:text-zinc-600 disabled:opacity-50"
                        />
                        <button 
                          type="submit"
                          disabled={!tutorInput.trim() || isTutorLoading}
                          className="p-2 bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 disabled:opacity-40 text-white rounded-xl shadow-md transition shrink-0 flex items-center justify-center w-9 h-9 border-0 cursor-pointer"
                        >
                          <Send className="w-4 h-4" />
                        </button>
                      </form>
                    </div>
                  )}
                </div>
              </motion.div>
            </div>
          );
        })()}
      </AnimatePresence>
    </div>
  );
}

import React, { useState, useEffect, useMemo, useRef } from 'react';
import { motion, AnimatePresence, useScroll, useTransform, useReducedMotion } from 'motion/react';
import { 
  Search, SlidersHorizontal, Star, Award, GraduationCap, 
  MapPin, Clock, Languages, Globe, Calendar, Check, MessageSquare,
  ArrowRight, ExternalLink, X, Compass, CheckCircle2, ChevronRight,
  BookOpen, Sparkles, Send, CheckSquare, ArrowLeft, RefreshCw, AlertTriangle,
  ChevronLeft, Flame, Filter
} from 'lucide-react';
import { UserProfile, Skill, LearningOption, Review } from '../types';
import { getSkillGuide } from '../data/skillGuides';
import { getAISkillTutorReply } from '../lib/gemini';
import { calculateMatch } from '../lib/matchUtils';
import { VerifiedSkillBadge } from './VerifiedSkillBadge';
import { EmptyState, CardSkeletonGrid } from './ui';
import { Spotlight } from './motion/Spotlight';
import { MagneticButton } from './motion/MagneticButton';
import { RevealText } from './motion/RevealText';
import { FadeUp } from './motion/FadeUp';
import { ProfileDetailModal } from './ProfileDetailModal';

interface ExploreViewProps {
  currentUser: UserProfile;
  users: UserProfile[];
  onBookSession: (
    teacher: UserProfile, 
    skill: Skill, 
    option: LearningOption, 
    date: string, 
    slot: 'Morning' | 'Afternoon' | 'Evening', 
    notes: string, 
    scheduledTime?: string, 
    swapRole?: 'learn' | 'teach'
  ) => void;
  onOpenChat: (userId: string) => void;
  isLoading: boolean;
  allReviews?: Review[];
}

const CATEGORIES = [
  'All', 'Programming', 'Graphic Design', 'Video Editing', 'Digital Marketing',
  'Photography', 'Music', 'Fitness', 'Cooking', 'Language Learning',
  'Public Speaking', 'Business'
];

const SUGGESTED_SEARCHES = [
  'React', 'Python', 'UI/UX Design', 'Music Theory', 'Video Editing', 'Spanish'
];

const LEARNING_OPTIONS: { value: LearningOption; icon: string; desc: string }[] = [
  { value: 'Live 1-on-1 Session', icon: '📹', desc: 'Real-time interactive session via voice or video' },
  { value: 'Group Session', icon: '👥', desc: 'Join a group with other learners sharing the skill' },
  { value: 'Chat Guidance', icon: '💬', desc: 'Text guidance, asynchronous Q&A, and quick feedback' },
  { value: 'Notes & Resources', icon: '📄', desc: 'Handouts, code snippets, templates, or reading list' },
  { value: 'Recorded Video', icon: '🎥', desc: 'Pre-recorded video explaining the key concepts' },
  { value: 'Project-Based Learning', icon: '🛠', desc: 'Build a practical, real-world project together' }
];

const ExploreView = React.memo(function ExploreView({ 
  currentUser, 
  users, 
  onBookSession, 
  onOpenChat, 
  isLoading, 
  allReviews = [] 
}: ExploreViewProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [selectedLevel, setSelectedLevel] = useState<string>('All');
  const [selectedLanguage, setSelectedLanguage] = useState<string>('All');
  const [selectedAvailability, setSelectedAvailability] = useState<string>('All');
  const [selectedTimeZone, setSelectedTimeZone] = useState<string>('All');
  const [showFilters, setShowFilters] = useState(false);
  const [matchFilter, setMatchFilter] = useState<'all' | 'perfect' | 'partial'>('all');
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  
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
  const [swapRole, setSwapRole] = useState<'learn' | 'teach'>('learn');

  // Discovery Carousel reference
  const carouselRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

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
        text: `⚠️ I had a temporary issue connecting to the AI server. Please make sure your development environment has internet access and try again!\n\nIn the meantime, you can continue browsing the **Syllabus Roadmap** and **Official Resources** on the other tabs!` 
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
          <pre key={index} className="bg-black/80 text-lavender-200 rounded-lg p-3 font-mono text-[11px] overflow-x-auto my-2 border border-white/10">
            <code>{codeLines}</code>
          </pre>
        );
      }

      const lines = part.split('\n');
      return (
        <div key={index} className="space-y-1.5">
          {lines.map((line, lIdx) => {
            const trimmed = line.trim();
            if (trimmed.startsWith('# ')) {
              return <h3 key={lIdx} className="font-bold text-sm text-white mt-2 mb-1">{trimmed.replace('# ', '')}</h3>;
            }
            if (trimmed.startsWith('## ')) {
              return <h4 key={lIdx} className="font-bold text-xs text-lavender-200 mt-2 mb-1">{trimmed.replace('## ', '')}</h4>;
            }
            if (trimmed.startsWith('* ') || trimmed.startsWith('- ')) {
              return (
                <div key={lIdx} className="flex items-start gap-1.5 pl-2 text-xs">
                  <span className="text-violet-400 font-bold">•</span>
                  <span>{trimmed.replace(/^[*|-]\s+/, '')}</span>
                </div>
              );
            }
            if (!trimmed) return <div key={lIdx} className="h-1" />;
            return <p key={lIdx} className="text-xs leading-relaxed">{line}</p>;
          })}
        </div>
      );
    });
  };

  // Exclude current user from explore list
  const otherUsers = useMemo(() => {
    return users.filter(u => u.id !== currentUser.id);
  }, [users, currentUser.id]);

  // Compute matches for all other users
  const userMatches = useMemo(() => {
    return otherUsers.map(u => calculateMatch(currentUser, u));
  }, [otherUsers, currentUser]);

  const matchMap = useMemo(() => {
    const map = new Map<string, ReturnType<typeof calculateMatch>>();
    userMatches.forEach(m => {
      if (m?.user?.id) {
        map.set(m.user.id, m);
      }
    });
    return map;
  }, [userMatches]);

  const perfectMatches = useMemo(() => {
    return userMatches.filter(m => m.isPerfectMatch);
  }, [userMatches]);

  const partialMatches = useMemo(() => {
    return userMatches.filter(m => m.isPartialMatch);
  }, [userMatches]);

  // Featured discovery users: perfect matches first, then high rated
  const featuredDiscoveryUsers = useMemo(() => {
    const sorted = [...otherUsers].sort((a, b) => {
      const matchA = matchMap.get(a.id);
      const matchB = matchMap.get(b.id);
      if (matchA?.isPerfectMatch && !matchB?.isPerfectMatch) return -1;
      if (!matchA?.isPerfectMatch && matchB?.isPerfectMatch) return 1;
      return (b.rating || 5) - (a.rating || 5);
    });
    return sorted.slice(0, 8);
  }, [otherUsers, matchMap]);

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

  // Unique languages and time zones across all users
  const allLanguages = useMemo(() => Array.from(new Set(otherUsers.flatMap(u => (u.languages ?? []).map(l => l.split(' ')[0])))), [otherUsers]);
  const allTimeZones = useMemo(() => Array.from(new Set(otherUsers.map(u => u.timeZone))), [otherUsers]);

  const handleOpenDetails = (teacher: UserProfile) => {
    setSelectedTeacher(teacher);
    setSelectedSkillToLearn((teacher?.skillsOffered ?? [])[0] || null);
    setIsBookingMode(false);
    setBookingSuccess(false);
  };

  const handleStartBooking = () => {
    setIsBookingMode(true);
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    setBookingDate(tomorrow.toISOString().split('T')[0]);
    setBookingTime('14:00');
  };

  const submitBooking = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTeacher || !selectedSkillToLearn) return;
    if (swapRole === 'learn' && (currentUser.credits ?? 0) < 10) return;
    
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
      scheduledTimeStr,
      swapRole
    );

    setBookingSuccess(true);
    setTimeout(() => {
      setIsBookingMode(false);
      setSelectedTeacher(null);
      setBookingSuccess(false);
      setBookingNotes('');
      setSwapRole('learn');
    }, 2000);
  };

  const scrollCarousel = (direction: 'left' | 'right') => {
    if (carouselRef.current) {
      const scrollAmount = direction === 'left' ? -380 : 380;
      carouselRef.current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
    }
  };

  const activeFilterCount = (selectedLevel !== 'All' ? 1 : 0) +
    (selectedLanguage !== 'All' ? 1 : 0) +
    (selectedAvailability !== 'All' ? 1 : 0) +
    (selectedTimeZone !== 'All' ? 1 : 0);

  return (
    <div id="explore-view-root" className="space-y-10 pb-16">
      {/* 1. HERO SECTION: "Find your next skill." + prominent glowing search */}
      <section className="relative pt-2 sm:pt-6">
        {/* Subtle Ambient Violet Atmosphere */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-4xl h-56 bg-gradient-to-b from-violet-600/10 via-lavender-500/5 to-transparent blur-3xl -z-10 pointer-events-none" />

        <div className="max-w-3xl mx-auto text-center space-y-4">
          <FadeUp delay={0.05}>
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-surface-raised border border-white/10 text-xs font-semibold text-lavender-200 mb-1">
              <Sparkles className="w-3.5 h-3.5 text-violet-400" />
              <span>Peer-to-Peer Barter Discovery</span>
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
              <span className="text-[11px] text-text-sub font-normal">{otherUsers.length} active practitioners</span>
            </div>
          </FadeUp>

          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black tracking-tight text-white font-display leading-[1.08]">
            <RevealText text="Find your next skill." />
          </h1>

          <FadeUp delay={0.15}>
            <p className="text-text-sub text-sm sm:text-base max-w-xl mx-auto leading-relaxed">
              Connect with practitioners ready to trade knowledge. Learn what you need, share what you know — no fees, pure barter.
            </p>
          </FadeUp>

          {/* Visually Prominent Search Field with Focus State & Ambient Aura */}
          <FadeUp delay={0.25}>
            <div className="mt-8 relative max-w-2xl mx-auto">
              <div 
                className={`relative rounded-2xl transition-all duration-300 ${
                  isSearchFocused 
                    ? 'ring-2 ring-violet-500/50 shadow-2xl shadow-violet-500/20 bg-surface-raised border-violet-500/50' 
                    : 'bg-surface-base border border-white/10 hover:border-white/20 shadow-xl'
                }`}
              >
                <div className="flex items-center px-4 sm:px-5 py-3.5 sm:py-4">
                  <Search className={`w-5 h-5 transition-colors shrink-0 ${isSearchFocused ? 'text-violet-400' : 'text-text-muted'}`} />
                  
                  <input 
                    ref={searchInputRef}
                    type="text" 
                    placeholder="What do you want to learn? (e.g., React, Python, UI Design, Guitar)" 
                    value={searchQuery}
                    onFocus={() => setIsSearchFocused(true)}
                    onBlur={() => setIsSearchFocused(false)}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-3.5 pr-2 bg-transparent text-sm sm:text-base text-white placeholder:text-text-muted focus:outline-none"
                  />

                  {searchQuery && (
                    <button
                      type="button"
                      onClick={() => {
                        setSearchQuery('');
                        searchInputRef.current?.focus();
                      }}
                      className="p-1 rounded-lg text-text-muted hover:text-white hover:bg-white/10 transition cursor-pointer shrink-0"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>

              {/* Quick Suggestion Pills under Search Bar */}
              <div className="flex items-center justify-center flex-wrap gap-2 mt-3 text-xs text-text-muted">
                <span className="font-medium text-[11px] text-text-dim uppercase tracking-wider">Suggested:</span>
                {SUGGESTED_SEARCHES.map((item) => (
                  <button
                    key={item}
                    type="button"
                    onClick={() => setSearchQuery(item)}
                    className={`px-2.5 py-1 rounded-lg text-xs font-medium transition cursor-pointer ${
                      searchQuery.toLowerCase() === item.toLowerCase()
                        ? 'bg-violet-600/30 text-violet-300 border border-violet-500/30'
                        : 'bg-surface-raised/70 hover:bg-surface-raised text-text-sub hover:text-white border border-white/5'
                    }`}
                  >
                    {item}
                  </button>
                ))}
              </div>
            </div>
          </FadeUp>
        </div>
      </section>

      {/* 2. POPULAR CATEGORIES & MATCH FILTER BAR */}
      <section className="space-y-4">
        {/* Match Fit Mode + Filter Drawer Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-surface-base p-3 sm:p-4 rounded-2xl border border-white/5">
          {/* Match Filter Tabs */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
            <button
              onClick={() => setMatchFilter('all')}
              className={`px-3.5 py-2 rounded-xl font-semibold text-xs transition cursor-pointer flex items-center gap-2 whitespace-nowrap ${
                matchFilter === 'all'
                  ? 'bg-surface-interactive text-white shadow-md border border-white/10'
                  : 'text-text-sub hover:text-white hover:bg-surface-raised'
              }`}
            >
              <span>All Swappers</span>
              <span className="px-1.5 py-0.5 bg-black/40 text-text-sub rounded-md text-[10px] font-bold">
                {otherUsers.length}
              </span>
            </button>

            <button
              onClick={() => setMatchFilter('perfect')}
              className={`px-3.5 py-2 rounded-xl font-semibold text-xs transition cursor-pointer flex items-center gap-2 whitespace-nowrap ${
                matchFilter === 'perfect'
                  ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-lg shadow-emerald-500/20'
                  : 'text-emerald-400 hover:bg-emerald-500/10'
              }`}
            >
              <Sparkles className={`w-3.5 h-3.5 ${matchFilter === 'perfect' ? 'text-amber-300 fill-amber-300' : 'text-emerald-400'}`} />
              <span>Perfect Barters</span>
              <span className={`px-1.5 py-0.5 rounded-md text-[10px] font-bold ${
                matchFilter === 'perfect' ? 'bg-black/30 text-emerald-100' : 'bg-emerald-500/20 text-emerald-300'
              }`}>
                {perfectMatches.length}
              </span>
            </button>

            <button
              onClick={() => setMatchFilter('partial')}
              className={`px-3.5 py-2 rounded-xl font-semibold text-xs transition cursor-pointer flex items-center gap-2 whitespace-nowrap ${
                matchFilter === 'partial'
                  ? 'bg-violet-600/30 text-violet-300 border border-violet-500/30'
                  : 'text-lavender-300 hover:text-white hover:bg-violet-500/10'
              }`}
            >
              <RefreshCw className="w-3.5 h-3.5 text-violet-400" />
              <span>Partial Fits</span>
              <span className="px-1.5 py-0.5 bg-violet-500/20 text-violet-200 rounded-md text-[10px] font-bold">
                {partialMatches.length}
              </span>
            </button>
          </div>

          {/* Filter Trigger Button */}
          <button 
            onClick={() => setShowFilters(!showFilters)}
            className={`px-4 py-2 border rounded-xl text-xs flex items-center justify-center gap-2 font-semibold transition cursor-pointer shrink-0 ${
              showFilters || activeFilterCount > 0
                ? 'bg-violet-600/20 border-violet-500/40 text-violet-300' 
                : 'bg-surface-raised border-white/10 text-text-sub hover:text-white'
            }`}
          >
            <SlidersHorizontal className="w-3.5 h-3.5" />
            <span>Filters</span>
            {activeFilterCount > 0 && (
              <span className="w-4 h-4 rounded-full bg-violet-500 text-white text-[10px] font-bold flex items-center justify-center">
                {activeFilterCount}
              </span>
            )}
            <span className="text-[11px] text-text-muted">{showFilters ? 'Hide' : 'Show'}</span>
          </button>
        </div>

        {/* Categories Pills Horizontal Strip */}
        <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-thin">
          {CATEGORIES.map(category => {
            const isSelected = selectedCategory === category;

            return (
              <button
                key={category}
                onClick={() => setSelectedCategory(category)}
                className={`px-4 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer shrink-0 ${
                  isSelected 
                    ? 'bg-violet-600 text-white shadow-lg shadow-violet-500/25 border border-violet-400/30' 
                    : 'bg-surface-base text-text-sub hover:text-white hover:bg-surface-raised border border-white/5'
                }`}
              >
                {category}
              </button>
            );
          })}
        </div>

        {/* Collapsible Secondary Filters Panel */}
        <AnimatePresence>
          {showFilters && (
            <motion.div 
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
              className="overflow-hidden bg-surface-base border border-white/10 rounded-2xl p-4 sm:p-5 grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs"
            >
              <div>
                <label className="block text-text-sub font-semibold mb-1.5">Skill Level</label>
                <select 
                  value={selectedLevel} 
                  onChange={(e) => setSelectedLevel(e.target.value)}
                  className="w-full bg-surface-raised border border-white/10 text-white rounded-xl p-2.5 focus:outline-none focus:ring-1 focus:ring-violet-500 cursor-pointer"
                >
                  <option value="All">All Levels</option>
                  <option value="Beginner">Beginner</option>
                  <option value="Intermediate">Intermediate</option>
                  <option value="Expert">Expert</option>
                </select>
              </div>

              <div>
                <label className="block text-text-sub font-semibold mb-1.5">Language</label>
                <select 
                  value={selectedLanguage} 
                  onChange={(e) => setSelectedLanguage(e.target.value)}
                  className="w-full bg-surface-raised border border-white/10 text-white rounded-xl p-2.5 focus:outline-none focus:ring-1 focus:ring-violet-500 cursor-pointer"
                >
                  <option value="All">All Languages</option>
                  {allLanguages.map(lang => (
                    <option key={lang} value={lang}>{lang}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-text-sub font-semibold mb-1.5">Availability</label>
                <select 
                  value={selectedAvailability} 
                  onChange={(e) => setSelectedAvailability(e.target.value)}
                  className="w-full bg-surface-raised border border-white/10 text-white rounded-xl p-2.5 focus:outline-none focus:ring-1 focus:ring-violet-500 cursor-pointer"
                >
                  <option value="All">Any Time</option>
                  <option value="Morning">Morning</option>
                  <option value="Afternoon">Afternoon</option>
                  <option value="Evening">Evening</option>
                </select>
              </div>

              <div>
                <label className="block text-text-sub font-semibold mb-1.5">Time Zone</label>
                <select 
                  value={selectedTimeZone} 
                  onChange={(e) => setSelectedTimeZone(e.target.value)}
                  className="w-full bg-surface-raised border border-white/10 text-white rounded-xl p-2.5 focus:outline-none focus:ring-1 focus:ring-violet-500 cursor-pointer"
                >
                  <option value="All">Any Time Zone</option>
                  {allTimeZones.map(tz => (
                    <option key={tz} value={tz}>{tz}</option>
                  ))}
                </select>
              </div>

              {activeFilterCount > 0 && (
                <div className="col-span-2 sm:col-span-4 flex justify-end pt-2 border-t border-white/5">
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedLevel('All');
                      setSelectedLanguage('All');
                      setSelectedAvailability('All');
                      setSelectedTimeZone('All');
                    }}
                    className="text-xs text-violet-400 hover:text-violet-300 font-semibold cursor-pointer underline"
                  >
                    Reset all filters
                  </button>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </section>

      {/* 3. HORIZONTAL DISCOVERY AREA: Featured Mentors & High-Affinity Barters */}
      {!isLoading && featuredDiscoveryUsers.length > 0 && searchQuery === '' && selectedCategory === 'All' && matchFilter === 'all' && (
        <section className="space-y-4 pt-2">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2">
                <Flame className="w-4 h-4 text-violet-400" />
                <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-white font-display">
                  Featured Practitioners
                </h2>
              </div>
              <p className="text-xs text-text-sub mt-0.5">Top-rated peers and high-affinity skill barter matches</p>
            </div>

            {/* Carousel Arrow Controls */}
            <div className="flex items-center gap-1.5">
              <button
                onClick={() => scrollCarousel('left')}
                className="w-8 h-8 rounded-xl bg-surface-base border border-white/10 hover:border-white/20 text-text-sub hover:text-white flex items-center justify-center transition cursor-pointer"
                aria-label="Previous featured mentors"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                onClick={() => scrollCarousel('right')}
                className="w-8 h-8 rounded-xl bg-surface-base border border-white/10 hover:border-white/20 text-text-sub hover:text-white flex items-center justify-center transition cursor-pointer"
                aria-label="Next featured mentors"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Horizontal Discovery Carousel */}
          <div 
            ref={carouselRef}
            className="flex items-stretch gap-4 overflow-x-auto pb-4 pt-1 snap-x snap-mandatory scrollbar-none -mx-2.5 px-2.5 sm:mx-0 sm:px-0"
          >
            {featuredDiscoveryUsers.map((user) => {
              const match = matchMap.get(user.id);
              const isPerfect = match?.isPerfectMatch;

              return (
                <div
                  key={`featured-${user.id}`}
                  className="w-[280px] sm:w-[320px] shrink-0 snap-start"
                >
                  <Spotlight
                    spotlightColor="rgba(139, 92, 246, 0.18)"
                    className={`h-full bg-surface-base rounded-2xl border transition-all duration-300 flex flex-col justify-between overflow-hidden cursor-pointer group ${
                      isPerfect
                        ? 'border-emerald-500/40 shadow-xl shadow-emerald-500/5'
                        : 'border-white/10 hover:border-violet-500/40'
                    }`}
                    onClick={() => handleOpenDetails(user)}
                  >
                    {/* Top Image Banner & Avatar */}
                    <div className="relative h-28 bg-gradient-to-tr from-surface-raised to-charcoal-800 overflow-hidden">
                      {isPerfect && (
                        <div className="absolute top-2.5 left-2.5 z-10 bg-emerald-500/90 backdrop-blur-md text-white px-2.5 py-0.5 rounded-full text-[10px] font-extrabold flex items-center gap-1 shadow-md">
                          <Sparkles className="w-3 h-3 text-amber-300 fill-amber-300" />
                          <span>100% Match</span>
                        </div>
                      )}
                      
                      <div className="absolute top-2.5 right-2.5 z-10 bg-black/60 backdrop-blur-md px-2 py-0.5 rounded-md text-[10px] font-semibold text-amber-400 flex items-center gap-1 border border-white/10">
                        <Star className="w-3 h-3 fill-amber-400" />
                        <span>{(user.rating ?? 5.0).toFixed(1)}</span>
                      </div>

                      <div className="absolute -bottom-5 left-4">
                        <img
                          src={user.avatar}
                          alt={user.name}
                          loading="lazy"
                          decoding="async"
                          referrerPolicy="no-referrer"
                          className="w-14 h-14 rounded-2xl object-cover border-2 border-surface-base shadow-xl bg-surface-raised"
                        />
                      </div>
                    </div>

                    {/* Card Content */}
                    <div className="p-4 pt-6 space-y-3 flex-1 flex flex-col justify-between">
                      <div>
                        <div className="flex items-center justify-between gap-1">
                          <h3 className="font-bold text-white text-base group-hover:text-violet-300 transition truncate">
                            {user.name}
                          </h3>
                          <span className="px-2 py-0.5 bg-surface-raised text-text-sub rounded-md text-[10px] font-medium shrink-0 border border-white/5">
                            {user.skillLevel}
                          </span>
                        </div>

                        <p className="text-text-sub text-xs line-clamp-2 mt-1.5 leading-relaxed">
                          {user.bio || 'Active practitioner available for skill barter.'}
                        </p>
                      </div>

                      {/* Top Skill Offered */}
                      <div className="pt-2 border-t border-white/5 space-y-1.5">
                        <span className="text-[10px] font-bold text-text-muted uppercase tracking-wider">Top Offering</span>
                        <div className="flex flex-wrap gap-1.5">
                          {(user.skillsOffered ?? []).slice(0, 2).map((sk, idx) => (
                            <span 
                              key={idx} 
                              className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-violet-500/10 border border-violet-500/20 text-lavender-300 text-[11px] font-medium"
                            >
                              <Award className="w-3 h-3 text-violet-400 shrink-0" />
                              <span className="truncate max-w-[120px]">{sk.name}</span>
                            </span>
                          ))}
                        </div>
                      </div>

                      {/* Action trigger */}
                      <div className="pt-2 flex items-center justify-between text-xs">
                        <span className="text-[11px] text-text-muted">
                          {user.successfulExchanges} exchanges
                        </span>
                        <span className="font-semibold text-violet-400 flex items-center gap-1 group-hover:translate-x-0.5 transition">
                          View profile <ChevronRight className="w-3.5 h-3.5" />
                        </span>
                      </div>
                    </div>
                  </Spotlight>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* 4. MAIN PROFILE RESULTS GRID: Editorial Cards */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-white font-display">
              {searchQuery ? `Results for "${searchQuery}"` : selectedCategory !== 'All' ? `${selectedCategory} Practitioners` : 'All Practitioners'}
            </h2>
            <p className="text-xs text-text-sub mt-0.5">
              Showing {filteredUsers.length} peer{filteredUsers.length === 1 ? '' : 's'} ready to barter skills
            </p>
          </div>
        </div>

        {/* Grid or Empty / Loading State */}
        {isLoading ? (
          <CardSkeletonGrid count={6} />
        ) : filteredUsers.length === 0 ? (
          <EmptyState
            preset="partners"
            title="No Matching Skill Swappers Found"
            description="Try broadening your search query, clearing category filters, or exploring popular skills like React, Python, or UI Design."
            actionText="Reset Search & Filters"
            onAction={() => {
              setSearchQuery('');
              setSelectedCategory('All');
              setSelectedLevel('All');
              setSelectedLanguage('All');
              setSelectedAvailability('All');
              setSelectedTimeZone('All');
              setMatchFilter('all');
            }}
          />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {filteredUsers.map((user) => {
              const matchInfo = matchMap.get(user.id);
              const isPerfect = matchInfo?.isPerfectMatch;
              const isPartial = matchInfo?.isPartialMatch;

              return (
                <Spotlight
                  key={user.id}
                  spotlightColor={isPerfect ? "rgba(16, 185, 129, 0.12)" : "rgba(139, 92, 246, 0.12)"}
                  className={`bg-surface-base rounded-2xl border transition-all duration-300 flex flex-col justify-between overflow-hidden cursor-pointer group ${
                    isPerfect 
                      ? 'border-emerald-500/40 shadow-xl shadow-emerald-500/5 ring-1 ring-emerald-500/20' 
                      : isPartial
                      ? 'border-violet-500/30 hover:border-violet-500/50 shadow-xl'
                      : 'border-white/10 hover:border-white/20 shadow-lg'
                  }`}
                  onClick={() => handleOpenDetails(user)}
                >
                  {/* Perfect Match Top Banner */}
                  {isPerfect && (
                    <div className="bg-gradient-to-r from-emerald-600 via-teal-600 to-violet-700 text-white px-4 py-2 flex items-center justify-between text-xs font-bold">
                      <span className="flex items-center gap-1.5">
                        <Sparkles className="w-3.5 h-3.5 text-amber-300 fill-amber-300" />
                        Perfect 2-Way Skill Fit
                      </span>
                      <span className="bg-black/30 px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wide">
                        100% Mutual
                      </span>
                    </div>
                  )}

                  {/* Header info */}
                  <div className="p-5 flex items-start gap-4">
                    <img 
                      src={user.avatar} 
                      alt={user.name} 
                      loading="lazy"
                      decoding="async"
                      referrerPolicy="no-referrer"
                      className={`w-14 h-14 rounded-2xl object-cover border-2 flex-shrink-0 bg-surface-raised ${
                        isPerfect ? 'border-emerald-400' : 'border-white/10'
                      }`}
                    />
                    <div className="space-y-1 min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-1.5">
                        <h3 className="font-bold text-white truncate text-base group-hover:text-violet-300 transition">
                          {user.name}
                        </h3>
                        <span className="px-2 py-0.5 bg-surface-raised text-text-sub rounded-md text-[10px] font-medium shrink-0 border border-white/5">
                          {user.skillLevel ?? 'Beginner'}
                        </span>
                      </div>
                      
                      {/* Rating */}
                      <div className="flex items-center gap-1 text-xs text-amber-400 font-semibold">
                        <Star className="w-3.5 h-3.5 fill-current" />
                        <span>{(user.rating ?? 5.0).toFixed(1)}</span>
                        <span className="text-text-muted font-normal">({user.reviewsCount ?? 0} reviews)</span>
                      </div>

                      {/* Timezone / Availability */}
                      <div className="flex items-center gap-1 text-[11px] text-text-sub truncate">
                        <Globe className="w-3 h-3 text-text-muted shrink-0" />
                        <span className="truncate">{user.timeZone}</span>
                        <span className="text-text-dim">•</span>
                        <Clock className="w-3 h-3 text-text-muted shrink-0" />
                        <span className="truncate">{(user.availability ?? []).join(', ')}</span>
                      </div>
                    </div>
                  </div>

                  {/* Perfect Mutual Match Highlight Box */}
                  {isPerfect && matchInfo && (
                    <div className="mx-5 mb-3 p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl space-y-2 text-xs">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px]">
                        <div className="bg-black/50 p-2 rounded-lg border border-emerald-500/20">
                          <span className="text-emerald-400 block text-[10px] font-extrabold uppercase tracking-wider">They Teach (You Want)</span>
                          <span className="font-bold text-white truncate block">
                            {matchInfo.theyTeachUserWants.map(m => m.otherSkill.name).join(', ')}
                          </span>
                        </div>
                        <div className="bg-black/50 p-2 rounded-lg border border-violet-500/20">
                          <span className="text-violet-400 block text-[10px] font-extrabold uppercase tracking-wider">You Teach (They Want)</span>
                          <span className="font-bold text-white truncate block">
                            {matchInfo.userTeachesTheyWant.map(m => m.userSkill.name).join(', ')}
                          </span>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Partial Match Box */}
                  {isPartial && matchInfo && !isPerfect && (
                    <div className="mx-5 mb-3 p-2.5 bg-violet-500/10 border border-violet-500/20 rounded-xl text-[11px] space-y-1">
                      <span className="font-bold text-lavender-300 flex items-center gap-1">
                        <RefreshCw className="w-3 h-3 text-violet-400" />
                        Partial Barter Match
                      </span>
                      {matchInfo.theyTeachUserWants.length > 0 && (
                        <p className="text-text-sub">
                          They teach <strong className="text-emerald-300">{matchInfo.theyTeachUserWants.map(m => m.otherSkill.name).join(', ')}</strong> (on your wishlist)
                        </p>
                      )}
                    </div>
                  )}

                  {/* Teaching & Learning skills */}
                  <div className="px-5 pb-4 flex-1 space-y-3">
                    <div>
                      <span className="text-[10px] font-bold text-text-dim tracking-wider uppercase">Teaches</span>
                      <div className="flex flex-wrap gap-1.5 mt-1.5">
                        {(user.skillsOffered ?? []).slice(0, 3).map((sk, idx) => (
                          <span key={idx} className="inline-flex items-center gap-1 px-2.5 py-1 bg-violet-500/10 border border-violet-500/20 text-lavender-300 rounded-lg text-xs font-medium">
                            <Award className="w-3 h-3 text-violet-400 shrink-0" />
                            <span>{sk.name}</span>
                            <VerifiedSkillBadge teacherId={user.id} skillName={sk.name} allReviews={allReviews} />
                          </span>
                        ))}
                      </div>
                    </div>

                    <div>
                      <span className="text-[10px] font-bold text-text-dim tracking-wider uppercase">Wants to Learn</span>
                      <div className="flex flex-wrap gap-1.5 mt-1.5">
                        {(user.skillsWanted ?? []).slice(0, 3).map((sk, idx) => (
                          <span key={idx} className="inline-flex items-center gap-1 px-2 py-0.5 bg-surface-raised border border-white/5 text-text-sub rounded-lg text-xs">
                            <GraduationCap className="w-3 h-3 text-text-muted" />
                            <span>{sk.name}</span>
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Bottom Footer bar */}
                  <div className="px-5 py-3 bg-surface-raised/80 border-t border-white/5 flex items-center justify-between text-xs">
                    <span className="text-text-sub">
                      <span className="font-bold text-white">{user.successfulExchanges}</span> swaps completed
                    </span>
                    <span className="text-violet-400 font-semibold group-hover:text-lavender-200 flex items-center gap-1 transition">
                      <span>View Profile</span>
                      <ChevronRight className="w-4 h-4 group-hover:translate-x-0.5 transition" />
                    </span>
                  </div>
                </Spotlight>
              );
            })}
          </div>
        )}
      </section>

      {/* 5. TEACHER PROFILE DETAIL OVERLAY & BOOKING MODAL */}
      <ProfileDetailModal
        teacher={selectedTeacher}
        currentUser={currentUser}
        allReviews={allReviews}
        onClose={() => setSelectedTeacher(null)}
        onOpenChat={onOpenChat}
        onBookSession={({
          teacher,
          skill,
          option,
          date,
          slot,
          notes,
          scheduledTime,
          swapRole
        }) => {
          onBookSession(teacher, skill, option, date, slot, notes, scheduledTime, swapRole);
        }}
        onOpenStudyHub={handleOpenStudyHub}
      />

      {/* 6. INTERACTIVE STUDY HUB OVERLAY */}
      <AnimatePresence>
        {activeStudySkill && (() => {
          const guide = getSkillGuide(activeStudySkill.name, activeStudySkill.category);
          return (
            <div className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 z-55 overflow-y-auto">
              <motion.div 
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.95, opacity: 0 }}
                transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
                className="bg-surface-base rounded-3xl w-full max-w-3xl border border-white/10 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
              >
                {/* Header */}
                <div className="p-6 border-b border-white/10 bg-surface-raised/50 flex items-start justify-between shrink-0">
                  <div className="space-y-1">
                    <button 
                      onClick={() => setActiveStudySkill(null)}
                      className="text-violet-400 hover:text-violet-300 text-xs font-semibold flex items-center gap-1 mb-2 group transition bg-transparent border-0 cursor-pointer"
                    >
                      <ArrowLeft className="w-3.5 h-3.5 transition group-hover:-translate-x-0.5" /> Back to Profile
                    </button>
                    <div className="flex items-center gap-2">
                      <h2 className="text-xl font-bold text-white font-display">Study Hub: {activeStudySkill.name}</h2>
                      <span className="px-2 py-0.5 bg-violet-500/20 text-lavender-300 border border-violet-500/30 rounded text-[10px] font-semibold">{activeStudySkill.level}</span>
                    </div>
                    <p className="text-text-sub text-xs mt-0.5">Category: <span className="font-semibold text-white">{activeStudySkill.category}</span> • Self-Paced Interactive Syllabus</p>
                  </div>
                  <button 
                    onClick={() => setActiveStudySkill(null)}
                    className="p-1 rounded-full hover:bg-surface-raised text-text-muted hover:text-white transition mt-6 cursor-pointer"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                {/* Tabs */}
                <div className="flex border-b border-white/10 px-6 bg-surface-base shrink-0 overflow-x-auto">
                  <button
                    onClick={() => setStudyActiveTab('roadmap')}
                    className={`py-3.5 px-4 text-xs font-semibold border-b-2 transition whitespace-nowrap flex items-center gap-1.5 cursor-pointer ${
                      studyActiveTab === 'roadmap' 
                        ? 'border-violet-500 text-violet-400' 
                        : 'border-transparent text-text-sub hover:text-white'
                    }`}
                  >
                    <CheckSquare className="w-4 h-4" />
                    1. Study Roadmap & Tasks
                  </button>
                  <button
                    onClick={() => setStudyActiveTab('resources')}
                    className={`py-3.5 px-4 text-xs font-semibold border-b-2 transition whitespace-nowrap flex items-center gap-1.5 cursor-pointer ${
                      studyActiveTab === 'resources' 
                        ? 'border-violet-500 text-violet-400' 
                        : 'border-transparent text-text-sub hover:text-white'
                    }`}
                  >
                    <BookOpen className="w-4 h-4" />
                    2. Browse Tutorials ({guide.w3schoolsLink ? 'W3Schools' : 'External'})
                  </button>
                  <button
                    onClick={() => setStudyActiveTab('coach')}
                    className={`py-3.5 px-4 text-xs font-semibold border-b-2 transition whitespace-nowrap flex items-center gap-1.5 cursor-pointer ${
                      studyActiveTab === 'coach' 
                        ? 'border-violet-500 text-violet-400' 
                        : 'border-transparent text-text-sub hover:text-white'
                    }`}
                  >
                    <Sparkles className="w-4 h-4 text-violet-400" />
                    3. AI Virtual Skill Coach
                  </button>
                </div>

                {/* Body Content */}
                <div className="flex-1 overflow-y-auto p-6 space-y-6">
                  {studyActiveTab === 'roadmap' && (
                    <div className="space-y-6">
                      <div className="bg-surface-raised p-4 rounded-2xl border border-white/5">
                        <h3 className="font-bold text-white text-sm flex items-center gap-1.5">
                          <span>💡</span> Skill Overview
                        </h3>
                        <p className="text-text-sub text-xs mt-1.5 leading-relaxed">{guide.description}</p>
                      </div>

                      <div className="space-y-4">
                        <h4 className="text-xs font-bold text-text-dim tracking-wider uppercase">Syllabus Roadmaps & Tasks</h4>
                        {guide.syllabus.map((phase, pIdx) => (
                          <div key={pIdx} className="border border-white/10 rounded-2xl overflow-hidden bg-surface-raised shadow-lg">
                            <div className="bg-surface-base px-4 py-2.5 border-b border-white/10 flex justify-between items-center text-xs">
                              <span className="font-bold text-violet-400 uppercase tracking-wide">{phase.phase}</span>
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
                                        ? 'bg-violet-500/10 border-violet-500/20 text-text-muted' 
                                        : 'bg-surface-base border-white/5 hover:border-white/15 text-text-main'
                                    }`}
                                  >
                                    <input 
                                      type="checkbox" 
                                      checked={isDone}
                                      onChange={() => toggleTask(taskKey)}
                                      className="mt-0.5 rounded border-white/20 bg-surface-raised text-violet-600 focus:ring-violet-500 w-4 h-4 cursor-pointer"
                                    />
                                    <span className={isDone ? 'line-through text-text-muted' : ''}>{task}</span>
                                  </label>
                                );
                              })}
                            </div>
                          </div>
                        ))}
                      </div>

                      {/* Practice Project Card */}
                      <div className="bg-gradient-to-br from-violet-600/10 via-purple-600/10 to-surface-raised p-5 rounded-2xl border border-violet-500/20">
                        <div className="flex items-center gap-2">
                          <span className="text-xl">🛠️</span>
                          <h4 className="font-bold text-white text-sm">Suggested Hands-on Project: {guide.practiceProject.title}</h4>
                        </div>
                        <p className="text-text-sub text-xs mt-1 leading-normal">{guide.practiceProject.description}</p>
                        <div className="mt-4 space-y-2">
                          <p className="text-[10px] font-bold text-lavender-300 uppercase tracking-wider">Suggested Build Steps:</p>
                          <ol className="list-decimal pl-4 text-xs text-text-sub space-y-1">
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
                      {guide.w3schoolsLink && (
                        <div className="p-5 bg-emerald-500/10 border border-emerald-500/30 rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-4">
                          <div className="space-y-1">
                            <span className="px-2.5 py-0.5 bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 rounded-full text-[10px] font-bold uppercase tracking-wider">Recommended Practice Playground</span>
                            <h3 className="font-bold text-white text-base mt-1.5 flex items-center gap-1">
                              Learn {activeStudySkill.name} on W3Schools 🟢
                            </h3>
                            <p className="text-text-sub text-xs leading-relaxed">
                              Learn and execute code snippets or practice exercises in their interactive sandbox, with comprehensive testing, examples, and certifications.
                            </p>
                          </div>
                          <a 
                            href={guide.w3schoolsLink} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs rounded-xl shadow-lg transition flex items-center justify-center gap-1 shrink-0 cursor-pointer no-underline"
                          >
                            Launch W3Schools <ExternalLink className="w-3.5 h-3.5" />
                          </a>
                        </div>
                      )}

                      <div className="space-y-3">
                        <h4 className="text-xs font-bold text-text-dim tracking-wider uppercase">Curated Study Materials</h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {guide.otherLinks.map((link, idx) => (
                            <div key={idx} className="bg-surface-raised border border-white/5 rounded-2xl p-4 flex flex-col justify-between hover:border-white/15 transition shadow-md">
                              <div>
                                <div className="flex items-center justify-between gap-2">
                                  <span className="text-[10px] font-bold text-violet-400 uppercase tracking-wider">{link.siteName}</span>
                                </div>
                                <h5 className="font-bold text-white text-xs mt-1">{link.name}</h5>
                                <p className="text-text-sub text-[11px] mt-1.5 leading-normal">{link.description}</p>
                              </div>
                              <div className="mt-4 pt-3 border-t border-white/5 flex justify-end">
                                <a 
                                  href={link.url} 
                                  target="_blank" 
                                  rel="noopener noreferrer"
                                  className="text-xs font-semibold text-violet-400 hover:text-violet-300 flex items-center gap-1 transition cursor-pointer"
                                >
                                  Go to Tutorial <ExternalLink className="w-3.5 h-3.5" />
                                </a>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}

                  {studyActiveTab === 'coach' && (
                    <div className="flex flex-col h-[45vh] border border-white/10 rounded-2xl overflow-hidden bg-surface-raised shadow-inner">
                      {/* Messages list */}
                      <div className="flex-1 overflow-y-auto p-4 space-y-4">
                        {tutorMessages.map((msg, idx) => (
                          <div 
                            key={idx}
                            className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                          >
                            <div 
                              className={`max-w-[85%] p-3.5 rounded-2xl text-xs space-y-2 leading-relaxed shadow-md ${
                                msg.role === 'user'
                                  ? 'bg-violet-600 text-white rounded-br-none'
                                  : 'bg-surface-base text-text-main border border-white/10 rounded-bl-none'
                              }`}
                            >
                              {msg.role === 'model' && (
                                <div className="flex items-center gap-1 text-[10px] font-bold text-violet-400 tracking-wider uppercase mb-1">
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

                        {isTutorLoading && (
                          <div className="flex justify-start">
                            <div className="bg-surface-base border border-white/10 p-4 rounded-2xl rounded-bl-none shadow-md flex items-center gap-1.5 text-text-sub">
                              <span className="w-1.5 h-1.5 bg-violet-400 rounded-full animate-bounce"></span>
                              <span className="w-1.5 h-1.5 bg-violet-400 rounded-full animate-bounce [animation-delay:0.2s]"></span>
                              <span className="w-1.5 h-1.5 bg-violet-400 rounded-full animate-bounce [animation-delay:0.4s]"></span>
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Chat Input form */}
                      <form onSubmit={handleSendTutorMessage} className="p-3 bg-surface-base border-t border-white/10 flex gap-2 shrink-0">
                        <input 
                          type="text"
                          value={tutorInput}
                          onChange={(e) => setTutorInput(e.target.value)}
                          placeholder={`Ask anything about ${activeStudySkill.name}...`}
                          disabled={isTutorLoading}
                          className="flex-1 bg-surface-raised border border-white/10 text-white rounded-xl px-3.5 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-violet-500 placeholder:text-text-muted disabled:opacity-50"
                        />
                        <button 
                          type="submit"
                          disabled={!tutorInput.trim() || isTutorLoading}
                          className="p-2 bg-violet-600 hover:bg-violet-500 disabled:opacity-40 text-white rounded-xl shadow-md transition shrink-0 flex items-center justify-center w-9 h-9 border-0 cursor-pointer"
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
});

export default ExploreView;

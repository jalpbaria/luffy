import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Search, SlidersHorizontal, Star, Award, GraduationCap, 
  MapPin, Clock, Languages, Globe, Calendar, Check, MessageSquare,
  ArrowRight, ExternalLink, X, Compass, CheckCircle2, ChevronRight,
  BookOpen, Sparkles, Send, CheckSquare, ArrowLeft, Code
} from 'lucide-react';
import { UserProfile, Skill, LearningOption } from '../types';
import { getSkillGuide } from '../data/skillGuides';
import { getAISkillTutorReply } from '../lib/gemini';

interface ExploreViewProps {
  currentUser: UserProfile;
  users: UserProfile[];
  onBookSession: (teacher: UserProfile, skill: Skill, option: LearningOption, date: string, slot: 'Morning' | 'Afternoon' | 'Evening', notes: string) => void;
  onOpenChat: (userId: string) => void;
  isLoading: boolean;
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

export default function ExploreView({ currentUser, users, onBookSession, onOpenChat, isLoading }: ExploreViewProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [selectedLevel, setSelectedLevel] = useState<string>('All');
  const [selectedLanguage, setSelectedLanguage] = useState<string>('All');
  const [selectedAvailability, setSelectedAvailability] = useState<string>('All');
  const [selectedTimeZone, setSelectedTimeZone] = useState<string>('All');
  const [showFilters, setShowFilters] = useState(false);
  
  // Selected teacher for full details
  const [selectedTeacher, setSelectedTeacher] = useState<UserProfile | null>(null);
  const [selectedSkillToLearn, setSelectedSkillToLearn] = useState<Skill | null>(null);
  
  // Booking Form State
  const [isBookingMode, setIsBookingMode] = useState(false);
  const [chosenOption, setChosenOption] = useState<LearningOption>('Live 1-on-1 Session');
  const [bookingDate, setBookingDate] = useState('');
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

  // Filter users based on query state
  const otherUsers = users.filter(u => u.id !== currentUser?.id);
  
  const filteredUsers = otherUsers.filter(user => {
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
    // Set default date to tomorrow
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    setBookingDate(tomorrow.toISOString().split('T')[0]);
  };

  const submitBooking = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTeacher || !selectedSkillToLearn) return;
    
    onBookSession(
      selectedTeacher,
      selectedSkillToLearn,
      chosenOption,
      bookingDate,
      bookingSlot,
      bookingNotes
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
          <h1 className="text-3xl font-serif font-semibold tracking-tight text-slate-900">Discover Skill Swappers</h1>
          <p className="text-slate-500 mt-1 text-sm">Find your perfect skill-sharing partner. Filter by language, level, and availability.</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="px-3 py-1 bg-indigo-50 border border-indigo-100 rounded-full text-xs font-semibold text-indigo-700 flex items-center gap-1">
            <span>✨ Spark Economy</span>
            <span className="font-bold bg-indigo-200 text-indigo-800 px-1.5 py-0.5 rounded-full text-[10px]">{currentUser.credits} Credits Available</span>
          </div>
        </div>
      </div>

      {/* Search and Filters bar */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4 space-y-4">
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
            <input 
              type="text" 
              placeholder="Search skills, names, bios..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-sm"
            />
          </div>
          <button 
            onClick={() => setShowFilters(!showFilters)}
            className={`px-4 py-2 border rounded-lg text-sm flex items-center gap-2 font-medium transition ${
              showFilters ? 'bg-slate-100 border-slate-300 text-slate-900' : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
            }`}
          >
            <SlidersHorizontal className="w-4 h-4" />
            Filters
            {showFilters ? 'Hide' : 'Show'}
          </button>
        </div>

        {/* Categories Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-thin">
          {CATEGORIES.map(category => (
            <button
              key={category}
              onClick={() => setSelectedCategory(category)}
              className={`px-3.5 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-all ${
                selectedCategory === category 
                  ? 'bg-indigo-600 text-white shadow-sm' 
                  : 'bg-slate-50 text-slate-600 hover:bg-slate-100 border border-slate-150'
              }`}
            >
              {category}
            </button>
          ))}
        </div>

        {/* Extra Filters Panel */}
        <AnimatePresence>
          {showFilters && (
            <motion.div 
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden border-t border-slate-100 pt-4 grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs"
            >
              <div>
                <label className="block text-slate-500 font-medium mb-1.5">Skill level</label>
                <select 
                  value={selectedLevel} 
                  onChange={(e) => setSelectedLevel(e.target.value)}
                  className="w-full border border-slate-200 rounded-md p-2 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                >
                  <option value="All">All Levels</option>
                  <option value="Beginner">Beginner</option>
                  <option value="Intermediate">Intermediate</option>
                  <option value="Expert">Expert</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-500 font-medium mb-1.5">Language spoken</label>
                <select 
                  value={selectedLanguage} 
                  onChange={(e) => setSelectedLanguage(e.target.value)}
                  className="w-full border border-slate-200 rounded-md p-2 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                >
                  <option value="All">All Languages</option>
                  {allLanguages.map(lang => (
                    <option key={lang} value={lang}>{lang}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-slate-500 font-medium mb-1.5">Availability</label>
                <select 
                  value={selectedAvailability} 
                  onChange={(e) => setSelectedAvailability(e.target.value)}
                  className="w-full border border-slate-200 rounded-md p-2 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                >
                  <option value="All">Any Time</option>
                  <option value="Morning">Morning</option>
                  <option value="Afternoon">Afternoon</option>
                  <option value="Evening">Evening</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-500 font-medium mb-1.5">Time Zone</label>
                <select 
                  value={selectedTimeZone} 
                  onChange={(e) => setSelectedTimeZone(e.target.value)}
                  className="w-full border border-slate-200 rounded-md p-2 focus:outline-none focus:ring-1 focus:ring-indigo-500"
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
        <div className="flex flex-col items-center justify-center py-20 text-slate-400 gap-2">
          <div className="animate-spin rounded-full h-8 w-8 border-2 border-indigo-600 border-t-transparent"></div>
          <span className="text-sm">Loading matches...</span>
        </div>
      ) : filteredUsers.length === 0 ? (
        <div className="bg-slate-50 rounded-xl border border-slate-200 py-16 px-4 text-center">
          <Compass className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <h3 className="font-medium text-slate-700 text-base">No matches found</h3>
          <p className="text-slate-500 text-sm max-w-sm mx-auto mt-1">Try adjusting your filters, expanding your search query, or checking back later.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredUsers.map((user) => (
            <motion.div 
              key={user.id}
              layoutId={`user-card-${user.id}`}
              className="bg-white rounded-xl border border-slate-200 hover:border-slate-300 shadow-sm hover:shadow-md transition-all duration-200 flex flex-col overflow-hidden"
              onClick={() => handleOpenDetails(user)}
            >
              {/* Header card info */}
              <div className="p-5 flex items-start gap-4 cursor-pointer">
                <img 
                  src={user.avatar} 
                  alt={user.name} 
                  referrerPolicy="no-referrer"
                  className="w-14 h-14 rounded-full object-cover border-2 border-slate-100 flex-shrink-0"
                />
                <div className="space-y-1 min-w-0">
                  <div className="flex items-center gap-1.5">
                    <h3 className="font-semibold text-slate-900 truncate text-base hover:text-indigo-600 transition">{user.name}</h3>
                    <span className="px-2 py-0.5 bg-slate-100 text-slate-600 rounded text-[10px] font-medium">{user.skillLevel}</span>
                  </div>
                  
                  {/* Rating */}
                  <div className="flex items-center gap-1 text-xs text-amber-500 font-semibold">
                    <Star className="w-3.5 h-3.5 fill-current" />
                    <span>{user.rating.toFixed(1)}</span>
                    <span className="text-slate-400 font-normal">({user.reviewsCount} reviews)</span>
                  </div>

                  {/* Timezone / Availability info */}
                  <div className="flex items-center gap-1 text-xs text-slate-500">
                    <Globe className="w-3 h-3 text-slate-400" />
                    <span>{user.timeZone}</span>
                    <span className="text-slate-300">•</span>
                    <Clock className="w-3 h-3 text-slate-400" />
                    <span className="truncate">{(user.availability ?? []).join(', ')}</span>
                  </div>
                </div>
              </div>

              {/* Teaching skills */}
              <div className="px-5 pb-4 flex-1 space-y-3 cursor-pointer">
                <div>
                  <span className="text-[11px] font-semibold text-slate-400 tracking-wider uppercase">Teaches</span>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {(user.skillsOffered ?? []).map((sk, idx) => (
                      <span key={idx} className="inline-flex items-center gap-1 px-2.5 py-1 bg-indigo-50 border border-indigo-100 text-indigo-700 rounded-md text-xs font-medium">
                        <Award className="w-3 h-3 text-indigo-500" />
                        {sk.name}
                      </span>
                    ))}
                  </div>
                </div>

                <div>
                  <span className="text-[11px] font-semibold text-slate-400 tracking-wider uppercase">Wants to Learn</span>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {(user.skillsWanted ?? []).map((sk, idx) => (
                      <span key={idx} className="inline-flex items-center gap-1 px-2.5 py-1 bg-amber-50 border border-amber-100 text-amber-800 rounded-md text-xs font-medium">
                        <GraduationCap className="w-3 h-3 text-amber-500" />
                        {sk.name}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              {/* Successful Exchanges and CTA */}
              <div className="px-5 py-3.5 bg-slate-50 border-t border-slate-100 flex items-center justify-between text-xs">
                <span className="text-slate-500">
                  <span className="font-semibold text-slate-700">{user.successfulExchanges}</span> successful swaps
                </span>
                <span className="text-indigo-600 font-semibold group flex items-center gap-1 cursor-pointer">
                  View Profile <ChevronRight className="w-4 h-4 transition group-hover:translate-x-0.5" />
                </span>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* Teacher Profile Detail Overlay */}
      <AnimatePresence>
        {selectedTeacher && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 overflow-y-auto">
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-2xl w-full max-w-2xl border border-slate-100 shadow-xl overflow-hidden flex flex-col max-h-[90vh]"
            >
              {/* Profile Details Header */}
              <div className="p-6 border-b border-slate-150 flex items-start justify-between bg-slate-50">
                <div className="flex items-center gap-4">
                  <img 
                    src={selectedTeacher.avatar} 
                    alt={selectedTeacher.name} 
                    referrerPolicy="no-referrer"
                    className="w-16 h-16 rounded-full object-cover border-2 border-white shadow-sm"
                  />
                  <div>
                    <div className="flex items-center gap-2">
                      <h2 className="text-xl font-semibold text-slate-900">{selectedTeacher.name}</h2>
                      <span className="px-2.5 py-0.5 bg-indigo-100 text-indigo-800 rounded text-xs font-medium">{selectedTeacher.skillLevel}</span>
                    </div>
                    <p className="text-slate-500 text-xs flex items-center gap-3 mt-1">
                      <span className="flex items-center gap-1"><MapPin className="w-3.5 h-3.5 text-slate-400" />{selectedTeacher.timeZone}</span>
                      <span>•</span>
                      <span className="flex items-center gap-1"><Languages className="w-3.5 h-3.5 text-slate-400" />{selectedTeacher.languages.join(', ')}</span>
                    </p>
                  </div>
                </div>
                <button 
                  onClick={() => setSelectedTeacher(null)}
                  className="p-1 rounded-full hover:bg-slate-200 text-slate-400 hover:text-slate-600 transition"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Profile Details Body */}
              <div className="flex-1 overflow-y-auto p-6 space-y-6">
                {!isBookingMode ? (
                  <>
                    {/* Bio */}
                    <div>
                      <h4 className="text-xs font-semibold text-slate-400 tracking-wider uppercase mb-1.5">Introduction</h4>
                      <p className="text-slate-700 text-sm leading-relaxed">{selectedTeacher.bio}</p>
                    </div>

                    {/* Education & Experience */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm bg-slate-50 p-4 rounded-xl border border-slate-150">
                      <div>
                        <span className="text-xs text-slate-400 font-semibold uppercase tracking-wider">🎓 Education</span>
                        <p className="text-slate-700 mt-1">{selectedTeacher.education || 'No education specified'}</p>
                      </div>
                      <div>
                        <span className="text-xs text-slate-400 font-semibold uppercase tracking-wider">💼 Experience</span>
                        <p className="text-slate-700 mt-1">{selectedTeacher.experience || 'No experience specified'}</p>
                      </div>
                    </div>

                    {/* Portfolio / Links */}
                    {Object.keys(selectedTeacher.portfolio).length > 0 && (
                      <div>
                        <h4 className="text-xs font-semibold text-slate-400 tracking-wider uppercase mb-2">Portfolio & Socials</h4>
                        <div className="flex flex-wrap gap-2">
                          {selectedTeacher.portfolio.github && (
                            <a href={selectedTeacher.portfolio.github} target="_blank" rel="noreferrer" className="flex items-center gap-1 px-3 py-1.5 border border-slate-200 hover:bg-slate-50 rounded-lg text-xs font-semibold text-slate-700 transition">
                              GitHub <ExternalLink className="w-3.5 h-3.5 text-slate-400" />
                            </a>
                          )}
                          {selectedTeacher.portfolio.linkedin && (
                            <a href={selectedTeacher.portfolio.linkedin} target="_blank" rel="noreferrer" className="flex items-center gap-1 px-3 py-1.5 border border-slate-200 hover:bg-slate-50 rounded-lg text-xs font-semibold text-slate-700 transition">
                              LinkedIn <ExternalLink className="w-3.5 h-3.5 text-slate-400" />
                            </a>
                          )}
                          {selectedTeacher.portfolio.behance && (
                            <a href={selectedTeacher.portfolio.behance} target="_blank" rel="noreferrer" className="flex items-center gap-1 px-3 py-1.5 border border-slate-200 hover:bg-slate-50 rounded-lg text-xs font-semibold text-slate-700 transition">
                              Behance <ExternalLink className="w-3.5 h-3.5 text-slate-400" />
                            </a>
                          )}
                          {selectedTeacher.portfolio.portfolioUrl && (
                            <a href={selectedTeacher.portfolio.portfolioUrl} target="_blank" rel="noreferrer" className="flex items-center gap-1 px-3 py-1.5 border border-slate-200 hover:bg-slate-50 rounded-lg text-xs font-semibold text-slate-700 transition">
                              Website <ExternalLink className="w-3.5 h-3.5 text-slate-400" />
                            </a>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Skills Selection */}
                    <div>
                      <h4 className="text-xs font-semibold text-slate-400 tracking-wider uppercase mb-2">Select a skill to learn from {selectedTeacher.name}</h4>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {(selectedTeacher?.skillsOffered ?? []).map((sk, idx) => (
                          <div 
                            key={idx}
                            onClick={() => setSelectedSkillToLearn(sk)}
                            className={`p-3 border rounded-xl cursor-pointer transition flex items-center justify-between ${
                              selectedSkillToLearn?.name === sk.name 
                                ? 'bg-indigo-50 border-indigo-400 ring-2 ring-indigo-500/10' 
                                : 'bg-white border-slate-200 hover:border-slate-350'
                            }`}
                          >
                            <div>
                              <p className="font-semibold text-slate-800 text-sm">{sk.name}</p>
                              <p className="text-[11px] text-slate-500 mt-0.5">{sk.category} • {sk.level} level</p>
                            </div>
                            {selectedSkillToLearn?.name === sk.name && (
                              <div className="w-5 h-5 bg-indigo-500 text-white rounded-full flex items-center justify-center">
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
                          className="p-4 bg-indigo-50/40 border border-indigo-100 rounded-xl flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs animate-fade-in"
                        >
                          <div className="flex items-start gap-2.5">
                            <span className="text-xl bg-indigo-100 text-indigo-700 w-8 h-8 rounded-lg flex items-center justify-center shrink-0">📚</span>
                            <div>
                              <p className="font-semibold text-slate-800">Learn & Study on Your Own</p>
                              <p className="text-slate-500 mt-0.5">Explore structured syllabi, direct **W3Schools** tutorials, and ask our **AI Skill Coach** any questions!</p>
                            </div>
                          </div>
                          <div className="flex flex-col sm:flex-row gap-2 shrink-0 w-full md:w-auto">
                            {guide.w3schoolsLink && (
                              <a
                                href={guide.w3schoolsLink}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="px-3.5 py-2 bg-green-600 hover:bg-green-700 text-white font-semibold rounded-lg shadow-2xs transition flex items-center justify-center gap-1.5 whitespace-nowrap text-center text-xs decoration-transparent no-underline"
                              >
                                <ExternalLink className="w-3.5 h-3.5" />
                                Learn on W3Schools 🟢
                              </a>
                            )}
                            <button
                              type="button"
                              onClick={() => handleOpenStudyHub(selectedSkillToLearn)}
                              className="px-3.5 py-2 bg-white hover:bg-indigo-50 text-indigo-700 border border-indigo-200 hover:border-indigo-300 font-semibold rounded-lg shadow-2xs transition flex items-center justify-center gap-1.5 whitespace-nowrap"
                            >
                              <BookOpen className="w-3.5 h-3.5" />
                              Open Study Hub
                            </button>
                          </div>
                        </motion.div>
                      );
                    })()}

                    {/* Booking Prompt */}
                    <div className="bg-indigo-50/50 border border-indigo-100 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      <div>
                        <h5 className="font-semibold text-indigo-950 text-sm">Ready to make the exchange?</h5>
                        <p className="text-indigo-700/80 text-xs mt-0.5">Booking costs 1 Spark credit. No money required.</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <button 
                          onClick={() => onOpenChat(selectedTeacher.id)}
                          className="px-4 py-2 bg-white hover:bg-slate-50 text-indigo-700 border border-indigo-200 rounded-lg font-medium text-xs transition flex items-center gap-1.5"
                        >
                          <MessageSquare className="w-4 h-4" />
                          Chat First
                        </button>
                        <button 
                          onClick={handleStartBooking}
                          className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-semibold text-xs shadow-sm transition flex items-center gap-1"
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
                        <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto animate-bounce">
                          <CheckCircle2 className="w-10 h-10" />
                        </div>
                        <h3 className="text-lg font-semibold text-slate-900">Exchange Requested!</h3>
                        <p className="text-slate-500 text-sm">We reserved 1 credit. Sofia will review your request.</p>
                      </div>
                    ) : (
                      <>
                        <div className="p-3 bg-slate-50 border border-slate-150 rounded-lg flex items-center justify-between text-xs">
                          <div>
                            <span className="text-slate-400">Selected Teacher: </span>
                            <span className="font-semibold text-slate-700">{selectedTeacher.name}</span>
                          </div>
                          <div>
                            <span className="text-slate-400">Skill: </span>
                            <span className="font-semibold text-slate-700">{selectedSkillToLearn?.name}</span>
                          </div>
                        </div>

                        {/* Learning Options Segment */}
                        <div className="space-y-2">
                          <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider">How do you want to learn?</label>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                            {LEARNING_OPTIONS.map((opt) => (
                              <div
                                key={opt.value}
                                onClick={() => setChosenOption(opt.value)}
                                className={`p-3 border rounded-xl cursor-pointer transition flex items-start gap-3 ${
                                  chosenOption === opt.value
                                    ? 'bg-indigo-50 border-indigo-400 ring-2 ring-indigo-500/10'
                                    : 'bg-white border-slate-200 hover:border-slate-300'
                                }`}
                              >
                                <span className="text-2xl mt-0.5">{opt.icon}</span>
                                <div className="space-y-0.5">
                                  <p className="font-semibold text-slate-800 text-xs">{opt.value}</p>
                                  <p className="text-[10px] text-slate-500 leading-normal">{opt.desc}</p>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>

                        {/* Calendar / Date / Time */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                          <div>
                            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">Select Date</label>
                            <input 
                              type="date" 
                              required
                              value={bookingDate}
                              onChange={(e) => setBookingDate(e.target.value)}
                              className="w-full border border-slate-200 rounded-lg p-2.5 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500"
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">Time Slot Availability</label>
                            <div className="grid grid-cols-3 gap-1.5">
                              {(['Morning', 'Afternoon', 'Evening'] as const).map(slot => (
                                <button
                                  key={slot}
                                  type="button"
                                  onClick={() => setBookingSlot(slot)}
                                  className={`py-2.5 border rounded-lg text-xs font-semibold transition ${
                                    bookingSlot === slot
                                      ? 'bg-indigo-600 border-indigo-600 text-white shadow-sm'
                                      : selectedTeacher.availability.includes(slot)
                                        ? 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                                        : 'bg-slate-100 border-slate-200 text-slate-400 cursor-not-allowed line-through'
                                  }`}
                                  disabled={!selectedTeacher.availability.includes(slot)}
                                >
                                  {slot}
                                </button>
                              ))}
                            </div>
                            <span className="text-[10px] text-slate-400 mt-1 block">Crossed slots are not available for {selectedTeacher.name}.</span>
                          </div>
                        </div>

                        {/* Booking notes */}
                        <div>
                          <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">What do you want to focus on? (Optional)</label>
                          <textarea 
                            rows={3}
                            placeholder="Introduce your level and what goals you hope to focus on during this swap..."
                            value={bookingNotes}
                            onChange={(e) => setBookingNotes(e.target.value)}
                            className="w-full border border-slate-200 rounded-lg p-3 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500"
                          />
                        </div>

                        {/* Submit Button */}
                        <div className="flex items-center justify-end gap-2 pt-2">
                          <button 
                            type="button"
                            onClick={() => setIsBookingMode(false)}
                            className="px-4 py-2 border border-slate-200 hover:bg-slate-50 rounded-lg font-medium text-xs text-slate-600 transition"
                          >
                            Back to Profile
                          </button>
                          <button 
                            type="submit"
                            disabled={currentUser.credits < 1}
                            className={`px-5 py-2 rounded-lg font-semibold text-xs shadow-sm transition flex items-center gap-1.5 ${
                              currentUser.credits >= 1 
                                ? 'bg-indigo-600 hover:bg-indigo-700 text-white' 
                                : 'bg-slate-200 text-slate-400 cursor-not-allowed'
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
            <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-55 overflow-y-auto">
              <motion.div 
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.95, opacity: 0 }}
                className="bg-white rounded-2xl w-full max-w-3xl border border-slate-100 shadow-xl overflow-hidden flex flex-col max-h-[90vh]"
              >
                {/* Header */}
                <div className="p-6 border-b border-slate-150 bg-slate-50 flex items-start justify-between shrink-0">
                  <div className="space-y-1">
                    <button 
                      onClick={() => setActiveStudySkill(null)}
                      className="text-indigo-600 hover:text-indigo-800 text-xs font-semibold flex items-center gap-1 mb-2 group transition bg-transparent border-0 cursor-pointer"
                    >
                      <ArrowLeft className="w-3.5 h-3.5 transition group-hover:-translate-x-0.5" /> Back to Profile
                    </button>
                    <div className="flex items-center gap-2">
                      <h2 className="text-xl font-serif font-semibold text-slate-900">Study Hub: {activeStudySkill.name}</h2>
                      <span className="px-2 py-0.5 bg-indigo-100 text-indigo-800 rounded text-[10px] font-semibold">{activeStudySkill.level}</span>
                    </div>
                    <p className="text-slate-500 text-xs mt-0.5">Category: <span className="font-semibold text-slate-700">{activeStudySkill.category}</span> • Self-Paced Interactive Syllabus</p>
                  </div>
                  <button 
                    onClick={() => setActiveStudySkill(null)}
                    className="p-1 rounded-full hover:bg-slate-200 text-slate-400 hover:text-slate-600 transition mt-6"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                {/* Tabs selection */}
                <div className="flex border-b border-slate-200 px-6 bg-white shrink-0 overflow-x-auto">
                  <button
                    onClick={() => setStudyActiveTab('roadmap')}
                    className={`py-3.5 px-4 text-xs font-semibold border-b-2 transition whitespace-nowrap flex items-center gap-1.5 ${
                      studyActiveTab === 'roadmap' 
                        ? 'border-indigo-600 text-indigo-600' 
                        : 'border-transparent text-slate-500 hover:text-slate-800'
                    }`}
                  >
                    <CheckSquare className="w-4 h-4" />
                    1. Study Roadmap & Tasks
                  </button>
                  <button
                    onClick={() => setStudyActiveTab('resources')}
                    className={`py-3.5 px-4 text-xs font-semibold border-b-2 transition whitespace-nowrap flex items-center gap-1.5 ${
                      studyActiveTab === 'resources' 
                        ? 'border-indigo-600 text-indigo-600' 
                        : 'border-transparent text-slate-500 hover:text-slate-800'
                    }`}
                  >
                    <BookOpen className="w-4 h-4" />
                    2. Browse Tutorials ({guide.w3schoolsLink ? 'W3Schools' : 'External'})
                  </button>
                  <button
                    onClick={() => setStudyActiveTab('coach')}
                    className={`py-3.5 px-4 text-xs font-semibold border-b-2 transition whitespace-nowrap flex items-center gap-1.5 ${
                      studyActiveTab === 'coach' 
                        ? 'border-indigo-600 text-indigo-600' 
                        : 'border-transparent text-slate-500 hover:text-slate-800'
                    }`}
                  >
                    <Sparkles className="w-4 h-4 text-indigo-500" />
                    3. AI Virtual Skill Coach
                  </button>
                </div>

                {/* Body Content */}
                <div className="flex-1 overflow-y-auto p-6 space-y-6">
                  {studyActiveTab === 'roadmap' && (
                    <div className="space-y-6">
                      {/* Overview */}
                      <div className="bg-slate-50 p-4 rounded-xl border border-slate-150">
                        <h3 className="font-semibold text-slate-800 text-sm flex items-center gap-1.5">
                          <span>💡</span> Skill Overview
                        </h3>
                        <p className="text-slate-600 text-xs mt-1.5 leading-relaxed">{guide.description}</p>
                      </div>

                      {/* Staggered Roadmap Phases */}
                      <div className="space-y-4">
                        <h4 className="text-xs font-bold text-slate-400 tracking-wider uppercase">Syllabus Roadmaps & Practice Tasks</h4>
                        {guide.syllabus.map((phase, pIdx) => (
                          <div key={pIdx} className="border border-slate-200 rounded-xl overflow-hidden bg-white shadow-3xs">
                            <div className="bg-slate-50 px-4 py-2.5 border-b border-slate-200 flex justify-between items-center text-xs">
                              <span className="font-bold text-indigo-600 uppercase tracking-wide">{phase.phase}</span>
                              <span className="font-semibold text-slate-800">{phase.title}</span>
                            </div>
                            <div className="p-4 space-y-3">
                              {phase.tasks.map((task, tIdx) => {
                                const taskKey = `${activeStudySkill.name}-${phase.phase}-${tIdx}`;
                                const isDone = !!completedTasks[taskKey];
                                return (
                                  <label 
                                    key={tIdx} 
                                    className={`flex items-start gap-3 p-2.5 rounded-lg cursor-pointer transition text-xs border ${
                                      isDone 
                                        ? 'bg-indigo-50/20 border-indigo-100 text-slate-500' 
                                        : 'bg-white border-slate-150 hover:bg-slate-50 text-slate-700'
                                    }`}
                                  >
                                    <input 
                                      type="checkbox" 
                                      checked={isDone}
                                      onChange={() => toggleTask(taskKey)}
                                      className="mt-0.5 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 w-4 h-4"
                                    />
                                    <span className={isDone ? 'line-through text-slate-400' : ''}>{task}</span>
                                  </label>
                                );
                              })}
                            </div>
                          </div>
                        ))}
                      </div>

                      {/* Practice Project Card */}
                      <div className="bg-gradient-to-br from-indigo-50 to-amber-50 p-5 rounded-xl border border-indigo-100">
                        <div className="flex items-center gap-2">
                          <span className="text-xl">🛠️</span>
                          <h4 className="font-semibold text-indigo-950 text-sm">Suggested Hands-on Project: {guide.practiceProject.title}</h4>
                        </div>
                        <p className="text-indigo-900/80 text-xs mt-1 leading-normal">{guide.practiceProject.description}</p>
                        <div className="mt-4 space-y-2">
                          <p className="text-[10px] font-bold text-indigo-950/70 uppercase tracking-wider">Suggested Build Steps:</p>
                          <ol className="list-decimal pl-4 text-xs text-indigo-900/90 space-y-1">
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
                        <div className="p-5 bg-gradient-to-r from-green-50 to-emerald-50 border border-green-150 rounded-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
                          <div className="space-y-1">
                            <span className="px-2.5 py-0.5 bg-green-100 text-green-800 rounded-full text-[10px] font-bold uppercase tracking-wider">Recommended Practice Playground</span>
                            <h3 className="font-bold text-slate-900 text-base mt-1.5 flex items-center gap-1">
                              Learn {activeStudySkill.name} on W3Schools 🟢
                            </h3>
                            <p className="text-slate-600 text-xs leading-relaxed">
                              Learn and execute code snippets or practice exercises in their interactive sandbox, with comprehensive testing, examples, and certifications.
                            </p>
                          </div>
                          <a 
                            href={guide.w3schoolsLink} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="px-5 py-2.5 bg-green-600 hover:bg-green-700 text-white font-semibold text-xs rounded-lg shadow-sm transition flex items-center justify-center gap-1 shrink-0"
                          >
                            Launch W3Schools <ExternalLink className="w-3.5 h-3.5" />
                          </a>
                        </div>
                      )}

                      {/* Other Curated Resources */}
                      <div className="space-y-3">
                        <h4 className="text-xs font-bold text-slate-400 tracking-wider uppercase">More Highly Persuasive Study Materials</h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {guide.otherLinks.map((link, idx) => (
                            <div key={idx} className="bg-white border border-slate-200 rounded-xl p-4 flex flex-col justify-between hover:border-slate-350 transition shadow-3xs">
                              <div>
                                <div className="flex items-center justify-between gap-2">
                                  <span className="text-[10px] font-bold text-indigo-600 uppercase tracking-wider">{link.siteName}</span>
                                </div>
                                <h5 className="font-semibold text-slate-800 text-xs mt-1">{link.name}</h5>
                                <p className="text-slate-500 text-[11px] mt-1.5 leading-normal">{link.description}</p>
                              </div>
                              <div className="mt-4 pt-3 border-t border-slate-100 flex justify-end">
                                <a 
                                  href={link.url} 
                                  target="_blank" 
                                  rel="noopener noreferrer"
                                  className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 flex items-center gap-1 transition group"
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
                    <div className="flex flex-col h-[45vh] border border-slate-200 rounded-xl overflow-hidden bg-slate-50 shadow-inner">
                      {/* Message History list */}
                      <div className="flex-1 overflow-y-auto p-4 space-y-4">
                        {tutorMessages.map((msg, idx) => (
                          <div 
                            key={idx}
                            className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                          >
                            <div 
                              className={`max-w-[85%] p-3.5 rounded-2xl text-xs space-y-2 leading-relaxed shadow-3xs ${
                                msg.role === 'user'
                                  ? 'bg-indigo-600 text-white rounded-br-none'
                                  : 'bg-white text-slate-800 border border-slate-200 rounded-bl-none'
                              }`}
                            >
                              {msg.role === 'model' && (
                                <div className="flex items-center gap-1 text-[10px] font-bold text-indigo-500 tracking-wider uppercase mb-1">
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
                            <div className="bg-white border border-slate-200 p-4 rounded-2xl rounded-bl-none shadow-3xs flex items-center gap-1 text-slate-400">
                              <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce"></span>
                              <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce [animation-delay:0.2s]"></span>
                              <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce [animation-delay:0.4s]"></span>
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Chat Input form */}
                      <form onSubmit={handleSendTutorMessage} className="p-3 bg-white border-t border-slate-200 flex gap-2 shrink-0">
                        <input 
                          type="text"
                          value={tutorInput}
                          onChange={(e) => setTutorInput(e.target.value)}
                          placeholder={`Ask anything about ${activeStudySkill.name}...`}
                          disabled={isTutorLoading}
                          className="flex-1 border border-slate-200 rounded-lg px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:bg-slate-50 disabled:text-slate-400"
                        />
                        <button 
                          type="submit"
                          disabled={!tutorInput.trim() || isTutorLoading}
                          className="p-2 bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-100 text-white disabled:text-slate-400 rounded-lg shadow-sm transition shrink-0 flex items-center justify-center w-9 h-9 border-0 cursor-pointer"
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

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Sparkles, Users, Zap, Video, BookOpen, User, 
  ChevronRight, ChevronLeft, X, Check, ShieldCheck, HeartHandshake
} from 'lucide-react';

interface OnboardingTourProps {
  onComplete: () => void;
  userName?: string;
}

interface TourStep {
  id: string;
  tag: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  badgeBg: string;
  badgeText: string;
  accentGradient: string;
  highlights: string[];
}

export default function OnboardingTour({ onComplete, userName }: OnboardingTourProps) {
  const [currentStep, setCurrentStep] = useState(0);

  const steps: TourStep[] = [
    {
      id: 'welcome',
      tag: 'Skill Barter Platform',
      title: `Welcome to ExchangeYourSkill${userName ? `, ${userName}` : ''}!`,
      description: 'The zero-money community where you barter knowledge directly with peers around the globe. Teach what you love, learn what you need — no currency required.',
      icon: <HeartHandshake className="w-8 h-8 text-emerald-600" />,
      badgeBg: 'bg-emerald-100/80 border-emerald-200',
      badgeText: 'text-emerald-800',
      accentGradient: 'from-emerald-500 to-teal-600',
      highlights: [
        '100% Free Skill Barter System',
        'Direct Peer-to-Peer Swapping',
        'Global Peer-to-Peer Learning'
      ]
    },
    {
      id: 'browse',
      tag: 'Explore Swappers',
      title: 'Find Swappers & Skills',
      description: 'Browse community members offering skills in Web Development, Graphic Design, Languages, Music, Fitness, Business, and more.',
      icon: <Users className="w-8 h-8 text-indigo-600" />,
      badgeBg: 'bg-indigo-100/80 border-indigo-200',
      badgeText: 'text-indigo-800',
      accentGradient: 'from-indigo-500 to-purple-600',
      highlights: [
        'Filter by category, skill level & availability',
        'Inspect portfolios & verified community reviews',
        'Find partners in compatible time zones'
      ]
    },
    {
      id: 'swapping',
      tag: 'Skill Swapping',
      title: 'Book Sessions & Swap Skills',
      description: 'Book 1-on-1 sessions or chat guidance directly with expert swappers. Share knowledge freely without any restrictions.',
      icon: <Zap className="w-8 h-8 text-amber-500" />,
      badgeBg: 'bg-amber-100/80 border-amber-200',
      badgeText: 'text-amber-800',
      accentGradient: 'from-amber-500 to-orange-600',
      highlights: [
        'Book unlimited learning sessions for free',
        'Gain XP and badges whenever you teach',
        'Fair community-driven exchange model'
      ]
    },
    {
      id: 'live',
      tag: 'Live 1-on-1 Classroom',
      title: 'Chat & Video Call Workspace',
      description: 'Coordinate session goals with instant messaging, then hop onto live HD video calls with integrated code editors and study notes.',
      icon: <Video className="w-8 h-8 text-sky-600" />,
      badgeBg: 'bg-sky-100/80 border-sky-200',
      badgeText: 'text-sky-800',
      accentGradient: 'from-sky-500 to-blue-600',
      highlights: [
        'Real-time messaging & scheduling',
        'HD video calls with screen & code sharing',
        'Join window time-gating for organized classes'
      ]
    },
    {
      id: 'study',
      tag: 'Self-Paced Learning',
      title: 'Self-Study Hub & Syllabi',
      description: 'Prefer independent study? Access our curated free learning resources, video tutorials, official documentation, and structured W3Schools syllabi anytime.',
      icon: <BookOpen className="w-8 h-8 text-violet-600" />,
      badgeBg: 'bg-violet-100/80 border-violet-200',
      badgeText: 'text-violet-800',
      accentGradient: 'from-violet-500 to-fuchsia-600',
      highlights: [
        'Free curated resources across 11+ categories',
        'Topic-by-topic structured syllabi',
        'Study independently before scheduling a live swap'
      ]
    },
    {
      id: 'profile',
      tag: 'Get Started',
      title: 'Customize Your Profile',
      description: 'Make your profile stand out! Update your offered skills, learning goals, bio, and social portfolio links so other swappers can find you.',
      icon: <User className="w-8 h-8 text-rose-600" />,
      badgeBg: 'bg-rose-100/80 border-rose-200',
      badgeText: 'text-rose-800',
      accentGradient: 'from-rose-500 to-pink-600',
      highlights: [
        'Showcase what you teach & what you want to learn',
        'Add bio, experience, and GitHub/portfolio links',
        'Earn achievement badges as you teach and learn'
      ]
    }
  ];

  const step = steps[currentStep];
  const isLastStep = currentStep === steps.length - 1;

  // Handle keyboard navigation & Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onComplete();
      } else if (e.key === 'ArrowRight') {
        if (currentStep < steps.length - 1) {
          setCurrentStep(prev => prev + 1);
        } else {
          onComplete();
        }
      } else if (e.key === 'ArrowLeft') {
        if (currentStep > 0) {
          setCurrentStep(prev => prev - 1);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentStep, steps.length, onComplete]);

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/75 backdrop-blur-xs overflow-y-auto"
      onClick={(e) => {
        // Dismiss when clicking directly on backdrop
        if (e.target === e.currentTarget) {
          onComplete();
        }
      }}
    >
      <div className="w-full max-w-lg bg-white rounded-2xl border border-slate-200 shadow-2xl overflow-hidden flex flex-col my-auto relative text-slate-700">
        
        {/* Top Header Bar */}
        <div className="p-4 sm:p-5 border-b border-slate-100 bg-slate-50/80 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2">
            <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold border ${step.badgeBg} ${step.badgeText}`}>
              {step.tag}
            </span>
            <span className="text-[11px] font-semibold text-slate-400">
              Step {currentStep + 1} of {steps.length}
            </span>
          </div>

          <button
            onClick={onComplete}
            className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 rounded-xl transition cursor-pointer flex items-center gap-1 text-xs font-semibold"
            title="Skip onboarding tour (Esc)"
          >
            <span className="hidden sm:inline text-[11px]">Skip</span>
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Animated Step Content Body */}
        <div className="p-5 sm:p-6 space-y-5 flex-1 min-h-[280px] flex flex-col justify-between">
          <AnimatePresence mode="wait">
            <motion.div
              key={step.id}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.2 }}
              className="space-y-4"
            >
              {/* Step Icon Container */}
              <div className="flex items-center gap-3.5">
                <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${step.accentGradient} p-0.5 shadow-md shrink-0 flex items-center justify-center`}>
                  <div className="w-full h-full bg-white rounded-[14px] flex items-center justify-center">
                    {step.icon}
                  </div>
                </div>

                <div>
                  <h3 className="text-base sm:text-lg font-extrabold text-slate-900 leading-snug">
                    {step.title}
                  </h3>
                  <div className="flex items-center gap-1.5 text-[11px] text-slate-400 font-medium mt-0.5">
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
                    <span>Official Walkthrough</span>
                  </div>
                </div>
              </div>

              {/* Step Description */}
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                {step.description}
              </p>

              {/* Step Key Highlights */}
              <div className="bg-slate-50 border border-slate-150 rounded-xl p-3.5 space-y-2">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Highlights:</p>
                <ul className="space-y-1.5 text-xs text-slate-700">
                  {step.highlights.map((h, i) => (
                    <li key={i} className="flex items-center gap-2">
                      <div className="w-4 h-4 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
                        <Check className="w-2.5 h-2.5 stroke-[3]" />
                      </div>
                      <span className="font-medium">{h}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </motion.div>
          </AnimatePresence>

          {/* Progress Dots */}
          <div className="flex items-center justify-center gap-1.5 pt-2">
            {steps.map((s, idx) => (
              <button
                key={s.id}
                onClick={() => setCurrentStep(idx)}
                title={`Go to step ${idx + 1}`}
                className={`h-2 rounded-full transition-all cursor-pointer ${
                  currentStep === idx 
                    ? 'w-6 bg-indigo-600 shadow-2xs' 
                    : 'w-2 bg-slate-200 hover:bg-slate-300'
                }`}
              />
            ))}
          </div>
        </div>

        {/* Footer Navigation Buttons */}
        <div className="p-4 sm:p-5 border-t border-slate-100 bg-slate-50/80 flex items-center justify-between gap-3 shrink-0">
          <button
            onClick={() => setCurrentStep(prev => Math.max(0, prev - 1))}
            disabled={currentStep === 0}
            className={`px-3.5 py-2 rounded-xl text-xs font-semibold transition flex items-center gap-1 ${
              currentStep === 0
                ? 'opacity-0 pointer-events-none'
                : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200 cursor-pointer'
            }`}
          >
            <ChevronLeft className="w-4 h-4" />
            <span>Back</span>
          </button>

          <div className="flex items-center gap-2">
            <button
              onClick={onComplete}
              className="px-3.5 py-2 text-slate-500 hover:text-slate-800 text-xs font-semibold cursor-pointer transition"
            >
              Skip
            </button>

            {isLastStep ? (
              <button
                onClick={onComplete}
                className="px-5 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-bold rounded-xl text-xs shadow-md transition flex items-center gap-1.5 cursor-pointer"
              >
                <Sparkles className="w-4 h-4" />
                <span>Get Started</span>
              </button>
            ) : (
              <button
                onClick={() => setCurrentStep(prev => prev + 1)}
                className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl text-xs shadow-md transition flex items-center gap-1.5 cursor-pointer"
              >
                <span>Next</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}

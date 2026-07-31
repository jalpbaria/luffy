import React from 'react';
import { motion } from 'motion/react';
import { Button, ButtonProps } from './Button';
import { Sparkles, Compass, Rocket, BookOpen, Users, Calendar, MessageSquare, Award, Search, Trophy } from 'lucide-react';

export type EmptyStatePreset = 
  | 'partners' 
  | 'bookings' 
  | 'chats' 
  | 'courses' 
  | 'notes' 
  | 'certificates' 
  | 'search' 
  | 'general';

export interface EmptyStateProps {
  preset?: EmptyStatePreset;
  title?: string;
  description?: string;
  icon?: React.ReactNode;
  actionText?: string;
  onAction?: () => void;
  actionIcon?: React.ReactNode;
  secondaryActionText?: string;
  onSecondaryAction?: () => void;
  className?: string;
}

const PRESET_CONFIGS: Record<EmptyStatePreset, { icon: React.ReactNode; title: string; description: string; actionText: string; gradient: string }> = {
  partners: {
    icon: <Users className="w-8 h-8 text-indigo-600" />,
    title: 'Find Your First Skill Swap Partner',
    description: 'Connect with peers ready to barter skills. Exchange programming, languages, design, and business expertise!',
    actionText: 'Explore Available Swappers',
    gradient: 'from-indigo-500/10 via-purple-500/10 to-cyan-500/10',
  },
  bookings: {
    icon: <Calendar className="w-8 h-8 text-emerald-600" />,
    title: 'Start Your Learning Journey Today',
    description: 'You have no scheduled live sessions yet. Pick a skill partner and book your first 1-on-1 barter classroom!',
    actionText: 'Book a Skill Classroom',
    gradient: 'from-emerald-500/10 via-teal-500/10 to-cyan-500/10',
  },
  chats: {
    icon: <MessageSquare className="w-8 h-8 text-purple-600" />,
    title: 'No Conversations Started Yet',
    description: 'Send a message to a skill partner to negotiate an exchange, schedule times, or discuss learning goals.',
    actionText: 'Browse Active Members',
    gradient: 'from-purple-500/10 via-indigo-500/10 to-pink-500/10',
  },
  courses: {
    icon: <BookOpen className="w-8 h-8 text-cyan-600" />,
    title: 'Begin Your Mastery Track',
    description: 'No active learning courses in progress. Complete peer barter sessions or study hub modules to build your roadmap!',
    actionText: 'Discover Skill Courses',
    gradient: 'from-cyan-500/10 via-blue-500/10 to-indigo-500/10',
  },
  notes: {
    icon: <Sparkles className="w-8 h-8 text-amber-500" />,
    title: 'Your Study Scratchpad is Empty',
    description: 'Generate AI study guides, flashcards, or interactive quizzes to store key takeaways in your personal hub.',
    actionText: 'Generate AI Study Guide',
    gradient: 'from-amber-500/10 via-orange-500/10 to-yellow-500/10',
  },
  certificates: {
    icon: <Award className="w-8 h-8 text-amber-600" />,
    title: 'Complete Your First Barter Milestone',
    description: 'Earn official verified SkillSwap peer certificates as you complete exchange sessions and demonstrate skill mastery.',
    actionText: 'Browse Exchange Partners',
    gradient: 'from-amber-500/10 via-yellow-500/10 to-orange-500/10',
  },
  search: {
    icon: <Search className="w-8 h-8 text-slate-500" />,
    title: 'No Matching Results Found',
    description: 'Try adjusting your search filters, clearing active tags, or searching for broader skill categories.',
    actionText: 'Clear All Filters',
    gradient: 'from-slate-500/10 via-zinc-500/10 to-slate-500/10',
  },
  general: {
    icon: <Rocket className="w-8 h-8 text-indigo-600" />,
    title: 'Nothing Here Yet',
    description: 'Take your first step towards collaborative skill barter and peer mentorship.',
    actionText: 'Get Started',
    gradient: 'from-indigo-500/10 via-purple-500/10 to-cyan-500/10',
  },
};

export const EmptyState: React.FC<EmptyStateProps> = ({
  preset = 'general',
  title,
  description,
  icon,
  actionText,
  onAction,
  actionIcon,
  secondaryActionText,
  onSecondaryAction,
  className = '',
}) => {
  const config = PRESET_CONFIGS[preset];

  const finalTitle = title || config.title;
  const finalDescription = description || config.description;
  const finalIcon = icon || config.icon;
  const finalActionText = actionText || config.actionText;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.96 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.3, ease: 'easeOut' }}
      className={`bg-white rounded-3xl border border-slate-200/90 p-8 sm:p-12 text-center shadow-xs flex flex-col items-center justify-center max-w-xl mx-auto my-4 relative overflow-hidden group ${className}`}
    >
      {/* Decorative Gradient Blob */}
      <div className={`absolute inset-0 bg-gradient-to-br ${config.gradient} opacity-50 blur-2xl pointer-events-none group-hover:opacity-80 transition-opacity duration-500`} />

      <div className="relative z-10 space-y-4">
        {/* Animated Icon Ring */}
        <motion.div
          whileHover={{ scale: 1.1, rotate: 5 }}
          transition={{ type: 'spring', stiffness: 300 }}
          className="w-16 h-16 rounded-3xl bg-white border border-slate-200 shadow-lg shadow-indigo-500/10 flex items-center justify-center mx-auto"
        >
          {finalIcon}
        </motion.div>

        {/* Text */}
        <div className="space-y-1.5 max-w-md mx-auto">
          <h3 className="font-extrabold text-slate-900 text-lg sm:text-xl tracking-tight">
            {finalTitle}
          </h3>
          <p className="text-slate-500 text-xs sm:text-sm leading-relaxed">
            {finalDescription}
          </p>
        </div>

        {/* Buttons */}
        <div className="pt-3 flex flex-wrap items-center justify-center gap-3">
          {onAction && (
            <Button
              variant="gradient"
              size="md"
              onClick={onAction}
              leftIcon={actionIcon || <Compass className="w-4 h-4" />}
            >
              {finalActionText}
            </Button>
          )}

          {onSecondaryAction && secondaryActionText && (
            <Button
              variant="outline"
              size="md"
              onClick={onSecondaryAction}
            >
              {secondaryActionText}
            </Button>
          )}
        </div>
      </div>
    </motion.div>
  );
};

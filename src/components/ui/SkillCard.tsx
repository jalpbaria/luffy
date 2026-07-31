import React from 'react';
import { motion } from 'motion/react';
import { BookOpen, Users, Clock, ArrowRight, Zap, CheckCircle } from 'lucide-react';
import { Badge } from './Badge';
import { Button } from './Button';
import { ProgressBar } from './ProgressBar';

export interface SkillCardProps {
  id: string;
  title: string;
  category: string;
  description: string;
  level?: 'Beginner' | 'Intermediate' | 'Advanced' | 'All Levels';
  learnerCount?: number;
  estimatedHours?: number;
  xpReward?: number;
  progressPercentage?: number;
  isCompleted?: boolean;
  icon?: React.ReactNode;
  onAction?: (id: string) => void;
  actionText?: string;
  className?: string;
}

export const SkillCard: React.FC<SkillCardProps> = ({
  id,
  title,
  category,
  description,
  level = 'Intermediate',
  learnerCount = 1280,
  estimatedHours = 6,
  xpReward = 150,
  progressPercentage,
  isCompleted = false,
  icon,
  onAction,
  actionText = 'Start Learning',
  className = '',
}) => {
  return (
    <motion.div
      whileHover={{ y: -5, transition: { duration: 0.25, ease: 'easeOut' } }}
      className={`bg-white rounded-3xl border border-slate-200/90 p-5 sm:p-6 shadow-sm hover:shadow-xl hover:shadow-indigo-500/10 hover:border-indigo-300 transition-all duration-300 flex flex-col justify-between relative overflow-hidden group ${className}`}
    >
      <div>
        {/* Top Header Row */}
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="w-12 h-12 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 shadow-2xs group-hover:bg-indigo-600 group-hover:text-white group-hover:scale-105 transition-all duration-300 shrink-0">
            {icon || <BookOpen className="w-6 h-6" />}
          </div>
          <div className="flex items-center gap-1.5 flex-wrap justify-end">
            <Badge variant="secondary" pill className="text-[10px]">
              {category}
            </Badge>
            <Badge variant="neutral" pill className="text-[10px]">
              {level}
            </Badge>
          </div>
        </div>

        {/* Title and Description */}
        <h4 className="font-extrabold text-slate-900 text-lg tracking-tight group-hover:text-indigo-600 transition-colors line-clamp-1">
          {title}
        </h4>
        <p className="text-slate-500 text-xs sm:text-sm mt-1.5 leading-relaxed line-clamp-2">
          {description}
        </p>

        {/* Metadata info */}
        <div className="flex items-center gap-4 text-xs text-slate-500 font-semibold my-4 py-2 border-y border-slate-100">
          <div className="flex items-center gap-1">
            <Users className="w-3.5 h-3.5 text-slate-400" />
            <span>{learnerCount.toLocaleString()} learners</span>
          </div>
          <div className="flex items-center gap-1">
            <Clock className="w-3.5 h-3.5 text-slate-400" />
            <span>{estimatedHours}h</span>
          </div>
          <div className="flex items-center gap-1 text-amber-600 font-extrabold ml-auto">
            <Zap className="w-3.5 h-3.5 fill-amber-400 text-amber-500" />
            <span>+{xpReward} XP</span>
          </div>
        </div>

        {/* Optional Progress Bar */}
        {progressPercentage !== undefined && (
          <div className="mb-4">
            <ProgressBar
              value={progressPercentage}
              label={isCompleted ? 'Completed' : 'Course Progress'}
              color={isCompleted ? 'emerald' : 'indigo'}
              height="sm"
            />
          </div>
        )}
      </div>

      {/* Action Footer */}
      <div className="pt-2 flex items-center justify-between">
        {isCompleted ? (
          <div className="flex items-center gap-1.5 text-xs font-extrabold text-emerald-600 bg-emerald-50 px-3 py-1.5 rounded-full border border-emerald-200">
            <CheckCircle className="w-4 h-4" />
            <span>Completed</span>
          </div>
        ) : (
          <Button
            variant={progressPercentage && progressPercentage > 0 ? 'gradient' : 'primary'}
            size="sm"
            fullWidth
            onClick={() => onAction && onAction(id)}
            rightIcon={<ArrowRight className="w-3.5 h-3.5" />}
          >
            {progressPercentage && progressPercentage > 0 ? 'Continue' : actionText}
          </Button>
        )}
      </div>
    </motion.div>
  );
};

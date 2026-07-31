import React from 'react';
import { motion } from 'motion/react';
import { Star, MessageSquare, Calendar, Sparkles, MapPin, Zap } from 'lucide-react';
import { UserProfile } from '../../types';
import { Avatar } from './Avatar';
import { Badge } from './Badge';
import { Button } from './Button';

export interface PartnerCardProps {
  partner: UserProfile;
  matchScore?: number;
  onBookSession?: (partner: UserProfile) => void;
  onMessage?: (partner: UserProfile) => void;
  onViewProfile?: (partner: UserProfile) => void;
  className?: string;
}

export const PartnerCard: React.FC<PartnerCardProps> = ({
  partner,
  matchScore = 95,
  onBookSession,
  onMessage,
  onViewProfile,
  className = '',
}) => {
  return (
    <motion.div
      whileHover={{ y: -5, transition: { duration: 0.25, ease: 'easeOut' } }}
      className={`bg-white rounded-3xl border border-slate-200/90 p-5 sm:p-6 shadow-sm hover:shadow-xl hover:shadow-indigo-500/10 hover:border-indigo-300 transition-all duration-300 flex flex-col justify-between relative overflow-hidden group ${className}`}
    >
      {/* Background Subtle Gradient Overlay */}
      <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-indigo-500 via-purple-500 to-cyan-500" />

      <div>
        {/* Top Header Row */}
        <div className="flex items-start justify-between gap-3 mb-4 pt-1">
          <div className="flex items-center gap-3.5">
            <div 
              onClick={() => onViewProfile && onViewProfile(partner)}
              className="cursor-pointer transition-transform hover:scale-105 shrink-0"
            >
              <Avatar
                src={partner.avatarUrl}
                name={partner.fullName}
                size="lg"
                isOnline={partner.isOnline}
                xpLevel={partner.level}
              />
            </div>
            <div>
              <div className="flex items-center gap-1.5 flex-wrap">
                <h4 
                  onClick={() => onViewProfile && onViewProfile(partner)}
                  className="font-extrabold text-slate-900 text-base sm:text-lg tracking-tight hover:text-indigo-600 transition-colors cursor-pointer"
                >
                  {partner.fullName}
                </h4>
                {partner.role === 'mentor' && (
                  <Badge variant="primary" pill={false} className="text-[10px] py-0 px-1.5">
                    Mentor
                  </Badge>
                )}
              </div>
              <p className="text-xs text-slate-500 font-medium line-clamp-1 mt-0.5">
                {partner.headline || partner.title || 'Skill Exchange Partner'}
              </p>
              {partner.location && (
                <div className="flex items-center gap-1 text-[11px] text-slate-400 mt-1 font-medium">
                  <MapPin className="w-3 h-3 shrink-0" />
                  <span>{partner.location}</span>
                </div>
              )}
            </div>
          </div>

          {/* Match Score Badge */}
          {matchScore && (
            <div className="shrink-0 flex flex-col items-end">
              <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-gradient-to-r from-emerald-500/10 to-teal-500/10 text-emerald-700 border border-emerald-500/20 rounded-full font-extrabold text-xs">
                <Sparkles className="w-3 h-3 text-emerald-500" />
                <span>{matchScore}% Match</span>
              </span>
            </div>
          )}
        </div>

        {/* Stats Strip */}
        <div className="grid grid-cols-3 gap-2 py-2.5 px-3 bg-slate-50/80 rounded-2xl border border-slate-100 my-3 text-center">
          <div>
            <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">Rating</span>
            <span className="text-xs font-extrabold text-slate-800 flex items-center justify-center gap-1 mt-0.5">
              <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
              <span>{partner.rating ? partner.rating.toFixed(1) : '5.0'}</span>
            </span>
          </div>
          <div className="border-x border-slate-200/60">
            <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">Sessions</span>
            <span className="text-xs font-extrabold text-slate-800 mt-0.5 block">
              {partner.sessionsCompleted || 12}
            </span>
          </div>
          <div>
            <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">XP</span>
            <span className="text-xs font-extrabold text-indigo-600 flex items-center justify-center gap-0.5 mt-0.5">
              <Zap className="w-3 h-3 fill-indigo-400 text-indigo-500" />
              <span>{partner.xp || 450}</span>
            </span>
          </div>
        </div>

        {/* Offered & Wanted Skills */}
        <div className="space-y-2.5 my-3">
          <div>
            <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block mb-1">
              Can Teach
            </span>
            <div className="flex flex-wrap gap-1.5">
              {(partner.skillsOffered || partner.skills || ['React', 'TypeScript']).map((skill, idx) => (
                <span
                  key={idx}
                  className="px-2.5 py-0.5 bg-indigo-50 text-indigo-700 border border-indigo-200/80 rounded-full text-[11px] font-bold"
                >
                  {skill}
                </span>
              ))}
            </div>
          </div>

          <div>
            <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block mb-1">
              Wants to Learn
            </span>
            <div className="flex flex-wrap gap-1.5">
              {(partner.skillsWanted || ['AI Prompting', 'System Design']).map((skill, idx) => (
                <span
                  key={idx}
                  className="px-2.5 py-0.5 bg-slate-100 text-slate-700 border border-slate-200 rounded-full text-[11px] font-semibold"
                >
                  {skill}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Footer Actions */}
      <div className="pt-3 mt-3 border-t border-slate-100 flex items-center gap-2">
        {onMessage && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => onMessage(partner)}
            leftIcon={<MessageSquare className="w-3.5 h-3.5" />}
            className="flex-1"
          >
            Chat
          </Button>
        )}
        {onBookSession && (
          <Button
            variant="primary"
            size="sm"
            onClick={() => onBookSession(partner)}
            leftIcon={<Calendar className="w-3.5 h-3.5" />}
            className="flex-1"
          >
            Book Session
          </Button>
        )}
      </div>
    </motion.div>
  );
};

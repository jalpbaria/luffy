import React from 'react';
import { motion } from 'motion/react';
import { UserProfile } from '../../types';
import { Avatar } from './Avatar';
import { Badge } from './Badge';
import { Button } from './Button';
import { CheckCircle2, Star, Zap, Calendar, Settings, Share2, Award } from 'lucide-react';

export interface ProfileCardProps {
  user: UserProfile;
  onEditProfile?: () => void;
  onShareProfile?: () => void;
  className?: string;
}

export const ProfileCard: React.FC<ProfileCardProps> = ({
  user,
  onEditProfile,
  onShareProfile,
  className = '',
}) => {
  return (
    <motion.div
      whileHover={{ y: -3 }}
      transition={{ duration: 0.2 }}
      className={`bg-white rounded-3xl border border-slate-200/90 shadow-sm overflow-hidden relative ${className}`}
    >
      {/* Top Banner Cover */}
      <div className="h-28 bg-gradient-to-r from-indigo-600 via-purple-600 to-cyan-500 relative">
        <div className="absolute top-3 right-3 flex items-center gap-2">
          {onShareProfile && (
            <button
              onClick={onShareProfile}
              className="p-2 bg-white/20 hover:bg-white/30 backdrop-blur-md rounded-xl text-white transition cursor-pointer border border-white/20"
              title="Share Profile"
            >
              <Share2 className="w-4 h-4" />
            </button>
          )}
          {onEditProfile && (
            <button
              onClick={onEditProfile}
              className="p-2 bg-white/20 hover:bg-white/30 backdrop-blur-md rounded-xl text-white transition cursor-pointer border border-white/20"
              title="Edit Profile"
            >
              <Settings className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Main Profile Body */}
      <div className="px-6 pb-6 relative">
        {/* Avatar Overlap */}
        <div className="flex items-end justify-between -mt-12 mb-4">
          <div className="p-1 bg-white rounded-full shadow-lg">
            <Avatar
              src={user.avatarUrl}
              name={user.fullName}
              size="xl"
              isOnline={user.isOnline}
              xpLevel={user.level}
            />
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="duolingo" pill className="px-3 py-1 text-xs">
              🔥 {user.streakDays || 5} Day Streak
            </Badge>
          </div>
        </div>

        {/* User Info */}
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <h3 className="font-extrabold text-slate-900 text-xl tracking-tight">
              {user.fullName}
            </h3>
            <CheckCircle2 className="w-5 h-5 text-indigo-600 fill-indigo-100" />
          </div>
          <p className="text-xs font-bold text-indigo-600 uppercase tracking-wider">
            {user.headline || user.role || 'Skill Exchange Member'}
          </p>
          <p className="text-slate-500 text-xs sm:text-sm mt-2 leading-relaxed">
            {user.bio || 'Passionate about continuous learning, peer mentorship, and AI skills.'}
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-3 gap-3 my-5">
          <div className="bg-slate-50/80 rounded-2xl p-3 border border-slate-100 text-center">
            <span className="block text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">Rating</span>
            <div className="text-base font-extrabold text-slate-900 flex items-center justify-center gap-1 mt-0.5">
              <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
              <span>{user.rating ? user.rating.toFixed(1) : '5.0'}</span>
            </div>
          </div>

          <div className="bg-slate-50/80 rounded-2xl p-3 border border-slate-100 text-center">
            <span className="block text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">Sessions</span>
            <div className="text-base font-extrabold text-slate-900 flex items-center justify-center gap-1 mt-0.5">
              <Calendar className="w-4 h-4 text-indigo-600" />
              <span>{user.sessionsCompleted || 14}</span>
            </div>
          </div>

          <div className="bg-slate-50/80 rounded-2xl p-3 border border-slate-100 text-center">
            <span className="block text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">XP Earned</span>
            <div className="text-base font-extrabold text-amber-600 flex items-center justify-center gap-1 mt-0.5">
              <Zap className="w-4 h-4 fill-amber-400 text-amber-500" />
              <span>{user.xp || 780}</span>
            </div>
          </div>
        </div>

        {/* Skills Offered / Badges */}
        <div className="space-y-3">
          <div>
            <span className="text-[11px] font-extrabold text-slate-400 uppercase tracking-wider block mb-1.5">
              Teaching Expertise
            </span>
            <div className="flex flex-wrap gap-1.5">
              {(user.skillsOffered || user.skills || ['React', 'TypeScript', 'UI Design']).map((skill, idx) => (
                <span
                  key={idx}
                  className="px-3 py-1 bg-indigo-50 text-indigo-700 border border-indigo-200/80 rounded-full text-xs font-bold"
                >
                  {skill}
                </span>
              ))}
            </div>
          </div>

          <div>
            <span className="text-[11px] font-extrabold text-slate-400 uppercase tracking-wider block mb-1.5">
              Learning Focus
            </span>
            <div className="flex flex-wrap gap-1.5">
              {(user.skillsWanted || ['AI Prompting', 'System Design']).map((skill, idx) => (
                <span
                  key={idx}
                  className="px-3 py-1 bg-slate-100 text-slate-700 border border-slate-200 rounded-full text-xs font-semibold"
                >
                  {skill}
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* Action Button */}
        <div className="mt-6 pt-4 border-t border-slate-100">
          <Button
            variant="outline"
            fullWidth
            onClick={onEditProfile}
            leftIcon={<Settings className="w-4 h-4" />}
          >
            Manage Profile Settings
          </Button>
        </div>
      </div>
    </motion.div>
  );
};

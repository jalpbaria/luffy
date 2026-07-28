import React, { useState } from 'react';
import { CheckCircle2, ShieldCheck, HelpCircle } from 'lucide-react';
import { isSkillVerified } from '../lib/verifiedSkillUtils';
import { Review } from '../types';

interface VerifiedSkillBadgeProps {
  teacherId: string;
  skillName: string;
  allReviews: Review[];
  variant?: 'badge-only' | 'inline-tag' | 'card-pill';
  className?: string;
}

export function VerifiedSkillBadge({
  teacherId,
  skillName,
  allReviews,
  variant = 'badge-only',
  className = ''
}: VerifiedSkillBadgeProps) {
  const [showTooltip, setShowTooltip] = useState(false);
  const status = isSkillVerified(teacherId, skillName, allReviews);

  if (!status.isVerified) return null;

  const tooltipText = `Verified Skill: ${status.qualifyingCount}+ high ratings (4-5★) received for ${skillName}`;

  if (variant === 'badge-only') {
    return (
      <div className={`relative inline-flex items-center shrink-0 group/vbadge ${className}`}>
        <span
          onMouseEnter={() => setShowTooltip(true)}
          onMouseLeave={() => setShowTooltip(false)}
          onClick={(e) => { e.stopPropagation(); setShowTooltip(!showTooltip); }}
          className="inline-flex items-center gap-1 px-1.5 py-0.5 bg-emerald-100 border border-emerald-300 text-emerald-800 rounded-full text-[10px] font-extrabold shadow-2xs cursor-help hover:bg-emerald-200 transition"
          title={tooltipText}
        >
          <CheckCircle2 className="w-3 h-3 text-emerald-600 fill-emerald-200 shrink-0" />
          <span>Verified</span>
        </span>

        {/* Hover / Tap Tooltip */}
        {showTooltip && (
          <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 z-50 pointer-events-none w-52">
            <div className="bg-slate-900/95 text-white text-[11px] font-normal rounded-lg p-2.5 shadow-xl border border-slate-700/50 leading-snug text-center">
              <span className="font-bold text-emerald-300 flex items-center justify-center gap-1 mb-1">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                Verified Skill Badge
              </span>
              <span>
                Earned {status.qualifyingCount} high-rating reviews (4-5★) from swappers for <strong className="text-white">{skillName}</strong>.
              </span>
            </div>
            <div className="w-2 h-2 bg-slate-900 rotate-45 mx-auto -mt-1"></div>
          </div>
        )}
      </div>
    );
  }

  if (variant === 'inline-tag') {
    return (
      <div className={`relative inline-flex items-center group/vtag ${className}`}>
        <span
          onMouseEnter={() => setShowTooltip(true)}
          onMouseLeave={() => setShowTooltip(false)}
          onClick={(e) => { e.stopPropagation(); setShowTooltip(!showTooltip); }}
          className="inline-flex items-center gap-1 px-2.5 py-1 bg-emerald-50 border border-emerald-300 text-emerald-800 rounded-md text-xs font-semibold cursor-help hover:bg-emerald-100/80 transition"
        >
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
          <span>{skillName}</span>
          <span className="ml-1 px-1.5 py-0.2 bg-emerald-600 text-white rounded-full text-[9px] font-extrabold uppercase">
            Verified
          </span>
        </span>

        {/* Tooltip */}
        {showTooltip && (
          <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 z-50 pointer-events-none w-56">
            <div className="bg-slate-900 text-white text-[11px] rounded-lg p-2.5 shadow-xl border border-slate-800 text-center leading-snug">
              <span className="font-bold text-emerald-400 block mb-0.5">Verified Skill Status</span>
              This teacher received 3+ positive reviews (4-5★) specifically for teaching {skillName}.
            </div>
            <div className="w-2 h-2 bg-slate-900 rotate-45 mx-auto -mt-1"></div>
          </div>
        )}
      </div>
    );
  }

  return null;
}

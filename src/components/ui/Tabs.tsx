import React from 'react';
import { motion } from 'motion/react';
import { motionTokens } from '../motion/tokens';

export interface TabItem {
  id: string;
  label: string;
  icon?: React.ReactNode;
  badge?: string | number;
}

export interface TabsProps {
  tabs: TabItem[];
  activeTab: string;
  onChange: (tabId: string) => void;
  variant?: 'pill' | 'segmented' | 'underline';
  className?: string;
}

export const Tabs: React.FC<TabsProps> = ({
  tabs,
  activeTab,
  onChange,
  variant = 'pill',
  className = '',
}) => {
  if (variant === 'segmented') {
    return (
      <div className={`inline-flex items-center p-1 bg-[#12131A] rounded-2xl border border-white/[0.08] ${className}`}>
        {tabs.map((tab) => {
          const isActive = tab.id === activeTab;
          return (
            <button
              key={tab.id}
              onClick={() => onChange(tab.id)}
              className={`relative px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-colors cursor-pointer border-0 ${
                isActive ? 'text-white' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              {isActive && (
                <motion.div
                  layoutId="activeSegment"
                  className="absolute inset-0 bg-[#1E202E] rounded-xl shadow-xs border border-white/[0.12]"
                  transition={motionTokens.spring.medium}
                />
              )}
              <span className="relative z-10 flex items-center gap-2">
                {tab.icon}
                <span>{tab.label}</span>
                {tab.badge !== undefined && (
                  <span
                    className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold ${
                      isActive ? 'bg-violet-500/20 text-violet-300' : 'bg-white/[0.08] text-slate-400'
                    }`}
                  >
                    {tab.badge}
                  </span>
                )}
              </span>
            </button>
          );
        })}
      </div>
    );
  }

  if (variant === 'underline') {
    return (
      <div className={`flex items-center gap-6 border-b border-white/[0.08] ${className}`}>
        {tabs.map((tab) => {
          const isActive = tab.id === activeTab;
          return (
            <button
              key={tab.id}
              onClick={() => onChange(tab.id)}
              className={`relative pb-3 text-xs sm:text-sm font-semibold transition-colors cursor-pointer border-0 bg-transparent ${
                isActive ? 'text-white' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <span className="flex items-center gap-2">
                {tab.icon}
                <span>{tab.label}</span>
                {tab.badge !== undefined && (
                  <span
                    className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold ${
                      isActive ? 'bg-violet-500/25 text-violet-300' : 'bg-white/[0.06] text-slate-400'
                    }`}
                  >
                    {tab.badge}
                  </span>
                )}
              </span>
              {isActive && (
                <motion.div
                  layoutId="activeUnderline"
                  className="absolute bottom-0 left-0 right-0 h-0.5 bg-violet-500 rounded-full shadow-[0_0_8px_rgba(139,92,246,0.6)]"
                  transition={motionTokens.spring.medium}
                />
              )}
            </button>
          );
        })}
      </div>
    );
  }

  // Default pill style
  return (
    <div className={`flex flex-wrap items-center gap-2 ${className}`}>
      {tabs.map((tab) => {
        const isActive = tab.id === activeTab;
        return (
          <button
            key={tab.id}
            onClick={() => onChange(tab.id)}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer flex items-center gap-2 border ${
              isActive
                ? 'bg-violet-600 text-white border-violet-500 shadow-[0_0_16px_rgba(139,92,246,0.3)]'
                : 'bg-[#181924] text-slate-400 hover:text-white border-white/[0.07] hover:border-white/[0.14]'
            }`}
          >
            {tab.icon}
            <span>{tab.label}</span>
            {tab.badge !== undefined && (
              <span
                className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold ${
                  isActive ? 'bg-white/20 text-white' : 'bg-white/[0.08] text-slate-400'
                }`}
              >
                {tab.badge}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
};

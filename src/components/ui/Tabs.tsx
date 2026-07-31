import React from 'react';
import { motion } from 'motion/react';

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
      <div className={`inline-flex items-center p-1 bg-slate-100 rounded-2xl border border-slate-200/80 ${className}`}>
        {tabs.map((tab) => {
          const isActive = tab.id === activeTab;
          return (
            <button
              key={tab.id}
              onClick={() => onChange(tab.id)}
              className={`relative px-4 py-2 rounded-xl text-xs font-bold transition-colors cursor-pointer border-0 ${
                isActive ? 'text-slate-900' : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              {isActive && (
                <motion.div
                  layoutId="activeSegment"
                  className="absolute inset-0 bg-white rounded-xl shadow-xs border border-slate-200/60"
                  transition={{ type: 'spring', stiffness: 500, damping: 35 }}
                />
              )}
              <span className="relative z-10 flex items-center gap-2">
                {tab.icon}
                <span>{tab.label}</span>
                {tab.badge !== undefined && (
                  <span
                    className={`px-1.5 py-0.2 rounded-full text-[10px] font-extrabold ${
                      isActive ? 'bg-indigo-100 text-indigo-700' : 'bg-slate-200 text-slate-600'
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
      <div className={`flex items-center gap-6 border-b border-slate-200 ${className}`}>
        {tabs.map((tab) => {
          const isActive = tab.id === activeTab;
          return (
            <button
              key={tab.id}
              onClick={() => onChange(tab.id)}
              className={`relative pb-3 text-xs sm:text-sm font-bold transition-colors cursor-pointer border-0 ${
                isActive ? 'text-indigo-600' : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <span className="flex items-center gap-2">
                {tab.icon}
                <span>{tab.label}</span>
                {tab.badge !== undefined && (
                  <span
                    className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold ${
                      isActive ? 'bg-indigo-100 text-indigo-700' : 'bg-slate-100 text-slate-600'
                    }`}
                  >
                    {tab.badge}
                  </span>
                )}
              </span>
              {isActive && (
                <motion.div
                  layoutId="activeUnderline"
                  className="absolute bottom-0 left-0 right-0 h-0.5 bg-indigo-600 rounded-full"
                  transition={{ type: 'spring', stiffness: 500, damping: 35 }}
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
            className={`px-4 py-2 rounded-2xl text-xs font-bold transition-all cursor-pointer flex items-center gap-2 border ${
              isActive
                ? 'bg-indigo-600 text-white border-indigo-600 shadow-md shadow-indigo-500/20'
                : 'bg-white text-slate-600 hover:text-slate-900 border-slate-200 hover:border-slate-300 shadow-2xs'
            }`}
          >
            {tab.icon}
            <span>{tab.label}</span>
            {tab.badge !== undefined && (
              <span
                className={`px-1.5 py-0.2 rounded-full text-[10px] font-extrabold ${
                  isActive ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-600'
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

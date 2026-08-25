import React, { useState, useRef, useEffect } from 'react';
import { motion, useScroll, useTransform, useSpring, useReducedMotion, AnimatePresence } from 'motion/react';
import { supabase } from '../lib/supabase';
import { UserProfile, Skill } from '../types';
import { triggerCelebrationConfetti } from '../lib/gamification';
import { Spotlight } from './motion/Spotlight';
import { MagneticButton } from './motion/MagneticButton';
import { RevealText } from './motion/RevealText';
import { FadeUp } from './motion/FadeUp';
import { 
  Sparkles, BookOpen, ExternalLink, CheckCircle2, Circle, 
  Clock, ArrowRight, Zap, RotateCcw, Sliders, DollarSign, Gift,
  Check, AlertCircle, Compass, Layers, Send, LayoutGrid, GraduationCap,
  Target, Award, Bookmark, ArrowUpRight, ChevronRight, Users, Play,
  Cpu, Flame, Code, BookMarked, Sparkle, ShieldCheck
} from 'lucide-react';

type Resource = { name: string; url: string; type: string; price?: string };

export type MilestoneStage = 'DISCOVER' | 'FOUNDATION' | 'PRACTICE' | 'BUILD' | 'EXCHANGE' | 'MASTER';

export type Step = {
  stage: MilestoneStage;
  title: string;
  subtitle: string;
  description: string;
  estimatedTime: string;
  keyDeliverable: string;
  resources: { free: Resource[]; paid: Resource[] };
};

export type LearningPath = { 
  id: string; 
  skill: string; 
  currentLevel: string;
  targetLevel: string;
  steps: Step[]; 
};

interface SkillPathViewProps {
  currentUser: UserProfile | null;
  onNavigateToExplore?: (skillQuery?: string) => void;
  onOpenStudyHub?: (skill: Skill) => void;
}

const STAGES_META: Record<MilestoneStage, { 
  number: number; 
  label: string; 
  tagline: string; 
  icon: any; 
  glowColor: string;
  accentClass: string;
}> = {
  DISCOVER: {
    number: 1,
    label: 'DISCOVER',
    tagline: 'Mental Models & Landscape',
    icon: Compass,
    glowColor: 'rgba(139, 92, 246, 0.4)',
    accentClass: 'text-violet-400 border-violet-500/30 bg-violet-500/10',
  },
  FOUNDATION: {
    number: 2,
    label: 'FOUNDATION',
    tagline: 'Core Syntax & Tooling',
    icon: Layers,
    glowColor: 'rgba(168, 85, 247, 0.4)',
    accentClass: 'text-purple-400 border-purple-500/30 bg-purple-500/10',
  },
  PRACTICE: {
    number: 3,
    label: 'PRACTICE',
    tagline: 'Drills & Pattern Recognition',
    icon: Cpu,
    glowColor: 'rgba(192, 132, 252, 0.4)',
    accentClass: 'text-lavender-300 border-lavender-400/30 bg-lavender-400/10',
  },
  BUILD: {
    number: 4,
    label: 'BUILD',
    tagline: 'Portfolio & Artifact Creation',
    icon: Code,
    glowColor: 'rgba(139, 92, 246, 0.4)',
    accentClass: 'text-violet-400 border-violet-500/30 bg-violet-500/10',
  },
  EXCHANGE: {
    number: 5,
    label: 'EXCHANGE',
    tagline: 'Peer Barter & Knowledge Transfer',
    icon: Users,
    glowColor: 'rgba(52, 211, 153, 0.4)',
    accentClass: 'text-emerald-400 border-emerald-500/30 bg-emerald-500/10',
  },
  MASTER: {
    number: 6,
    label: 'MASTER',
    tagline: 'Edge Cases & Certification',
    icon: Award,
    glowColor: 'rgba(251, 191, 36, 0.4)',
    accentClass: 'text-amber-400 border-amber-500/30 bg-amber-500/10',
  }
};

const POPULAR_SKILLS = [
  'React & Next.js', 
  'UI/UX & Product Design', 
  'Python & AI Engineering', 
  'Public Speaking', 
  'Digital Marketing & SEO', 
  'Fullstack Web Architecture'
];

const SkillPathView = React.memo(function SkillPathView({ currentUser, onNavigateToExplore, onOpenStudyHub }: SkillPathViewProps) {
  const [skill, setSkill] = useState('React & Next.js');
  const [currentLevel, setCurrentLevel] = useState('beginner');
  const [targetLevel, setTargetLevel] = useState('expert');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [path, setPath] = useState<LearningPath | null>(null);
  const [completedSteps, setCompletedSteps] = useState<Record<number, boolean>>({});
  const [instruction, setInstruction] = useState('');
  const [activeStageIndex, setActiveStageIndex] = useState(0);

  const containerRef = useRef<HTMLDivElement>(null);
  const pathTimelineRef = useRef<HTMLDivElement>(null);
  const prefersReducedMotion = useReducedMotion();

  // Scroll tracking for progressive storytelling
  const { scrollYProgress } = useScroll({
    target: pathTimelineRef,
    offset: ['start 65%', 'end 35%']
  });

  const smoothProgress = useSpring(scrollYProgress, {
    stiffness: 80,
    damping: 24,
    restDelta: 0.001
  });

  // Calculate active stage based on scroll progress
  useEffect(() => {
    const unsubscribe = scrollYProgress.on('change', (v) => {
      if (!path) return;
      const count = path.steps.length || 6;
      const index = Math.min(count - 1, Math.max(0, Math.floor(v * count)));
      setActiveStageIndex(index);
    });
    return () => unsubscribe();
  }, [scrollYProgress, path]);

  // Generate Default Initial Path on mount for a rich out-of-the-box experience
  useEffect(() => {
    generateDefaultMilestones('React & Next.js', 'beginner', 'expert');
  }, []);

  function generateDefaultMilestones(skillName: string, fromLvl: string, toLvl: string): LearningPath {
    const defaultSteps: Step[] = [
      {
        stage: 'DISCOVER',
        title: `Mental Models of ${skillName}`,
        subtitle: 'Understand the core architecture & fundamental paradigms',
        description: `Map out the complete modern ecosystem of ${skillName}. Understand how state flows, lifecycle mechanics, and the trade-offs of modern declarative design patterns.`,
        estimatedTime: '3 - 5 Hours',
        keyDeliverable: 'Domain Cheat-Sheet & Architecture Diagram',
        resources: {
          free: [
            { name: `${skillName} Official Documentation`, url: 'https://react.dev', type: 'Docs' },
            { name: 'Architecture Overview & Paradigms (W3Schools / MDN)', url: 'https://www.w3schools.com', type: 'Tutorial' }
          ],
          paid: [
            { name: 'Comprehensive Frontend Masters Deep Dive', url: 'https://frontendmasters.com', type: 'Course', price: '$39/mo' }
          ]
        }
      },
      {
        stage: 'FOUNDATION',
        title: 'Core Syntax, Tooling & Mechanics',
        subtitle: 'Establish rigorous patterns and build clean mental scaffolding',
        description: `Master hooks, custom state stores, async error boundaries, and component modularity. Avoid common anti-patterns like layout thrashing and unnecessary re-renders.`,
        estimatedTime: '8 - 12 Hours',
        keyDeliverable: 'Fully Typed Component Playground',
        resources: {
          free: [
            { name: 'TypeScript & Modern React Cheatsheet', url: 'https://react.dev/learn', type: 'Guide' },
            { name: 'Interactive Kata Sandboxes', url: 'https://codesandbox.io', type: 'Drills' }
          ],
          paid: [
            { name: 'Complete Developer Academy Bootcamp', url: 'https://egghead.io', type: 'Bootcamp', price: '$25/mo' }
          ]
        }
      },
      {
        stage: 'PRACTICE',
        title: 'Targeted Drills & Pattern Recognition',
        subtitle: 'Solve real engineering challenges and internalize problem solving',
        description: `Solve 10+ focused exercises including dynamic search filtering, animated drawer choreography, optimistic UI updates, and server cache synchronization.`,
        estimatedTime: '10 - 15 Hours',
        keyDeliverable: 'Repository of 10 Micro-Challenges',
        resources: {
          free: [
            { name: 'LeetCode & Frontend Practice Problems', url: 'https://leetcode.com', type: 'Drills' },
            { name: 'Open-Source Pattern Libraries', url: 'https://github.com', type: 'Code' }
          ],
          paid: [
            { name: 'GreatFrontend Senior Interview Katas', url: 'https://greatfrontend.com', type: 'Platform', price: '$29' }
          ]
        }
      },
      {
        stage: 'BUILD',
        title: 'Production Artifact & Full-Stack App',
        subtitle: 'Architect and deploy an end-to-end usable product',
        description: `Build and deploy a complete production-grade application with persistent data storage, responsive mobile-first typography, fluid motion choreography, and high-contrast accessibility.`,
        estimatedTime: '15 - 25 Hours',
        keyDeliverable: 'Shipped Web App with Live URL & GitHub Repo',
        resources: {
          free: [
            { name: 'Vercel / Cloud Run Deployment Guide', url: 'https://vercel.com/docs', type: 'Guide' },
            { name: 'Tailwind CSS Modern Styling Guide', url: 'https://tailwindcss.com', type: 'Docs' }
          ],
          paid: [
            { name: 'Production Fullstack Masterclass', url: 'https://joyofreact.com', type: 'Masterclass', price: '$149' }
          ]
        }
      },
      {
        stage: 'EXCHANGE',
        title: 'SkillSwap Peer Barter & Rehearsal',
        subtitle: 'Teach what you know to another swapper to cement your mastery',
        description: `Connect with a peer in the SkillSwap explore directory. Conduct a 45-minute live 1-on-1 swap or interactive study session. Explaining concepts to others is the highest-leverage accelerator of mastery.`,
        estimatedTime: '2 - 4 Hours',
        keyDeliverable: 'Completed Peer Barter Session with 5★ Review',
        resources: {
          free: [
            { name: 'SkillSwap Peer Matching Directory', url: '#', type: 'Platform' },
            { name: 'Feynman Technique Teaching Framework', url: 'https://fs.blog/feynman-technique/', type: 'Article' }
          ],
          paid: []
        }
      },
      {
        stage: 'MASTER',
        title: 'Optimization, Edge Cases & Verification',
        subtitle: 'Achieve verified expertise and mentor new practitioners',
        description: `Profile runtime performance, audit bundle boundaries, implement end-to-end testing, and complete official industry verification or SkillSwap Verified Mentor status.`,
        estimatedTime: '12 - 20 Hours',
        keyDeliverable: 'Verified SkillSwap Mentor Badge',
        resources: {
          free: [
            { name: 'Web Vitals & Performance Profiling Guide', url: 'https://web.dev', type: 'Docs' },
            { name: 'SkillSwap Community Verified Guild', url: '#', type: 'Badge' }
          ],
          paid: [
            { name: 'Official Industry Certification Exam', url: 'https://aws.amazon.com/certification', type: 'Certificate', price: '$150' }
          ]
        }
      }
    ];

    const generatedPath: LearningPath = {
      id: `path-${Date.now()}`,
      skill: skillName,
      currentLevel: fromLvl,
      targetLevel: toLvl,
      steps: defaultSteps
    };

    setPath(generatedPath);
    return generatedPath;
  }

  async function generatePath(targetSkill?: string) {
    const selectedSkill = (targetSkill || skill).trim();
    if (!selectedSkill) {
      setError('Please enter or select a skill.');
      return;
    }
    setError('');
    setLoading(true);

    try {
      // Try edge function if available
      const { data, error: fnError } = await supabase.functions.invoke('learning-path-agent', {
        body: { action: 'generate', skill: selectedSkill, currentLevel, targetLevel, userId: currentUser?.id },
      });

      if (!fnError && data && Array.isArray((data as any).steps) && (data as any).steps.length > 0) {
        // Map edge function steps into the 6-stage canonical system
        const stagesList: MilestoneStage[] = ['DISCOVER', 'FOUNDATION', 'PRACTICE', 'BUILD', 'EXCHANGE', 'MASTER'];
        const mappedSteps: Step[] = (data as any).steps.map((st: any, idx: number) => ({
          stage: stagesList[Math.min(idx, stagesList.length - 1)],
          title: st.title || `Milestone ${idx + 1}`,
          subtitle: st.subtitle || `Progression Stage ${idx + 1}`,
          description: st.description || 'Master key concepts with structured exercises and peer exchanges.',
          estimatedTime: st.estimatedTime || '5 - 10 Hours',
          keyDeliverable: st.keyDeliverable || 'Hands-on project artifact',
          resources: st.resources || { free: [], paid: [] }
        }));

        setPath({
          id: (data as any).id || `path-${Date.now()}`,
          skill: selectedSkill,
          currentLevel,
          targetLevel,
          steps: mappedSteps
        });
        setCompletedSteps({});
      } else {
        // Fallback to high-quality procedural roadmap
        generateDefaultMilestones(selectedSkill, currentLevel, targetLevel);
      }
    } catch (err: any) {
      console.warn('Learning path edge function unavailable, generating custom matrix:', err);
      generateDefaultMilestones(selectedSkill, currentLevel, targetLevel);
    } finally {
      setLoading(false);
    }
  }

  async function refinePath() {
    if (!path || !instruction.trim()) return;

    setLoading(true);
    setError('');
    let targetPathId = path.id;

    try {
      // If the roadmap was generated via local fallback, auto-persist it to learning_paths first
      if (targetPathId.startsWith('path-')) {
        const { data: insertedRow, error: insertErr } = await supabase
          .from('learning_paths')
          .insert({
            user_id: currentUser?.id || null,
            skill: path.skill || skill,
            current_level: path.currentLevel || currentLevel,
            target_level: path.targetLevel || targetLevel,
            path_json: {
              skill: path.skill || skill,
              currentLevel: path.currentLevel || currentLevel,
              targetLevel: path.targetLevel || targetLevel,
              steps: path.steps
            }
          })
          .select('id')
          .single();

        if (insertErr || !insertedRow?.id) {
          throw new Error(insertErr?.message || 'Could not save local roadmap to database before refining.');
        }

        targetPathId = insertedRow.id;
        // Update local state with real persisted UUID
        setPath(prev => prev ? { ...prev, id: targetPathId } : null);
      }

      const { data, error: fnError } = await supabase.functions.invoke('learning-path-agent', {
        body: { action: 'refine', learningPathId: targetPathId, instruction },
      });
      if (fnError) throw fnError;
      if (data && Array.isArray((data as any).steps)) {
        setPath({
          id: (data as any).id || targetPathId,
          skill: (data as any).skill || path.skill,
          currentLevel: (data as any).currentLevel || path.currentLevel,
          targetLevel: (data as any).targetLevel || path.targetLevel,
          steps: (data as any).steps
        });
      } else {
        throw new Error('Refinement response did not contain updated milestone steps.');
      }
      setInstruction('');
      triggerCelebrationConfetti();
    } catch (err: any) {
      console.error('Failed to refine learning path:', err);
      const errorDetail = err?.message || err?.error_description || (typeof err === 'string' ? err : '');
      setError(errorDetail ? `Couldn't apply that refinement — ${errorDetail}` : "Couldn't apply that refinement. Please check your connection and try again.");
    } finally {
      setLoading(false);
    }
  }

  const toggleStepComplete = (index: number) => {
    setCompletedSteps(prev => {
      const isNowComplete = !prev[index];
      if (isNowComplete) {
        triggerCelebrationConfetti();
      }
      return { ...prev, [index]: isNowComplete };
    });
  };

  const totalSteps = path?.steps?.length || 6;
  const completedCount = Object.values(completedSteps).filter(Boolean).length;
  const progressPercent = Math.round((completedCount / totalSteps) * 100);

  return (
    <div ref={containerRef} id="skill-path-root" className="space-y-12 pb-24">
      {/* 1. HERO SECTION: "Your path to mastering [skill]" */}
      <section className="relative pt-2 sm:pt-6">
        {/* Ambient violet aura */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-4xl h-64 bg-gradient-to-b from-violet-600/15 via-purple-600/5 to-transparent blur-3xl -z-10 pointer-events-none" />

        <div className="max-w-3xl mx-auto text-center space-y-4">
          <FadeUp delay={0.05}>
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-surface-raised border border-white/10 text-xs font-semibold text-lavender-200 mb-1">
              <Sparkles className="w-3.5 h-3.5 text-violet-400" />
              <span>AI Skill Path Engine</span>
              <span className="w-1.5 h-1.5 rounded-full bg-violet-400"></span>
              <span className="text-[11px] text-text-sub font-normal">6-Stage Mastery Spine</span>
            </div>
          </FadeUp>

          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black tracking-tight text-white font-display leading-[1.08]">
            <RevealText text={`Your path to mastering ${path?.skill || skill}.`} />
          </h1>

          <FadeUp delay={0.15}>
            <p className="text-text-sub text-sm sm:text-base max-w-xl mx-auto leading-relaxed">
              A scroll-driven progression system engineered to take you from initial discovery to peer barter exchange and certified mastery.
            </p>
          </FadeUp>

          {/* Generator / Skill Input Bar */}
          <FadeUp delay={0.25}>
            <div className="mt-8 max-w-2xl mx-auto space-y-4 bg-surface-base border border-white/10 p-4 sm:p-5 rounded-3xl shadow-2xl">
              <div className="flex flex-col sm:flex-row gap-3">
                <div className="relative flex-1">
                  <input
                    type="text"
                    value={skill}
                    onChange={(e) => setSkill(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') generatePath(skill);
                    }}
                    placeholder="Enter any skill (e.g. Next.js, Rust, UI Design, Guitar)..."
                    className="w-full bg-surface-raised border border-white/10 rounded-2xl pl-4 pr-10 py-3 text-sm text-white placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-violet-500 transition"
                  />
                  <Target className="w-4 h-4 text-text-muted absolute right-3.5 top-3.5 pointer-events-none" />
                </div>

                <button
                  type="button"
                  onClick={() => generatePath(skill)}
                  disabled={loading}
                  className="px-6 py-3 bg-violet-600 hover:bg-violet-500 active:bg-violet-700 text-white font-bold rounded-2xl text-xs transition flex items-center justify-center gap-2 shadow-lg shadow-violet-500/25 disabled:opacity-50 cursor-pointer shrink-0"
                >
                  {loading ? (
                    <>
                      <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      <span>Synthesizing...</span>
                    </>
                  ) : (
                    <>
                      <Zap className="w-3.5 h-3.5" />
                      <span>Generate Path</span>
                    </>
                  )}
                </button>
              </div>

              {/* Popular Skill Badges */}
              <div className="flex items-center justify-center flex-wrap gap-2 pt-1">
                <span className="text-[11px] font-medium text-text-dim uppercase tracking-wider">Explore:</span>
                {POPULAR_SKILLS.map((ps) => (
                  <button
                    key={ps}
                    type="button"
                    onClick={() => {
                      setSkill(ps);
                      generatePath(ps);
                    }}
                    className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition cursor-pointer ${
                      path?.skill === ps
                        ? 'bg-violet-600/30 text-lavender-200 border border-violet-500/40'
                        : 'bg-surface-raised/70 hover:bg-surface-interactive text-text-sub hover:text-white border border-white/5'
                    }`}
                  >
                    {ps}
                  </button>
                ))}
              </div>
            </div>
          </FadeUp>
        </div>
      </section>

      {/* 2. PROGRESSION HEADER SUMMARY & MASTER ROADMAP OVERVIEW */}
      <section className="max-w-5xl mx-auto">
        <div className="bg-surface-base border border-white/10 rounded-3xl p-6 sm:p-8 flex flex-col md:flex-row md:items-center justify-between gap-6 shadow-xl relative overflow-hidden">
          {/* Subtle Ambient Backing */}
          <div className="absolute top-0 right-0 w-80 h-80 bg-violet-600/10 rounded-full blur-3xl pointer-events-none" />

          <div className="space-y-2 max-w-xl relative z-10">
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-md bg-violet-500/20 text-lavender-300 border border-violet-500/30 text-xs font-bold uppercase tracking-wider">
                {path?.skill || 'Target Skill'}
              </span>
              <span className="text-xs text-text-dim capitalize">
                {currentLevel} → {targetLevel}
              </span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-white font-display tracking-tight">
              6-Stage Mastery Roadmap
            </h2>
            <p className="text-xs sm:text-sm text-text-sub leading-relaxed">
              Follow the scroll timeline below. Each node represents a distinct milestone with curated documentation, actionable projects, and peer exchange prompts.
            </p>
          </div>

          {/* Mastery Progress Card */}
          <div className="bg-surface-raised rounded-2xl p-5 border border-white/10 min-w-[220px] shadow-lg relative z-10">
            <div className="flex items-center justify-between gap-2 mb-1.5">
              <span className="text-xs font-bold text-lavender-300">Path Completion</span>
              <span className="text-xs font-semibold text-text-sub">{completedCount} of {totalSteps}</span>
            </div>
            <div className="text-3xl font-black text-white font-display tracking-tight mb-2.5">
              {progressPercent}%
            </div>
            <div className="w-full bg-black/50 rounded-full h-2 overflow-hidden border border-white/5 p-0.5">
              <motion.div 
                className="bg-gradient-to-r from-violet-600 via-purple-500 to-emerald-400 h-full rounded-full transition-all duration-500"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          </div>
        </div>
      </section>

      {/* 3. SCROLL-DRIVEN 6-STAGE PROGRESSION SYSTEM */}
      <section ref={pathTimelineRef} className="max-w-4xl mx-auto relative pt-4">
        {/* Vertical Glowing Energy Spine (Left-aligned on mobile, Spine on desktop) */}
        <div className="absolute left-6 sm:left-10 top-12 bottom-12 w-[2px] bg-white/5 rounded-full pointer-events-none">
          {/* Animated filled beam tracking scroll progress */}
          <motion.div 
            className="w-full bg-gradient-to-b from-violet-500 via-purple-400 to-emerald-400 shadow-[0_0_12px_rgba(139,92,246,0.8)]"
            style={{ 
              height: useTransform(smoothProgress, [0, 1], ['0%', '100%']),
              originY: 0
            }}
          />
        </div>

        {/* The 6 Milestones */}
        <div className="space-y-12 sm:space-y-16">
          {(path?.steps || []).map((step, idx) => {
            const stageMeta = STAGES_META[step.stage] || STAGES_META.DISCOVER;
            const Icon = stageMeta.icon;
            const isCompleted = !!completedSteps[idx];
            const isActive = activeStageIndex === idx;

            return (
              <div 
                key={idx} 
                id={`milestone-${step.stage.toLowerCase()}`}
                className="relative pl-16 sm:pl-24 group"
              >
                {/* Node Orb on the spine */}
                <div className="absolute left-6 sm:left-10 -translate-x-1/2 top-6 z-20">
                  <motion.button
                    type="button"
                    onClick={() => toggleStepComplete(idx)}
                    whileHover={{ scale: 1.15 }}
                    whileTap={{ scale: 0.92 }}
                    className={`w-10 h-10 sm:w-12 sm:h-12 rounded-2xl flex items-center justify-center transition-all duration-300 border-2 cursor-pointer ${
                      isCompleted 
                        ? 'bg-emerald-600 border-emerald-400 text-white shadow-lg shadow-emerald-500/30' 
                        : isActive
                          ? 'bg-violet-600 border-lavender-300 text-white shadow-xl shadow-violet-500/50 ring-4 ring-violet-500/20'
                          : 'bg-surface-raised border-white/15 text-text-muted hover:border-white/30 hover:text-white'
                    }`}
                  >
                    {isCompleted ? (
                      <Check className="w-5 h-5 stroke-[3]" />
                    ) : (
                      <Icon className="w-5 h-5" />
                    )}
                  </motion.button>
                </div>

                {/* Milestone Content Card */}
                <Spotlight 
                  className={`rounded-3xl border transition-all duration-300 ${
                    isCompleted 
                      ? 'bg-surface-base/90 border-emerald-500/30' 
                      : isActive 
                        ? 'bg-surface-base border-violet-500/40 shadow-2xl shadow-violet-500/10' 
                        : 'bg-surface-base border-white/10 hover:border-white/20'
                  }`}
                >
                  <div className="p-6 sm:p-8 space-y-6">
                    {/* Stage Header */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-white/5 pb-5">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className={`px-2.5 py-0.5 rounded-lg text-xs font-black tracking-wider uppercase border ${stageMeta.accentClass}`}>
                            Stage {stageMeta.number}: {stageMeta.label}
                          </span>
                          <span className="text-xs text-text-dim font-medium">
                            • {stageMeta.tagline}
                          </span>
                        </div>
                        <h3 className={`text-xl sm:text-2xl font-bold font-display tracking-tight pt-1 ${
                          isCompleted ? 'text-text-muted line-through' : 'text-white'
                        }`}>
                          {step.title}
                        </h3>
                        <p className="text-xs text-text-sub font-medium">
                          {step.subtitle}
                        </p>
                      </div>

                      {/* Time & Checklist trigger */}
                      <div className="flex items-center gap-2 shrink-0">
                        <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-surface-raised border border-white/5 text-xs text-text-sub font-medium">
                          <Clock className="w-3.5 h-3.5 text-violet-400" />
                          <span>{step.estimatedTime}</span>
                        </div>

                        <button
                          type="button"
                          onClick={() => toggleStepComplete(idx)}
                          className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition cursor-pointer border ${
                            isCompleted
                              ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30 hover:bg-emerald-500/30'
                              : 'bg-surface-raised hover:bg-surface-interactive text-text-sub hover:text-white border-white/10'
                          }`}
                        >
                          {isCompleted ? 'Completed ✓' : 'Mark Done'}
                        </button>
                      </div>
                    </div>

                    {/* Description */}
                    <p className="text-xs sm:text-sm text-text-sub leading-relaxed">
                      {step.description}
                    </p>

                    {/* Key Deliverable Box */}
                    <div className="p-4 rounded-2xl bg-surface-raised border border-white/5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                      <div>
                        <span className="text-[10px] font-bold text-text-dim uppercase tracking-wider block">
                          Key Deliverable / Milestone Goal
                        </span>
                        <span className="font-bold text-white text-xs sm:text-sm mt-0.5 block">
                          🎯 {step.keyDeliverable}
                        </span>
                      </div>

                      {step.stage === 'EXCHANGE' && onNavigateToExplore && (
                        <button
                          type="button"
                          onClick={() => onNavigateToExplore(path?.skill || skill)}
                          className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl text-xs transition flex items-center justify-center gap-1.5 shadow-lg shadow-emerald-600/20 cursor-pointer shrink-0"
                        >
                          <span>Find Barter Partner</span>
                          <ArrowRight className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>

                    {/* Curated Resources (Free + Paid) */}
                    {(step.resources?.free?.length > 0 || step.resources?.paid?.length > 0) && (
                      <div className="space-y-3 pt-2">
                        <span className="text-xs font-bold text-text-dim uppercase tracking-wider flex items-center gap-1.5">
                          <BookMarked className="w-3.5 h-3.5 text-violet-400" />
                          Curated Learning Materials
                        </span>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                          {/* Free Resources */}
                          {step.resources?.free?.map((res, rIdx) => (
                            <a
                              key={rIdx}
                              href={res.url}
                              target="_blank"
                              rel="noreferrer"
                              className="group/res flex items-center justify-between p-3 rounded-2xl bg-surface-raised hover:bg-surface-interactive border border-white/5 hover:border-violet-500/30 transition no-underline text-xs"
                            >
                              <div className="min-w-0 pr-2">
                                <span className="font-semibold text-white group-hover/res:text-lavender-200 block truncate">
                                  {res.name}
                                </span>
                                <span className="text-[10px] text-emerald-400 font-bold mt-0.5 block">
                                  Free • {res.type}
                                </span>
                              </div>
                              <ArrowUpRight className="w-4 h-4 text-text-muted group-hover/res:text-violet-400 shrink-0 transition" />
                            </a>
                          ))}

                          {/* Paid / Certification Resources */}
                          {step.resources?.paid?.map((res, rIdx) => (
                            <a
                              key={rIdx}
                              href={res.url}
                              target="_blank"
                              rel="noreferrer"
                              className="group/res flex items-center justify-between p-3 rounded-2xl bg-surface-raised hover:bg-surface-interactive border border-white/5 hover:border-purple-500/30 transition no-underline text-xs"
                            >
                              <div className="min-w-0 pr-2">
                                <span className="font-semibold text-white group-hover/res:text-lavender-200 block truncate">
                                  {res.name}
                                </span>
                                <span className="text-[10px] text-lavender-300 font-bold mt-0.5 block">
                                  {res.price || 'Paid'} • {res.type}
                                </span>
                              </div>
                              <ArrowUpRight className="w-4 h-4 text-text-muted group-hover/res:text-purple-400 shrink-0 transition" />
                            </a>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </Spotlight>
              </div>
            );
          })}
        </div>
      </section>

      {/* 4. AI REFINE BAR */}
      {path && (() => {
        const isFallbackPath = path.id.startsWith('path-');
        return (
          <section className="max-w-4xl mx-auto">
            <div className="bg-surface-base border border-white/10 rounded-3xl p-6 shadow-2xl space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <label className="text-xs font-bold text-lavender-300 uppercase tracking-wider flex items-center gap-2">
                  <Sliders className="w-4 h-4 text-violet-400" />
                  <span>Refine Roadmap with Natural Language</span>
                </label>
                <span className="text-[11px] text-text-muted">
                  {isFallbackPath ? 'Local roadmap (will auto-save on refinement)' : 'Add project types, adjust pace, or prioritize free tutorials'}
                </span>
              </div>

              {error && (
                <div className="p-3 bg-rose-500/10 border border-rose-500/30 rounded-2xl flex items-center justify-between gap-3 text-xs text-rose-300 animate-in fade-in duration-200">
                  <div className="flex items-center gap-2 min-w-0">
                    <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
                    <span className="truncate">{error}</span>
                  </div>
                  <button onClick={() => setError('')} className="p-1 hover:text-white text-rose-400/80 cursor-pointer shrink-0">✕</button>
                </div>
              )}

              <div className="flex flex-col sm:flex-row gap-2.5">
                <input
                  type="text"
                  value={instruction}
                  onChange={(e) => {
                    setInstruction(e.target.value);
                    if (error) setError('');
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') refinePath();
                  }}
                  placeholder="e.g. Include 3 more hands-on portfolio ideas and emphasize async API handling..."
                  disabled={loading}
                  className="flex-1 bg-surface-raised border border-white/10 text-white placeholder:text-text-muted rounded-2xl px-4 py-3 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-violet-500 transition disabled:opacity-50"
                />
                <button
                  type="button"
                  onClick={refinePath}
                  disabled={loading || !instruction.trim()}
                  className="px-6 py-3 bg-violet-600 hover:bg-violet-500 text-white font-bold rounded-2xl text-xs transition flex items-center justify-center gap-2 disabled:opacity-50 shrink-0 shadow-lg shadow-violet-500/20 cursor-pointer disabled:cursor-not-allowed"
                >
                  {loading ? (
                    <>
                      <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      <span>Updating...</span>
                    </>
                  ) : (
                    <>
                      <Send className="w-3.5 h-3.5" />
                      <span>Apply Refinement</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </section>
        );
      })()}
    </div>
  );
});

export default SkillPathView;

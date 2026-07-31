import React, { useState } from 'react';
import { supabase } from '../lib/supabase';
import { UserProfile } from '../types';
import { triggerCelebrationConfetti } from '../lib/gamification';
import { 
  Sparkles, BookOpen, ExternalLink, CheckCircle2, Circle, 
  Clock, ArrowRight, Zap, RotateCcw, Sliders, DollarSign, Gift,
  Check, AlertCircle, Compass, Layers, Send, LayoutGrid, GraduationCap,
  Target, Award, Bookmark, ArrowUpRight
} from 'lucide-react';

type Resource = { name: string; url: string; type: string; price?: string };
type Step = {
  title: string;
  description: string;
  estimatedTime: string;
  resources: { free: Resource[]; paid: Resource[] };
};
type LearningPath = { id: string; skill: string; steps: Step[] };

export default function SkillPathView({ currentUser }: { currentUser: UserProfile | null }) {
  const [path, setPath] = useState<LearningPath | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [skill, setSkill] = useState('');
  const [currentLevel, setCurrentLevel] = useState('beginner');
  const [targetLevel, setTargetLevel] = useState('expert');
  const [instruction, setInstruction] = useState('');
  const [completedSteps, setCompletedSteps] = useState<Record<number, boolean>>({});

  const popularSkills = [
    'React & Next.js', 'UI/UX Design', 'Data Science & AI', 
    'Public Speaking', 'Python Automation', 'Product Management'
  ];

  async function generatePath(targetSkill?: string) {
    const selectedSkill = targetSkill || skill;
    if (!selectedSkill.trim()) {
      setError('Please enter or select a skill.');
      return;
    }
    setError('');
    setLoading(true);
    try {
      const { data, error: fnError } = await supabase.functions.invoke('learning-path-agent', {
        body: { action: 'generate', skill: selectedSkill, currentLevel, targetLevel, userId: currentUser?.id },
      });
      if (fnError) throw fnError;
      setPath(data as LearningPath);
      setCompletedSteps({});
    } catch (err: any) {
      setError(err.message || 'Failed to generate learning path.');
    } finally {
      setLoading(false);
    }
  }

  async function refinePath() {
    if (!path || !instruction.trim()) return;
    setLoading(true);
    setError('');
    try {
      const { data, error: fnError } = await supabase.functions.invoke('learning-path-agent', {
        body: { action: 'refine', learningPathId: path.id, instruction },
      });
      if (fnError) throw fnError;
      setPath(data as LearningPath);
      setInstruction('');
    } catch (err: any) {
      setError(err.message || 'Failed to refine learning path.');
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

  const completedCount = Object.values(completedSteps).filter(Boolean).length;
  const totalSteps = path?.steps?.length || 0;
  const progressPercent = totalSteps > 0 ? Math.round((completedCount / totalSteps) * 100) : 0;

  return (
    <div className="max-w-5xl mx-auto space-y-8 pb-12">
      {/* Option 2 Interactive Grid Academy Banner */}
      <div className="relative overflow-hidden rounded-[28px] bg-gradient-to-br from-zinc-950 via-zinc-900 to-indigo-950/80 border border-zinc-800 text-white p-6 sm:p-8 shadow-2xl">
        {/* Decorative Grid Mesh */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff08_1px,transparent_1px),linear-gradient(to_bottom,#ffffff08_1px,transparent_1px)] bg-[size:24px_24px] pointer-events-none" />
        <div className="absolute top-0 right-0 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-1/3 w-80 h-80 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-bold tracking-wide uppercase">
              <LayoutGrid className="w-3.5 h-3.5 text-emerald-400" />
              <span>AI Learning Agent • Skill Matrix</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight flex items-center gap-2.5">
              <span>Skill Matrix & Master Roadmap</span>
              <GraduationCap className="w-7 h-7 text-emerald-400 hidden sm:inline-block" />
            </h2>
            <p className="text-sm text-zinc-400 leading-relaxed">
              An interactive learning matrix powered by Groq LLM and Tavily web research to take you step-by-step from beginner to industry-certified expertise.
            </p>
          </div>

          {path && (
            <div className="bg-zinc-900/90 backdrop-blur-xl rounded-2xl p-4 border border-zinc-800 text-center min-w-[200px] shadow-xl">
              <div className="flex items-center justify-between gap-2 mb-1">
                <span className="text-xs font-semibold text-emerald-400">Mastery Index</span>
                <span className="text-xs font-bold text-white">{completedCount}/{totalSteps} Completed</span>
              </div>
              <div className="text-3xl font-extrabold text-white mb-2 tracking-tight">{progressPercent}%</div>
              <div className="w-full bg-zinc-950 rounded-full h-2.5 overflow-hidden p-0.5 border border-zinc-800">
                <div 
                  className="bg-gradient-to-r from-emerald-400 via-teal-400 to-indigo-400 h-1.5 transition-all duration-500 rounded-full"
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
            </div>
          )}
        </div>
      </div>

      {error && (
        <div className="p-4 bg-rose-500/10 text-rose-300 border border-rose-500/20 rounded-2xl text-xs font-semibold flex items-center gap-3 shadow-md">
          <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Generator Form */}
      {!path && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 bg-zinc-900/90 border border-zinc-800 rounded-[28px] p-6 sm:p-8 space-y-6 shadow-2xl">
            <div>
              <label className="block text-xs font-bold text-zinc-300 uppercase tracking-wider mb-2 flex items-center justify-between">
                <span>Select or Enter Target Skill</span>
                <span className="text-[10px] text-emerald-400 font-bold bg-emerald-500/10 px-2 py-0.5 rounded-md border border-emerald-500/20">Web Grounded</span>
              </label>
              <div className="relative">
                <input
                  value={skill}
                  onChange={(e) => setSkill(e.target.value)}
                  placeholder="e.g. Next.js App Router, Cloud Architecture, AI Prompting..."
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl pl-4 pr-10 py-3 text-sm text-white placeholder:text-zinc-600 focus:outline-none focus:ring-2 focus:ring-emerald-500 transition shadow-inner"
                />
                <Target className="w-5 h-5 text-zinc-500 absolute right-3.5 top-3 pointer-events-none" />
              </div>

              {/* Quick Skill Chips */}
              <div className="mt-3 flex flex-wrap items-center gap-2">
                <span className="text-[11px] font-medium text-zinc-500">Featured:</span>
                {popularSkills.map((ps) => (
                  <button
                    key={ps}
                    onClick={() => {
                      setSkill(ps);
                      generatePath(ps);
                    }}
                    className="px-2.5 py-1 rounded-lg bg-zinc-950 hover:bg-emerald-500/10 hover:text-emerald-400 text-zinc-400 text-xs font-semibold transition border border-zinc-800 hover:border-emerald-500/30 cursor-pointer"
                  >
                    + {ps}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
              <div>
                <label className="block text-xs font-bold text-zinc-300 uppercase tracking-wider mb-2">
                  Current Level
                </label>
                <div className="space-y-1.5">
                  {['beginner', 'intermediate', 'advanced'].map((lvl) => (
                    <button
                      key={lvl}
                      type="button"
                      onClick={() => setCurrentLevel(lvl)}
                      className={`w-full py-2 px-3 text-xs font-medium rounded-xl capitalize transition flex items-center justify-between border cursor-pointer ${
                        currentLevel === lvl
                          ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30 font-bold shadow-md'
                          : 'bg-zinc-950 text-zinc-400 border-zinc-800 hover:bg-zinc-800/50'
                      }`}
                    >
                      <span>{lvl}</span>
                      {currentLevel === lvl && <Check className="w-4 h-4 text-emerald-400" />}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-zinc-300 uppercase tracking-wider mb-2">
                  Target Mastery Goal
                </label>
                <div className="space-y-1.5">
                  {['intermediate', 'advanced', 'expert'].map((lvl) => (
                    <button
                      key={lvl}
                      type="button"
                      onClick={() => setTargetLevel(lvl)}
                      className={`w-full py-2 px-3 text-xs font-medium rounded-xl capitalize transition flex items-center justify-between border cursor-pointer ${
                        targetLevel === lvl
                          ? 'bg-indigo-500/10 text-indigo-400 border-indigo-500/30 font-bold shadow-md'
                          : 'bg-zinc-950 text-zinc-400 border-zinc-800 hover:bg-zinc-800/50'
                      }`}
                    >
                      <span>{lvl}</span>
                      {targetLevel === lvl && <Check className="w-4 h-4 text-indigo-400" />}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <button
              onClick={() => generatePath()}
              disabled={loading}
              className="w-full py-3.5 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 active:from-emerald-600 text-zinc-950 font-extrabold rounded-xl text-sm shadow-lg shadow-emerald-500/20 transition-all flex items-center justify-center gap-2 disabled:opacity-60 cursor-pointer border-0"
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-zinc-950/30 border-t-zinc-950 rounded-full animate-spin" />
                  <span>Synthesizing Custom Academy Matrix...</span>
                </>
              ) : (
                <>
                  <Zap className="w-4 h-4 text-zinc-950" />
                  <span>Generate Mastery Roadmap</span>
                </>
              )}
            </button>
          </div>

          {/* Option 2 Info Sidebar */}
          <div className="bg-zinc-900/90 border border-zinc-800 rounded-[28px] p-6 flex flex-col justify-between space-y-6 shadow-2xl">
            <div className="space-y-4">
              <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
                <Bookmark className="w-5 h-5" />
              </div>
              <h3 className="font-extrabold text-lg text-white">Why Academy Matrix?</h3>
              <ul className="space-y-2.5 text-xs text-zinc-400 leading-relaxed">
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                  <span>Verified free documentation & video links via Tavily web search.</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                  <span>Paid certification options for official credentials.</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                  <span>Refine any step on demand with natural language prompt feedback.</span>
                </li>
              </ul>
            </div>

            <div className="p-4 bg-zinc-950 border border-zinc-800 rounded-2xl text-xs text-zinc-400">
              <span className="font-bold text-white block mb-1">💡 Pro Tip</span>
              Start with 'beginner' to ensure you don't miss core fundamentals before building advanced projects.
            </div>
          </div>
        </div>
      )}

      {/* Path Display Option 2 Grid Layout */}
      {path && (
        <div className="space-y-6">
          <div className="bg-zinc-900/90 border border-zinc-800 rounded-2xl p-4 sm:p-5 flex flex-wrap items-center justify-between gap-4 shadow-xl">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 font-bold">
                <Award className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-extrabold text-xl text-white">{path.skill} Roadmap</h3>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className="text-xs text-zinc-400 capitalize">{currentLevel} → {targetLevel}</span>
                  <span className="text-zinc-600">•</span>
                  <span className="text-xs font-semibold text-emerald-400">{path.steps?.length || 0} Modules</span>
                </div>
              </div>
            </div>

            <button
              onClick={() => setPath(null)}
              className="px-3.5 py-1.5 text-xs font-semibold text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-xl border border-zinc-800 transition flex items-center gap-1.5 cursor-pointer bg-transparent"
            >
              <RotateCcw className="w-3.5 h-3.5 text-zinc-400" />
              <span>New Search</span>
            </button>
          </div>

          {/* Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {path.steps?.map((step, i) => {
              const isDone = !!completedSteps[i];
              return (
                <div 
                  key={i} 
                  className={`bg-zinc-900/90 border rounded-[24px] p-6 shadow-xl flex flex-col justify-between transition-all ${
                    isDone 
                      ? 'border-emerald-500/50 bg-emerald-500/5 shadow-none' 
                      : 'border-zinc-800 hover:border-emerald-500/30'
                  }`}
                >
                  <div className="space-y-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-2">
                        <span className="w-7 h-7 rounded-xl bg-zinc-950 text-white border border-zinc-800 text-xs font-bold flex items-center justify-center shrink-0">
                          {i + 1}
                        </span>
                        <h4 className={`font-extrabold text-base ${isDone ? 'text-zinc-500 line-through' : 'text-white'}`}>
                          {step.title}
                        </h4>
                      </div>

                      <button
                        onClick={() => toggleStepComplete(i)}
                        className={`p-1.5 rounded-xl border transition cursor-pointer ${
                          isDone 
                            ? 'bg-emerald-500 text-zinc-950 border-emerald-500' 
                            : 'bg-zinc-950 text-zinc-500 border-zinc-800 hover:text-white'
                        }`}
                        title={isDone ? "Mark Incomplete" : "Mark Complete"}
                      >
                        <Check className="w-4 h-4 stroke-[3]" />
                      </button>
                    </div>

                    <p className="text-xs text-zinc-400 leading-relaxed">{step.description}</p>

                    <div className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-zinc-400 bg-zinc-950 px-2.5 py-1 rounded-lg border border-zinc-800 w-fit">
                      <Clock className="w-3.5 h-3.5 text-emerald-400" />
                      <span>{step.estimatedTime}</span>
                    </div>

                    {/* Resources */}
                    <div className="space-y-3 pt-3 border-t border-zinc-800">
                      {/* Free Links */}
                      {step.resources?.free?.length > 0 && (
                        <div className="space-y-1.5">
                          <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider block">Free Learning</span>
                          {step.resources.free.map((r, j) => (
                            <a
                              key={j}
                              href={r.url}
                              target="_blank"
                              rel="noreferrer"
                              className="group/link flex items-center justify-between text-xs font-medium text-zinc-300 hover:text-white p-2 rounded-xl bg-zinc-950 hover:bg-zinc-800 border border-zinc-800 transition no-underline"
                            >
                              <span className="truncate pr-2">{r.name}</span>
                              <ArrowUpRight className="w-3.5 h-3.5 text-zinc-500 group-hover/link:text-emerald-400 shrink-0" />
                            </a>
                          ))}
                        </div>
                      )}

                      {/* Paid Links */}
                      {step.resources?.paid?.length > 0 && (
                        <div className="space-y-1.5">
                          <span className="text-[10px] font-bold text-indigo-400 uppercase tracking-wider block">Paid / Premium</span>
                          {step.resources.paid.map((r, j) => (
                            <a
                              key={j}
                              href={r.url}
                              target="_blank"
                              rel="noreferrer"
                              className="group/link flex items-center justify-between text-xs font-medium text-zinc-300 hover:text-white p-2 rounded-xl bg-zinc-950 hover:bg-zinc-800 border border-zinc-800 transition no-underline"
                            >
                              <div className="flex items-center gap-1.5 truncate pr-2">
                                <span className="truncate">{r.name}</span>
                                {r.price && (
                                  <span className="text-[10px] font-bold text-indigo-300 bg-indigo-500/20 px-1.5 py-0.5 rounded border border-indigo-500/30">
                                    {r.price}
                                  </span>
                                )}
                              </div>
                              <ArrowUpRight className="w-3.5 h-3.5 text-zinc-500 group-hover/link:text-indigo-400 shrink-0" />
                            </a>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Refine Section Option 2 */}
          <div className="bg-zinc-900/90 border border-zinc-800 rounded-[28px] p-6 shadow-2xl text-white space-y-4">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-emerald-400 uppercase tracking-wider flex items-center gap-2">
                <Sliders className="w-4 h-4 text-emerald-400" />
                <span>Refine Matrix with AI Instructions</span>
              </label>
              <span className="text-[11px] text-zinc-500">Re-architect roadmap dynamically</span>
            </div>

            <div className="flex flex-col sm:flex-row gap-2">
              <input
                value={instruction}
                onChange={(e) => setInstruction(e.target.value)}
                placeholder="e.g. Include 3 more free documentation links and focus on project examples..."
                className="flex-1 bg-zinc-950 border border-zinc-800 text-white placeholder:text-zinc-600 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
              <button
                onClick={refinePath}
                disabled={loading || !instruction.trim()}
                className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl text-sm transition flex items-center justify-center gap-2 disabled:opacity-50 shrink-0 shadow-lg shadow-emerald-950/40 cursor-pointer border-0"
              >
                {loading ? (
                  <>
                    <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    <span>Updating...</span>
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4" />
                    <span>Apply Refinement</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}


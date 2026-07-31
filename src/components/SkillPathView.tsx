import React, { useState } from 'react';
import { supabase } from '../lib/supabase';
import { UserProfile } from '../types';
import { 
  Sparkles, BookOpen, ExternalLink, CheckCircle2, Circle, 
  Clock, ArrowRight, Zap, RotateCcw, Sliders, DollarSign, Gift,
  Check, AlertCircle, Compass, Layers, Send
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
    setCompletedSteps(prev => ({ ...prev, [index]: !prev[index] }));
  };

  const completedCount = Object.values(completedSteps).filter(Boolean).length;
  const totalSteps = path?.steps?.length || 0;
  const progressPercent = totalSteps > 0 ? Math.round((completedCount / totalSteps) * 100) : 0;

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-12">
      {/* Option 1 Executive Hero Header */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 text-white p-6 sm:p-8 shadow-xl border border-indigo-900/40">
        <div className="absolute -right-12 -top-12 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute right-1/3 -bottom-12 w-48 h-48 bg-purple-500/10 rounded-full blur-2xl pointer-events-none" />
        
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2 max-w-xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/20 border border-indigo-400/30 text-indigo-300 text-xs font-semibold tracking-wide uppercase">
              <Sparkles className="w-3.5 h-3.5 text-indigo-400 animate-pulse" />
              <span>Option 1 · Executive AI Agent</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-serif font-bold text-white tracking-tight">
              AI Skill Path Architect
            </h2>
            <p className="text-sm text-slate-300 leading-relaxed">
              Real-time web grounding via Tavily and Llama-3.3 AI to map out customized, step-by-step masteries with verified free and premium learning resources.
            </p>
          </div>

          {path && (
            <div className="bg-white/10 backdrop-blur-md rounded-2xl p-4 border border-white/15 text-center min-w-[160px]">
              <span className="text-xs font-medium text-indigo-200 block mb-1">Path Progress</span>
              <div className="text-2xl font-bold text-white mb-1">{progressPercent}%</div>
              <div className="w-full bg-slate-700/60 rounded-full h-2 overflow-hidden">
                <div 
                  className="bg-gradient-to-r from-indigo-400 to-emerald-400 h-2 transition-all duration-500 rounded-full"
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
              <span className="text-[10px] text-slate-300 mt-1.5 block">
                {completedCount} of {totalSteps} Steps Complete
              </span>
            </div>
          )}
        </div>
      </div>

      {error && (
        <div className="p-4 bg-rose-50 text-rose-800 border border-rose-200/80 rounded-2xl text-xs font-medium flex items-center gap-3 shadow-xs">
          <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Generator Form */}
      {!path && (
        <div className="bg-white border border-slate-200/80 rounded-3xl p-6 sm:p-8 space-y-6 shadow-sm">
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2 flex items-center justify-between">
              <span>Skill or Domain to Master</span>
              <span className="text-[10px] text-indigo-600 font-semibold uppercase">Powered by Real-Time Grounding</span>
            </label>
            <div className="relative">
              <input
                value={skill}
                onChange={(e) => setSkill(e.target.value)}
                placeholder="e.g. React Native, Machine Learning, Corporate Negotiation..."
                className="w-full border border-slate-200 rounded-xl pl-4 pr-10 py-3 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition shadow-xs"
              />
              <Compass className="w-5 h-5 text-slate-400 absolute right-3.5 top-3 pointer-events-none" />
            </div>

            {/* Quick Skill Chips */}
            <div className="mt-3 flex flex-wrap items-center gap-2">
              <span className="text-[11px] font-medium text-slate-400">Popular:</span>
              {popularSkills.map((ps) => (
                <button
                  key={ps}
                  onClick={() => {
                    setSkill(ps);
                    generatePath(ps);
                  }}
                  className="px-2.5 py-1 rounded-full bg-slate-100 hover:bg-indigo-50 hover:text-indigo-700 text-slate-600 text-xs font-medium transition border border-slate-200/60"
                >
                  + {ps}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                Starting Level
              </label>
              <div className="grid grid-cols-3 gap-1.5 p-1 bg-slate-100/80 rounded-xl border border-slate-200/60">
                {['beginner', 'intermediate', 'advanced'].map((lvl) => (
                  <button
                    key={lvl}
                    type="button"
                    onClick={() => setCurrentLevel(lvl)}
                    className={`py-1.5 text-xs font-medium rounded-lg capitalize transition ${
                      currentLevel === lvl
                        ? 'bg-white text-indigo-700 shadow-xs font-semibold'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    {lvl}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                Target Mastery Level
              </label>
              <div className="grid grid-cols-3 gap-1.5 p-1 bg-slate-100/80 rounded-xl border border-slate-200/60">
                {['intermediate', 'advanced', 'expert'].map((lvl) => (
                  <button
                    key={lvl}
                    type="button"
                    onClick={() => setTargetLevel(lvl)}
                    className={`py-1.5 text-xs font-medium rounded-lg capitalize transition ${
                      targetLevel === lvl
                        ? 'bg-white text-indigo-700 shadow-xs font-semibold'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    {lvl}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <button
            onClick={() => generatePath()}
            disabled={loading}
            className="w-full py-3.5 bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white font-semibold rounded-xl text-sm shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2 disabled:opacity-60"
          >
            {loading ? (
              <>
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                <span>Searching & Architecting Roadmap...</span>
              </>
            ) : (
              <>
                <Zap className="w-4 h-4 text-indigo-200" />
                <span>Build Verified Learning Path</span>
              </>
            )}
          </button>
        </div>
      )}

      {/* Path Display */}
      {path && (
        <div className="space-y-6">
          <div className="bg-white border border-slate-200/80 rounded-2xl p-4 sm:p-5 flex flex-wrap items-center justify-between gap-4 shadow-xs">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 font-bold">
                <Layers className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-serif font-bold text-xl text-slate-900">{path.skill}</h3>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className="text-xs text-slate-500 capitalize">{currentLevel} → {targetLevel}</span>
                  <span className="text-slate-300">•</span>
                  <span className="text-xs font-medium text-indigo-600">{path.steps?.length || 0} Modules</span>
                </div>
              </div>
            </div>

            <button
              onClick={() => setPath(null)}
              className="px-3.5 py-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg border border-slate-200 transition flex items-center gap-1.5"
            >
              <RotateCcw className="w-3.5 h-3.5 text-slate-500" />
              <span>Change Skill</span>
            </button>
          </div>

          {/* Timeline */}
          <div className="relative border-l-2 border-indigo-100 pl-6 sm:pl-8 space-y-6 ml-3 sm:ml-4">
            {path.steps?.map((step, i) => {
              const isDone = !!completedSteps[i];
              return (
                <div key={i} className="relative group">
                  {/* Step Dot */}
                  <button
                    onClick={() => toggleStepComplete(i)}
                    className={`absolute -left-[37px] sm:-left-[45px] top-1.5 w-7 h-7 rounded-full flex items-center justify-center border-2 transition-all ${
                      isDone 
                        ? 'bg-emerald-600 border-emerald-600 text-white shadow-sm' 
                        : 'bg-white border-indigo-400 text-indigo-600 hover:border-indigo-600 hover:scale-110'
                    }`}
                  >
                    {isDone ? <Check className="w-4 h-4 stroke-[3]" /> : <span className="text-xs font-bold">{i + 1}</span>}
                  </button>

                  {/* Step Card */}
                  <div className={`bg-white border rounded-2xl p-5 shadow-xs transition-all ${
                    isDone ? 'border-emerald-200 bg-emerald-50/20' : 'border-slate-200/80 hover:border-indigo-200 hover:shadow-md'
                  }`}>
                    <div className="flex flex-wrap items-start justify-between gap-2 mb-2">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-indigo-600 bg-indigo-50 px-2.5 py-0.5 rounded-full border border-indigo-100">
                          Step {i + 1}
                        </span>
                        <h4 className={`font-semibold text-base ${isDone ? 'text-slate-500 line-through' : 'text-slate-900'}`}>
                          {step.title}
                        </h4>
                      </div>
                      <div className="flex items-center gap-1.5 text-xs font-medium text-slate-500 bg-slate-50 px-2.5 py-1 rounded-full border border-slate-200/60">
                        <Clock className="w-3.5 h-3.5 text-indigo-500" />
                        <span>{step.estimatedTime}</span>
                      </div>
                    </div>

                    <p className="text-sm text-slate-600 leading-relaxed mb-4">{step.description}</p>

                    {/* Resources Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-3 border-t border-slate-100">
                      {/* Free Resources */}
                      <div className="bg-emerald-50/40 border border-emerald-100/80 rounded-xl p-3.5 space-y-2">
                        <div className="flex items-center gap-1.5 text-emerald-800 font-bold text-xs uppercase tracking-wider">
                          <Gift className="w-3.5 h-3.5 text-emerald-600" />
                          <span>Free Resources</span>
                        </div>
                        <div className="space-y-1.5">
                          {step.resources?.free?.length > 0 ? (
                            step.resources.free.map((r, j) => (
                              <a
                                key={j}
                                href={r.url}
                                target="_blank"
                                rel="noreferrer"
                                className="group/link flex items-center justify-between text-xs font-medium text-slate-800 hover:text-indigo-600 p-2 rounded-lg bg-white border border-emerald-100 shadow-2xs hover:border-indigo-200 transition"
                              >
                                <span className="truncate pr-2">{r.name}</span>
                                <ExternalLink className="w-3.5 h-3.5 text-slate-400 group-hover/link:text-indigo-600 shrink-0" />
                              </a>
                            ))
                          ) : (
                            <span className="text-xs text-slate-400 italic">No free links provided</span>
                          )}
                        </div>
                      </div>

                      {/* Paid Resources */}
                      <div className="bg-amber-50/40 border border-amber-100/80 rounded-xl p-3.5 space-y-2">
                        <div className="flex items-center gap-1.5 text-amber-800 font-bold text-xs uppercase tracking-wider">
                          <DollarSign className="w-3.5 h-3.5 text-amber-600" />
                          <span>Paid & Certified</span>
                        </div>
                        <div className="space-y-1.5">
                          {step.resources?.paid?.length > 0 ? (
                            step.resources.paid.map((r, j) => (
                              <a
                                key={j}
                                href={r.url}
                                target="_blank"
                                rel="noreferrer"
                                className="group/link flex items-center justify-between text-xs font-medium text-slate-800 hover:text-indigo-600 p-2 rounded-lg bg-white border border-amber-100 shadow-2xs hover:border-indigo-200 transition"
                              >
                                <div className="flex items-center gap-1.5 truncate pr-2">
                                  <span className="truncate">{r.name}</span>
                                  {r.price && (
                                    <span className="text-[10px] font-bold text-amber-700 bg-amber-100 px-1.5 py-0.5 rounded">
                                      {r.price}
                                    </span>
                                  )}
                                </div>
                                <ExternalLink className="w-3.5 h-3.5 text-slate-400 group-hover/link:text-indigo-600 shrink-0" />
                              </a>
                            ))
                          ) : (
                            <span className="text-xs text-slate-400 italic">No paid links provided</span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Refine Section */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg text-white space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-indigo-300 uppercase tracking-wider flex items-center gap-1.5">
                <Sliders className="w-4 h-4 text-indigo-400" />
                <span>Refine this Path with AI</span>
              </label>
              <span className="text-[11px] text-slate-400">Instruct AI to adjust steps, links or time</span>
            </div>

            <div className="flex flex-col sm:flex-row gap-2">
              <input
                value={instruction}
                onChange={(e) => setInstruction(e.target.value)}
                placeholder="e.g. Add 2 more free YouTube crash courses to Step 1..."
                className="flex-1 bg-slate-800 border border-slate-700 text-white placeholder:text-slate-500 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
              <button
                onClick={refinePath}
                disabled={loading || !instruction.trim()}
                className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold rounded-xl text-sm transition flex items-center justify-center gap-2 disabled:opacity-50 shrink-0 shadow-md"
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

            {/* Quick Refine Suggestions */}
            <div className="flex flex-wrap items-center gap-2 pt-1">
              <span className="text-[10px] font-medium text-slate-400">Try:</span>
              {[
                'Add more free video tutorials',
                'Focus on hands-on practical projects',
                'Include official documentation links'
              ].map((sug) => (
                <button
                  key={sug}
                  onClick={() => setInstruction(sug)}
                  className="px-2.5 py-0.5 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-300 text-[11px] border border-slate-700 transition"
                >
                  {sug}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}


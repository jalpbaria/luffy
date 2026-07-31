import React, { useState } from 'react';
import { supabase } from '../lib/supabase';
import { UserProfile } from '../types';

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

  async function generatePath() {
    if (!skill.trim()) {
      setError('Please enter a skill.');
      return;
    }
    setError('');
    setLoading(true);
    try {
      const { data, error: fnError } = await supabase.functions.invoke('learning-path-agent', {
        body: { action: 'generate', skill, currentLevel, targetLevel, userId: currentUser?.id },
      });
      if (fnError) throw fnError;
      setPath(data as LearningPath);
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

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div>
        <h2 className="text-xl font-serif font-bold text-slate-900">AI Skill Path Planner</h2>
        <p className="text-sm text-slate-500 mt-1">
          Tell us what you want to learn, and we'll research a real, up-to-date path with free and paid resources.
        </p>
      </div>

      {error && (
        <div className="p-3 bg-red-50 text-red-800 border border-red-200 rounded-xl text-xs">
          {error}
        </div>
      )}

      {!path && (
        <div className="bg-white border border-slate-200 rounded-2xl p-5 space-y-4 shadow-xs">
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">
              Skill you want to learn
            </label>
            <input
              value={skill}
              onChange={(e) => setSkill(e.target.value)}
              placeholder="e.g. React, Public Speaking, UI Design"
              className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                Current level
              </label>
              <select
                value={currentLevel}
                onChange={(e) => setCurrentLevel(e.target.value)}
                className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm"
              >
                <option value="beginner">Beginner</option>
                <option value="intermediate">Intermediate</option>
                <option value="advanced">Advanced</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                Target level
              </label>
              <select
                value={targetLevel}
                onChange={(e) => setTargetLevel(e.target.value)}
                className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm"
              >
                <option value="intermediate">Intermediate</option>
                <option value="advanced">Advanced</option>
                <option value="expert">Expert</option>
              </select>
            </div>
          </div>

          <button
            onClick={generatePath}
            disabled={loading}
            className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-lg text-sm disabled:opacity-50"
          >
            {loading ? 'Researching & building your path...' : 'Generate Learning Path'}
          </button>
        </div>
      )}

      {path && (
        <>
          <div className="flex items-center justify-between">
            <h3 className="font-serif font-bold text-lg text-slate-900">{path.skill} — Your Path</h3>
            <button
              onClick={() => setPath(null)}
              className="text-xs font-semibold text-slate-500 hover:text-slate-700"
            >
              Start Over
            </button>
          </div>

          <div className="relative border-l-2 border-indigo-200 pl-6 space-y-6">
            {path.steps.map((step, i) => (
              <div key={i} className="relative">
                <div className="absolute -left-[31px] top-1 w-4 h-4 rounded-full bg-indigo-600 border-2 border-white shadow" />
                <h4 className="font-semibold text-slate-900">{step.title}</h4>
                <p className="text-xs text-slate-400 font-medium">{step.estimatedTime}</p>
                <p className="mt-1 text-sm text-slate-600">{step.description}</p>

                <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <p className="text-[10px] font-bold text-emerald-700 uppercase tracking-wider mb-1.5">Free</p>
                    <div className="space-y-1">
                      {step.resources.free.map((r, j) => (
                        <a
                          key={j}
                          href={r.url}
                          target="_blank"
                          rel="noreferrer"
                          className="block text-xs text-indigo-600 hover:underline"
                        >
                          {r.name}
                        </a>
                      ))}
                    </div>
                  </div>
                  <div>
                    <p className="text-[10px] font-bold text-amber-700 uppercase tracking-wider mb-1.5">Paid</p>
                    <div className="space-y-1">
                      {step.resources.paid.map((r, j) => (
                        <a
                          key={j}
                          href={r.url}
                          target="_blank"
                          rel="noreferrer"
                          className="block text-xs text-indigo-600 hover:underline"
                        >
                          {r.name} {r.price && `(${r.price})`}
                        </a>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="bg-white border border-slate-200 rounded-2xl p-4 flex gap-2 shadow-xs">
            <input
              value={instruction}
              onChange={(e) => setInstruction(e.target.value)}
              placeholder="e.g. add more free video resources to step 2"
              className="flex-1 border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
            <button
              onClick={refinePath}
              disabled={loading}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-900 text-white font-semibold rounded-lg text-sm disabled:opacity-50"
            >
              {loading ? 'Updating...' : 'Refine'}
            </button>
          </div>
        </>
      )}
    </div>
  );
}

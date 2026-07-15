import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Sparkles, Award, ArrowRight, Brain, AlertCircle, Compass, 
  MapPin, Check, ChevronRight, HelpCircle, GraduationCap, Clock 
} from 'lucide-react';
import { UserProfile } from '../types';
import { getAIRecommendations } from '../lib/gemini';

interface AIRecommendationsProps {
  currentUser: UserProfile;
  onSelectRecommendedSkill: (skillName: string, category: string) => void;
}

interface RecommendedSkill {
  skillName: string;
  category: string;
  reasoning: string;
  marketDemand: string;
}

export default function AIRecommendations({ currentUser, onSelectRecommendedSkill }: AIRecommendationsProps) {
  const [careerGoals, setCareerGoals] = useState('');
  const [recommendations, setRecommendations] = useState<RecommendedSkill[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!careerGoals.trim()) return;

    setIsLoading(true);
    setError(null);

    try {
      const data = await getAIRecommendations(
        currentUser?.skillsOffered ?? [],
        careerGoals.trim()
      );
      setRecommendations(data);
    } catch (err) {
      console.error('Error loading AI suggestions:', err);
      setError('Could not connect to Gemini API. Please make sure your development environment has internet access or try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div id="ai-recs-root" className="max-w-4xl mx-auto space-y-6 text-xs text-slate-700">
      
      {/* Title block */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 bg-indigo-100 text-indigo-600 rounded-xl flex items-center justify-center text-lg shadow-inner">
          💡
        </div>
        <div>
          <h1 className="text-3xl font-serif font-semibold tracking-tight text-slate-900 flex items-center gap-2">
            AI Skill Advising 
            <span className="px-2 py-0.5 bg-indigo-100 text-indigo-700 rounded-full text-[10px] font-bold uppercase tracking-wider font-sans">Gemini Powered</span>
          </h1>
          <p className="text-slate-500 mt-0.5 text-sm">Align your skill-sharing journey with your career milestones and professional growth.</p>
        </div>
      </div>

      {/* Goal submission form */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 space-y-4">
        <h3 className="font-semibold text-slate-800 text-sm flex items-center gap-1.5 border-b border-slate-100 pb-2">
          <Brain className="w-4 h-4 text-indigo-500" />
          Specify Your Learning & Career Milestones
        </h3>
        
        <p className="text-slate-500 text-xs">
          Describe what you want to achieve (e.g., "I want to design and code my own web startup and pitch to angel investors" or "I want to master video content creation to launch a digital marketing agency"). Our AI advisor analyzes your current skills offered: <span className="font-semibold text-slate-700">{(currentUser?.skillsOffered ?? []).map(s => s.name).join(', ') || 'None'}</span> and suggests critical additions.
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <textarea
              rows={3}
              required
              placeholder="What are your primary professional goals, career changes, or hobby milestones for the next 6-12 months? Be as specific as you like!"
              value={careerGoals}
              onChange={(e) => setCareerGoals(e.target.value)}
              className="w-full border border-slate-250 rounded-lg p-3 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div className="flex items-center justify-between">
            <span className="text-[10px] text-slate-400">Uses server-side Gemini 3.5 Flash for contextual analysis.</span>
            <button
              type="submit"
              disabled={isLoading || !careerGoals.trim()}
              className={`px-5 py-2.5 rounded-lg font-bold shadow-md transition flex items-center gap-2 text-xs ${
                isLoading || !careerGoals.trim()
                  ? 'bg-slate-200 text-slate-400 cursor-not-allowed'
                  : 'bg-indigo-600 hover:bg-indigo-700 text-white'
              }`}
            >
              <Sparkles className="w-4 h-4 fill-current" />
              {isLoading ? 'Consulting Advisor...' : 'Get Skill Recommendations'}
            </button>
          </div>
        </form>
      </div>

      {/* Recommendations Results list */}
      <div className="space-y-4">
        {error && (
          <div className="p-3 bg-rose-50 border border-rose-100 rounded-xl text-rose-600 flex items-start gap-2.5">
            <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
            <p>{error}</p>
          </div>
        )}

        {isLoading ? (
          <div className="bg-white rounded-xl border border-slate-200 p-16 text-center space-y-4">
            <div className="animate-spin rounded-full h-8 w-8 border-2 border-indigo-600 border-t-transparent mx-auto"></div>
            <div className="space-y-1">
              <p className="font-semibold text-slate-800 text-sm">Analyzing current portfolio and career milestones...</p>
              <p className="text-slate-400 text-xs">Using Gemini reasoning to formulate a customized learning map.</p>
            </div>
          </div>
        ) : recommendations.length === 0 ? (
          /* Empty state */
          <div className="bg-slate-50 rounded-xl border border-slate-200 py-16 px-4 text-center">
            <Sparkles className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <h3 className="font-medium text-slate-700 text-base">No active recommendations</h3>
            <p className="text-slate-500 text-sm max-w-sm mx-auto mt-1">Submit your learning goals above, and Gemini will custom tailor the perfect skill sets to target next.</p>
          </div>
        ) : (
          /* Active Results grid */
          <div className="space-y-4">
            <h4 className="font-bold text-slate-800 text-sm flex items-center gap-1.5">
              💡 Recommended Learning Map
            </h4>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {recommendations.map((rec, idx) => (
                <div 
                  key={idx}
                  className="bg-white rounded-xl border border-slate-200 p-5 space-y-4 flex flex-col justify-between hover:shadow-md transition shadow-sm"
                >
                  <div className="space-y-3">
                    {/* Category pill */}
                    <div className="flex items-center justify-between">
                      <span className="px-2.5 py-0.5 bg-indigo-50 border border-indigo-100 text-indigo-700 rounded text-[9px] font-bold uppercase tracking-wider">
                        {rec.category}
                      </span>
                      <span className="px-2 py-0.5 bg-amber-50 text-amber-800 rounded font-semibold text-[9px]">
                        📈 {rec.marketDemand}
                      </span>
                    </div>

                    {/* Skill Name */}
                    <h5 className="font-bold text-slate-900 text-base leading-snug">{rec.skillName}</h5>

                    {/* Reasoning */}
                    <p className="text-slate-600 leading-relaxed text-xs">{rec.reasoning}</p>
                  </div>

                  {/* Search Swappers Link CTA */}
                  <div className="pt-3.5 border-t border-slate-100">
                    <button
                      onClick={() => onSelectRecommendedSkill(rec.skillName, rec.category)}
                      className="w-full py-2 bg-indigo-50 hover:bg-indigo-100 border border-indigo-150 text-indigo-700 rounded-lg text-xs font-bold transition flex items-center justify-center gap-1"
                    >
                      Find Teachers <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>

            <div className="p-4 bg-indigo-50/40 border border-indigo-100 rounded-xl flex items-center gap-3">
              <span className="text-base">💡</span>
              <p className="text-indigo-800 text-xs">
                <strong>Next Step:</strong> Click "Find Teachers" on any recommended skill to automatically filter our swappers catalog and arrange a 1-on-1 session with an available expert!
              </p>
            </div>
          </div>
        )}

      </div>

    </div>
  );
}

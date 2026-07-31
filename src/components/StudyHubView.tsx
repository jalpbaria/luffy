import React, { useState, useMemo } from 'react';
import { 
  BookOpen, ExternalLink, Layers, 
  CheckCircle2, ArrowUpRight, Lightbulb,
  Sparkles, Search, Compass, Globe, Video, Award, GraduationCap
} from 'lucide-react';
import { UserProfile } from '../types';
import { FREE_CATEGORY_RESOURCES, CategoryResource } from '../data/freeResources';

interface StudyHubViewProps {
  currentUser: UserProfile;
}

interface SyllabusTopic {
  id: string;
  title: string;
  category: string;
  icon: string;
  description: string;
  w3Link: string;
  topics: string[];
  level: 'Beginner' | 'Intermediate' | 'Advanced';
}

const SYLLABI: SyllabusTopic[] = [
  {
    id: 'js-dev',
    title: 'JavaScript & Web Fundamentals',
    category: 'Programming',
    icon: '⚡',
    description: 'Master core JavaScript ES6+, DOM manipulation, async/await, and modern web APIs.',
    w3Link: 'https://www.w3schools.com/js/',
    topics: ['Variables & Data Types', 'Functions & Scope', 'DOM Manipulation', 'Async / Promises & Fetch API', 'Classes & Modules'],
    level: 'Beginner'
  },
  {
    id: 'react-dev',
    title: 'React.js Modern Development',
    category: 'Programming',
    icon: '⚛️',
    description: 'Build interactive user interfaces with components, hooks, state management, and props.',
    w3Link: 'https://www.w3schools.com/react/',
    topics: ['JSX & Components', 'useState & useEffect Hooks', 'Props & State Flow', 'Form Handling', 'Context API & Router'],
    level: 'Intermediate'
  },
  {
    id: 'python-dev',
    title: 'Python for Beginners & Data',
    category: 'Programming',
    icon: '🐍',
    description: 'Learn versatile Python syntax for automation, data analysis, web backend, and AI scripting.',
    w3Link: 'https://www.w3schools.com/python/',
    topics: ['Python Data Structures', 'Control Flow & Loops', 'Functions & Modules', 'File Handling & JSON', 'Pandas & Basic Automation'],
    level: 'Beginner'
  },
  {
    id: 'sql-db',
    title: 'SQL & Relational Databases',
    category: 'Database',
    icon: '🗄️',
    description: 'Query, join, filter, and structure database schemas using standard SQL queries.',
    w3Link: 'https://www.w3schools.com/sql/',
    topics: ['SELECT, WHERE & ORDER BY', 'INNER / LEFT JOINs', 'GROUP BY & Aggregations', 'INSERT, UPDATE, DELETE', 'Database Indexing Basics'],
    level: 'Beginner'
  },
  {
    id: 'html-css',
    title: 'HTML5 & Tailwind / CSS3',
    category: 'Design & Web',
    icon: '🎨',
    description: 'Structure clean web content with modern semantic HTML and responsive CSS layouts.',
    w3Link: 'https://www.w3schools.com/html/',
    topics: ['Semantic Tags & Accessibility', 'CSS Flexbox & Grid Layouts', 'Responsive Media Queries', 'CSS Variables & Animation', 'Tailwind Utility Design'],
    level: 'Beginner'
  },
  {
    id: 'ai-prompting',
    title: 'AI Prompt Engineering & LLMs',
    category: 'Artificial Intelligence',
    icon: '🤖',
    description: 'Understand Gemini API prompting, system instructions, structured JSON outputs, and RAG.',
    w3Link: 'https://www.w3schools.com/genai/',
    topics: ['Zero-Shot & Few-Shot Prompting', 'System Instructions', 'JSON Schema Output', 'Temperature & Top-P Tuning', 'Integrating Gemini SDKs'],
    level: 'Intermediate'
  }
];

const RESOURCE_CATEGORIES = [
  'All',
  'Programming',
  'Graphic Design',
  'Video Editing',
  'Digital Marketing',
  'Photography',
  'Music',
  'Fitness',
  'Cooking',
  'Language Learning',
  'Public Speaking',
  'Business'
];

export default function StudyHubView({ currentUser }: StudyHubViewProps) {
  const [activeTab, setActiveTab] = useState<'resources' | 'syllabi'>('resources');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [resourceSearch, setResourceSearch] = useState('');

  // Total resources count
  const totalResourcesCount = useMemo(() => {
    return Object.values(FREE_CATEGORY_RESOURCES).reduce((acc, curr) => acc + curr.length, 0);
  }, []);

  // Filtered free resources list
  const filteredResources = useMemo(() => {
    let list: { category: string; item: CategoryResource }[] = [];

    if (selectedCategory === 'All') {
      Object.entries(FREE_CATEGORY_RESOURCES).forEach(([cat, items]) => {
        items.forEach(item => list.push({ category: cat, item }));
      });
    } else if (FREE_CATEGORY_RESOURCES[selectedCategory]) {
      FREE_CATEGORY_RESOURCES[selectedCategory].forEach(item => {
        list.push({ category: selectedCategory, item });
      });
    }

    if (resourceSearch.trim()) {
      const q = resourceSearch.toLowerCase();
      list = list.filter(r => 
        r.item.name.toLowerCase().includes(q) ||
        r.item.description.toLowerCase().includes(q) ||
        r.category.toLowerCase().includes(q) ||
        (r.item.type && r.item.type.toLowerCase().includes(q))
      );
    }

    return list;
  }, [selectedCategory, resourceSearch]);

  const getTypeIcon = (type?: string) => {
    switch (type) {
      case 'YouTube': return <Video className="w-3.5 h-3.5 text-rose-400" />;
      case 'Course': return <GraduationCap className="w-3.5 h-3.5 text-indigo-400" />;
      case 'Platform': return <Compass className="w-3.5 h-3.5 text-emerald-400" />;
      default: return <Globe className="w-3.5 h-3.5 text-sky-400" />;
    }
  };

  return (
    <div id="study-hub-root" className="max-w-5xl mx-auto space-y-6 text-xs text-zinc-300">
      
      {/* Banner: Self-Study & Learning Hub */}
      <div className="bg-gradient-to-r from-zinc-950 via-zinc-900 to-indigo-950/80 text-white rounded-[28px] p-6 border border-zinc-800 shadow-2xl flex flex-col md:flex-row items-start md:items-center justify-between gap-5 relative overflow-hidden">
        <div className="absolute -right-8 -bottom-8 w-44 h-44 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none"></div>
        <div className="flex items-start sm:items-center gap-4 z-10">
          <div className="w-12 h-12 bg-emerald-500/10 text-emerald-400 rounded-2xl flex items-center justify-center text-2xl shrink-0 shadow-inner border border-emerald-500/20">
            📚
          </div>
          <div className="space-y-1">
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-xl font-extrabold text-white tracking-tight">
                Self-Study & Resource Hub
              </h2>
              <span className="px-2.5 py-0.5 bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 rounded-full text-[10px] font-bold">
                100% Free Resources
              </span>
            </div>
            <p className="text-zinc-400 text-xs leading-relaxed max-w-xl">
              Build skills independently with curated free courses, interactive tutorials, official docs, and structured W3Schools syllabi before swapping with peers!
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5 w-full md:w-auto shrink-0 pt-2 md:pt-0 border-t md:border-t-0 border-zinc-800 z-10">
          <a
            href="https://www.w3schools.com"
            target="_blank"
            rel="noopener noreferrer"
            className="flex-1 md:flex-none inline-flex items-center justify-center gap-2 bg-[#00a82d] hover:bg-[#008f26] text-white font-bold px-4 py-2.5 rounded-xl shadow-lg shadow-emerald-950/40 transition text-xs border border-emerald-500/30 cursor-pointer no-underline"
          >
            <ExternalLink className="w-4 h-4 stroke-[2.5]" />
            <span>Visit W3Schools</span>
            <span className="w-2.5 h-2.5 bg-emerald-300 rounded-full animate-pulse"></span>
          </a>
        </div>
      </div>

      {/* Primary Section Switcher Tabs */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between border-b border-zinc-800 pb-3 gap-3">
        <div className="flex items-center gap-2 bg-zinc-950 p-1 rounded-2xl border border-zinc-800 self-start">
          <button
            onClick={() => setActiveTab('resources')}
            className={`px-4 py-2 rounded-xl font-bold text-xs transition flex items-center gap-2 cursor-pointer border-0 ${
              activeTab === 'resources'
                ? 'bg-gradient-to-r from-emerald-500 to-teal-600 text-white shadow-lg shadow-emerald-500/20'
                : 'text-zinc-400 hover:text-white bg-transparent'
            }`}
          >
            <BookOpen className="w-4 h-4" />
            <span>Free Resources by Category</span>
            <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold ${
              activeTab === 'resources' ? 'bg-white/20 text-white' : 'bg-zinc-800 text-zinc-300'
            }`}>
              {totalResourcesCount}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('syllabi')}
            className={`px-4 py-2 rounded-xl font-bold text-xs transition flex items-center gap-2 cursor-pointer border-0 ${
              activeTab === 'syllabi'
                ? 'bg-gradient-to-r from-indigo-500 to-purple-600 text-white shadow-lg shadow-indigo-500/20'
                : 'text-zinc-400 hover:text-white bg-transparent'
            }`}
          >
            <Layers className="w-4 h-4" />
            <span>Structured Syllabi</span>
            <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold ${
              activeTab === 'syllabi' ? 'bg-white/20 text-white' : 'bg-zinc-800 text-zinc-300'
            }`}>
              {SYLLABI.length}
            </span>
          </button>
        </div>

        <span className="text-[11px] text-zinc-500 font-medium hidden md:inline">
          Self-Paced Learning • Free & Unlimited Access
        </span>
      </div>

      {/* TAB 1: FREE RESOURCES BY CATEGORY */}
      {activeTab === 'resources' && (
        <div className="space-y-5">
          {/* Category Filter Pills & Search */}
          <div className="space-y-3">
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
              <div className="relative flex-1 max-w-md">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
                <input
                  type="text"
                  placeholder="Search resources by title, description, or topic..."
                  value={resourceSearch}
                  onChange={(e) => setResourceSearch(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 bg-zinc-950 border border-zinc-800 text-white rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500 placeholder:text-zinc-600"
                />
                {resourceSearch && (
                  <button
                    onClick={() => setResourceSearch('')}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-white text-xs font-bold border-0 bg-transparent cursor-pointer"
                  >
                    Clear
                  </button>
                )}
              </div>

              <div className="text-zinc-400 text-xs text-right shrink-0">
                Showing <strong className="text-white">{filteredResources.length}</strong> resources
              </div>
            </div>

            {/* Category Filter Horizontal Scroll */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-thin">
              {RESOURCE_CATEGORIES.map(cat => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition cursor-pointer shrink-0 border-0 ${
                    selectedCategory === cat
                      ? 'bg-emerald-500 text-zinc-950 shadow-md shadow-emerald-500/20'
                      : 'bg-zinc-900 text-zinc-400 hover:bg-zinc-800 border border-zinc-800'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          {/* Resources Cards Grid */}
          {filteredResources.length === 0 ? (
            <div className="bg-zinc-900/90 rounded-[24px] border border-zinc-800 p-8 text-center space-y-2">
              <p className="text-white font-bold text-sm">No free resources found</p>
              <p className="text-zinc-400 text-xs">Try searching for a different keyword or choosing another category above.</p>
              <button
                onClick={() => { setSelectedCategory('All'); setResourceSearch(''); }}
                className="mt-2 px-3.5 py-1.5 bg-emerald-600 text-white font-bold rounded-xl text-xs hover:bg-emerald-500 transition cursor-pointer border-0"
              >
                Reset Filters
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredResources.map(({ category, item }, idx) => {
                const domain = item.url.replace(/^https?:\/\/(www\.)?/, '').split('/')[0];
                return (
                  <div
                    key={`${category}-${idx}`}
                    className="bg-zinc-900/90 rounded-[24px] border border-zinc-800 hover:border-emerald-500/50 p-5 shadow-xl transition flex flex-col justify-between group space-y-3"
                  >
                    <div className="space-y-2">
                      <div className="flex items-center justify-between gap-2">
                        <span className="px-2.5 py-0.5 bg-zinc-950 text-zinc-300 font-bold rounded-lg text-[10px] shrink-0 border border-zinc-800">
                          {category}
                        </span>
                        {item.type && (
                          <span className="px-2 py-0.5 bg-emerald-500/10 text-emerald-400 font-semibold rounded-lg text-[10px] shrink-0 border border-emerald-500/20 flex items-center gap-1">
                            {getTypeIcon(item.type)}
                            {item.type}
                          </span>
                        )}
                      </div>

                      <h3 className="font-bold text-white text-sm group-hover:text-emerald-400 transition leading-snug">
                        {item.name}
                      </h3>

                      <p className="text-zinc-400 text-xs leading-relaxed line-clamp-3">
                        {item.description}
                      </p>
                    </div>

                    <div className="pt-3 border-t border-zinc-800 flex items-center justify-between gap-2">
                      <span className="text-[11px] text-zinc-500 font-normal truncate max-w-[130px]">
                        {domain}
                      </span>
                      <a
                        href={item.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold px-3 py-1.5 rounded-xl text-xs transition shadow-md shadow-emerald-950/40 border border-emerald-500/30 no-underline cursor-pointer"
                      >
                        <span>Open Resource</span>
                        <ExternalLink className="w-3.5 h-3.5" />
                      </a>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Tips Callout */}
          <div className="bg-amber-500/10 border border-amber-500/20 rounded-2xl p-4 flex items-start gap-3">
            <Sparkles className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
            <div className="text-xs text-amber-200 space-y-1">
              <p className="font-bold">Combine Free Self-Study with Live Skill Swaps!</p>
              <p className="text-zinc-300 leading-relaxed">
                Use these curated free platforms, YouTube tutorials, and courses to learn foundational theory on your own. When you want feedback, project reviews, or live speaking practice, schedule a session with a swapper on ExchangeYourSkill!
              </p>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: STRUCTURED SYLLABI (W3SCHOOLS) */}
      {activeTab === 'syllabi' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {SYLLABI.map((syllabus) => (
              <div 
                key={syllabus.id}
                className="bg-zinc-900/90 rounded-[24px] border border-zinc-800 p-5 shadow-xl flex flex-col justify-between space-y-4 hover:border-indigo-500/50 transition group relative overflow-hidden"
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-2xl">{syllabus.icon}</span>
                    <span className="px-2.5 py-0.5 bg-zinc-950 text-zinc-400 font-semibold rounded-full text-[10px] border border-zinc-800">
                      {syllabus.level}
                    </span>
                  </div>

                  <div>
                    <h3 className="font-bold text-white text-sm group-hover:text-indigo-400 transition">
                      {syllabus.title}
                    </h3>
                    <p className="text-zinc-400 text-xs mt-1 leading-relaxed">
                      {syllabus.description}
                    </p>
                  </div>

                  {/* Topic breakdown list */}
                  <div className="bg-zinc-950/80 rounded-2xl p-3.5 border border-zinc-800/80 space-y-1.5">
                    <p className="font-bold text-[10px] text-zinc-500 uppercase tracking-wider">Key Syllabus Topics:</p>
                    <ul className="space-y-1 text-zinc-300 text-[11px]">
                      {syllabus.topics.map((t, idx) => (
                        <li key={idx} className="flex items-center gap-1.5">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                          <span className="truncate">{t}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

                <div className="pt-2 border-t border-zinc-800 flex items-center justify-between gap-2">
                  <a
                    href={syllabus.w3Link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full inline-flex items-center justify-center gap-1.5 bg-[#00a82d] hover:bg-[#008f26] text-white font-bold px-3 py-2.5 rounded-xl text-[11px] transition shadow-md shadow-emerald-950/40 border border-emerald-500/30 no-underline cursor-pointer"
                  >
                    <span>Learn on W3Schools</span>
                    <ArrowUpRight className="w-3.5 h-3.5" />
                  </a>
                </div>
              </div>
            ))}
          </div>

          {/* Quick tips callout */}
          <div className="bg-indigo-500/10 border border-indigo-500/20 rounded-2xl p-4 flex items-start gap-3">
            <Lightbulb className="w-5 h-5 text-indigo-400 shrink-0 mt-0.5" />
            <div className="text-xs text-indigo-200 space-y-1">
              <p className="font-bold">Pro Tip for Self-Learners:</p>
              <p className="text-zinc-300">
                Combine independent study on W3Schools with real-world practice on ExchangeYourSkill. Practice concepts here on your own, then schedule a live session with a swapper to ask questions and showcase your projects!
              </p>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

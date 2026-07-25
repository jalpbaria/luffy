import React from 'react';
import { 
  BookOpen, ExternalLink, Layers, 
  CheckCircle2, ArrowUpRight, Lightbulb
} from 'lucide-react';
import { UserProfile } from '../types';

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

export default function StudyHubView({ currentUser }: StudyHubViewProps) {
  return (
    <div id="study-hub-root" className="max-w-5xl mx-auto space-y-6 text-xs text-slate-700">
      
      {/* Banner: Learn & Study on Your Own */}
      <div className="bg-stone-50/90 border border-stone-200/90 rounded-2xl p-5 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4 transition-all hover:border-emerald-200">
        <div className="flex items-start sm:items-center gap-3.5">
          <div className="w-11 h-11 bg-emerald-100/80 text-emerald-800 rounded-xl flex items-center justify-center text-xl shrink-0 shadow-inner border border-emerald-200/50">
            📚
          </div>
          <div className="space-y-1">
            <h2 className="text-base font-bold text-slate-900 tracking-tight flex items-center gap-2">
              Learn & Study on Your Own
            </h2>
            <p className="text-slate-600 text-xs leading-relaxed max-w-xl">
              Explore structured syllabi and direct <span className="font-bold text-slate-800">W3Schools</span> tutorials to study on your own!
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5 w-full md:w-auto shrink-0 pt-2 md:pt-0 border-t md:border-t-0 border-slate-200/60">
          <a
            href="https://www.w3schools.com"
            target="_blank"
            rel="noopener noreferrer"
            className="flex-1 md:flex-none inline-flex items-center justify-center gap-2 bg-[#00a82d] hover:bg-[#008f26] text-white font-bold px-4 py-2.5 rounded-xl shadow-xs transition text-xs border border-emerald-700/30 cursor-pointer no-underline"
          >
            <ExternalLink className="w-4 h-4 stroke-[2.5]" />
            <span>Learn on W3Schools</span>
            <span className="w-2.5 h-2.5 bg-emerald-300 rounded-full animate-pulse shadow-xs"></span>
          </a>
        </div>
      </div>

      {/* Navigation Header inside Study Hub */}
      <div className="flex items-center justify-between border-b border-slate-200 pb-2.5">
        <div className="flex items-center gap-2">
          <div className="px-3.5 py-1.5 bg-slate-900 text-white font-bold rounded-lg flex items-center gap-2 text-xs shadow-xs">
            <Layers className="w-4 h-4 text-emerald-400" />
            <span>Interactive Syllabi</span>
          </div>
        </div>

        <span className="hidden sm:inline text-[11px] text-slate-400 font-medium">
          Self-Paced Learning • Free & Unlimited
        </span>
      </div>

      {/* Syllabi Grid */}
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {SYLLABI.map((syllabus) => (
            <div 
              key={syllabus.id}
              className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs flex flex-col justify-between space-y-4 hover:shadow-md transition group relative overflow-hidden"
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-2xl">{syllabus.icon}</span>
                  <span className="px-2.5 py-0.5 bg-slate-100 text-slate-600 font-semibold rounded-full text-[10px]">
                    {syllabus.level}
                  </span>
                </div>

                <div>
                  <h3 className="font-bold text-slate-900 text-sm group-hover:text-indigo-600 transition">
                    {syllabus.title}
                  </h3>
                  <p className="text-slate-500 text-xs mt-1 leading-relaxed">
                    {syllabus.description}
                  </p>
                </div>

                {/* Topic breakdown list */}
                <div className="bg-slate-50/80 rounded-xl p-3 border border-slate-150/60 space-y-1.5">
                  <p className="font-bold text-[10px] text-slate-400 uppercase tracking-wider">Key Syllabus Topics:</p>
                  <ul className="space-y-1 text-slate-700 text-[11px]">
                    {syllabus.topics.map((t, idx) => (
                      <li key={idx} className="flex items-center gap-1.5">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                        <span className="truncate">{t}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              <div className="pt-2 border-t border-slate-100 flex items-center justify-between gap-2">
                <a
                  href={syllabus.w3Link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full inline-flex items-center justify-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-3 py-2.5 rounded-xl text-[11px] transition shadow-xs border border-emerald-700/30 no-underline cursor-pointer"
                >
                  <span>Learn on W3Schools</span>
                  <ArrowUpRight className="w-3.5 h-3.5" />
                </a>
              </div>
            </div>
          ))}
        </div>

        {/* Quick tips callout */}
        <div className="bg-amber-50/60 border border-amber-200/80 rounded-xl p-4 flex items-start gap-3">
          <Lightbulb className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
          <div className="text-xs text-amber-900 space-y-1">
            <p className="font-bold">Pro Tip for Self-Learners:</p>
            <p>Combine independent study on W3Schools with real-world practice on ExchangeYourSkill. Practice concepts here on your own, then schedule a live session with a swapper to ask questions and showcase your projects!</p>
          </div>
        </div>
      </div>

    </div>
  );
}

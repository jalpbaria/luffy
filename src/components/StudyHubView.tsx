import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  BookOpen, ExternalLink, Sparkles, Brain, Send, 
  Code2, Laptop, Palette, TrendingUp, Layers, Globe, 
  CheckCircle2, ArrowUpRight, GraduationCap, Lightbulb, RefreshCw, MessageSquare
} from 'lucide-react';
import { UserProfile } from '../types';
import { getAISkillTutorReply, TutorMessage } from '../lib/gemini';

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
  const [selectedTopic, setSelectedTopic] = useState<SyllabusTopic>(SYLLABI[0]);
  const [activeTab, setActiveTab] = useState<'syllabi' | 'ai-coach'>('syllabi');
  
  // AI Coach Chat State
  const [chatInput, setChatInput] = useState('');
  const [chatHistory, setChatHistory] = useState<TutorMessage[]>([
    {
      role: 'model',
      text: `Hello ${currentUser.name}! I am your AI Skill Coach. I can explain any topic, provide code snippets, break down complex concepts, or give you practice exercises for **${SYLLABI[0].title}** or any other subject you are studying on your own! What would you like to explore today?`
    }
  ]);
  const [isCoachThinking, setIsCoachThinking] = useState(false);

  const handleSendCoachMessage = async (text: string) => {
    if (!text.trim() || isCoachThinking) return;

    const userMsg = text.trim();
    setChatInput('');
    const updatedHistory: TutorMessage[] = [...chatHistory, { role: 'user', text: userMsg }];
    setChatHistory(updatedHistory);
    setIsCoachThinking(true);

    try {
      const reply = await getAISkillTutorReply(
        selectedTopic.title,
        selectedTopic.category,
        userMsg,
        updatedHistory
      );
      setChatHistory([...updatedHistory, { role: 'model', text: reply }]);
    } catch (err) {
      console.error('Error fetching AI coach reply:', err);
      setChatHistory([
        ...updatedHistory, 
        { role: 'model', text: 'Sorry, I encountered an issue retrieving an answer. Please check your connection or try asking again.' }
      ]);
    } finally {
      setIsCoachThinking(false);
    }
  };

  const handleAskCoachAboutSyllabus = (syllabus: SyllabusTopic) => {
    setSelectedTopic(syllabus);
    setActiveTab('ai-coach');
    const promptText = `Can you give me a structured 5-step self-study roadmap to master ${syllabus.title}? Include key W3Schools tutorials and practice exercises!`;
    handleSendCoachMessage(promptText);
  };

  return (
    <div id="study-hub-root" className="max-w-5xl mx-auto space-y-6 text-xs text-slate-700">
      
      {/* User Screenshot Banner: Learn & Study on Your Own */}
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
              Explore structured syllabi, direct <span className="font-bold text-slate-800">W3Schools</span> tutorials, and ask our <span className="font-bold text-slate-800">AI Skill Coach</span> any questions!
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

          <button
            onClick={() => setActiveTab('syllabi')}
            className={`flex-1 md:flex-none inline-flex items-center justify-center gap-1.5 font-bold px-4 py-2.5 rounded-xl transition text-xs cursor-pointer ${
              activeTab === 'syllabi'
                ? 'bg-slate-900 text-white shadow-xs'
                : 'bg-white border border-slate-250 text-slate-700 hover:bg-slate-100'
            }`}
          >
            <BookOpen className="w-4 h-4" />
            <span>Open Study Hub</span>
          </button>
        </div>
      </div>

      {/* Main Navigation Tabs within Study Hub */}
      <div className="flex items-center justify-between border-b border-slate-200 pb-2">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveTab('syllabi')}
            className={`px-4 py-2 rounded-lg font-bold transition flex items-center gap-2 text-xs cursor-pointer ${
              activeTab === 'syllabi'
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
            }`}
          >
            <Layers className="w-4 h-4" />
            <span>Interactive Syllabi</span>
          </button>

          <button
            onClick={() => setActiveTab('ai-coach')}
            className={`px-4 py-2 rounded-lg font-bold transition flex items-center gap-2 text-xs cursor-pointer ${
              activeTab === 'ai-coach'
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
            }`}
          >
            <Sparkles className="w-4 h-4 text-amber-300 fill-current" />
            <span>AI Skill Coach</span>
          </button>
        </div>

        <span className="hidden sm:inline text-[11px] text-slate-400 font-medium">
          Self-Paced Learning • Free & Unlimited
        </span>
      </div>

      {/* VIEW 1: Interactive Syllabi & W3Schools Direct Access */}
      {activeTab === 'syllabi' && (
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
                    className="flex-1 inline-flex items-center justify-center gap-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 font-bold px-3 py-2 rounded-lg text-[11px] transition border border-emerald-200/60 no-underline"
                  >
                    <span>W3Schools Tutorial</span>
                    <ArrowUpRight className="w-3.5 h-3.5" />
                  </a>

                  <button
                    onClick={() => handleAskCoachAboutSyllabus(syllabus)}
                    className="inline-flex items-center justify-center gap-1 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold px-3 py-2 rounded-lg text-[11px] transition border border-indigo-200/60 cursor-pointer"
                    title="Ask AI Coach for study guide"
                  >
                    <Brain className="w-3.5 h-3.5" />
                    <span>Ask Coach</span>
                  </button>
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
      )}

      {/* VIEW 2: AI Skill Coach Tutor Chat */}
      {activeTab === 'ai-coach' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col h-[580px]">
          {/* Header */}
          <div className="p-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between shrink-0">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 bg-indigo-600 text-white rounded-xl flex items-center justify-center shadow-xs font-bold text-base">
                🤖
              </div>
              <div>
                <h3 className="font-bold text-slate-800 text-sm flex items-center gap-1.5">
                  AI Skill Coach & Tutor
                  <span className="px-2 py-0.2 bg-emerald-100 text-emerald-800 rounded-full text-[9px] font-bold uppercase">Active</span>
                </h3>
                <p className="text-slate-500 text-[11px]">
                  Focusing on: <span className="font-semibold text-indigo-600">{selectedTopic.title}</span>
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <select
                value={selectedTopic.id}
                onChange={(e) => {
                  const found = SYLLABI.find(s => s.id === e.target.value);
                  if (found) setSelectedTopic(found);
                }}
                className="bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-indigo-500"
              >
                {SYLLABI.map(s => (
                  <option key={s.id} value={s.id}>{s.icon} {s.title}</option>
                ))}
              </select>

              <button
                onClick={() => {
                  setChatHistory([{
                    role: 'model',
                    text: `Chat reset! Ask me anything about **${selectedTopic.title}** or request a quiz/code breakdown.`
                  }]);
                }}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg border border-slate-200 hover:bg-slate-100 transition"
                title="Reset conversation"
              >
                <RefreshCw className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Chat Messages Feed */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50/50">
            {chatHistory.map((msg, idx) => (
              <div 
                key={idx}
                className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div className={`max-w-[85%] p-3.5 rounded-2xl shadow-xs space-y-1.5 ${
                  msg.role === 'user' 
                    ? 'bg-indigo-600 text-white rounded-br-none' 
                    : 'bg-white border border-slate-200 text-slate-800 rounded-bl-none'
                }`}>
                  <div className="flex items-center gap-1.5 text-[10px] opacity-75 font-bold uppercase tracking-wider mb-1">
                    {msg.role === 'user' ? (
                      <span>You</span>
                    ) : (
                      <span className="flex items-center gap-1 text-indigo-500">
                        <Sparkles className="w-3 h-3 fill-current" /> AI Coach
                      </span>
                    )}
                  </div>
                  <div className="text-xs leading-relaxed whitespace-pre-wrap break-words">
                    {msg.text}
                  </div>
                </div>
              </div>
            ))}

            {isCoachThinking && (
              <div className="flex justify-start">
                <div className="bg-white border border-slate-200 p-3.5 rounded-2xl rounded-bl-none text-slate-500 flex items-center gap-2 text-xs shadow-xs">
                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-indigo-600 border-t-transparent"></div>
                  <span>AI Coach is formulating a comprehensive answer...</span>
                </div>
              </div>
            )}
          </div>

          {/* Quick Prompts Suggestions */}
          <div className="p-2 border-t border-slate-150 bg-slate-50 flex items-center gap-2 overflow-x-auto shrink-0">
            <span className="text-[10px] font-bold text-slate-400 uppercase shrink-0 px-2">Quick Prompts:</span>
            <button
              onClick={() => handleSendCoachMessage(`Give me a 3-question quiz to test my knowledge on ${selectedTopic.title}.`)}
              className="bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-full px-3 py-1 text-[11px] font-medium shrink-0 cursor-pointer"
            >
              📝 Take a 3-Question Quiz
            </button>
            <button
              onClick={() => handleSendCoachMessage(`Show me a real-world code example demonstrating core principles of ${selectedTopic.title}.`)}
              className="bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-full px-3 py-1 text-[11px] font-medium shrink-0 cursor-pointer"
            >
              💻 Code Example
            </button>
            <button
              onClick={() => handleSendCoachMessage(`What are the top 3 common beginner mistakes to avoid when learning ${selectedTopic.title}?`)}
              className="bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-full px-3 py-1 text-[11px] font-medium shrink-0 cursor-pointer"
            >
              ⚠️ Common Pitfalls
            </button>
          </div>

          {/* Input Bar */}
          <form 
            onSubmit={(e) => {
              e.preventDefault();
              handleSendCoachMessage(chatInput);
            }} 
            className="p-3 border-t border-slate-200 bg-white flex items-center gap-2 shrink-0"
          >
            <input
              type="text"
              placeholder={`Ask anything about ${selectedTopic.title} or general self-study topics...`}
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
              disabled={isCoachThinking}
              className="flex-1 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
            <button
              type="submit"
              disabled={isCoachThinking || !chatInput.trim()}
              className={`px-4 py-2.5 font-bold rounded-xl shadow-xs transition flex items-center gap-1.5 text-xs cursor-pointer ${
                isCoachThinking || !chatInput.trim()
                  ? 'bg-slate-200 text-slate-400 cursor-not-allowed'
                  : 'bg-indigo-600 hover:bg-indigo-700 text-white'
              }`}
            >
              <span>Send</span>
              <Send className="w-3.5 h-3.5" />
            </button>
          </form>
        </div>
      )}

    </div>
  );
}

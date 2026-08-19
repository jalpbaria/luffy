import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  BookOpen, ExternalLink, Layers, 
  CheckCircle2, ArrowUpRight, Lightbulb,
  Sparkles, Search, Compass, Globe, Video, Award, GraduationCap,
  ChevronRight, ChevronLeft, Play, Check, Code, FileText, 
  Target, Send, Bookmark, LayoutGrid, RotateCcw, Bot, HelpCircle,
  Clock, Share2, Sparkle, Laptop, CheckSquare
} from 'lucide-react';
import { UserProfile, Skill } from '../types';
import { FREE_CATEGORY_RESOURCES, CategoryResource } from '../data/freeResources';
import { AICoachPanel } from './AICoachPanel';
import { triggerCelebrationConfetti } from '../lib/gamification';
import { Spotlight } from './motion/Spotlight';
import { FadeUp } from './motion/FadeUp';
import { EmptyState } from './ui';

interface StudyHubViewProps {
  currentUser: UserProfile | null;
  onNavigateToExplore?: (skillQuery?: string) => void;
}

export interface Lesson {
  id: string;
  title: string;
  duration: string;
  difficulty: 'Beginner' | 'Intermediate' | 'Advanced';
  objective: string;
  mentalModel: string;
  codeSnippet?: {
    language: string;
    code: string;
    explanation: string;
  };
  exercise: {
    prompt: string;
    hint: string;
    starterText?: string;
  };
  keyTakeaways: string[];
}

export interface SyllabusModule {
  id: string;
  title: string;
  category: string;
  icon: string;
  description: string;
  w3Link: string;
  level: 'Beginner' | 'Intermediate' | 'Advanced';
  lessons: Lesson[];
}

const SYLLABUS_MODULES: SyllabusModule[] = [
  {
    id: 'js-dev',
    title: 'JavaScript & Modern Web',
    category: 'Programming',
    icon: '⚡',
    description: 'Master core JavaScript ES6+, DOM manipulation, async/await, and modern browser APIs.',
    w3Link: 'https://www.w3schools.com/js/',
    level: 'Beginner',
    lessons: [
      {
        id: 'js-1',
        title: 'Variables, Scope & Primitive Types',
        duration: '15 min',
        difficulty: 'Beginner',
        objective: 'Understand the difference between let, const, primitive value types, and lexical scope.',
        mentalModel: 'Think of variables as named boxes with specific retention rules. const locks the assignment (not mutability of objects), while let allows dynamic reassignment within block scope.',
        codeSnippet: {
          language: 'javascript',
          code: `// Lexical scoping with let & const\nconst MAX_RETRIES = 3;\n\nfunction processSkillSwap(swapperName) {\n  let currentAttempt = 1;\n  if (currentAttempt <= MAX_RETRIES) {\n    const sessionKey = \`session_\${swapperName}_\${Date.now()}\`;\n    console.log("Initialized session:", sessionKey);\n  }\n  // sessionKey is block-scoped and unavailable here\n}`,
          explanation: 'Variables declared with let and const respect curly brace block boundaries, eliminating accidental global pollution.'
        },
        exercise: {
          prompt: 'Refactor a legacy var loop to modern block-scoped const/let, capturing index values inside an async timeout.',
          hint: 'Remember that let in a for-loop header creates a fresh binding for each iteration.',
          starterText: 'for (let i = 0; i < 3; i++) {\n  setTimeout(() => console.log("Swapper index:", i), 100);\n}'
        },
        keyTakeaways: [
          'Always default to const; use let only when reassignment is strictly required.',
          'Never use var in modern JavaScript to avoid hoisting side-effects.',
          'Primitive values (strings, numbers, booleans) are immutable.'
        ]
      },
      {
        id: 'js-2',
        title: 'Functions, Closures & Arrow Syntax',
        duration: '20 min',
        difficulty: 'Beginner',
        objective: 'Master first-class functions, lexical this binding, and higher-order helper patterns.',
        mentalModel: 'A closure is a function bundled with its lexical environment. It "remembers" the variables around it even when executed in another context.',
        codeSnippet: {
          language: 'javascript',
          code: `// Closure: Skill Credit Tracker\nfunction createCreditBank(initialCredits = 50) {\n  let balance = initialCredits;\n  return {\n    deposit: (amt) => { balance += amt; return balance; },\n    deduct: (amt) => { \n      if (balance >= amt) { balance -= amt; return true; }\n      return false; \n    },\n    getBalance: () => balance\n  };\n}\n\nconst userWallet = createCreditBank(100);\nuserWallet.deduct(25); // returns true, balance = 75`,
          explanation: 'The balance variable remains private and encapsulated inside the outer function scope.'
        },
        exercise: {
          prompt: 'Write a higher-order debounce function that prevents a search input handler from firing more than once every 300ms.',
          hint: 'Keep a timer reference enclosed within the returned wrapped function.',
          starterText: 'function debounce(fn, delayMs = 300) {\n  let timer;\n  return (...args) => {\n    clearTimeout(timer);\n    timer = setTimeout(() => fn(...args), delayMs);\n  };\n}'
        },
        keyTakeaways: [
          'Arrow functions inherit this lexically from their enclosing context.',
          'Closures enable private state encapsulation without classes.',
          'Functions are first-class citizens and can be passed as arguments or returned.'
        ]
      },
      {
        id: 'js-3',
        title: 'Asynchronous JavaScript & Promises',
        duration: '25 min',
        difficulty: 'Intermediate',
        objective: 'Handle async network calls, error handling with try/catch, and concurrent execution with Promise.all.',
        mentalModel: 'Async/await is non-blocking syntax sugar over Promises. The event loop delegates async I/O to Web APIs and resumes execution via the microtask queue.',
        codeSnippet: {
          language: 'javascript',
          code: `// Fetching swapper profile with async/await\nasync function fetchSwapperProfile(userId) {\n  try {\n    const response = await fetch(\`/api/profiles/\${userId}\`);\n    if (!response.ok) {\n      throw new Error(\`HTTP error! status: \${response.status}\`);\n    }\n    const profile = await response.json();\n    return profile;\n  } catch (error) {\n    console.error("Profile sync failed:", error.message);\n    return null;\n  }\n}`,
          explanation: 'Always wrap async calls in try/catch blocks to gracefully handle network dropouts and bad HTTP responses.'
        },
        exercise: {
          prompt: 'Use Promise.allSettled to load user ratings and upcoming bookings concurrently without one error failing the other.',
          hint: 'Promise.allSettled always resolves with an array of result objects containing status ("fulfilled" or "rejected").',
          starterText: 'const [ratingsRes, bookingsRes] = await Promise.allSettled([\n  fetchRatings(userId),\n  fetchBookings(userId)\n]);'
        },
        keyTakeaways: [
          'Use async/await for readable sequential asynchronous workflows.',
          'Use Promise.all for independent parallel operations to maximize throughput.',
          'Always guard network requests with comprehensive error boundaries.'
        ]
      },
      {
        id: 'js-4',
        title: 'DOM Manipulation & Event Listeners',
        duration: '20 min',
        difficulty: 'Beginner',
        objective: 'Select elements, handle user click/input events, and optimize event delegation.',
        mentalModel: 'Event delegation attaches a single listener to a common ancestor, relying on event bubbling instead of registering individual listeners on hundreds of children.',
        codeSnippet: {
          language: 'javascript',
          code: `// Event delegation on a list container\nconst skillList = document.querySelector('#skills-container');\n\nskillList.addEventListener('click', (e) => {\n  const skillChip = e.target.closest('[data-skill-id]');\n  if (skillChip) {\n    const skillId = skillChip.dataset.skillId;\n    console.log("Selected skill:", skillId);\n  }\n});`,
          explanation: 'closest() cleanly traverses up to the desired element regardless of whether the user clicked an inner SVG icon or text span.'
        },
        exercise: {
          prompt: 'Implement a simple dynamic search filter that reveals matching cards as the user types.',
          hint: 'Listen to the "input" event and update className or hidden attributes.',
          starterText: 'inputEl.addEventListener("input", (e) => {\n  const q = e.target.value.toLowerCase();\n  cards.forEach(c => c.hidden = !c.textContent.toLowerCase().includes(q));\n});'
        },
        keyTakeaways: [
          'Prefer event delegation for dynamically inserted elements.',
          'Always clean up event listeners to prevent memory leaks in long-running single-page apps.'
        ]
      },
      {
        id: 'js-5',
        title: 'Interactive Project: Live Barter Calculator',
        duration: '35 min',
        difficulty: 'Intermediate',
        objective: 'Synthesize your JavaScript skills by building a client-side skill credit exchange calculator.',
        mentalModel: 'Combine state management, event handling, and input validation to calculate reciprocal barter balances.',
        codeSnippet: {
          language: 'javascript',
          code: `// Barter Equation Evaluator\nfunction calculateBarterDeficit(teachingHours, learningHours, creditRate = 10) {\n  const creditsEarned = teachingHours * creditRate;\n  const creditsSpent = learningHours * creditRate;\n  const balance = creditsEarned - creditsSpent;\n  return {\n    balanced: balance === 0,\n    creditsOwed: balance < 0 ? Math.abs(balance) : 0,\n    creditsSurplus: balance > 0 ? balance : 0\n  };\n}`,
          explanation: 'Clean mathematical modeling allows pure functions to power both UI and backend validation.'
        },
        exercise: {
          prompt: 'Test the barter calculator with 3 hours of teaching Python vs 2 hours of learning UI/UX design.',
          hint: 'Calculate with a credit rate of 10 to see a +10 credit surplus.',
          starterText: 'const result = calculateBarterDeficit(3, 2, 10);\nconsole.log("Barter status:", result);'
        },
        keyTakeaways: [
          'Separate pure business calculation logic from DOM manipulation code.',
          'Unit test edge cases like zero hours or unequal credit valuations.'
        ]
      }
    ]
  },
  {
    id: 'react-dev',
    title: 'React.js Modern Architecture',
    category: 'Programming',
    icon: '⚛️',
    description: 'Build interactive user interfaces with components, hooks, state management, and props.',
    w3Link: 'https://www.w3schools.com/react/',
    level: 'Intermediate',
    lessons: [
      {
        id: 'react-1',
        title: 'JSX, Props & Declarative UI',
        duration: '15 min',
        difficulty: 'Beginner',
        objective: 'Understand how React transforms declarative JSX into real DOM updates and pass props with TypeScript.',
        mentalModel: 'UI is a pure mathematical function of state and props: UI = f(state, props). When data changes, React re-renders the component tree automatically.',
        codeSnippet: {
          language: 'tsx',
          code: `interface SkillBadgeProps {\n  name: string;\n  verified: boolean;\n  onSelect?: (name: string) => void;\n}\n\nexport const SkillBadge: React.FC<SkillBadgeProps> = ({\n  name,\n  verified,\n  onSelect\n}) => (\n  <button\n    type="button"\n    onClick={() => onSelect?.(name)}\n    className="px-3 py-1 rounded-xl bg-surface-raised border border-white/10 text-xs font-bold text-white hover:border-violet-500/40 transition"\n  >\n    <span>{name}</span>\n    {verified && <span className="ml-1.5 text-violet-400">★</span>}\n  </button>\n);`,
          explanation: 'TypeScript interfaces provide autocomplete and guarantee that required props are never accidentally omitted.'
        },
        exercise: {
          prompt: 'Create a SwapperAvatar component that displays an image with an optional online status indicator dot.',
          hint: 'Use absolute positioning on the indicator dot relative to the avatar container.',
          starterText: 'export const SwapperAvatar = ({ src, name, isOnline }: { src: string; name: string; isOnline?: boolean }) => (\n  <div className="relative">\n    <img src={src} alt={name} className="w-10 h-10 rounded-full" />\n    {isOnline && <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-emerald-400 rounded-full" />}\n  </div>\n);'
        },
        keyTakeaways: [
          'JSX expressions must return a single root element or Fragment (<>...</>).',
          'Props are strictly read-only and must never be mutated directly by a child.'
        ]
      },
      {
        id: 'react-2',
        title: 'State Management with useState & useReducer',
        duration: '20 min',
        difficulty: 'Beginner',
        objective: 'Handle component state updates immutably and structure complex forms.',
        mentalModel: 'State updates in React are queued and trigger a re-render. Always create fresh copies of arrays/objects rather than mutating the original state.',
        codeSnippet: {
          language: 'tsx',
          code: `// Updating nested list state immutably\nconst [skills, setSkills] = useState<string[]>(['TypeScript', 'React']);\n\nconst addSkill = (newSkill: string) => {\n  if (!skills.includes(newSkill)) {\n    // Create a new array reference\n    setSkills(prev => [...prev, newSkill]);\n  }\n};\n\nconst removeSkill = (skillToRemove: string) => {\n  setSkills(prev => prev.filter(s => s !== skillToRemove));\n};`,
          explanation: 'The spread operator (...) and Array.filter() generate brand-new references, allowing React to detect changes correctly.'
        },
        exercise: {
          prompt: 'Write a simple toggle state handler that tracks whether the AI Coach panel is expanded.',
          hint: 'Use functional update: setIsExpanded(prev => !prev).',
          starterText: 'const [isExpanded, setIsExpanded] = useState(false);\nconst toggle = () => setIsExpanded(p => !p);'
        },
        keyTakeaways: [
          'Never mutate state directly (e.g. state.push() is forbidden).',
          'Use functional updates when new state depends on previous state.'
        ]
      },
      {
        id: 'react-3',
        title: 'Side Effects & Lifecycle with useEffect',
        duration: '25 min',
        difficulty: 'Intermediate',
        objective: 'Sync with external systems, subscribe to real-time events, and avoid infinite render loops.',
        mentalModel: 'useEffect is for synchronizing React state with outside entities (like timers, DOM listeners, or network subscriptions).',
        codeSnippet: {
          language: 'tsx',
          code: `useEffect(() => {\n  let isMounted = true;\n  \n  async function loadSwapperIndex() {\n    const data = await fetchSwappers();\n    if (isMounted) setSwappers(data);\n  }\n  loadSwapperIndex();\n  \n  // Cleanup on unmount\n  return () => { isMounted = false; };\n}, [category]); // Only re-run if category changes`,
          explanation: 'The dependency array dictates when the effect fires. The returned cleanup function runs before the next effect or on component unmount.'
        },
        exercise: {
          prompt: 'Write an effect that listens to window resize and debounces dimension state updates.',
          hint: 'Always call window.removeEventListener in the cleanup return function.',
          starterText: 'useEffect(() => {\n  const handleResize = () => setWidth(window.innerWidth);\n  window.addEventListener("resize", handleResize);\n  return () => window.removeEventListener("resize", handleResize);\n}, []);'
        },
        keyTakeaways: [
          'Always stabilize functions/objects or use primitive values in dependency arrays.',
          'Always clean up subscriptions, event listeners, and timers to prevent memory leaks.'
        ]
      },
      {
        id: 'react-4',
        title: 'Custom Hooks & Code Reusability',
        duration: '25 min',
        difficulty: 'Intermediate',
        objective: 'Extract stateful logic into modular custom hooks (e.g. useDebounce, useMediaQuery, useLocalStorage).',
        mentalModel: 'Custom hooks let you share stateful logic between components without duplicating code or creating wrapper components.',
        codeSnippet: {
          language: 'tsx',
          code: `export function useLocalStorage<T>(key: string, initialValue: T) {\n  const [value, setValue] = useState<T>(() => {\n    try {\n      const item = window.localStorage.getItem(key);\n      return item ? JSON.parse(item) : initialValue;\n    } catch {\n      return initialValue;\n    }\n  });\n\n  const setStoredValue = (newValue: T | ((val: T) => T)) => {\n    const valueToStore = newValue instanceof Function ? newValue(value) : newValue;\n    setValue(valueToStore);\n    window.localStorage.setItem(key, JSON.stringify(valueToStore));\n  };\n\n  return [value, setStoredValue] as const;\n}`,
          explanation: 'Encapsulates localStorage JSON serialization with fallback error guarding.'
        },
        exercise: {
          prompt: 'Create a useSkillProgress hook that computes percentage completed from an array of booleans.',
          hint: 'Calculate completed count / total count * 100.',
          starterText: 'export function useSkillProgress(steps: boolean[]) {\n  const completed = steps.filter(Boolean).length;\n  return steps.length ? Math.round((completed / steps.length) * 100) : 0;\n}'
        },
        keyTakeaways: [
          'Hook names must always begin with the "use" prefix.',
          'Hooks can compose other standard React hooks internally.'
        ]
      },
      {
        id: 'react-5',
        title: 'Project: Interactive Live Exchange Workspace',
        duration: '40 min',
        difficulty: 'Advanced',
        objective: 'Build a component combining live chat synchronization, timer countdowns, and session notes.',
        mentalModel: 'Integrate custom state, event hooks, and animation transitions into a cohesive production module.',
        codeSnippet: {
          language: 'tsx',
          code: `// Live Session Timer with Warning States\nexport const SessionCountdown: React.FC<{ durationMins: number; onEnd: () => void }> = ({\n  durationMins,\n  onEnd\n}) => {\n  const [secondsLeft, setSecondsLeft] = useState(durationMins * 60);\n  \n  useEffect(() => {\n    if (secondsLeft <= 0) { onEnd(); return; }\n    const interval = setInterval(() => setSecondsLeft(s => s - 1), 1000);\n    return () => clearInterval(interval);\n  }, [secondsLeft, onEnd]);\n  \n  const mins = Math.floor(secondsLeft / 60);\n  const secs = secondsLeft % 60;\n  return <span className="font-mono text-sm">{mins}:{secs < 10 ? '0' : ''}{secs}</span>;\n};`,
          explanation: 'Clear lifecycle teardown guarantees reliable timer behavior.'
        },
        exercise: {
          prompt: 'Add an audio chime or celebration confetti when the timer reaches 0.',
          hint: 'Call triggerCelebrationConfetti() inside the onEnd handler.',
          starterText: 'if (secondsLeft <= 0) {\n  triggerCelebrationConfetti();\n  onEnd();\n}'
        },
        keyTakeaways: [
          'Component decomposition keeps code readable, testable, and maintainable.'
        ]
      }
    ]
  },
  {
    id: 'python-dev',
    title: 'Python for Scripting & AI',
    category: 'Programming',
    icon: '🐍',
    description: 'Learn versatile Python syntax for automation, data analysis, web backend, and AI scripting.',
    w3Link: 'https://www.w3schools.com/python/',
    level: 'Beginner',
    lessons: [
      {
        id: 'py-1',
        title: 'Python Data Structures & List Comprehensions',
        duration: '15 min',
        difficulty: 'Beginner',
        objective: 'Master lists, dictionaries, tuples, sets, and concise list comprehensions.',
        mentalModel: 'Python emphasizes readability. List comprehensions transform and filter data in a clean, single-line expressive syntax.',
        codeSnippet: {
          language: 'python',
          code: `# Filtering verified swappers with list comprehension\nswappers = [\n    {"name": "Elena", "skill": "React", "rating": 4.9, "verified": True},\n    {"name": "Marcus", "skill": "Python", "rating": 4.7, "verified": False},\n    {"name": "Amina", "skill": "UI/UX", "rating": 5.0, "verified": True},\n]\n\ntop_mentors = [s["name"] for s in swappers if s["verified"] and s["rating"] >= 4.8]\nprint("Top Verified Mentors:", top_mentors) # ['Elena', 'Amina']`,
          explanation: 'List comprehensions replace verbose multi-line loops with clean, readable data transformations.'
        },
        exercise: {
          prompt: 'Write a dictionary comprehension that maps skill names to their uppercase versions.',
          hint: '{s: s.upper() for s in skills}',
          starterText: 'skills = ["python", "react", "sql"]\nupper_map = {s: s.upper() for s in skills}'
        },
        keyTakeaways: [
          'Use dictionaries for O(1) key lookups; use sets for uniqueness.',
          'List comprehensions are generally faster and cleaner than traditional for-loops.'
        ]
      },
      {
        id: 'py-2',
        title: 'Functions, *args, **kwargs & Type Hints',
        duration: '20 min',
        difficulty: 'Beginner',
        objective: 'Write clean, type-annotated functions with variable arguments and default parameters.',
        mentalModel: 'Type hints in Python 3.9+ act as documentation and enable static linters like mypy to catch bugs before runtime.',
        codeSnippet: {
          language: 'python',
          code: `from typing import Optional, List\n\ndef match_swapper(\n    target_skill: str,\n    available_teachers: List[dict],\n    min_rating: float = 4.5\n) -> Optional[dict]:\n    for teacher in available_teachers:\n        if teacher.get("skill") == target_skill and teacher.get("rating", 0) >= min_rating:\n            return teacher\n    return None`,
          explanation: 'Clear type annotations clarify function signatures and prevent subtle type mismatch bugs.'
        },
        exercise: {
          prompt: 'Create a function with **kwargs that merges custom session settings with defaults.',
          hint: 'Use default_settings.update(kwargs).',
          starterText: 'def configure_session(**kwargs):\n    config = {"duration": 45, "mode": "video"}\n    config.update(kwargs)\n    return config'
        },
        keyTakeaways: [
          'Always use dict.get(key, default) to safely avoid KeyError exceptions.',
          'Annotate functions with type hints for clarity.'
        ]
      },
      {
        id: 'py-3',
        title: 'Calling Gemini API with @google/genai in Python',
        duration: '25 min',
        difficulty: 'Intermediate',
        objective: 'Send prompts to Gemini models, configure system instructions, and parse responses.',
        mentalModel: 'The Google GenAI SDK allows Python scripts to generate content, analyze code, and parse structured output seamlessly.',
        codeSnippet: {
          language: 'python',
          code: `import os\nfrom google import genai\n\n# Initialize client using environment variable\nclient = genai.Client(api_key=os.environ.get("GEMINI_API_KEY"))\n\nresponse = client.models.generate_content(\n    model="gemini-2.5-flash",\n    contents="Generate 3 practical Python exercises for an intermediate developer."\n)\n\nprint("AI Coach Response:\\n", response.text)`,
          explanation: 'Never hardcode API keys; always read from environment variables or secure secret managers.'
        },
        exercise: {
          prompt: 'Modify the prompt to request output in structured JSON format.',
          hint: 'Pass response_mime_type="application/json" in generation config.',
          starterText: 'response = client.models.generate_content(\n    model="gemini-2.5-flash",\n    contents="List 3 topics",\n    config={"response_mime_type": "application/json"}\n)'
        },
        keyTakeaways: [
          'Gemini 2.5 Flash is ideal for fast interactive coding assistants.',
          'Always handle rate limits and missing keys gracefully.'
        ]
      }
    ]
  },
  {
    id: 'ai-prompting',
    title: 'AI Prompt Engineering & LLMs',
    category: 'Artificial Intelligence',
    icon: '🤖',
    description: 'Understand Gemini API prompting, system instructions, structured JSON outputs, and RAG.',
    w3Link: 'https://www.w3schools.com/genai/',
    level: 'Intermediate',
    lessons: [
      {
        id: 'ai-1',
        title: 'System Instructions & Persona Framing',
        duration: '15 min',
        difficulty: 'Beginner',
        objective: 'Frame LLM behavior with clear system instructions, tone boundaries, and guardrails.',
        mentalModel: 'System instructions define the context, persona, and rules of engagement before user messages are processed.',
        codeSnippet: {
          language: 'typescript',
          code: `const systemInstruction = \`You are an expert, encouraging skill-exchange tutor.\nYour mission is to guide learners step-by-step through practical drills.\nNever give away the final code immediately—first provide intuition and a hint.\`;\n\n// Passed to Gemini API client configuration`,
          explanation: 'Persona framing keeps responses focused, actionable, and aligned with pedagogical principles.'
        },
        exercise: {
          prompt: 'Write a system prompt that forces the AI to output exactly 3 bullet points with bold keywords.',
          hint: 'Specify format constraints: "Reply strictly with 3 bullet points, each starting with a **Bold Keyword**."',
          starterText: 'const prompt = "Format your answer as strictly 3 bullet points with bold keywords.";'
        },
        keyTakeaways: [
          'Be explicit about role, tone, constraints, and disallowed responses.',
          'Keep instructions concise and direct.'
        ]
      },
      {
        id: 'ai-2',
        title: 'Few-Shot Prompting & JSON Schema Outputs',
        duration: '20 min',
        difficulty: 'Intermediate',
        objective: 'Provide input-output examples and enforce strict JSON schemas for predictable programmatic parsing.',
        mentalModel: 'Few-shot prompting shows the model concrete examples of the desired pattern, dramatically increasing adherence to custom schemas.',
        codeSnippet: {
          language: 'json',
          code: `{\n  "skillName": "React Hooks",\n  "difficulty": "Intermediate",\n  "exercises": [\n    {\n      "title": "useRef Focus Manager",\n      "timeMinutes": 10,\n      "deliverable": "Auto-focusing search bar"\n    }\n  ]\n}`,
          explanation: 'Using responseSchema or JSON formatting guarantees valid syntax for direct frontend consumption.'
        },
        exercise: {
          prompt: 'Define a TypeScript interface for a skill roadmap step and prompt the LLM to populate it.',
          hint: 'Include fields for title, duration, deliverable, and resource link.',
          starterText: 'interface SkillStep {\n  title: string;\n  duration: string;\n  deliverable: string;\n}'
        },
        keyTakeaways: [
          'Few-shot examples anchor ambiguous edge cases.',
          'Always parse JSON responses within try/catch blocks.'
        ]
      }
    ]
  }
];

export default function StudyHubView({ currentUser, onNavigateToExplore }: StudyHubViewProps) {
  const [selectedModuleId, setSelectedModuleId] = useState<string>('js-dev');
  const [selectedLessonIndex, setSelectedLessonIndex] = useState<number>(0);
  const [completedLessons, setCompletedLessons] = useState<Record<string, boolean>>({});
  const [exerciseScratchpad, setExerciseScratchpad] = useState<string>('');
  const [mobileActiveTab, setMobileActiveTab] = useState<'syllabus' | 'lesson' | 'coach'>('lesson');
  const [showResourcesDirectoryModal, setShowResourcesDirectoryModal] = useState<boolean>(false);
  const [resourceSearch, setResourceSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');

  // Active module & lesson objects
  const activeModule = useMemo(() => {
    return SYLLABUS_MODULES.find(m => m.id === selectedModuleId) || SYLLABUS_MODULES[0];
  }, [selectedModuleId]);

  const activeLesson = useMemo(() => {
    return activeModule.lessons[selectedLessonIndex] || activeModule.lessons[0];
  }, [activeModule, selectedLessonIndex]);

  // Overall module progress calculation
  const totalLessonsInModule = activeModule.lessons.length;
  const completedInModule = activeModule.lessons.filter(l => completedLessons[l.id]).length;
  const moduleProgressPercent = Math.round((completedInModule / totalLessonsInModule) * 100);

  const isCurrentLessonComplete = !!completedLessons[activeLesson.id];

  const handleToggleLessonComplete = (lessonId: string) => {
    setCompletedLessons(prev => {
      const isNowDone = !prev[lessonId];
      if (isNowDone) {
        triggerCelebrationConfetti();
      }
      return { ...prev, [lessonId]: isNowDone };
    });
  };

  const handleNextLesson = () => {
    if (selectedLessonIndex < activeModule.lessons.length - 1) {
      setSelectedLessonIndex(selectedLessonIndex + 1);
      setExerciseScratchpad('');
    }
  };

  const handlePrevLesson = () => {
    if (selectedLessonIndex > 0) {
      setSelectedLessonIndex(selectedLessonIndex - 1);
      setExerciseScratchpad('');
    }
  };

  // Filtered free resources for the directory modal
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
        r.category.toLowerCase().includes(q)
      );
    }
    return list;
  }, [selectedCategory, resourceSearch]);

  return (
    <div id="study-hub-workspace" className="space-y-6 max-w-7xl mx-auto pb-16">
      
      {/* 1. TOP HERO & COURSE SWITCHER HEADER */}
      <div className="bg-surface-base border border-white/10 rounded-3xl p-5 sm:p-6 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-5 relative overflow-hidden">
        <div className="absolute top-0 right-1/4 w-72 h-72 bg-violet-600/10 rounded-full blur-3xl pointer-events-none" />

        <div className="flex items-start sm:items-center gap-4 relative z-10">
          <div className="w-12 h-12 rounded-2xl bg-violet-600/20 border border-violet-500/30 flex items-center justify-center text-2xl shrink-0">
            {activeModule.icon}
          </div>
          <div className="space-y-1">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="px-2.5 py-0.5 rounded-full bg-violet-500/15 text-lavender-300 border border-violet-500/20 text-xs font-bold uppercase tracking-wider">
                Study Hub Workspace
              </span>
              <span className="text-xs text-text-dim">
                • {activeModule.category} • {activeModule.level}
              </span>
            </div>
            <h1 className="text-xl sm:text-2xl font-black text-white font-display tracking-tight">
              {activeModule.title}
            </h1>
          </div>
        </div>

        {/* Action Controls & Resource Directory Trigger */}
        <div className="flex items-center gap-3 relative z-10 flex-wrap">
          <button
            type="button"
            onClick={() => setShowResourcesDirectoryModal(true)}
            className="px-4 py-2.5 rounded-2xl bg-surface-raised hover:bg-surface-interactive text-text-sub hover:text-white border border-white/10 text-xs font-bold transition flex items-center gap-2 cursor-pointer"
          >
            <BookOpen className="w-4 h-4 text-violet-400" />
            <span>Free Resources Directory</span>
          </button>

          <a
            href={activeModule.w3Link}
            target="_blank"
            rel="noopener noreferrer"
            className="px-4 py-2.5 rounded-2xl bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 border border-emerald-500/30 text-xs font-bold transition flex items-center gap-2 no-underline cursor-pointer"
          >
            <ExternalLink className="w-4 h-4" />
            <span>Official Docs</span>
          </a>
        </div>
      </div>

      {/* 2. MOBILE RESPONSIVE SEGMENTED VIEW SWITCHER (< lg screens) */}
      <div className="lg:hidden flex items-center bg-surface-base p-1 rounded-2xl border border-white/10 text-xs font-bold">
        <button
          type="button"
          onClick={() => setMobileActiveTab('syllabus')}
          className={`flex-1 py-2 rounded-xl transition flex items-center justify-center gap-1.5 cursor-pointer ${
            mobileActiveTab === 'syllabus'
              ? 'bg-violet-600 text-white shadow-md'
              : 'text-text-sub hover:text-white'
          }`}
        >
          <Layers className="w-3.5 h-3.5" />
          <span>Syllabus ({completedInModule}/{totalLessonsInModule})</span>
        </button>

        <button
          type="button"
          onClick={() => setMobileActiveTab('lesson')}
          className={`flex-1 py-2 rounded-xl transition flex items-center justify-center gap-1.5 cursor-pointer ${
            mobileActiveTab === 'lesson'
              ? 'bg-violet-600 text-white shadow-md'
              : 'text-text-sub hover:text-white'
          }`}
        >
          <BookOpen className="w-3.5 h-3.5" />
          <span>Lesson Workspace</span>
        </button>

        <button
          type="button"
          onClick={() => setMobileActiveTab('coach')}
          className={`flex-1 py-2 rounded-xl transition flex items-center justify-center gap-1.5 cursor-pointer ${
            mobileActiveTab === 'coach'
              ? 'bg-violet-600 text-white shadow-md'
              : 'text-text-sub hover:text-white'
          }`}
        >
          <Bot className="w-3.5 h-3.5" />
          <span>AI Coach</span>
        </button>
      </div>

      {/* 3. THREE-COLUMN IMMERSIVE LEARNING WORKSPACE */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* ======================================================== */}
        {/* COLUMN 1: LEFT - LEARNING PATH / SYLLABUS NAVIGATION */}
        {/* ======================================================== */}
        <div className={`lg:col-span-3 space-y-4 ${
          mobileActiveTab === 'syllabus' ? 'block' : 'hidden lg:block'
        }`}>
          {/* Module Switcher Dropdown */}
          <div className="bg-surface-base border border-white/10 rounded-3xl p-4 shadow-xl space-y-3">
            <label className="text-[11px] font-bold text-text-dim uppercase tracking-wider block">
              Choose Study Curriculum
            </label>
            <div className="space-y-1.5">
              {SYLLABUS_MODULES.map((mod) => (
                <button
                  key={mod.id}
                  type="button"
                  onClick={() => {
                    setSelectedModuleId(mod.id);
                    setSelectedLessonIndex(0);
                    setExerciseScratchpad('');
                    if (window.innerWidth < 1024) setMobileActiveTab('lesson');
                  }}
                  className={`w-full p-2.5 rounded-2xl text-left transition flex items-center justify-between text-xs cursor-pointer border ${
                    selectedModuleId === mod.id
                      ? 'bg-violet-600/20 text-white border-violet-500/40 font-bold'
                      : 'bg-surface-raised/60 hover:bg-surface-interactive text-text-sub hover:text-white border-white/5'
                  }`}
                >
                  <div className="flex items-center gap-2.5 truncate">
                    <span className="text-base">{mod.icon}</span>
                    <span className="truncate">{mod.title}</span>
                  </div>
                  {selectedModuleId === mod.id && (
                    <ChevronRight className="w-4 h-4 text-violet-400 shrink-0" />
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Module Syllabus & Lessons Tree */}
          <div className="bg-surface-base border border-white/10 rounded-3xl p-5 shadow-xl space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-white">Course Syllabus</span>
              <span className="text-xs font-bold text-lavender-300">
                {moduleProgressPercent}% Mastered
              </span>
            </div>

            {/* Mini Progress Bar */}
            <div className="w-full bg-black/40 rounded-full h-1.5 overflow-hidden border border-white/5">
              <div 
                className="bg-gradient-to-r from-violet-600 to-emerald-400 h-full rounded-full transition-all duration-500"
                style={{ width: `${moduleProgressPercent}%` }}
              />
            </div>

            {/* Lesson Items */}
            <div className="space-y-2 pt-1">
              {activeModule.lessons.map((lesson, idx) => {
                const isSelected = selectedLessonIndex === idx;
                const isDone = !!completedLessons[lesson.id];

                return (
                  <button
                    key={lesson.id}
                    type="button"
                    onClick={() => {
                      setSelectedLessonIndex(idx);
                      setExerciseScratchpad('');
                      if (window.innerWidth < 1024) setMobileActiveTab('lesson');
                    }}
                    className={`w-full p-3 rounded-2xl text-left transition flex items-start justify-between gap-2.5 cursor-pointer border ${
                      isSelected
                        ? 'bg-violet-600 text-white border-violet-400/50 shadow-lg shadow-violet-600/20'
                        : isDone
                          ? 'bg-surface-raised/40 text-text-sub border-emerald-500/20 hover:border-emerald-500/40'
                          : 'bg-surface-raised hover:bg-surface-interactive text-text-sub hover:text-white border-white/5'
                    }`}
                  >
                    <div className="flex items-start gap-2.5 min-w-0">
                      <div 
                        onClick={(e) => {
                          e.stopPropagation();
                          handleToggleLessonComplete(lesson.id);
                        }}
                        className={`w-5 h-5 rounded-lg border flex items-center justify-center shrink-0 mt-0.5 transition ${
                          isDone
                            ? isSelected
                              ? 'bg-white text-violet-700 border-white'
                              : 'bg-emerald-500 text-black border-emerald-400'
                            : isSelected
                              ? 'border-white/40 text-transparent'
                              : 'border-white/20 text-transparent hover:border-white/40'
                        }`}
                      >
                        <Check className="w-3.5 h-3.5 stroke-[3]" />
                      </div>

                      <div className="min-w-0">
                        <span className={`text-[10px] font-bold block ${
                          isSelected ? 'text-violet-200' : 'text-text-dim'
                        }`}>
                          Lesson {idx + 1}
                        </span>
                        <span className={`text-xs font-bold leading-tight block truncate ${
                          isSelected ? 'text-white' : isDone ? 'line-through text-text-muted' : 'text-text-main'
                        }`}>
                          {lesson.title}
                        </span>
                      </div>
                    </div>

                    <span className={`text-[10px] font-medium shrink-0 ${
                      isSelected ? 'text-violet-200' : 'text-text-dim'
                    }`}>
                      {lesson.duration}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* ======================================================== */}
        {/* COLUMN 2: CENTER - CURRENT LESSON / PROJECT WORKSPACE */}
        {/* ======================================================== */}
        <div className={`lg:col-span-6 space-y-6 ${
          mobileActiveTab === 'lesson' ? 'block' : 'hidden lg:block'
        }`}>
          <Spotlight className="bg-surface-base border border-white/10 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-6">
            
            {/* Lesson Title & Status Bar */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/5 pb-5">
              <div className="space-y-1.5">
                <div className="flex items-center gap-2">
                  <span className="px-2.5 py-0.5 rounded-md bg-violet-500/20 text-lavender-300 text-xs font-bold">
                    Lesson {selectedLessonIndex + 1} of {activeModule.lessons.length}
                  </span>
                  <span className="text-xs text-text-dim">
                    • {activeLesson.difficulty} • {activeLesson.duration}
                  </span>
                </div>
                <h2 className="text-2xl sm:text-3xl font-bold text-white font-display tracking-tight">
                  {activeLesson.title}
                </h2>
              </div>

              {/* Complete Toggle Button */}
              <button
                type="button"
                onClick={() => handleToggleLessonComplete(activeLesson.id)}
                className={`px-4 py-2 rounded-2xl text-xs font-bold transition flex items-center justify-center gap-2 cursor-pointer border shrink-0 ${
                  isCurrentLessonComplete
                    ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40 hover:bg-emerald-500/30'
                    : 'bg-violet-600 hover:bg-violet-500 text-white border-violet-500 shadow-md shadow-violet-600/20'
                }`}
              >
                <Check className="w-4 h-4 stroke-[3]" />
                <span>{isCurrentLessonComplete ? 'Lesson Completed ✓' : 'Mark as Done'}</span>
              </button>
            </div>

            {/* 1. Learning Objective */}
            <div className="p-4 rounded-2xl bg-surface-raised border border-white/5 space-y-1">
              <span className="text-[10px] font-bold text-text-dim uppercase tracking-wider flex items-center gap-1.5">
                <Target className="w-3.5 h-3.5 text-violet-400" />
                Lesson Objective
              </span>
              <p className="text-xs sm:text-sm text-text-main leading-relaxed font-medium">
                {activeLesson.objective}
              </p>
            </div>

            {/* 2. Mental Model / Core Concept */}
            <div className="space-y-2">
              <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
                <Lightbulb className="w-4 h-4 text-amber-400" />
                <span>Core Concept & Mental Model</span>
              </h3>
              <p className="text-xs sm:text-sm text-text-sub leading-relaxed">
                {activeLesson.mentalModel}
              </p>
            </div>

            {/* 3. Formatted Code Snippet (if available) */}
            {activeLesson.codeSnippet && (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-text-dim uppercase tracking-wider flex items-center gap-1.5">
                    <Code className="w-3.5 h-3.5 text-violet-400" />
                    Example Code ({activeLesson.codeSnippet.language})
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      navigator.clipboard.writeText(activeLesson.codeSnippet?.code || '');
                      triggerCelebrationConfetti();
                    }}
                    className="text-[11px] font-semibold text-lavender-300 hover:text-white bg-transparent border-0 cursor-pointer"
                  >
                    Copy Snippet
                  </button>
                </div>

                <div className="rounded-2xl bg-black/80 border border-white/10 p-4 font-mono text-xs text-text-sub overflow-x-auto">
                  <pre className="leading-relaxed whitespace-pre">
                    <code>{activeLesson.codeSnippet.code}</code>
                  </pre>
                </div>
                <p className="text-[11px] text-text-dim italic">
                  💡 {activeLesson.codeSnippet.explanation}
                </p>
              </div>
            )}

            {/* 4. Practical Hands-on Exercise */}
            <div className="p-5 rounded-2xl bg-surface-raised border border-violet-500/20 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-lavender-200 uppercase tracking-wider flex items-center gap-2">
                  <Laptop className="w-4 h-4 text-violet-400" />
                  <span>Hands-On Drill / Exercise</span>
                </span>
                <span className="text-[10px] text-text-dim font-medium">
                  {activeLesson.exercise.hint}
                </span>
              </div>

              <p className="text-xs text-text-main font-semibold leading-relaxed">
                {activeLesson.exercise.prompt}
              </p>

              {/* Code / Notes Scratchpad */}
              <div className="space-y-1.5">
                <textarea
                  rows={3}
                  value={exerciseScratchpad}
                  onChange={(e) => setExerciseScratchpad(e.target.value)}
                  placeholder={activeLesson.exercise.starterText || "Write your solution or notes here..."}
                  className="w-full bg-black/60 border border-white/10 rounded-xl p-3 text-xs font-mono text-white placeholder:text-text-muted focus:outline-none focus:ring-1 focus:ring-violet-500"
                />
              </div>

              {/* Bridge to AI Coach */}
              <div className="flex items-center justify-between pt-1">
                <span className="text-[11px] text-text-dim">
                  Need an exercise review or hints?
                </span>
                <button
                  type="button"
                  onClick={() => {
                    if (window.innerWidth < 1024) {
                      setMobileActiveTab('coach');
                    }
                  }}
                  className="text-xs font-bold text-violet-400 hover:text-lavender-200 flex items-center gap-1 cursor-pointer bg-transparent border-0"
                >
                  <span>Ask AI Coach</span>
                  <ArrowUpRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* 5. Key Takeaways Checklist */}
            <div className="space-y-2 pt-2 border-t border-white/5">
              <span className="text-xs font-bold text-text-dim uppercase tracking-wider block">
                Key Takeaways
              </span>
              <ul className="space-y-1.5 text-xs text-text-sub">
                {activeLesson.keyTakeaways.map((takeaway, tIdx) => (
                  <li key={tIdx} className="flex items-start gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                    <span>{takeaway}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* 6. Navigation Controls: Prev / Next Lesson */}
            <div className="flex items-center justify-between pt-4 border-t border-white/5 gap-3">
              <button
                type="button"
                onClick={handlePrevLesson}
                disabled={selectedLessonIndex === 0}
                className="px-4 py-2.5 rounded-2xl bg-surface-raised hover:bg-surface-interactive disabled:opacity-30 text-text-sub hover:text-white border border-white/10 text-xs font-bold transition flex items-center gap-2 cursor-pointer"
              >
                <ChevronLeft className="w-4 h-4" />
                <span>Previous Lesson</span>
              </button>

              <button
                type="button"
                onClick={handleNextLesson}
                disabled={selectedLessonIndex === activeModule.lessons.length - 1}
                className="px-5 py-2.5 rounded-2xl bg-violet-600 hover:bg-violet-500 disabled:opacity-30 text-white font-bold text-xs transition flex items-center gap-2 cursor-pointer shadow-lg shadow-violet-600/25"
              >
                <span>Next Lesson</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </Spotlight>
        </div>

        {/* ======================================================== */}
        {/* COLUMN 3: RIGHT - INTEGRATED AI COACH */}
        {/* ======================================================== */}
        <div className={`lg:col-span-3 h-[600px] lg:h-[720px] sticky top-6 ${
          mobileActiveTab === 'coach' ? 'block' : 'hidden lg:block'
        }`}>
          <AICoachPanel
            currentTopic={activeModule.title}
            category={activeModule.category}
            currentLessonTitle={activeLesson.title}
            currentLessonObjective={activeLesson.objective}
            currentUser={currentUser}
            className="h-full"
          />
        </div>

      </div>

      {/* 4. MODAL: FREE RESOURCES DIRECTORY (12+ Categories) */}
      <AnimatePresence>
        {showResourcesDirectoryModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="bg-surface-base border border-white/10 rounded-3xl w-full max-w-4xl max-h-[85vh] flex flex-col shadow-2xl overflow-hidden"
            >
              {/* Modal Header */}
              <div className="p-6 border-b border-white/5 flex items-center justify-between gap-4 bg-surface-raised">
                <div>
                  <h3 className="text-lg font-bold text-white font-display">
                    Free Learning Resources Directory
                  </h3>
                  <p className="text-xs text-text-sub">
                    Curated free documentation, YouTube channels, and complete courses across 12 disciplines
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setShowResourcesDirectoryModal(false)}
                  className="px-3.5 py-1.5 rounded-xl bg-surface-interactive text-text-sub hover:text-white text-xs font-bold cursor-pointer border border-white/10"
                >
                  Close ✕
                </button>
              </div>

              {/* Modal Filters */}
              <div className="p-5 border-b border-white/5 space-y-3 bg-surface-base">
                <div className="relative">
                  <Search className="w-4 h-4 absolute left-3.5 top-3 text-text-muted" />
                  <input
                    type="text"
                    value={resourceSearch}
                    onChange={(e) => setResourceSearch(e.target.value)}
                    placeholder="Search resources by title, description, or keyword..."
                    className="w-full bg-surface-raised border border-white/10 rounded-xl pl-9 pr-4 py-2 text-xs text-white placeholder:text-text-muted focus:outline-none focus:ring-1 focus:ring-violet-500"
                  />
                </div>

                {/* Categories */}
                <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
                  {['All', ...Object.keys(FREE_CATEGORY_RESOURCES)].map(cat => (
                    <button
                      key={cat}
                      type="button"
                      onClick={() => setSelectedCategory(cat)}
                      className={`px-3 py-1 rounded-xl text-xs font-semibold whitespace-nowrap transition cursor-pointer border ${
                        selectedCategory === cat
                          ? 'bg-violet-600 text-white border-violet-500'
                          : 'bg-surface-raised text-text-sub hover:text-white border-white/5'
                      }`}
                    >
                      {cat}
                    </button>
                  ))}
                </div>
              </div>

              {/* Modal Resource Cards List */}
              <div className="flex-1 overflow-y-auto p-6 grid grid-cols-1 md:grid-cols-2 gap-4">
                {filteredResources.map(({ category, item }, idx) => (
                  <div
                    key={idx}
                    className="p-4 rounded-2xl bg-surface-raised border border-white/5 hover:border-violet-500/30 transition flex flex-col justify-between space-y-3"
                  >
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between text-[10px]">
                        <span className="px-2 py-0.5 rounded-md bg-white/5 text-lavender-200 font-bold">
                          {category}
                        </span>
                        {item.type && (
                          <span className="text-emerald-400 font-semibold">
                            {item.type}
                          </span>
                        )}
                      </div>
                      <h4 className="font-bold text-white text-sm">
                        {item.name}
                      </h4>
                      <p className="text-xs text-text-sub leading-relaxed">
                        {item.description}
                      </p>
                    </div>

                    <div className="pt-2 border-t border-white/5 flex items-center justify-end">
                      <a
                        href={item.url}
                        target="_blank"
                        rel="noreferrer"
                        className="px-3 py-1.5 rounded-xl bg-violet-600/20 hover:bg-violet-600/30 text-lavender-200 hover:text-white text-xs font-bold transition flex items-center gap-1.5 no-underline cursor-pointer border border-violet-500/20"
                      >
                        <span>Open Resource</span>
                        <ArrowUpRight className="w-3.5 h-3.5" />
                      </a>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}

import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Sparkles, Send, Bot, User as UserIcon, RefreshCw, 
  Lightbulb, Zap, CheckCircle, ArrowRight, Copy, Check,
  MessageSquare, ShieldCheck, HelpCircle, Flame
} from 'lucide-react';
import { getAISkillTutorReply, TutorMessage } from '../lib/gemini';
import { UserProfile } from '../types';
import { triggerCelebrationConfetti } from '../lib/gamification';

interface AICoachPanelProps {
  currentTopic: string;
  category: string;
  currentLessonTitle: string;
  currentLessonObjective: string;
  currentUser?: UserProfile | null;
  className?: string;
}

interface MessageItem {
  id: string;
  role: 'user' | 'model';
  text: string;
  timestamp: string;
}

export const AICoachPanel: React.FC<AICoachPanelProps> = ({
  currentTopic,
  category,
  currentLessonTitle,
  currentLessonObjective,
  currentUser,
  className = ''
}) => {
  const [messages, setMessages] = useState<MessageItem[]>([
    {
      id: 'welcome',
      role: 'model',
      text: `Hello ${currentUser?.name ? currentUser.name.split(' ')[0] : 'there'}! I'm your AI Learning Coach for **${currentTopic}**.\n\nYou're currently working on: **${currentLessonTitle}**.\n\nUse the quick prompts below or ask me any question about the concepts, code examples, or exercises!`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto scroll to bottom when messages update
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, loading]);

  // Contextual Quick Prompts
  const quickPrompts = [
    {
      label: '💡 Explain this',
      prompt: `Could you explain the core concepts of "${currentLessonTitle}" in simple, intuitive terms with a practical real-world analogy?`
    },
    {
      label: '⚡ Give me an exercise',
      prompt: `Give me a quick 5-minute hands-on drill or challenge to test my understanding of "${currentLessonTitle}".`
    },
    {
      label: '🔍 Review my work',
      prompt: `I've been working on the exercise for "${currentLessonTitle}". Here is what I came up with: (Please paste your code or notes here for instant feedback).`
    },
    {
      label: '🚀 What\'s next?',
      prompt: `How does mastering "${currentLessonTitle}" connect to real-world skill barters on SkillSwap?`
    }
  ];

  const handleSendMessage = async (textToSend?: string) => {
    const query = (textToSend || input).trim();
    if (!query || loading) return;

    const userMsgId = `user-${Date.now()}`;
    const userMsg: MessageItem = {
      id: userMsgId,
      role: 'user',
      text: query,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setMessages(prev => [...prev, userMsg]);
    if (!textToSend) setInput('');
    setLoading(true);

    try {
      // Build history for context
      const historyPayload: TutorMessage[] = messages.map(m => ({
        role: m.role,
        text: m.text
      }));

      const contextEnhancedQuestion = `[Context: Active Lesson "${currentLessonTitle}" in "${currentTopic}" (${category}). Lesson Objective: "${currentLessonObjective}"]\n\n${query}`;

      const replyText = await getAISkillTutorReply(
        currentTopic,
        category,
        contextEnhancedQuestion,
        historyPayload
      );

      const aiMsg: MessageItem = {
        id: `ai-${Date.now()}`,
        role: 'model',
        text: replyText,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };

      setMessages(prev => [...prev, aiMsg]);
    } catch (err) {
      const errorMsg: MessageItem = {
        id: `err-${Date.now()}`,
        role: 'model',
        text: 'I ran into a temporary hiccup processing your request. Please try asking again!',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      setMessages(prev => [...prev, errorMsg]);
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className={`flex flex-col h-full bg-surface-base border border-white/10 rounded-3xl overflow-hidden shadow-2xl ${className}`}>
      {/* Header */}
      <div className="p-4 border-b border-white/5 bg-surface-raised flex items-center justify-between gap-3 shrink-0">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-violet-600/20 border border-violet-500/30 flex items-center justify-center text-violet-400">
            <Bot className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-bold text-xs text-white">AI Learning Coach</span>
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            </div>
            <span className="text-[10px] text-text-muted truncate block max-w-[170px]">
              Active: {currentLessonTitle}
            </span>
          </div>
        </div>

        <div className="px-2 py-0.5 rounded-lg bg-white/5 border border-white/10 text-[10px] font-bold text-lavender-200">
          Gemini 2.5
        </div>
      </div>

      {/* Contextual Quick Prompts Carousel */}
      <div className="p-2.5 border-b border-white/5 bg-surface-base/80 overflow-x-auto scrollbar-none flex items-center gap-1.5 shrink-0">
        {quickPrompts.map((qp, idx) => (
          <button
            key={idx}
            type="button"
            onClick={() => handleSendMessage(qp.prompt)}
            disabled={loading}
            className="px-2.5 py-1 rounded-xl bg-surface-raised hover:bg-surface-interactive text-text-sub hover:text-white border border-white/5 hover:border-violet-500/30 text-[11px] font-medium whitespace-nowrap transition cursor-pointer disabled:opacity-50"
          >
            {qp.label}
          </button>
        ))}
      </div>

      {/* Message List */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 text-xs">
        {messages.map((msg) => {
          const isUser = msg.role === 'user';
          return (
            <motion.div
              key={msg.id}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
              className={`flex flex-col ${isUser ? 'items-end' : 'items-start'}`}
            >
              <div className="flex items-center gap-1.5 mb-1 px-1 text-[10px] text-text-dim">
                <span>{isUser ? 'You' : 'AI Coach'}</span>
                <span>•</span>
                <span>{msg.timestamp}</span>
              </div>

              <div
                className={`p-3.5 rounded-2xl max-w-[90%] leading-relaxed break-words relative group ${
                  isUser
                    ? 'bg-violet-600 text-white rounded-br-sm shadow-md shadow-violet-600/20'
                    : 'bg-surface-raised text-text-sub border border-white/5 rounded-bl-sm'
                }`}
              >
                {/* Text content with simple markdown formatting */}
                <div className="space-y-1.5 whitespace-pre-wrap">
                  {msg.text.split('\n\n').map((paragraph, pIdx) => {
                    // Check if it contains bolding or code blocks
                    return (
                      <p key={pIdx} className="leading-relaxed">
                        {paragraph}
                      </p>
                    );
                  })}
                </div>

                {!isUser && (
                  <button
                    type="button"
                    onClick={() => handleCopy(msg.id, msg.text)}
                    className="absolute top-2 right-2 p-1 rounded-md bg-surface-base/80 text-text-dim hover:text-white opacity-0 group-hover:opacity-100 transition"
                    title="Copy response"
                  >
                    {copiedId === msg.id ? (
                      <Check className="w-3 h-3 text-emerald-400" />
                    ) : (
                      <Copy className="w-3 h-3" />
                    )}
                  </button>
                )}
              </div>
            </motion.div>
          );
        })}

        {/* Loading / Thinking indicator */}
        {loading && (
          <motion.div
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-start gap-2 text-text-muted"
          >
            <div className="w-6 h-6 rounded-lg bg-violet-600/20 border border-violet-500/20 flex items-center justify-center text-violet-400 shrink-0">
              <Sparkles className="w-3 h-3 animate-spin" />
            </div>
            <div className="p-3 rounded-2xl bg-surface-raised border border-white/5 text-xs text-lavender-200 flex items-center gap-1.5">
              <div className="w-1.5 h-1.5 rounded-full bg-violet-400 animate-bounce" style={{ animationDelay: '0ms' }} />
              <div className="w-1.5 h-1.5 rounded-full bg-violet-400 animate-bounce" style={{ animationDelay: '150ms' }} />
              <div className="w-1.5 h-1.5 rounded-full bg-violet-400 animate-bounce" style={{ animationDelay: '300ms' }} />
              <span className="text-[11px] text-text-dim ml-1">AI Coach is thinking...</span>
            </div>
          </motion.div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input Form */}
      <div className="p-3 border-t border-white/5 bg-surface-raised">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSendMessage();
          }}
          className="flex items-center gap-2"
        >
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={`Ask about ${currentLessonTitle}...`}
            disabled={loading}
            className="flex-1 bg-surface-base border border-white/10 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder:text-text-muted focus:outline-none focus:ring-1 focus:ring-violet-500 transition"
          />
          <button
            type="submit"
            disabled={loading || !input.trim()}
            className="p-2.5 bg-violet-600 hover:bg-violet-500 disabled:opacity-40 text-white rounded-xl transition shadow-md shadow-violet-600/20 cursor-pointer shrink-0"
          >
            <Send className="w-4 h-4" />
          </button>
        </form>
      </div>
    </div>
  );
};

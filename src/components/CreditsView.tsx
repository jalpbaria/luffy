import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { UserProfile } from '../types';
import { 
  Coins, 
  TrendingUp, 
  TrendingDown, 
  RefreshCw, 
  ArrowUpRight, 
  ArrowDownLeft, 
  Clock, 
  ShieldCheck, 
  Info, 
  ArrowRight,
  GraduationCap,
  Sparkles,
  Repeat
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import { EmptyState } from './ui';
import { AnimatedCounter } from './motion/AnimatedCounter';

export interface CreditTransaction {
  id: string;
  user_id: string;
  amount: number;
  type: 'earned' | 'spent';
  reason: string;
  booking_id?: string;
  created_at: string;
}

interface CreditsViewProps {
  currentUser: UserProfile;
  onRefreshProfile?: () => void;
}

export const CreditsView = React.memo(function CreditsView({ currentUser, onRefreshProfile }: CreditsViewProps) {
  const [transactions, setTransactions] = useState<CreditTransaction[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [liveCredits, setLiveCredits] = useState<number>(currentUser.credits ?? 100);

  const fetchCreditsAndTransactions = async () => {
    setIsLoading(true);
    setError(null);
    try {
      if (currentUser?.id) {
        const { data: profData } = await supabase
          .from('profiles')
          .select('credits')
          .eq('id', currentUser.id)
          .single();

        if (profData && typeof profData.credits === 'number') {
          setLiveCredits(profData.credits);
        } else {
          setLiveCredits(currentUser.credits ?? 100);
        }

        const { data: txData, error: txErr } = await supabase
          .from('credit_transactions')
          .select('*')
          .eq('user_id', currentUser.id)
          .order('created_at', { ascending: false });

        if (txErr) {
          console.warn('Error fetching credit transactions:', txErr);
          setError('Could not load transaction history.');
        } else if (txData) {
          setTransactions(txData as CreditTransaction[]);
        }
      }
    } catch (err: any) {
      console.error('CreditsView fetch error:', err);
      setError(err.message || 'Failed to fetch credit data.');
    } finally {
      setIsLoading(false);
      if (onRefreshProfile) onRefreshProfile();
    }
  };

  useEffect(() => {
    if (currentUser?.id) {
      fetchCreditsAndTransactions();
    }
  }, [currentUser?.id]);

  const totalEarned = transactions
    .filter((t) => t.type === 'earned' || t.amount > 0)
    .reduce((sum, t) => sum + Math.abs(t.amount), 0);

  const totalSpent = transactions
    .filter((t) => t.type === 'spent' || t.amount < 0)
    .reduce((sum, t) => sum + Math.abs(t.amount), 0);

  return (
    <div id="credits-view-root" className="max-w-5xl mx-auto space-y-8 pb-12">
      
      {/* 🚀 Hero: Platform Economy & Large Credit Balance */}
      <div className="relative rounded-3xl bg-surface-raised border border-white/10 text-white p-6 sm:p-10 shadow-2xl overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-violet-600/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-1/4 w-80 h-80 bg-fuchsia-600/10 rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-8 relative z-10">
          <div className="space-y-3">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/5 border border-white/10 rounded-full text-xs font-bold uppercase tracking-widest text-lavender-300">
              <Coins className="w-3.5 h-3.5 text-violet-400" />
              <span>SkillSwap Economy</span>
            </div>
            
            <div className="space-y-1">
              <div className="flex items-baseline gap-3">
                <span className="text-5xl sm:text-7xl font-black text-white tracking-tight">
                  <AnimatedCounter value={liveCredits} />
                </span>
                <span className="text-lg sm:text-2xl font-black text-text-sub uppercase tracking-wider">
                  / SKILL CREDITS
                </span>
              </div>
              <p className="text-text-sub text-xs sm:text-sm max-w-xl leading-relaxed pt-1">
                The peer-to-peer currency fueling reciprocal knowledge exchange. Every hour taught fuels an hour learned.
              </p>
            </div>
          </div>

          <div className="flex sm:flex-col items-center sm:items-end justify-between gap-3 shrink-0">
            <button
              onClick={fetchCreditsAndTransactions}
              disabled={isLoading}
              className="px-4 py-2.5 bg-surface-interactive hover:bg-white/15 border border-white/10 rounded-2xl font-bold text-xs text-white transition flex items-center gap-2 cursor-pointer disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin text-violet-400' : ''}`} />
              <span>Refresh Balance</span>
            </button>
            <span className="text-[11px] text-text-dim flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" /> Real-time verified
            </span>
          </div>
        </div>
      </div>

      {/* 🔄 Visual Economy Flow: TEACH → EARN → LEARN → EXCHANGE */}
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
            <Repeat className="w-4 h-4 text-violet-400" />
            The Exchange Cycle
          </h2>
          <span className="text-xs text-text-dim">Zero-cash barter loop</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            {
              step: '01',
              title: 'TEACH',
              desc: 'Share your craft and mentor a peer',
              highlight: '+10 Credits per swap',
              icon: <GraduationCap className="w-5 h-5 text-violet-400" />,
              color: 'from-violet-600/20 to-violet-900/10'
            },
            {
              step: '02',
              title: 'EARN',
              desc: 'Credits deposited automatically',
              highlight: 'Instant ledger credit',
              icon: <Coins className="w-5 h-5 text-amber-400" />,
              color: 'from-amber-600/20 to-amber-900/10'
            },
            {
              step: '03',
              title: 'LEARN',
              desc: 'Book verified 1-on-1 peer sessions',
              highlight: '-10 Credits to book',
              icon: <Sparkles className="w-5 h-5 text-fuchsia-400" />,
              color: 'from-fuchsia-600/20 to-fuchsia-900/10'
            },
            {
              step: '04',
              title: 'EXCHANGE',
              desc: 'Keep the reciprocity loop in motion',
              highlight: 'Continuous growth',
              icon: <Repeat className="w-5 h-5 text-emerald-400" />,
              color: 'from-emerald-600/20 to-emerald-900/10'
            }
          ].map((item, idx) => (
            <div
              key={item.title}
              className="p-5 rounded-2xl bg-surface-raised border border-white/5 space-y-3 relative group hover:border-white/10 transition"
            >
              <div className="flex items-center justify-between">
                <div className="w-10 h-10 rounded-xl bg-surface-base border border-white/10 flex items-center justify-center">
                  {item.icon}
                </div>
                <span className="text-xs font-mono font-bold text-text-dim">{item.step}</span>
              </div>

              <div>
                <h3 className="font-black text-white text-base tracking-wide flex items-center gap-1.5">
                  <span>{item.title}</span>
                  {idx < 3 && <ArrowRight className="w-3.5 h-3.5 text-text-dim hidden lg:inline" />}
                </h3>
                <p className="text-text-dim text-xs mt-1 leading-relaxed">{item.desc}</p>
              </div>

              <div className="pt-2 border-t border-white/5">
                <span className="text-[11px] font-bold text-lavender-300">
                  {item.highlight}
                </span>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* 📊 Balance & Summary Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* Available Balance */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-surface-raised rounded-2xl border border-white/10 p-6 shadow-xl flex flex-col justify-between"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-lavender-300 uppercase tracking-wider flex items-center gap-1.5">
              <Coins className="w-4 h-4 text-violet-400" /> Available Balance
            </span>
            <span className="px-2.5 py-0.5 bg-violet-600/20 text-lavender-200 border border-violet-500/30 rounded-full text-[10px] font-bold uppercase">
              Live
            </span>
          </div>

          <div className="my-6">
            <div className="text-4xl sm:text-5xl font-black text-white tracking-tight flex items-baseline gap-2">
              <AnimatedCounter value={liveCredits} />
              <span className="text-sm font-bold text-text-sub">Credits</span>
            </div>
            <p className="text-text-dim text-xs mt-2 flex items-center gap-1">
              10 credits required per 1-on-1 swap session
            </p>
          </div>

          <div className="pt-3 border-t border-white/5 flex items-center justify-between text-[11px] text-text-dim">
            <span>Verified peer transactions</span>
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
          </div>
        </motion.div>

        {/* Total Earned Card */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          transition={{ delay: 0.1 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-surface-raised rounded-2xl border border-white/10 p-6 shadow-xl flex flex-col justify-between"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-emerald-400 uppercase tracking-wider flex items-center gap-1.5">
              <TrendingUp className="w-4 h-4 text-emerald-400" /> Total Earned
            </span>
            <div className="w-8 h-8 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center justify-center">
              <ArrowUpRight className="w-4 h-4" />
            </div>
          </div>

          <div className="my-6">
            <div className="text-3xl sm:text-4xl font-black text-emerald-400 tracking-tight">
              <AnimatedCounter value={totalEarned} prefix="+" />
            </div>
            <p className="text-text-dim text-xs mt-2">
              Earned from verified teaching sessions
            </p>
          </div>

          <div className="pt-3 border-t border-white/5 text-[11px] text-text-dim">
            Teach skills to earn +10 credits per swap
          </div>
        </motion.div>

        {/* Total Spent Card */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          transition={{ delay: 0.2 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-surface-raised rounded-2xl border border-white/10 p-6 shadow-xl flex flex-col justify-between"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-rose-400 uppercase tracking-wider flex items-center gap-1.5">
              <TrendingDown className="w-4 h-4 text-rose-400" /> Total Spent
            </span>
            <div className="w-8 h-8 rounded-xl bg-rose-500/10 text-rose-400 border border-rose-500/20 flex items-center justify-center">
              <ArrowDownLeft className="w-4 h-4" />
            </div>
          </div>

          <div className="my-6">
            <div className="text-3xl sm:text-4xl font-black text-rose-400 tracking-tight">
              <AnimatedCounter value={totalSpent} prefix="-" />
            </div>
            <p className="text-text-dim text-xs mt-2">
              Invested into learning from peer mentors
            </p>
          </div>

          <div className="pt-3 border-t border-white/5 text-[11px] text-text-dim">
            Costs 10 credits when you book a skill
          </div>
        </motion.div>
      </div>

      {/* 📜 Transaction History List */}
      <div className="bg-surface-raised rounded-2xl border border-white/10 p-6 shadow-xl space-y-6">
        <div className="flex items-center justify-between border-b border-white/5 pb-4">
          <div>
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <Clock className="w-5 h-5 text-violet-400" />
              Credit Ledger History
            </h3>
            <p className="text-text-dim text-xs mt-0.5">
              Immutable ledger of all earned, spent, and milestone credit adjustments.
            </p>
          </div>
          <span className="px-3 py-1 bg-surface-base border border-white/10 text-text-sub rounded-full text-xs font-bold">
            {transactions.length} {transactions.length === 1 ? 'record' : 'records'}
          </span>
        </div>

        {error && (
          <div className="p-4 bg-rose-500/10 border border-rose-500/20 rounded-2xl text-xs text-rose-300 flex items-center gap-2">
            <Info className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {isLoading ? (
          <div className="py-12 text-center space-y-3">
            <div className="w-8 h-8 border-2 border-violet-500 border-t-transparent rounded-full animate-spin mx-auto" />
            <p className="text-text-dim text-xs">Loading transaction history...</p>
          </div>
        ) : transactions.length === 0 ? (
          <EmptyState
            title="No Credit Transactions Yet"
            description="Complete learning or teaching sessions with other swappers to earn and spend credits."
            actionLabel="Explore Swappers"
            onAction={() => {
              const exploreTabBtn = document.querySelector('[data-tab="explore"]') as HTMLButtonElement;
              if (exploreTabBtn) exploreTabBtn.click();
            }}
          />
        ) : (
          <div className="max-h-[500px] overflow-y-auto space-y-2 pr-1 divide-y divide-white/5">
            {transactions.map((tx) => {
              const isEarned = tx.type === 'earned' || tx.amount > 0;
              const formattedDate = new Date(tx.created_at).toLocaleString('en-US', {
                month: 'short',
                day: 'numeric',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
              });

              return (
                <div
                  key={tx.id}
                  className="pt-3 first:pt-0 flex items-center justify-between gap-4 p-3 hover:bg-surface-interactive rounded-2xl transition"
                >
                  <div className="flex items-center gap-3.5 min-w-0">
                    <div
                      className={`w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 ${
                        isEarned
                          ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/20'
                          : 'bg-rose-500/15 text-rose-400 border border-rose-500/20'
                      }`}
                    >
                      {isEarned ? (
                        <ArrowUpRight className="w-5 h-5" />
                      ) : (
                        <ArrowDownLeft className="w-5 h-5" />
                      )}
                    </div>

                    <div className="space-y-0.5 min-w-0">
                      <p className="font-bold text-white text-xs truncate">
                        {tx.reason || (isEarned ? 'Credit Earned' : 'Credit Spent')}
                      </p>
                      <p className="text-[11px] text-text-dim flex items-center gap-1">
                        <span>{formattedDate}</span>
                        {tx.booking_id && (
                          <>
                            <span>•</span>
                            <span className="truncate">Booking #{tx.booking_id.slice(-6)}</span>
                          </>
                        )}
                      </p>
                    </div>
                  </div>

                  <div className="text-right shrink-0">
                    <span
                      className={`text-base font-black block ${
                        isEarned ? 'text-emerald-400' : 'text-rose-400'
                      }`}
                    >
                      {isEarned ? `+${Math.abs(tx.amount)}` : `-${Math.abs(tx.amount)}`}
                    </span>
                    <span className="text-[10px] text-text-dim uppercase font-bold">
                      {isEarned ? 'Earned' : 'Spent'}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
});

export default CreditsView;


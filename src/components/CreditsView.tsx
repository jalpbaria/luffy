import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { UserProfile } from '../types';
import { Coins, TrendingUp, TrendingDown, RefreshCw, ArrowUpRight, ArrowDownLeft, Clock, Zap, ShieldCheck, Info } from 'lucide-react';
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

export function CreditsView({ currentUser, onRefreshProfile }: CreditsViewProps) {
  const [transactions, setTransactions] = useState<CreditTransaction[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [liveCredits, setLiveCredits] = useState<number>(currentUser.credits ?? 100);

  const fetchCreditsAndTransactions = async () => {
    setIsLoading(true);
    setError(null);
    try {
      // 1. Fetch latest profile credits for accuracy
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

        // 2. Fetch credit transactions
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

  // Compute total earned (sum of positive transaction amounts or type === 'earned')
  const totalEarned = transactions
    .filter((t) => t.type === 'earned' || t.amount > 0)
    .reduce((sum, t) => sum + Math.abs(t.amount), 0);

  // Compute total spent (sum of negative transaction amounts or type === 'spent')
  const totalSpent = transactions
    .filter((t) => t.type === 'spent' || t.amount < 0)
    .reduce((sum, t) => sum + Math.abs(t.amount), 0);

  return (
    <div id="credits-view-root" className="max-w-5xl mx-auto space-y-8 pb-12">
      
      {/* 🚀 Header Hero Banner */}
      <div className="relative rounded-[32px] bg-gradient-to-br from-slate-900 via-indigo-950 to-purple-950 text-white p-6 sm:p-10 border border-indigo-800 shadow-2xl overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-amber-500/15 rounded-full blur-3xl pointer-events-none animate-pulse" />
        <div className="absolute bottom-0 left-1/3 w-80 h-80 bg-purple-500/20 rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 relative z-10">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 bg-white/10 backdrop-blur-md border border-white/15 rounded-full text-xs font-black text-amber-300">
              <Coins className="w-4 h-4 text-amber-400" />
              <span>SkillSwap Credit Wallet</span>
            </div>
            <h1 className="text-3xl sm:text-4xl font-black text-white tracking-tight">
              Credits & Balance
            </h1>
            <p className="text-slate-300 text-xs sm:text-sm max-w-xl leading-relaxed">
              Credits power your skill exchanges. Earn credits by teaching skills to peers and spend them to learn new skills from mentors.
            </p>
          </div>

          <button
            onClick={fetchCreditsAndTransactions}
            disabled={isLoading}
            className="px-4 py-2.5 bg-white/10 hover:bg-white/20 border border-white/15 rounded-2xl font-bold text-xs text-white transition flex items-center gap-2 cursor-pointer shrink-0 disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
            <span>Refresh Wallet</span>
          </button>
        </div>
      </div>

      {/* 📊 Balance & Summary Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* Current Balance Card */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gradient-to-br from-amber-500/10 via-zinc-900 to-zinc-950 rounded-[28px] border border-amber-500/30 p-6 shadow-xl flex flex-col justify-between relative overflow-hidden group"
        >
          <div className="absolute -top-12 -right-12 w-32 h-32 bg-amber-500/10 rounded-full blur-2xl group-hover:bg-amber-500/20 transition-all" />
          
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
              <Coins className="w-4 h-4 text-amber-400" /> Available Balance
            </span>
            <span className="px-2.5 py-1 bg-amber-500/20 text-amber-300 border border-amber-500/30 rounded-full text-[10px] font-extrabold uppercase">
              Live
            </span>
          </div>

          <div className="my-6">
            <div className="text-4xl sm:text-5xl font-black text-white tracking-tight flex items-baseline gap-2">
              <AnimatedCounter value={liveCredits} />
              <span className="text-base font-bold text-amber-400">Credits</span>
            </div>
            <p className="text-zinc-400 text-xs mt-2 flex items-center gap-1">
              <Zap className="w-3.5 h-3.5 text-amber-400" /> 10 credits required to book a learning session
            </p>
          </div>

          <div className="pt-3 border-t border-zinc-800/80 flex items-center justify-between text-[11px] text-zinc-400">
            <span>Auto-managed by completed swaps</span>
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
          </div>
        </motion.div>

        {/* Total Earned Card */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          transition={{ delay: 0.1 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-zinc-900/90 rounded-[28px] border border-emerald-500/20 p-6 shadow-xl flex flex-col justify-between"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-emerald-400 uppercase tracking-wider flex items-center gap-1.5">
              <TrendingUp className="w-4 h-4 text-emerald-400" /> Total Earned
            </span>
            <div className="w-8 h-8 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
              <ArrowUpRight className="w-4 h-4" />
            </div>
          </div>

          <div className="my-6">
            <div className="text-3xl sm:text-4xl font-black text-emerald-400 tracking-tight">
              <AnimatedCounter value={totalEarned} prefix="+" />
            </div>
            <p className="text-zinc-400 text-xs mt-2">
              Earned from completed teaching sessions
            </p>
          </div>

          <div className="pt-3 border-t border-zinc-800/80 text-[11px] text-zinc-500">
            Teach skills to earn +10 credits per swap
          </div>
        </motion.div>

        {/* Total Spent Card */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          transition={{ delay: 0.2 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-zinc-900/90 rounded-[28px] border border-rose-500/20 p-6 shadow-xl flex flex-col justify-between"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-rose-400 uppercase tracking-wider flex items-center gap-1.5">
              <TrendingDown className="w-4 h-4 text-rose-400" /> Total Spent
            </span>
            <div className="w-8 h-8 rounded-xl bg-rose-500/20 text-rose-400 flex items-center justify-center">
              <ArrowDownLeft className="w-4 h-4" />
            </div>
          </div>

          <div className="my-6">
            <div className="text-3xl sm:text-4xl font-black text-rose-400 tracking-tight">
              <AnimatedCounter value={totalSpent} prefix="-" />
            </div>
            <p className="text-zinc-400 text-xs mt-2">
              Spent on completed learning sessions
            </p>
          </div>

          <div className="pt-3 border-t border-zinc-800/80 text-[11px] text-zinc-500">
            Costs 10 credits when you learn a skill
          </div>
        </motion.div>
      </div>

      {/* 📜 Transaction History List */}
      <div className="bg-zinc-900/90 rounded-[28px] border border-zinc-800 p-6 shadow-xl space-y-6">
        <div className="flex items-center justify-between border-b border-zinc-800 pb-4">
          <div>
            <h3 className="text-lg font-extrabold text-white flex items-center gap-2">
              <Clock className="w-5 h-5 text-indigo-400" />
              Credit Transaction History
            </h3>
            <p className="text-zinc-400 text-xs mt-0.5">
              Real-time ledger of all earned and spent credit adjustments.
            </p>
          </div>
          <span className="px-3 py-1 bg-zinc-800 text-zinc-300 rounded-full text-xs font-semibold">
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
            <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto" />
            <p className="text-zinc-500 text-xs">Loading transaction history...</p>
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
          <div className="max-h-[500px] overflow-y-auto space-y-3 pr-1 divide-y divide-zinc-800/50">
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
                  className="pt-3 first:pt-0 flex items-center justify-between gap-4 p-3 hover:bg-zinc-800/40 rounded-2xl transition"
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
                      <p className="text-[11px] text-zinc-500 flex items-center gap-1">
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
                      className={`text-base font-extrabold block ${
                        isEarned ? 'text-emerald-400' : 'text-rose-400'
                      }`}
                    >
                      {isEarned ? `+${Math.abs(tx.amount)}` : `-${Math.abs(tx.amount)}`}
                    </span>
                    <span className="text-[10px] text-zinc-500 uppercase font-semibold">
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
}

export default CreditsView;

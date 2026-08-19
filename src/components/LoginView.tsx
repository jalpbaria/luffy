import React, { useState, useRef } from 'react';
import { motion, AnimatePresence, useScroll, useTransform, useReducedMotion } from 'motion/react';
import { 
  LogIn, UserPlus, Eye, EyeOff, Sparkles, Mail, Lock, User, 
  BookOpen, ChevronRight, Check, AlertCircle,
  Users, TrendingUp, ArrowLeft, ShieldCheck
} from 'lucide-react';
import { UserProfile } from '../types';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

interface LoginViewProps {
  onLogin: (user: UserProfile) => void;
  onRegister: (newUserPayload: Omit<UserProfile, 'id' | 'rating' | 'reviewsCount' | 'successfulExchanges' | 'badges'> & { id: string }) => Promise<{ success: boolean; error?: string }>;
  allUsers: UserProfile[];
  accountDeletedNotice?: string;
}

export default function LoginView({ onLogin, onRegister, allUsers, accountDeletedNotice }: LoginViewProps) {
  const { signIn, signUp } = useAuth();
  const [mode, setMode] = useState<'login' | 'register'>('login');
  
  // Login fields
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [loginError, setLoginError] = useState('');
  const [emailConfirmationNotice, setEmailConfirmationNotice] = useState('');

  // Password reset fields
  const [isResetMode, setIsResetMode] = useState(false);
  const [resetEmail, setResetEmail] = useState('');
  const [resetMessage, setResetMessage] = useState('');
  const [resetError, setResetError] = useState('');

  // Registration fields
  const [regName, setRegName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [showRegPassword, setShowRegPassword] = useState(false);
  const [regBio, setRegBio] = useState('');
  const [regEducation, setRegEducation] = useState('');
  const [regExperience, setRegExperience] = useState('');
  const [regAvatar, setRegAvatar] = useState('');
  const [regLanguages, setRegLanguages] = useState<string>('English');
  const [regAvailability, setRegAvailability] = useState<('Morning' | 'Afternoon' | 'Evening')[]>(['Morning', 'Afternoon']);
  const [regTimeZone, setRegTimeZone] = useState('EST');

  // Offered Skill
  const [offeredName, setOfferedName] = useState('');
  const [offeredCategory, setOfferedCategory] = useState('Programming');
  const [offeredLevel, setOfferedLevel] = useState<'Beginner' | 'Intermediate' | 'Expert'>('Expert');

  // Wanted Skill
  const [wantedName, setWantedName] = useState('');
  const [wantedCategory, setWantedCategory] = useState('Language Learning');
  const [wantedLevel, setWantedLevel] = useState<'Beginner' | 'Intermediate' | 'Expert'>('Beginner');

  const [registerError, setRegisterError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Calculate Password Strength for Registration
  const getPasswordStrength = (password: string) => {
    if (!password) {
      return {
        score: 0,
        label: '',
        color: 'bg-white/10',
        textColor: 'text-text-dim',
        percentage: 0,
        checks: { length: false, caseMix: false, number: false, special: false }
      };
    }

    const checks = {
      length: password.length >= 8,
      caseMix: /[a-z]/.test(password) && /[A-Z]/.test(password),
      number: /[0-9]/.test(password),
      special: /[^A-Za-z0-9]/.test(password),
    };

    let score = 0;
    if (checks.length) score++;
    if (checks.caseMix) score++;
    if (checks.number) score++;
    if (checks.special) score++;

    if (score === 1) {
      return { score, label: 'Weak', color: 'bg-rose-500', textColor: 'text-rose-400', percentage: 25, checks };
    } else if (score === 2) {
      return { score, label: 'Fair', color: 'bg-amber-500', textColor: 'text-amber-400', percentage: 50, checks };
    } else if (score === 3) {
      return { score, label: 'Good', color: 'bg-violet-500', textColor: 'text-violet-300', percentage: 75, checks };
    } else if (score >= 4) {
      return { score, label: 'Strong', color: 'bg-emerald-500', textColor: 'text-emerald-400', percentage: 100, checks };
    }

    return { score: 0, label: 'Very Weak', color: 'bg-rose-400', textColor: 'text-rose-400', percentage: 12, checks };
  };

  const regPasswordStrength = getPasswordStrength(regPassword);

  // Unsplash profile image presets
  const avatarPresets = [
    'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=150&h=150&q=80',
    'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=150&h=150&q=80',
    'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?auto=format&fit=crop&w=150&h=150&q=80',
    'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=150&h=150&q=80',
    'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=150&h=150&q=80'
  ];

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError('');

    if (!loginEmail) {
      setLoginError('Please enter your email address.');
      return;
    }
    if (!loginPassword) {
      setLoginError('Please enter your password.');
      return;
    }

    setIsSubmitting(true);
    try {
      const { data, error } = await signIn(loginEmail, loginPassword);

      if (error) {
        setLoginError(error.message);
        return;
      }

      // Find user by ID or email in profile records
      const authUserId = data.user?.id;
      const cleanEmail = loginEmail.toLowerCase().trim();

      const matchedUser = allUsers.find(
        u => (authUserId && u.id === authUserId) || u.email.toLowerCase().trim() === cleanEmail
      );

      if (matchedUser) {
        onLogin(matchedUser);
      } else {
        console.error("Account data not found. Auth user ID mismatch for user ID:", authUserId, "email:", cleanEmail);
        setLoginError("Account data not found. Please contact support.");
      }
    } catch (err: any) {
      setLoginError(err.message || 'An error occurred during sign in.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handlePasswordResetSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setResetError('');
    setResetMessage('');

    if (!resetEmail) {
      setResetError('Please enter your email address.');
      return;
    }

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(resetEmail, {
        redirectTo: window.location.origin
      });

      if (error) {
        setResetError(error.message);
      } else {
        setResetMessage('Password reset link sent! Check your email inbox.');
      }
    } catch (err: any) {
      setResetError(err.message || 'Failed to send password reset link.');
    }
  };

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setRegisterError('');

    if (!regName.trim()) {
      setRegisterError('Please enter your full name.');
      return;
    }
    if (!regEmail.trim()) {
      setRegisterError('Please enter your email.');
      return;
    }
    if (!regPassword || regPassword.length < 6) {
      setRegisterError('Password must be at least 6 characters.');
      return;
    }
    if (!regBio.trim()) {
      setRegisterError('Please add a short bio.');
      return;
    }
    if (!offeredName.trim()) {
      setRegisterError('Please enter at least one skill you can teach.');
      return;
    }
    if (!wantedName.trim()) {
      setRegisterError('Please enter at least one skill you want to learn.');
      return;
    }

    setIsSubmitting(true);
    try {
      // 1. Sign up user via Supabase auth
      const { data: authData, error: authError } = await signUp(regEmail, regPassword, {
        name: regName.trim(),
        avatar: regAvatar || avatarPresets[0]
      });

      if (authError) {
        setRegisterError(authError.message);
        setIsSubmitting(false);
        return;
      }

      const generatedId = authData.user?.id || `usr_${Date.now()}`;

      const newUserPayload: Omit<UserProfile, 'rating' | 'reviewsCount' | 'successfulExchanges' | 'badges'> & { id: string } = {
        id: generatedId,
        name: regName.trim(),
        email: regEmail.toLowerCase().trim(),
        avatar: regAvatar || avatarPresets[0],
        bio: regBio.trim(),
        education: regEducation.trim(),
        experience: regExperience.trim(),
        languages: regLanguages.split(',').map(l => l.trim()).filter(Boolean),
        availability: regAvailability,
        skillLevel: offeredLevel,
        portfolio: {},
        skillsOffered: [
          { name: offeredName.trim(), category: offeredCategory, level: offeredLevel }
        ],
        skillsWanted: [
          { name: wantedName.trim(), category: wantedCategory, level: wantedLevel }
        ],
        timeZone: regTimeZone,
        credits: 100,
        xp: 500,
        loginStreak: 1,
        longestStreak: 1
      };

      const result = await onRegister(newUserPayload);
      if (result && !result.success) {
        setRegisterError(result.error || 'Failed to register profile.');
      } else {
        setEmailConfirmationNotice('Account created! Please check your email for confirmation.');
        setMode('login');
      }
    } catch (err: any) {
      setRegisterError(err.message || 'An error occurred during registration.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const platformBenefits = [
    {
      icon: <Users className="w-5 h-5 text-violet-400" />,
      title: 'Peer Matchmaking',
      description: 'Match with verified peers based on complementary skill barter.'
    },
    {
      icon: <BookOpen className="w-5 h-5 text-fuchsia-400" />,
      title: 'Interactive Rooms',
      description: '1-on-1 live classrooms with video, screen share, and shared notes.'
    },
    {
      icon: <Sparkles className="w-5 h-5 text-amber-400" />,
      title: 'Zero-Cash Economy',
      description: 'Earn skill credits by teaching, spend credits to learn anything.'
    },
    {
      icon: <TrendingUp className="w-5 h-5 text-emerald-400" />,
      title: 'Verified Badges',
      description: 'Track momentum, unlock skill badges, and build verifiable mastery.'
    },
  ];

  const containerRef = useRef<HTMLDivElement>(null);
  const prefersReducedMotion = useReducedMotion();

  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ['start start', 'end end']
  });

  const headingY = useTransform(scrollYProgress, [0, 1], prefersReducedMotion ? [0, 0] : [0, -18]);
  const cardsY = useTransform(scrollYProgress, [0, 1], prefersReducedMotion ? [0, 0] : [0, -8]);
  const glowY = useTransform(scrollYProgress, [0, 1], prefersReducedMotion ? [0, 0] : [0, -28]);

  return (
    <div 
      ref={containerRef}
      id="login-view-root" 
      className="min-h-screen bg-surface-base flex items-center justify-center p-4 sm:p-6 lg:p-10 relative overflow-hidden font-sans text-text-sub"
    >
      
      {/* Background Ambient Violet Atmosphere */}
      <motion.div 
        style={{ y: glowY }}
        className="absolute -top-32 -left-32 w-[500px] h-[500px] bg-violet-600/15 rounded-full blur-[120px] pointer-events-none" 
      />
      <motion.div 
        style={{ y: glowY }}
        className="absolute -bottom-32 -right-32 w-[500px] h-[500px] bg-fuchsia-600/15 rounded-full blur-[120px] pointer-events-none" 
      />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[700px] bg-violet-900/10 rounded-full blur-[140px] pointer-events-none" />

      {/* Main Split-Screen Layout */}
      <div className="w-full max-w-6xl grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center z-10 my-auto">
        
        {/* LEFT SECTION: Large Brand Statement & Value Props */}
        <motion.div 
          initial={{ opacity: 0, x: -24 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
          className="lg:col-span-6 space-y-8 pr-0 lg:pr-4"
        >
          {/* Brand Header */}
          <motion.div style={{ y: headingY }} className="space-y-4">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 bg-surface-raised border border-white/10 rounded-full shadow-md">
              <span className="w-2 h-2 rounded-full bg-violet-400 animate-pulse" />
              <span className="text-xs font-bold uppercase tracking-widest text-lavender-300">SkillSwap Barter Network</span>
            </div>

            <div className="space-y-2">
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black text-white tracking-tight leading-[1.1] font-display">
                Trade knowledge.<br />
                <span className="text-lavender-300">
                  Grow together.
                </span>
              </h1>
              <p className="text-text-sub text-sm sm:text-base leading-relaxed max-w-lg font-normal pt-2">
                Connect with real peers to barter expertise 1-on-1. Teach what you excel at, learn what you're passionate about — completely currency-free.
              </p>
            </div>
          </motion.div>

          {/* Benefits Grid */}
          <motion.div style={{ y: cardsY }} className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            {platformBenefits.map((benefit, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: 0.1 * idx }}
                whileHover={{ y: -3, transition: { duration: 0.2 } }}
                className="p-4 rounded-2xl border border-white/5 bg-surface-raised/80 backdrop-blur-md shadow-lg space-y-1.5 transition-all hover:border-white/10"
              >
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-surface-base border border-white/10 flex items-center justify-center shrink-0">
                    {benefit.icon}
                  </div>
                  <h3 className="font-bold text-white text-xs sm:text-sm">
                    {benefit.title}
                  </h3>
                </div>
                <p className="text-text-dim text-[11px] leading-relaxed">
                  {benefit.description}
                </p>
              </motion.div>
            ))}
          </motion.div>

          {/* Social Proof Banner */}
          <div className="pt-2 flex items-center gap-3 text-xs text-text-dim font-medium">
            <div className="flex items-center -space-x-2">
              {avatarPresets.slice(0, 3).map((url, i) => (
                <img key={i} src={url} alt="Member" className="w-7 h-7 rounded-full border-2 border-surface-base object-cover shadow-sm" />
              ))}
            </div>
            <span>Join thousands of active swappers trading skills</span>
          </div>
        </motion.div>

        {/* RIGHT SECTION: Auth Panel with Cinematic Transitions */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.15, ease: 'easeOut' }}
          className="lg:col-span-6 w-full max-w-md mx-auto lg:max-w-none"
        >
          <div className="bg-surface-raised border border-white/10 rounded-3xl p-6 sm:p-9 shadow-2xl backdrop-blur-2xl relative overflow-hidden">
            
            {/* Ambient accent top light */}
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-violet-500 via-fuchsia-500 to-indigo-500" />

            {/* Header Title */}
            <div className="text-center space-y-1.5 mb-6">
              <h2 className="text-2xl font-black text-white tracking-tight font-display">
                {isResetMode ? 'Reset Password' : mode === 'login' ? 'Welcome Back' : 'Join SkillSwap'}
              </h2>
              <p className="text-xs text-text-dim leading-relaxed max-w-xs mx-auto">
                {isResetMode 
                  ? 'We will send a secure recovery link to your inbox.' 
                  : mode === 'login' 
                    ? 'Enter your credentials to access your skill barter hub.' 
                    : 'Create your profile to start bartering skills with peers.'}
              </p>
            </div>

            {/* Mode Switcher Tabs */}
            {!isResetMode && (
              <div className="flex bg-surface-base p-1 rounded-2xl mb-6 border border-white/5">
                <button
                  type="button"
                  onClick={() => { setMode('login'); setLoginError(''); }}
                  className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer border-0 ${
                    mode === 'login' 
                      ? 'bg-violet-600 text-white shadow-md shadow-violet-500/20' 
                      : 'text-text-sub hover:text-white'
                  }`}
                >
                  <LogIn className="w-3.5 h-3.5" />
                  Sign In
                </button>
                <button
                  type="button"
                  onClick={() => { setMode('register'); setRegisterError(''); }}
                  className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer border-0 ${
                    mode === 'register' 
                      ? 'bg-violet-600 text-white shadow-md shadow-violet-500/20' 
                      : 'text-text-sub hover:text-white'
                  }`}
                >
                  <UserPlus className="w-3.5 h-3.5" />
                  Create Account
                </button>
              </div>
            )}

            {/* Cinematic View Container */}
            <AnimatePresence mode="wait">
              {isResetMode ? (
                <motion.form
                  key="reset-mode"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.25 }}
                  onSubmit={handlePasswordResetSubmit} 
                  className="space-y-4"
                >
                  {resetError && (
                    <div className="p-3 bg-rose-500/10 text-rose-300 border border-rose-500/20 rounded-2xl flex items-start gap-2.5 text-xs">
                      <AlertCircle className="w-4 h-4 shrink-0 text-rose-400 mt-0.5" />
                      <p>{resetError}</p>
                    </div>
                  )}

                  {resetMessage && (
                    <div className="p-3 bg-emerald-500/10 text-emerald-300 border border-emerald-500/20 rounded-2xl flex items-start gap-2.5 text-xs font-bold">
                      <Check className="w-4 h-4 shrink-0 text-emerald-400 mt-0.5" />
                      <p>{resetMessage}</p>
                    </div>
                  )}

                  <div className="space-y-1.5">
                    <label className="block text-xs font-bold text-text-sub">Email Address</label>
                    <div className="relative">
                      <Mail className="absolute left-3.5 top-3 w-4 h-4 text-text-dim" />
                      <input
                        type="email"
                        value={resetEmail}
                        onChange={(e) => setResetEmail(e.target.value)}
                        placeholder="alex.rivera@example.com"
                        required
                        className="w-full bg-surface-base border border-white/10 text-white rounded-2xl pl-10 pr-4 py-2.5 text-xs focus:outline-none focus:ring-2 focus:ring-violet-500 transition"
                      />
                    </div>
                  </div>

                  <div className="flex gap-3 pt-2">
                    <button
                      type="button"
                      onClick={() => { setIsResetMode(false); setResetError(''); setResetMessage(''); }}
                      className="flex-1 py-2.5 bg-surface-interactive hover:bg-white/15 text-text-sub font-bold rounded-2xl text-xs transition cursor-pointer border border-white/10 flex items-center justify-center gap-1"
                    >
                      <ArrowLeft className="w-3.5 h-3.5" />
                      Back
                    </button>
                    <button
                      type="submit"
                      className="flex-1 py-2.5 bg-violet-600 hover:bg-violet-500 text-white font-bold rounded-2xl text-xs shadow-lg shadow-violet-500/20 transition cursor-pointer border-0"
                    >
                      Send Link
                    </button>
                  </div>
                </motion.form>
              ) : mode === 'login' ? (
                /* Standard Sign In Form */
                <motion.form
                  key="login-mode"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  transition={{ duration: 0.25 }}
                  onSubmit={handleLoginSubmit} 
                  className="space-y-4"
                >
                  {accountDeletedNotice && (
                    <div className="p-3 bg-emerald-500/10 text-emerald-300 border border-emerald-500/20 rounded-2xl flex items-start gap-2.5 text-xs font-bold">
                      <Check className="w-4 h-4 shrink-0 text-emerald-400 mt-0.5" />
                      <p className="leading-snug">{accountDeletedNotice}</p>
                    </div>
                  )}

                  {emailConfirmationNotice && (
                    <div className="p-3 bg-violet-500/10 text-lavender-200 border border-violet-500/20 rounded-2xl flex items-start gap-2.5 text-xs font-semibold">
                      <Mail className="w-4 h-4 shrink-0 text-violet-400 mt-0.5" />
                      <p className="leading-snug">{emailConfirmationNotice}</p>
                    </div>
                  )}

                  {loginError && (
                    <div className="p-3 bg-rose-500/10 text-rose-300 border border-rose-500/20 rounded-2xl flex items-start gap-2.5 text-xs">
                      <AlertCircle className="w-4 h-4 shrink-0 text-rose-400 mt-0.5" />
                      <p>{loginError}</p>
                    </div>
                  )}

                  <div className="space-y-1.5">
                    <label className="block text-xs font-bold text-text-sub">Email Address</label>
                    <div className="relative">
                      <Mail className="absolute left-3.5 top-3 w-4 h-4 text-text-dim" />
                      <input
                        type="email"
                        value={loginEmail}
                        onChange={(e) => setLoginEmail(e.target.value)}
                        placeholder="alex.rivera@example.com"
                        required
                        className="w-full bg-surface-base border border-white/10 text-white rounded-2xl pl-10 pr-4 py-2.5 text-xs focus:outline-none focus:ring-2 focus:ring-violet-500 transition"
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <div className="flex justify-between items-center">
                      <label className="block text-xs font-bold text-text-sub">Password</label>
                      <button
                        type="button"
                        onClick={() => { setIsResetMode(true); setLoginError(''); setResetMessage(''); setResetError(''); }}
                        className="text-[11px] text-violet-400 hover:text-lavender-200 bg-transparent border-0 cursor-pointer p-0 font-bold"
                      >
                        Forgot password?
                      </button>
                    </div>
                    <div className="relative">
                      <Lock className="absolute left-3.5 top-3 w-4 h-4 text-text-dim" />
                      <input
                        type={showPassword ? "text" : "password"}
                        value={loginPassword}
                        onChange={(e) => setLoginPassword(e.target.value)}
                        placeholder="••••••••"
                        required
                        className="w-full bg-surface-base border border-white/10 text-white rounded-2xl pl-10 pr-10 py-2.5 text-xs focus:outline-none focus:ring-2 focus:ring-violet-500 transition"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3.5 top-3 text-text-dim hover:text-white border-0 bg-transparent cursor-pointer p-0"
                      >
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  {/* Remember Me */}
                  <div className="flex items-center justify-between pt-1">
                    <label className="flex items-center gap-2 cursor-pointer text-xs font-medium text-text-sub">
                      <input
                        type="checkbox"
                        checked={rememberMe}
                        onChange={(e) => setRememberMe(e.target.checked)}
                        className="rounded border-white/20 bg-surface-base text-violet-500 focus:ring-violet-500 w-3.5 h-3.5"
                      />
                      <span>Remember this device</span>
                    </label>
                  </div>

                  {/* Submit Button */}
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className={`w-full py-3 bg-violet-600 hover:bg-violet-500 text-white font-bold rounded-2xl shadow-lg shadow-violet-500/25 transition-all flex items-center justify-center gap-2 text-xs cursor-pointer border-0 mt-3 ${
                      isSubmitting ? 'opacity-75 cursor-not-allowed' : 'hover:scale-[1.01]'
                    }`}
                  >
                    {isSubmitting ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        Authenticating...
                      </>
                    ) : (
                      <>
                        <span>Sign In to SkillSwap</span>
                        <ChevronRight className="w-4 h-4" />
                      </>
                    )}
                  </button>

                  {/* Switch to Register */}
                  <div className="text-center pt-2 text-xs text-text-dim">
                    Don't have an account yet?{' '}
                    <button
                      type="button"
                      onClick={() => { setMode('register'); setRegisterError(''); }}
                      className="text-violet-400 font-bold hover:text-lavender-200 border-0 bg-transparent cursor-pointer p-0 ml-1"
                    >
                      Create Account
                    </button>
                  </div>
                </motion.form>
              ) : (
                /* Registration Form */
                <motion.form
                  key="register-mode"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.25 }}
                  onSubmit={handleRegisterSubmit} 
                  className="space-y-4 max-h-[55vh] overflow-y-auto pr-1"
                >
                  {registerError && (
                    <div className="p-3 bg-rose-500/10 text-rose-300 border border-rose-500/20 rounded-2xl flex items-start gap-2.5 text-xs">
                      <AlertCircle className="w-4 h-4 shrink-0 text-rose-400 mt-0.5" />
                      <p>{registerError}</p>
                    </div>
                  )}

                  {/* Profile Credentials */}
                  <div className="space-y-3 border-b border-white/5 pb-4">
                    <h3 className="text-xs font-bold text-lavender-300 uppercase tracking-wider flex items-center gap-1.5">
                      <ShieldCheck className="w-3.5 h-3.5 text-violet-400" />
                      Credentials
                    </h3>
                    
                    <div className="space-y-1">
                      <label className="block text-[10px] font-bold text-text-dim uppercase tracking-wider">Full Name *</label>
                      <div className="relative">
                        <User className="absolute left-3 top-2.5 w-3.5 h-3.5 text-text-dim" />
                        <input
                          type="text"
                          value={regName}
                          onChange={(e) => setRegName(e.target.value)}
                          placeholder="Jane Doe"
                          required
                          className="w-full bg-surface-base border border-white/10 text-white rounded-xl pl-9 pr-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-violet-500"
                        />
                      </div>
                    </div>

                    <div className="space-y-1">
                      <label className="block text-[10px] font-bold text-text-dim uppercase tracking-wider">Email Address *</label>
                      <div className="relative">
                        <Mail className="absolute left-3 top-2.5 w-3.5 h-3.5 text-text-dim" />
                        <input
                          type="email"
                          value={regEmail}
                          onChange={(e) => setRegEmail(e.target.value)}
                          placeholder="jane.doe@example.com"
                          required
                          className="w-full bg-surface-base border border-white/10 text-white rounded-xl pl-9 pr-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-violet-500"
                        />
                      </div>
                    </div>

                    <div className="space-y-1">
                      <label className="block text-[10px] font-bold text-text-dim uppercase tracking-wider">Password *</label>
                      <div className="relative">
                        <Lock className="absolute left-3 top-2.5 w-3.5 h-3.5 text-text-dim" />
                        <input
                          type={showRegPassword ? "text" : "password"}
                          value={regPassword}
                          onChange={(e) => setRegPassword(e.target.value)}
                          placeholder="••••••••"
                          required
                          className="w-full bg-surface-base border border-white/10 text-white rounded-xl pl-9 pr-9 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-violet-500"
                        />
                        <button
                          type="button"
                          onClick={() => setShowRegPassword(!showRegPassword)}
                          className="absolute right-3 top-2.5 text-text-dim hover:text-white border-0 bg-transparent cursor-pointer p-0"
                        >
                          {showRegPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                        </button>
                      </div>

                      {/* Password Strength Indicator */}
                      {regPassword && (
                        <div className="mt-2 p-2.5 bg-surface-base rounded-xl border border-white/5 space-y-1.5">
                          <div className="flex items-center justify-between text-[11px] font-semibold">
                            <span className="text-text-dim">Password Strength</span>
                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                              regPasswordStrength.score <= 1 ? 'bg-rose-500/20 text-rose-300' :
                              regPasswordStrength.score === 2 ? 'bg-amber-500/20 text-amber-300' :
                              regPasswordStrength.score === 3 ? 'bg-violet-500/20 text-violet-300' :
                              'bg-emerald-500/20 text-emerald-300'
                            }`}>
                              {regPasswordStrength.label}
                            </span>
                          </div>

                          <div className="w-full bg-white/10 rounded-full h-1.5 overflow-hidden">
                            <div
                              className={`h-full transition-all duration-300 rounded-full ${regPasswordStrength.color}`}
                              style={{ width: `${regPasswordStrength.percentage}%` }}
                            />
                          </div>

                          <div className="grid grid-cols-2 gap-x-2 gap-y-1 pt-1 text-[10px]">
                            <div className={`flex items-center gap-1.5 ${regPasswordStrength.checks.length ? 'text-emerald-400 font-bold' : 'text-text-dim'}`}>
                              <span>✓ 8+ characters</span>
                            </div>
                            <div className={`flex items-center gap-1.5 ${regPasswordStrength.checks.caseMix ? 'text-emerald-400 font-bold' : 'text-text-dim'}`}>
                              <span>✓ Upper & lower</span>
                            </div>
                            <div className={`flex items-center gap-1.5 ${regPasswordStrength.checks.number ? 'text-emerald-400 font-bold' : 'text-text-dim'}`}>
                              <span>✓ Number</span>
                            </div>
                            <div className={`flex items-center gap-1.5 ${regPasswordStrength.checks.special ? 'text-emerald-400 font-bold' : 'text-text-dim'}`}>
                              <span>✓ Symbol</span>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Profile Details */}
                  <div className="space-y-3 border-b border-white/5 pb-4">
                    <h3 className="text-xs font-bold text-lavender-300 uppercase tracking-wider flex items-center gap-1.5">
                      <User className="w-3.5 h-3.5 text-violet-400" />
                      Biography & Background
                    </h3>

                    <div className="space-y-1">
                      <label className="block text-[10px] font-bold text-text-dim uppercase tracking-wider">Biography *</label>
                      <textarea
                        value={regBio}
                        onChange={(e) => setRegBio(e.target.value)}
                        placeholder="Share who you are and why you want to exchange skills..."
                        rows={2}
                        required
                        className="w-full bg-surface-base border border-white/10 text-white rounded-xl px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-violet-500 placeholder:text-text-dim"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-2.5">
                      <div className="space-y-1">
                        <label className="block text-[10px] font-bold text-text-dim uppercase tracking-wider">Education</label>
                        <input
                          type="text"
                          value={regEducation}
                          onChange={(e) => setRegEducation(e.target.value)}
                          placeholder="Degree or Self-taught"
                          className="w-full bg-surface-base border border-white/10 text-white rounded-xl px-3 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-violet-500 placeholder:text-text-dim"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="block text-[10px] font-bold text-text-dim uppercase tracking-wider">Experience</label>
                        <input
                          type="text"
                          value={regExperience}
                          onChange={(e) => setRegExperience(e.target.value)}
                          placeholder="e.g. 3 yrs in design"
                          className="w-full bg-surface-base border border-white/10 text-white rounded-xl px-3 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-violet-500 placeholder:text-text-dim"
                        />
                      </div>
                    </div>

                    <div className="space-y-1">
                      <label className="block text-[10px] font-bold text-text-dim uppercase tracking-wider">Languages</label>
                      <input
                        type="text"
                        value={regLanguages}
                        onChange={(e) => setRegLanguages(e.target.value)}
                        placeholder="English, Spanish, Mandarin"
                        className="w-full bg-surface-base border border-white/10 text-white rounded-xl px-3 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-violet-500 placeholder:text-text-dim"
                      />
                    </div>

                    <div className="space-y-2">
                      <label className="block text-[10px] font-bold text-text-dim uppercase tracking-wider">Avatar Preset</label>
                      <div className="flex items-center gap-2">
                        {avatarPresets.map((url, idx) => (
                          <button
                            key={idx}
                            type="button"
                            onClick={() => setRegAvatar(url)}
                            className={`relative w-9 h-9 rounded-xl overflow-hidden border-2 transition shrink-0 cursor-pointer ${
                              regAvatar === url ? 'border-violet-500 scale-105 shadow-md shadow-violet-500/20' : 'border-transparent hover:border-white/30'
                            }`}
                          >
                            <img src={url} alt="preset" referrerPolicy="no-referrer" className="w-full h-full object-cover" />
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Skill Matchmaking Details */}
                  <div className="space-y-3">
                    <h3 className="text-xs font-bold text-lavender-300 uppercase tracking-wider flex items-center gap-1.5">
                      <BookOpen className="w-3.5 h-3.5 text-violet-400" />
                      Skill Exchange Matchmaking
                    </h3>

                    {/* Offered Skill */}
                    <div className="p-3 bg-surface-base border border-white/5 rounded-2xl space-y-2">
                      <span className="px-2 py-0.5 bg-violet-600 text-white rounded text-[9px] font-bold uppercase tracking-wider">Skill You Teach *</span>
                      <input
                        type="text"
                        value={offeredName}
                        onChange={(e) => setOfferedName(e.target.value)}
                        placeholder="e.g. React Frontend Development"
                        required
                        className="w-full bg-surface-raised border border-white/10 text-white rounded-xl px-3 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-violet-500 placeholder:text-text-dim"
                      />
                      <div className="grid grid-cols-2 gap-2">
                        <select
                          value={offeredCategory}
                          onChange={(e) => setOfferedCategory(e.target.value)}
                          className="w-full bg-surface-raised border border-white/10 text-white rounded-xl px-2 py-1.5 text-xs focus:outline-none"
                        >
                          <option value="Programming">Programming</option>
                          <option value="Graphic Design">Graphic Design</option>
                          <option value="Digital Marketing">Digital Marketing</option>
                          <option value="Language Learning">Language Learning</option>
                          <option value="Cooking">Cooking</option>
                          <option value="Video Editing">Video Editing</option>
                        </select>
                        <select
                          value={offeredLevel}
                          onChange={(e) => setOfferedLevel(e.target.value as any)}
                          className="w-full bg-surface-raised border border-white/10 text-white rounded-xl px-2 py-1.5 text-xs focus:outline-none font-bold"
                        >
                          <option value="Beginner">Beginner</option>
                          <option value="Intermediate">Intermediate</option>
                          <option value="Expert">Expert</option>
                        </select>
                      </div>
                    </div>

                    {/* Wanted Skill */}
                    <div className="p-3 bg-surface-base border border-white/5 rounded-2xl space-y-2">
                      <span className="px-2 py-0.5 bg-fuchsia-600 text-white rounded text-[9px] font-bold uppercase tracking-wider">Skill You Want *</span>
                      <input
                        type="text"
                        value={wantedName}
                        onChange={(e) => setWantedName(e.target.value)}
                        placeholder="e.g. Spanish Conversation"
                        required
                        className="w-full bg-surface-raised border border-white/10 text-white rounded-xl px-3 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-violet-500 placeholder:text-text-dim"
                      />
                      <div className="grid grid-cols-2 gap-2">
                        <select
                          value={wantedCategory}
                          onChange={(e) => setWantedCategory(e.target.value)}
                          className="w-full bg-surface-raised border border-white/10 text-white rounded-xl px-2 py-1.5 text-xs focus:outline-none"
                        >
                          <option value="Language Learning">Language Learning</option>
                          <option value="Programming">Programming</option>
                          <option value="Graphic Design">Graphic Design</option>
                          <option value="Digital Marketing">Digital Marketing</option>
                          <option value="Cooking">Cooking</option>
                          <option value="Video Editing">Video Editing</option>
                        </select>
                        <select
                          value={wantedLevel}
                          onChange={(e) => setWantedLevel(e.target.value as any)}
                          className="w-full bg-surface-raised border border-white/10 text-white rounded-xl px-2 py-1.5 text-xs focus:outline-none font-bold"
                        >
                          <option value="Beginner">Beginner</option>
                          <option value="Intermediate">Intermediate</option>
                          <option value="Expert">Expert</option>
                        </select>
                      </div>
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className={`w-full py-3 bg-violet-600 hover:bg-violet-500 text-white font-bold rounded-2xl shadow-lg shadow-violet-500/25 transition-all flex items-center justify-center gap-2 text-xs cursor-pointer border-0 mt-4 ${
                      isSubmitting ? 'opacity-75 cursor-not-allowed' : 'hover:scale-[1.01]'
                    }`}
                  >
                    {isSubmitting ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        Creating Account...
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-4 h-4" />
                        <span>Register Profile & Start Bartering</span>
                      </>
                    )}
                  </button>
                </motion.form>
              )}
            </AnimatePresence>

          </div>
        </motion.div>

      </div>
    </div>
  );
}

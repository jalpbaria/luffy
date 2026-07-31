import React, { useState } from 'react';
import { motion } from 'motion/react';
import { 
  LogIn, UserPlus, Eye, EyeOff, Sparkles, Mail, Lock, User, 
  BookOpen, ChevronRight, Check, AlertCircle, Languages,
  Users, TrendingUp, ArrowLeft
} from 'lucide-react';
import { UserProfile } from '../types';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

interface LoginViewProps {
  onLogin: (user: UserProfile) => void;
  onRegister: (newUserPayload: Omit<UserProfile, 'id' | 'rating' | 'reviewsCount' | 'successfulExchanges' | 'credits' | 'badges'> & { id: string }) => Promise<{ success: boolean; error?: string }>;
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
        color: 'bg-slate-200',
        textColor: 'text-slate-400',
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
      return { score, label: 'Weak', color: 'bg-rose-500', textColor: 'text-rose-600', percentage: 25, checks };
    } else if (score === 2) {
      return { score, label: 'Fair', color: 'bg-amber-500', textColor: 'text-amber-600', percentage: 50, checks };
    } else if (score === 3) {
      return { score, label: 'Good', color: 'bg-blue-500', textColor: 'text-blue-600', percentage: 75, checks };
    } else if (score >= 4) {
      return { score, label: 'Strong', color: 'bg-emerald-500', textColor: 'text-emerald-600', percentage: 100, checks };
    }

    return { score: 0, label: 'Very Weak', color: 'bg-rose-400', textColor: 'text-rose-500', percentage: 12, checks };
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
        redirectTo: `${window.location.origin}`,
      });

      if (error) {
        setResetError(error.message);
      } else {
        setResetMessage('Reset password link has been sent to your email address!');
      }
    } catch (err: any) {
      setResetError(err.message || 'An error occurred. Please try again.');
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
      setRegisterError('Please enter a valid email address.');
      return;
    }
    if (!regPassword) {
      setRegisterError('Please enter a password.');
      return;
    }
    if (regPassword.length < 6) {
      setRegisterError('Password must be at least 6 characters long.');
      return;
    }
    if (allUsers.some(u => u.email.toLowerCase().trim() === regEmail.toLowerCase().trim())) {
      setRegisterError('This email is already registered.');
      return;
    }
    if (!regBio.trim() || regBio.trim().length < 10) {
      setRegisterError('Please write a short bio (at least 10 characters) about yourself.');
      return;
    }
    if (!offeredName.trim()) {
      setRegisterError('Please specify at least one skill you can offer/teach.');
      return;
    }
    if (!wantedName.trim()) {
      setRegisterError('Please specify at least one skill you want to learn.');
      return;
    }

    setIsSubmitting(true);
    try {
      // 1. Sign up on Supabase Auth
      const { data: authData, error: authError } = await signUp(regEmail, regPassword);

      if (authError) {
        setRegisterError(authError.message);
        setIsSubmitting(false);
        return;
      }

      const uniqueId = authData.user?.id || `user-${Date.now()}`;
      const selectedAvatar = regAvatar || avatarPresets[Math.floor(Math.random() * avatarPresets.length)];

      const languagesArray = regLanguages
        .split(',')
        .map(lang => lang.trim())
        .filter(lang => lang.length > 0);

      const newUserPayload = {
        id: uniqueId,
        name: regName.trim(),
        email: regEmail.toLowerCase().trim(),
        avatar: selectedAvatar,
        bio: regBio.trim(),
        education: regEducation.trim() || 'Self-taught practitioner',
        experience: regExperience.trim() || 'Enthusiastic explorer',
        languages: languagesArray.length > 0 ? languagesArray : ['English'],
        availability: regAvailability.length > 0 ? regAvailability : ['Morning', 'Afternoon'],
        skillLevel: offeredLevel,
        portfolio: {},
        skillsOffered: [
          { name: offeredName.trim(), category: offeredCategory, level: offeredLevel }
        ],
        skillsWanted: [
          { name: wantedName.trim(), category: wantedCategory, level: wantedLevel }
        ],
        timeZone: regTimeZone
      };

      // 2. Save profile details in standard DB
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
      icon: <Users className="w-5 h-5 text-indigo-600" />,
      title: 'Find Skill Partners',
      description: 'Match with verified swappers based on custom skill complementarity.',
      bg: 'bg-indigo-50/80 border-indigo-100'
    },
    {
      icon: <BookOpen className="w-5 h-5 text-purple-600" />,
      title: 'Learn from Real People',
      description: '1-on-1 live interactive sessions with real code editor & whiteboard.',
      bg: 'bg-purple-50/80 border-purple-100'
    },
    {
      icon: <Sparkles className="w-5 h-5 text-blue-600" />,
      title: 'Teach What You Know',
      description: 'Share your unique expertise, build authority, and earn barter credits.',
      bg: 'bg-blue-50/80 border-blue-100'
    },
    {
      icon: <TrendingUp className="w-5 h-5 text-emerald-600" />,
      title: 'Grow Together',
      description: 'Track learning milestones, earn badges, and build verified portfolios.',
      bg: 'bg-emerald-50/80 border-emerald-100'
    },
  ];

  return (
    <div id="login-view-root" className="min-h-screen bg-slate-50/60 flex items-center justify-center p-4 sm:p-6 lg:p-10 relative overflow-hidden font-sans">
      
      {/* Background Ambient Glow Spheres */}
      <div className="absolute -top-32 -left-32 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-32 -right-32 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-blue-500/5 rounded-full blur-3xl pointer-events-none" />

      {/* Main Split-Screen Container */}
      <div className="w-full max-w-6xl grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center z-10 my-auto">
        
        {/* LEFT SECTION: Brand Showcase & Value Props */}
        <motion.div 
          initial={{ opacity: 0, x: -24 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
          className="lg:col-span-6 space-y-8 pr-0 lg:pr-4"
        >
          {/* Brand Header Badge */}
          <div className="space-y-4">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 bg-white border border-slate-200/90 rounded-full shadow-2xs">
              <span className="w-2 h-2 rounded-full bg-indigo-600 animate-pulse" />
              <span className="text-xs font-extrabold uppercase tracking-wider text-slate-700">SkillSwap Barter Network</span>
            </div>

            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-slate-900 tracking-tight leading-[1.15]">
              Exchange Skills.{' '}
              <span className="bg-gradient-to-r from-indigo-600 via-purple-600 to-blue-600 bg-clip-text text-transparent">
                Build Your Future.
              </span>
            </h1>

            <p className="text-slate-600 text-sm sm:text-base leading-relaxed max-w-lg font-normal">
              Connect with real peers to barter expertise 1-on-1. Teach what you excel at, learn what you're passionate about — completely currency-free.
            </p>
          </div>

          {/* Icon Benefit Cards Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            {platformBenefits.map((benefit, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: 0.1 * idx }}
                whileHover={{ y: -3, transition: { duration: 0.2 } }}
                className={`p-4 rounded-2xl border ${benefit.bg} bg-white/70 backdrop-blur-xs shadow-2xs space-y-1.5 transition-all`}
              >
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-white border border-slate-200/80 flex items-center justify-center shadow-2xs shrink-0">
                    {benefit.icon}
                  </div>
                  <h3 className="font-extrabold text-slate-900 text-xs sm:text-sm">
                    {benefit.title}
                  </h3>
                </div>
                <p className="text-slate-500 text-[11px] leading-relaxed">
                  {benefit.description}
                </p>
              </motion.div>
            ))}
          </div>

          {/* Social Proof / Trust Banner */}
          <div className="pt-2 flex items-center gap-3 text-xs text-slate-500 font-medium">
            <div className="flex items-center -space-x-2">
              {avatarPresets.slice(0, 3).map((url, i) => (
                <img key={i} src={url} alt="Member" className="w-7 h-7 rounded-full border-2 border-white object-cover shadow-2xs" />
              ))}
            </div>
            <span>Join thousands of skill swappers growing together</span>
          </div>
        </motion.div>

        {/* RIGHT SECTION: Auth Form Card */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.15, ease: 'easeOut' }}
          className="lg:col-span-6 w-full max-w-md mx-auto lg:max-w-none"
        >
          <div className="bg-white border border-slate-200/90 rounded-[28px] p-6 sm:p-9 shadow-2xl shadow-indigo-500/10 backdrop-blur-xl relative overflow-hidden">
            
            {/* Top Accent Line */}
            <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-indigo-500 via-purple-500 to-blue-500" />

            {/* Header Title & Subtitle */}
            <div className="text-center space-y-1.5 mb-6">
              <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight">
                {isResetMode ? 'Reset Password' : mode === 'login' ? 'Welcome Back' : 'Join SkillSwap'}
              </h2>
              <p className="text-xs text-slate-500 leading-relaxed max-w-xs mx-auto">
                {isResetMode 
                  ? 'We will send a secure recovery link to your inbox.' 
                  : mode === 'login' 
                    ? 'Enter your credentials to access your skill barter hub.' 
                    : 'Create your profile to start bartering skills with peers.'}
              </p>
            </div>

            {/* Mode Selector Tabs (Hidden in Reset Mode) */}
            {!isResetMode && (
              <div className="flex bg-slate-100/80 p-1 rounded-2xl mb-6">
                <button
                  type="button"
                  onClick={() => { setMode('login'); setLoginError(''); }}
                  className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer border-0 ${
                    mode === 'login' 
                      ? 'bg-white text-indigo-700 shadow-sm' 
                      : 'text-slate-500 hover:text-slate-800'
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
                      ? 'bg-white text-indigo-700 shadow-sm' 
                      : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  <UserPlus className="w-3.5 h-3.5" />
                  Create Account
                </button>
              </div>
            )}

            {/* Password Reset Form */}
            {isResetMode ? (
              <form onSubmit={handlePasswordResetSubmit} className="space-y-4">
                {resetError && (
                  <div className="p-3 bg-rose-50 text-rose-950 border border-rose-200/80 rounded-2xl flex items-start gap-2.5 text-xs font-medium">
                    <AlertCircle className="w-4 h-4 shrink-0 text-rose-600 mt-0.5" />
                    <p>{resetError}</p>
                  </div>
                )}

                {resetMessage && (
                  <div className="p-3 bg-emerald-50 text-emerald-950 border border-emerald-200/80 rounded-2xl flex items-start gap-2.5 text-xs font-semibold">
                    <Check className="w-4 h-4 shrink-0 text-emerald-600 mt-0.5" />
                    <p>{resetMessage}</p>
                  </div>
                )}

                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-slate-700">Email Address</label>
                  <div className="relative">
                    <Mail className="absolute left-3.5 top-3 w-4 h-4 text-slate-400" />
                    <input
                      type="email"
                      value={resetEmail}
                      onChange={(e) => setResetEmail(e.target.value)}
                      placeholder="alex.rivera@example.com"
                      required
                      className="w-full bg-slate-50 border border-slate-200 rounded-2xl pl-10 pr-4 py-2.5 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition"
                    />
                  </div>
                </div>

                <div className="flex gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => { setIsResetMode(false); setResetError(''); setResetMessage(''); }}
                    className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-extrabold rounded-2xl text-xs transition cursor-pointer border-0 flex items-center justify-center gap-1"
                  >
                    <ArrowLeft className="w-3.5 h-3.5" />
                    Back
                  </button>
                  <button
                    type="submit"
                    className="flex-1 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold rounded-2xl text-xs shadow-md shadow-indigo-600/20 transition cursor-pointer border-0"
                  >
                    Send Recovery Link
                  </button>
                </div>
              </form>
            ) : mode === 'login' ? (
              /* Standard Login Form */
              <form onSubmit={handleLoginSubmit} className="space-y-4">
                {accountDeletedNotice && (
                  <div className="p-3 bg-emerald-50 text-emerald-950 border border-emerald-200/80 rounded-2xl flex items-start gap-2.5 text-xs font-semibold">
                    <Check className="w-4 h-4 shrink-0 text-emerald-600 mt-0.5" />
                    <p className="leading-snug">{accountDeletedNotice}</p>
                  </div>
                )}

                {emailConfirmationNotice && (
                  <div className="p-3 bg-blue-50/90 text-blue-900 border border-blue-200/80 rounded-2xl flex items-start gap-2.5 text-xs font-medium">
                    <Mail className="w-4 h-4 shrink-0 text-blue-600 mt-0.5" />
                    <p className="leading-snug">{emailConfirmationNotice}</p>
                  </div>
                )}

                {loginError && (
                  <div className="p-3 bg-amber-50 text-amber-950 border border-amber-200/80 rounded-2xl flex items-start gap-2.5 text-xs font-medium">
                    <AlertCircle className="w-4 h-4 shrink-0 text-amber-600 mt-0.5" />
                    <p>{loginError}</p>
                  </div>
                )}

                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-slate-700">Email Address</label>
                  <div className="relative">
                    <Mail className="absolute left-3.5 top-3 w-4 h-4 text-slate-400" />
                    <input
                      type="email"
                      value={loginEmail}
                      onChange={(e) => setLoginEmail(e.target.value)}
                      placeholder="alex.rivera@example.com"
                      required
                      className="w-full bg-slate-50 border border-slate-200 rounded-2xl pl-10 pr-4 py-2.5 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <div className="flex justify-between items-center">
                    <label className="block text-xs font-bold text-slate-700">Password</label>
                    <button
                      type="button"
                      onClick={() => { setIsResetMode(true); setLoginError(''); setResetMessage(''); setResetError(''); }}
                      className="text-[11px] text-indigo-600 hover:text-indigo-800 bg-transparent border-0 cursor-pointer p-0 font-bold"
                    >
                      Forgot password?
                    </button>
                  </div>
                  <div className="relative">
                    <Lock className="absolute left-3.5 top-3 w-4 h-4 text-slate-400" />
                    <input
                      type={showPassword ? "text" : "password"}
                      value={loginPassword}
                      onChange={(e) => setLoginPassword(e.target.value)}
                      placeholder="••••••••"
                      required
                      className="w-full bg-slate-50 border border-slate-200 rounded-2xl pl-10 pr-10 py-2.5 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3.5 top-3 text-slate-400 hover:text-slate-600 border-0 bg-transparent cursor-pointer p-0"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {/* Remember Me Checkbox */}
                <div className="flex items-center justify-between pt-1">
                  <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-slate-600">
                    <input
                      type="checkbox"
                      checked={rememberMe}
                      onChange={(e) => setRememberMe(e.target.checked)}
                      className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 w-3.5 h-3.5"
                    />
                    <span>Remember this device</span>
                  </label>
                </div>

                {/* Primary Sign In Button */}
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className={`w-full py-3 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-extrabold rounded-2xl shadow-md shadow-indigo-600/20 transition-all flex items-center justify-center gap-2 text-xs cursor-pointer border-0 mt-3 ${
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

                {/* Switch to Registration */}
                <div className="text-center pt-2 text-xs text-slate-500">
                  Don't have an account yet?{' '}
                  <button
                    type="button"
                    onClick={() => { setMode('register'); setRegisterError(''); }}
                    className="text-indigo-600 font-extrabold hover:underline border-0 bg-transparent cursor-pointer p-0"
                  >
                    Create Account
                  </button>
                </div>
              </form>
            ) : (
              /* Registration Form */
              <form onSubmit={handleRegisterSubmit} className="space-y-4 max-h-[55vh] overflow-y-auto pr-1">
                {registerError && (
                  <div className="p-3 bg-amber-50 text-amber-950 border border-amber-200/80 rounded-2xl flex items-start gap-2.5 text-xs font-medium">
                    <AlertCircle className="w-4 h-4 shrink-0 text-amber-600 mt-0.5" />
                    <p>{registerError}</p>
                  </div>
                )}

                {/* Profile Credentials */}
                <div className="space-y-3 border-b border-slate-100 pb-4">
                  <h3 className="text-xs font-extrabold text-indigo-600 uppercase tracking-wide flex items-center gap-1.5">
                    <span>🔑</span> Profile Credentials
                  </h3>
                  
                  <div className="space-y-1">
                    <label className="block text-[10px] font-extrabold text-slate-600 uppercase tracking-wider">Full Name *</label>
                    <div className="relative">
                      <User className="absolute left-3 top-2.5 w-3.5 h-3.5 text-slate-400" />
                      <input
                        type="text"
                        value={regName}
                        onChange={(e) => setRegName(e.target.value)}
                        placeholder="Jane Doe"
                        required
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white"
                      />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="block text-[10px] font-extrabold text-slate-600 uppercase tracking-wider">Email Address *</label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-2.5 w-3.5 h-3.5 text-slate-400" />
                      <input
                        type="email"
                        value={regEmail}
                        onChange={(e) => setRegEmail(e.target.value)}
                        placeholder="jane.doe@example.com"
                        required
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white"
                      />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="block text-[10px] font-extrabold text-slate-600 uppercase tracking-wider">Password *</label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-2.5 w-3.5 h-3.5 text-slate-400" />
                      <input
                        type={showRegPassword ? "text" : "password"}
                        value={regPassword}
                        onChange={(e) => setRegPassword(e.target.value)}
                        placeholder="••••••••"
                        required
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-9 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white"
                      />
                      <button
                        type="button"
                        onClick={() => setShowRegPassword(!showRegPassword)}
                        className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600 border-0 bg-transparent cursor-pointer p-0"
                      >
                        {showRegPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                      </button>
                    </div>

                    {/* Password Strength Indicator */}
                    {regPassword && (
                      <div className="mt-2 p-2.5 bg-slate-50 rounded-xl border border-slate-200/70 space-y-1.5">
                        <div className="flex items-center justify-between text-[11px] font-semibold">
                          <span className="text-slate-600">Password Strength</span>
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                            regPasswordStrength.score <= 1 ? 'bg-rose-100 text-rose-700' :
                            regPasswordStrength.score === 2 ? 'bg-amber-100 text-amber-700' :
                            regPasswordStrength.score === 3 ? 'bg-blue-100 text-blue-700' :
                            'bg-emerald-100 text-emerald-700'
                          }`}>
                            {regPasswordStrength.label}
                          </span>
                        </div>

                        <div className="w-full bg-slate-200 rounded-full h-1.5 overflow-hidden">
                          <div
                            className={`h-full transition-all duration-300 rounded-full ${regPasswordStrength.color}`}
                            style={{ width: `${regPasswordStrength.percentage}%` }}
                          />
                        </div>

                        <div className="grid grid-cols-2 gap-x-2 gap-y-1 pt-1 text-[10px]">
                          <div className={`flex items-center gap-1.5 ${regPasswordStrength.checks.length ? 'text-emerald-600 font-bold' : 'text-slate-400'}`}>
                            <span>✓ 8+ characters</span>
                          </div>
                          <div className={`flex items-center gap-1.5 ${regPasswordStrength.checks.caseMix ? 'text-emerald-600 font-bold' : 'text-slate-400'}`}>
                            <span>✓ Upper & lower</span>
                          </div>
                          <div className={`flex items-center gap-1.5 ${regPasswordStrength.checks.number ? 'text-emerald-600 font-bold' : 'text-slate-400'}`}>
                            <span>✓ Number</span>
                          </div>
                          <div className={`flex items-center gap-1.5 ${regPasswordStrength.checks.special ? 'text-emerald-600 font-bold' : 'text-slate-400'}`}>
                            <span>✓ Symbol</span>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Profile Details */}
                <div className="space-y-3 border-b border-slate-100 pb-4">
                  <h3 className="text-xs font-extrabold text-indigo-600 uppercase tracking-wide flex items-center gap-1.5">
                    <span>📝</span> Profile & Biography
                  </h3>

                  <div className="space-y-1">
                    <label className="block text-[10px] font-extrabold text-slate-600 uppercase tracking-wider">Biography *</label>
                    <textarea
                      value={regBio}
                      onChange={(e) => setRegBio(e.target.value)}
                      placeholder="Share who you are and why you want to exchange skills..."
                      rows={2}
                      required
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-2.5">
                    <div className="space-y-1">
                      <label className="block text-[10px] font-extrabold text-slate-600 uppercase tracking-wider">Education</label>
                      <input
                        type="text"
                        value={regEducation}
                        onChange={(e) => setRegEducation(e.target.value)}
                        placeholder="Degree or Self-taught"
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="block text-[10px] font-extrabold text-slate-600 uppercase tracking-wider">Experience</label>
                      <input
                        type="text"
                        value={regExperience}
                        onChange={(e) => setRegExperience(e.target.value)}
                        placeholder="e.g. 3 years in web dev"
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="block text-[10px] font-extrabold text-slate-600 uppercase tracking-wider">Languages</label>
                    <input
                      type="text"
                      value={regLanguages}
                      onChange={(e) => setRegLanguages(e.target.value)}
                      placeholder="English, Spanish, Mandarin"
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="block text-[10px] font-extrabold text-slate-600 uppercase tracking-wider">Avatar Preset</label>
                    <div className="flex items-center gap-2">
                      {avatarPresets.map((url, idx) => (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => setRegAvatar(url)}
                          className={`relative w-9 h-9 rounded-full overflow-hidden border-2 transition shrink-0 ${
                            regAvatar === url ? 'border-indigo-600 scale-105 shadow-xs' : 'border-transparent hover:border-slate-300'
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
                  <h3 className="text-xs font-extrabold text-indigo-600 uppercase tracking-wide flex items-center gap-1.5">
                    <span>📚</span> Skill Exchange Matchmaking
                  </h3>

                  {/* Offered Skill */}
                  <div className="p-3 bg-indigo-50/50 border border-indigo-100 rounded-2xl space-y-2">
                    <span className="px-2 py-0.5 bg-indigo-600 text-white rounded text-[9px] font-extrabold uppercase tracking-wider">Skill You Teach *</span>
                    <input
                      type="text"
                      value={offeredName}
                      onChange={(e) => setOfferedName(e.target.value)}
                      placeholder="e.g. React Frontend Development"
                      required
                      className="w-full bg-white border border-slate-200 rounded-xl px-3 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                    <div className="grid grid-cols-2 gap-2">
                      <select
                        value={offeredCategory}
                        onChange={(e) => setOfferedCategory(e.target.value)}
                        className="w-full bg-white border border-slate-200 rounded-xl px-2 py-1.5 text-xs"
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
                        className="w-full bg-white border border-slate-200 rounded-xl px-2 py-1.5 text-xs"
                      >
                        <option value="Beginner">Beginner</option>
                        <option value="Intermediate">Intermediate</option>
                        <option value="Expert">Expert</option>
                      </select>
                    </div>
                  </div>

                  {/* Wanted Skill */}
                  <div className="p-3 bg-purple-50/50 border border-purple-100 rounded-2xl space-y-2">
                    <span className="px-2 py-0.5 bg-purple-600 text-white rounded text-[9px] font-extrabold uppercase tracking-wider">Skill You Want *</span>
                    <input
                      type="text"
                      value={wantedName}
                      onChange={(e) => setWantedName(e.target.value)}
                      placeholder="e.g. Spanish Conversation"
                      required
                      className="w-full bg-white border border-slate-200 rounded-xl px-3 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                    <div className="grid grid-cols-2 gap-2">
                      <select
                        value={wantedCategory}
                        onChange={(e) => setWantedCategory(e.target.value)}
                        className="w-full bg-white border border-slate-200 rounded-xl px-2 py-1.5 text-xs"
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
                        className="w-full bg-white border border-slate-200 rounded-xl px-2 py-1.5 text-xs"
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
                  className={`w-full py-3 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-extrabold rounded-2xl shadow-md shadow-indigo-600/20 transition-all flex items-center justify-center gap-2 text-xs cursor-pointer border-0 mt-4 ${
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
              </form>
            )}

          </div>
        </motion.div>

      </div>
    </div>
  );
}

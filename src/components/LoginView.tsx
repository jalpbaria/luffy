import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { 
  LogIn, UserPlus, Eye, EyeOff, Sparkles, Mail, Lock, User, 
  BookOpen, Compass, ChevronRight, Check, AlertCircle, Languages, Clock
} from 'lucide-react';
import { UserProfile, Skill } from '../types';
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
      return { score, label: 'Weak', color: 'bg-red-500', textColor: 'text-red-600', percentage: 25, checks };
    } else if (score === 2) {
      return { score, label: 'Fair', color: 'bg-amber-500', textColor: 'text-amber-600', percentage: 50, checks };
    } else if (score === 3) {
      return { score, label: 'Good', color: 'bg-blue-500', textColor: 'text-blue-600', percentage: 75, checks };
    } else if (score >= 4) {
      return { score, label: 'Strong', color: 'bg-emerald-500', textColor: 'text-emerald-600', percentage: 100, checks };
    }

    return { score: 0, label: 'Very Weak', color: 'bg-red-400', textColor: 'text-red-500', percentage: 12, checks };
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
        if (error.message?.toLowerCase().includes('confirm') || error.message?.toLowerCase().includes('email not confirmed')) {
          setLoginError('Email not confirmed. Please check your Gmail for the confirmation of your email.');
        } else {
          setLoginError(`${error.message} (Note: Please check your Gmail for the confirmation of your email.)`);
        }
        return;
      }

      // Try finding user by email in database
      const matchedUser = allUsers.find(
        u => u.email.toLowerCase().trim() === loginEmail.toLowerCase().trim()
      );

      if (matchedUser) {
        onLogin(matchedUser);
      } else {
        // Create an on-the-fly profile if it doesn't exist in local/JSON database yet
        const uniqueId = data.user?.id || `user-${Date.now()}`;
        const dummyProfile = {
          id: uniqueId,
          name: loginEmail.split('@')[0],
          email: loginEmail.toLowerCase().trim(),
          avatar: `https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&h=150&q=80`,
          bio: 'Self-starter on Skill Swap!',
          education: 'Self-taught practitioner',
          experience: 'Enthusiastic explorer',
          languages: ['English'],
          availability: ['Morning', 'Afternoon'] as any,
          skillLevel: 'Beginner' as any,
          portfolio: {},
          skillsOffered: [],
          skillsWanted: [],
          timeZone: 'EST'
        };
        await onRegister(dummyProfile);
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
        setEmailConfirmationNotice('Account created! Please check your Gmail for the confirmation of your email.');
        setMode('login');
      }
    } catch (err: any) {
      setRegisterError(err.message || 'An error occurred during registration.');
    } finally {
      setIsSubmitting(false);
    }
  };



  const toggleAvailability = (slot: 'Morning' | 'Afternoon' | 'Evening') => {
    setRegAvailability(prev => 
      prev.includes(slot) ? prev.filter(s => s !== slot) : [...prev, slot]
    );
  };

  return (
    <div id="login-view-root" className="min-h-[80vh] flex items-center justify-center py-6 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8 bg-white border border-slate-200 rounded-2xl p-6 sm:p-8 shadow-sm">
        
        {/* Brand Header */}
        <div className="text-center space-y-2">
          <div className="inline-flex w-12 h-12 bg-indigo-600 text-white rounded-xl items-center justify-center font-bold text-xl shadow-md shadow-indigo-600/10">
            ⇆
          </div>
          <h1 className="text-2xl font-serif font-bold text-slate-900 tracking-tight">Skill Swap Platform</h1>
          <p className="text-xs text-slate-500">
            {mode === 'login' 
              ? 'Log in to connect with custom-matched partners & barter skills'
              : 'Create a collaborative profile and start bartering expertise'
            }
          </p>
        </div>

        {/* Tab Selection */}
        <div className="flex bg-slate-100 p-1 rounded-xl shrink-0">
          <button
            onClick={() => { setMode('login'); setLoginError(''); }}
            className={`flex-1 py-2 text-xs font-semibold rounded-lg transition ${
              mode === 'login' 
                ? 'bg-white text-indigo-700 shadow-2xs' 
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <LogIn className="w-3.5 h-3.5 inline mr-1.5" />
            Sign In
          </button>
          <button
            onClick={() => { setMode('register'); setRegisterError(''); }}
            className={`flex-1 py-2 text-xs font-semibold rounded-lg transition ${
              mode === 'register' 
                ? 'bg-white text-indigo-700 shadow-2xs' 
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <UserPlus className="w-3.5 h-3.5 inline mr-1.5" />
            Create Account
          </button>
        </div>

        {mode === 'login' ? (
          <div className="space-y-6">
            {isResetMode ? (
              <form onSubmit={handlePasswordResetSubmit} className="space-y-4">
                <div className="space-y-1">
                  <h3 className="text-sm font-semibold text-slate-800">Reset Password</h3>
                  <p className="text-xs text-slate-500 leading-normal">
                    Enter your email address and we'll send you a recovery link to set a new password.
                  </p>
                </div>

                {resetError && (
                  <div className="p-3 bg-red-50 text-red-950 border border-red-200 rounded-xl flex items-start gap-2.5 text-xs">
                    <AlertCircle className="w-4 h-4 shrink-0 text-red-600 mt-0.5" />
                    <p>{resetError}</p>
                  </div>
                )}

                {resetMessage && (
                  <div className="p-3 bg-green-50 text-green-900 border border-green-200 rounded-xl flex items-start gap-2.5 text-xs">
                    <Check className="w-4 h-4 shrink-0 text-green-600 mt-0.5" />
                    <p>{resetMessage}</p>
                  </div>
                )}

                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider">Email Address</label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
                    <input
                      type="email"
                      value={resetEmail}
                      onChange={(e) => setResetEmail(e.target.value)}
                      placeholder="alex.rivera@example.com"
                      required
                      className="w-full bg-slate-50/50 border border-slate-200 rounded-lg pl-9 pr-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                </div>

                <div className="flex gap-3 pt-1">
                  <button
                    type="button"
                    onClick={() => { setIsResetMode(false); setResetError(''); setResetMessage(''); }}
                    className="flex-1 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-lg text-xs cursor-pointer border-0"
                  >
                    Back to Sign In
                  </button>
                  <button
                    type="submit"
                    className="flex-1 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-lg text-xs cursor-pointer border-0"
                  >
                    Send Link
                  </button>
                </div>
              </form>
            ) : (
              /* Standard Login Form */
              <form onSubmit={handleLoginSubmit} className="space-y-4">
                {accountDeletedNotice && (
                  <div className="p-3 bg-emerald-50 text-emerald-900 border border-emerald-200 rounded-xl flex items-start gap-2.5 text-xs font-semibold">
                    <Check className="w-4 h-4 shrink-0 text-emerald-600 mt-0.5" />
                    <p className="leading-snug">{accountDeletedNotice}</p>
                  </div>
                )}

                {emailConfirmationNotice && (
                  <div className="p-3 bg-blue-50/80 text-blue-900 border border-blue-200 rounded-xl flex items-start gap-2.5 text-xs font-medium">
                    <Mail className="w-4 h-4 shrink-0 text-blue-600 mt-0.5" />
                    <p className="leading-snug">{emailConfirmationNotice}</p>
                  </div>
                )}

                {loginError && (
                  <div className="p-3 bg-amber-50 text-amber-900 border border-amber-200 rounded-xl flex items-start gap-2.5 text-xs">
                    <AlertCircle className="w-4 h-4 shrink-0 text-amber-600 mt-0.5" />
                    <p>{loginError}</p>
                  </div>
                )}

                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider">Email Address</label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
                    <input
                      type="email"
                      value={loginEmail}
                      onChange={(e) => setLoginEmail(e.target.value)}
                      placeholder="alex.rivera@example.com"
                      className="w-full bg-slate-50/50 border border-slate-200 rounded-lg pl-9 pr-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <div className="flex justify-between items-center">
                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider">Password</label>
                    <button
                      type="button"
                      onClick={() => { setIsResetMode(true); setLoginError(''); setResetMessage(''); setResetError(''); }}
                      className="text-[11px] text-indigo-600 hover:text-indigo-800 bg-transparent border-0 cursor-pointer p-0 font-medium"
                    >
                      Forgot password?
                    </button>
                  </div>
                  <div className="relative">
                    <Lock className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
                    <input
                      type={showPassword ? "text" : "password"}
                      value={loginPassword}
                      onChange={(e) => setLoginPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full bg-slate-50/50 border border-slate-200 rounded-lg pl-9 pr-9 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600 border-0 bg-transparent cursor-pointer p-0"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-lg shadow-xs transition flex items-center justify-center gap-1.5 text-xs cursor-pointer border-0 mt-2"
                >
                  Sign In
                  <ChevronRight className="w-4 h-4" />
                </button>
              </form>
            )}
          </div>
        ) : (
          /* Registration Form */
          <form onSubmit={handleRegisterSubmit} className="space-y-5 max-h-[60vh] overflow-y-auto pr-2">
            {registerError && (
              <div className="p-3 bg-amber-50 text-amber-900 border border-amber-200 rounded-xl flex items-start gap-2.5 text-xs">
                <AlertCircle className="w-4 h-4 shrink-0 text-amber-600 mt-0.5" />
                <p>{registerError}</p>
              </div>
            )}

            {/* Profile Credentials */}
            <div className="space-y-3 border-b border-slate-100 pb-4">
              <h3 className="text-xs font-bold text-indigo-600 uppercase tracking-wide flex items-center gap-1.5">
                <span>🔑</span> Profile Credentials
              </h3>
              
              <div className="space-y-1">
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider">Full Name *</label>
                <div className="relative">
                  <User className="absolute left-3 top-2.5 w-3.5 h-3.5 text-slate-400" />
                  <input
                    type="text"
                    value={regName}
                    onChange={(e) => setRegName(e.target.value)}
                    placeholder="Jane Doe"
                    required
                    className="w-full bg-slate-50/50 border border-slate-200 rounded-lg pl-9 pr-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider">Email Address *</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-2.5 w-3.5 h-3.5 text-slate-400" />
                  <input
                    type="email"
                    value={regEmail}
                    onChange={(e) => setRegEmail(e.target.value)}
                    placeholder="jane.doe@example.com"
                    required
                    className="w-full bg-slate-50/50 border border-slate-200 rounded-lg pl-9 pr-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider">Password *</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-2.5 w-3.5 h-3.5 text-slate-400" />
                  <input
                    type={showRegPassword ? "text" : "password"}
                    value={regPassword}
                    onChange={(e) => setRegPassword(e.target.value)}
                    placeholder="••••••••"
                    required
                    className="w-full bg-slate-50/50 border border-slate-200 rounded-lg pl-9 pr-9 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                  <button
                    type="button"
                    onClick={() => setShowRegPassword(!showRegPassword)}
                    className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600 border-0 bg-transparent cursor-pointer p-0 flex items-center justify-center"
                    title={showRegPassword ? "Hide password" : "Show password"}
                  >
                    {showRegPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                  </button>
                </div>

                {/* Password Strength Indicator */}
                {regPassword && (
                  <div className="mt-2 pt-1 space-y-1.5 bg-slate-50/80 p-2.5 rounded-lg border border-slate-100">
                    <div className="flex items-center justify-between text-[11px] font-semibold">
                      <span className="text-slate-500">Password Strength</span>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        regPasswordStrength.score <= 1 ? 'bg-red-100 text-red-700' :
                        regPasswordStrength.score === 2 ? 'bg-amber-100 text-amber-700' :
                        regPasswordStrength.score === 3 ? 'bg-blue-100 text-blue-700' :
                        'bg-emerald-100 text-emerald-700'
                      }`}>
                        {regPasswordStrength.label}
                      </span>
                    </div>

                    {/* Progress Bar Track */}
                    <div className="w-full bg-slate-200 rounded-full h-1.5 overflow-hidden">
                      <div
                        className={`h-full transition-all duration-300 rounded-full ${regPasswordStrength.color}`}
                        style={{ width: `${regPasswordStrength.percentage}%` }}
                      />
                    </div>

                    {/* Requirements Checklist */}
                    <div className="grid grid-cols-2 gap-x-2 gap-y-1 pt-1 text-[10px]">
                      <div className={`flex items-center gap-1.5 ${regPasswordStrength.checks.length ? 'text-emerald-600 font-medium' : 'text-slate-400'}`}>
                        <div className={`w-3 h-3 rounded-full flex items-center justify-center text-[8px] ${regPasswordStrength.checks.length ? 'bg-emerald-500 text-white' : 'bg-slate-200 text-slate-400'}`}>
                          ✓
                        </div>
                        <span>8+ characters</span>
                      </div>
                      <div className={`flex items-center gap-1.5 ${regPasswordStrength.checks.caseMix ? 'text-emerald-600 font-medium' : 'text-slate-400'}`}>
                        <div className={`w-3 h-3 rounded-full flex items-center justify-center text-[8px] ${regPasswordStrength.checks.caseMix ? 'bg-emerald-500 text-white' : 'bg-slate-200 text-slate-400'}`}>
                          ✓
                        </div>
                        <span>Upper & lowercase</span>
                      </div>
                      <div className={`flex items-center gap-1.5 ${regPasswordStrength.checks.number ? 'text-emerald-600 font-medium' : 'text-slate-400'}`}>
                        <div className={`w-3 h-3 rounded-full flex items-center justify-center text-[8px] ${regPasswordStrength.checks.number ? 'bg-emerald-500 text-white' : 'bg-slate-200 text-slate-400'}`}>
                          ✓
                        </div>
                        <span>Number (0-9)</span>
                      </div>
                      <div className={`flex items-center gap-1.5 ${regPasswordStrength.checks.special ? 'text-emerald-600 font-medium' : 'text-slate-400'}`}>
                        <div className={`w-3 h-3 rounded-full flex items-center justify-center text-[8px] ${regPasswordStrength.checks.special ? 'bg-emerald-500 text-white' : 'bg-slate-200 text-slate-400'}`}>
                          ✓
                        </div>
                        <span>Special character</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Profile About */}
            <div className="space-y-3 border-b border-slate-100 pb-4">
              <h3 className="text-xs font-bold text-indigo-600 uppercase tracking-wide flex items-center gap-1.5">
                <span>📝</span> Profile & Biography
              </h3>

              <div className="space-y-1">
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider">Biography *</label>
                <textarea
                  value={regBio}
                  onChange={(e) => setRegBio(e.target.value)}
                  placeholder="Share who you are, what you enjoy doing, and why you are looking to exchange skills..."
                  rows={3}
                  required
                  className="w-full bg-slate-50/50 border border-slate-200 rounded-lg px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider">Education</label>
                  <input
                    type="text"
                    value={regEducation}
                    onChange={(e) => setRegEducation(e.target.value)}
                    placeholder="B.A. in Fine Arts"
                    className="w-full bg-slate-50/50 border border-slate-200 rounded-lg px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <div className="space-y-1">
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider">Experience</label>
                  <input
                    type="text"
                    value={regExperience}
                    onChange={(e) => setRegExperience(e.target.value)}
                    placeholder="Freelance artist (4 years)"
                    className="w-full bg-slate-50/50 border border-slate-200 rounded-lg px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider">Languages (comma separated)</label>
                <div className="relative">
                  <Languages className="absolute left-3 top-2.5 w-3.5 h-3.5 text-slate-400" />
                  <input
                    type="text"
                    value={regLanguages}
                    onChange={(e) => setRegLanguages(e.target.value)}
                    placeholder="English, Spanish, Mandarin"
                    className="w-full bg-slate-50/50 border border-slate-200 rounded-lg pl-9 pr-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider">Select Avatar Preset</label>
                <div className="flex items-center gap-2">
                  {avatarPresets.map((url, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setRegAvatar(url)}
                      className={`relative w-10 h-10 rounded-full overflow-hidden border-2 transition shrink-0 ${
                        regAvatar === url ? 'border-indigo-600 scale-105' : 'border-transparent hover:border-slate-300'
                      }`}
                    >
                      <img src={url} alt="preset" referrerPolicy="no-referrer" className="w-full h-full object-cover" />
                      {regAvatar === url && (
                        <div className="absolute inset-0 bg-indigo-600/20 flex items-center justify-center">
                          <Check className="w-4 h-4 text-white font-bold" />
                        </div>
                      )}
                    </button>
                  ))}
                </div>
                <input
                  type="text"
                  value={regAvatar}
                  onChange={(e) => setRegAvatar(e.target.value)}
                  placeholder="Or paste custom image URL..."
                  className="w-full bg-slate-50/50 border border-slate-200 rounded-lg px-3 py-1.5 text-[10px] focus:outline-none focus:ring-1 focus:ring-indigo-500 mt-1"
                />
              </div>

              <div className="space-y-1">
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider">Availability</label>
                <div className="flex gap-4">
                  {(['Morning', 'Afternoon', 'Evening'] as const).map(slot => (
                    <label key={slot} className="flex items-center gap-1.5 text-xs cursor-pointer">
                      <input
                        type="checkbox"
                        checked={regAvailability.includes(slot)}
                        onChange={() => toggleAvailability(slot)}
                        className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                      />
                      <span>{slot}</span>
                    </label>
                  ))}
                </div>
              </div>
            </div>

            {/* Core Skill Exchange */}
            <div className="space-y-4">
              <h3 className="text-xs font-bold text-indigo-600 uppercase tracking-wide flex items-center gap-1.5">
                <span>📚</span> Skill Exchange Matchmaking
              </h3>

              {/* Skill Offered */}
              <div className="p-3 bg-indigo-50/30 border border-indigo-100 rounded-xl space-y-2.5">
                <span className="px-2 py-0.5 bg-indigo-100 text-indigo-800 rounded text-[9px] font-bold uppercase tracking-wider">Skill You Teach *</span>
                
                <div className="space-y-1">
                  <label className="block text-[10px] font-bold text-slate-500">Skill Name</label>
                  <input
                    type="text"
                    value={offeredName}
                    onChange={(e) => setOfferedName(e.target.value)}
                    placeholder="e.g. React Frontend Development"
                    required
                    className="w-full bg-white border border-slate-200 rounded-lg px-3 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="block text-[10px] font-bold text-slate-500">Category</label>
                    <select
                      value={offeredCategory}
                      onChange={(e) => setOfferedCategory(e.target.value)}
                      className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    >
                      <option value="Programming">Programming</option>
                      <option value="Graphic Design">Graphic Design</option>
                      <option value="Digital Marketing">Digital Marketing</option>
                      <option value="Language Learning">Language Learning</option>
                      <option value="Cooking">Cooking</option>
                      <option value="Video Editing">Video Editing</option>
                      <option value="Public Speaking">Public Speaking</option>
                    </select>
                  </div>
                  <div className="space-y-1">
                    <label className="block text-[10px] font-bold text-slate-500">Your Level</label>
                    <select
                      value={offeredLevel}
                      onChange={(e) => setOfferedLevel(e.target.value as any)}
                      className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    >
                      <option value="Beginner">Beginner</option>
                      <option value="Intermediate">Intermediate</option>
                      <option value="Expert">Expert</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Skill Wanted */}
              <div className="p-3 bg-amber-50/30 border border-amber-100 rounded-xl space-y-2.5">
                <span className="px-2 py-0.5 bg-amber-100 text-amber-800 rounded text-[9px] font-bold uppercase tracking-wider">Skill You Want *</span>
                
                <div className="space-y-1">
                  <label className="block text-[10px] font-bold text-slate-500">Skill Name</label>
                  <input
                    type="text"
                    value={wantedName}
                    onChange={(e) => setWantedName(e.target.value)}
                    placeholder="e.g. Spanish Conversation"
                    required
                    className="w-full bg-white border border-slate-200 rounded-lg px-3 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="block text-[10px] font-bold text-slate-500">Category</label>
                    <select
                      value={wantedCategory}
                      onChange={(e) => setWantedCategory(e.target.value)}
                      className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    >
                      <option value="Language Learning">Language Learning</option>
                      <option value="Programming">Programming</option>
                      <option value="Graphic Design">Graphic Design</option>
                      <option value="Digital Marketing">Digital Marketing</option>
                      <option value="Cooking">Cooking</option>
                      <option value="Video Editing">Video Editing</option>
                      <option value="Public Speaking">Public Speaking</option>
                    </select>
                  </div>
                  <div className="space-y-1">
                    <label className="block text-[10px] font-bold text-slate-500">Target Level</label>
                    <select
                      value={wantedLevel}
                      onChange={(e) => setWantedLevel(e.target.value as any)}
                      className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    >
                      <option value="Beginner">Beginner</option>
                      <option value="Intermediate">Intermediate</option>
                      <option value="Expert">Expert</option>
                    </select>
                  </div>
                </div>
              </div>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className={`w-full py-2.5 text-white font-semibold rounded-lg shadow-xs transition flex items-center justify-center gap-1.5 text-xs cursor-pointer mt-6 border-0 ${
                isSubmitting ? 'bg-indigo-400 cursor-not-allowed' : 'bg-indigo-600 hover:bg-indigo-700'
              }`}
            >
              {isSubmitting ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  Registering Profile...
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  Register Profile & Enter Platform
                </>
              )}
            </button>
          </form>
        )}

      </div>
    </div>
  );
}

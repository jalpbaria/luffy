import React, { useState } from 'react';
import { 
  User, Mail, FileText, GraduationCap, Globe, Clock, Award, 
  Trash2, Plus, Save, BookOpen, Link as LinkIcon, AlertCircle, Check, LogOut,
  AlertTriangle, Lock, Eye, EyeOff, X, Star
} from 'lucide-react';
import { UserProfile, Skill, Review } from '../types';
import { VerifiedSkillBadge } from './VerifiedSkillBadge';
import { EmptyState } from './ui';

interface ProfileViewProps {
  currentUser: UserProfile;
  onSaveProfile: (updatedProfile: UserProfile) => void;
  isSaving: boolean;
  onLogout?: () => void;
  onDeleteAccount?: (password: string) => Promise<{ success: boolean; error?: string }>;
  allReviews?: Review[];
}

const CATEGORIES = [
  'Programming', 'Graphic Design', 'Video Editing', 'Digital Marketing',
  'Photography', 'Music', 'Fitness', 'Cooking', 'Language Learning',
  'Public Speaking', 'Business'
];

export default function ProfileView({ currentUser, onSaveProfile, isSaving, onLogout, onDeleteAccount, allReviews = [] }: ProfileViewProps) {
  // Local state for profile form fields
  const [name, setName] = useState(currentUser?.name ?? '');
  const [avatar, setAvatar] = useState(currentUser?.avatar ?? '');
  const [bio, setBio] = useState(currentUser?.bio ?? '');
  const [education, setEducation] = useState(currentUser?.education ?? '');
  const [experience, setExperience] = useState(currentUser?.experience ?? '');
  const [languages, setLanguages] = useState((currentUser?.languages ?? []).join(', '));
  const [availability, setAvailability] = useState<UserProfile['availability']>(currentUser?.availability ?? []);
  const [skillLevel, setSkillLevel] = useState<UserProfile['skillLevel']>(currentUser?.skillLevel ?? 'Intermediate');
  const [timeZone, setTimeZone] = useState(currentUser?.timeZone ?? 'EST');
  
  // Portfolios
  const [github, setGithub] = useState(currentUser?.portfolio?.github ?? '');
  const [linkedin, setLinkedin] = useState(currentUser?.portfolio?.linkedin ?? '');
  const [behance, setBehance] = useState(currentUser?.portfolio?.behance ?? '');
  const [portfolioUrl, setPortfolioUrl] = useState(currentUser?.portfolio?.portfolioUrl ?? '');

  // Skills Offered & Wanted list
  const [skillsOffered, setSkillsOffered] = useState<Skill[]>(currentUser?.skillsOffered ?? []);
  const [skillsWanted, setSkillsWanted] = useState<Skill[]>(currentUser?.skillsWanted ?? []);

  // New Skill Add inputs
  const [newOfferName, setNewOfferName] = useState('');
  const [newOfferCat, setNewOfferCat] = useState(CATEGORIES[0]);
  const [newOfferLvl, setNewOfferLvl] = useState<'Beginner' | 'Intermediate' | 'Expert'>('Intermediate');

  const [newWantName, setNewWantName] = useState('');
  const [newWantCat, setNewWantCat] = useState(CATEGORIES[0]);
  const [newWantLvl, setNewWantLvl] = useState<'Beginner' | 'Intermediate' | 'Expert'>('Beginner');

  const [saveSuccess, setSaveSuccess] = useState(false);

  // Delete Account Modal State
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState('');
  const [deletePassword, setDeletePassword] = useState('');
  const [showDeletePassword, setShowDeletePassword] = useState(false);
  const [deleteError, setDeleteError] = useState('');
  const [isDeletingAccount, setIsDeletingAccount] = useState(false);

  const handleConfirmDeleteAccount = async () => {
    if (deleteConfirmText !== 'DELETE') {
      setDeleteError('Please type DELETE to confirm account deletion.');
      return;
    }
    if (!deletePassword) {
      setDeleteError('Please enter your current password to verify your identity.');
      return;
    }

    setDeleteError('');
    setIsDeletingAccount(true);

    if (onDeleteAccount) {
      const res = await onDeleteAccount(deletePassword);
      if (!res.success) {
        setDeleteError(res.error || 'Failed to delete account. Please check your password and try again.');
        setIsDeletingAccount(false);
      }
    } else {
      setDeleteError('Account deletion service is not configured.');
      setIsDeletingAccount(false);
    }
  };

  const handleToggleAvailability = (slot: 'Morning' | 'Afternoon' | 'Evening') => {
    if (availability.includes(slot)) {
      setAvailability(availability.filter(s => s !== slot));
    } else {
      setAvailability([...availability, slot]);
    }
  };

  const handleAddOfferedSkill = () => {
    if (!newOfferName.trim()) return;
    setSkillsOffered([
      ...skillsOffered, 
      { name: newOfferName.trim(), category: newOfferCat, level: newOfferLvl }
    ]);
    setNewOfferName('');
  };

  const handleRemoveOfferedSkill = (index: number) => {
    setSkillsOffered(skillsOffered.filter((_, idx) => idx !== index));
  };

  const handleAddWantedSkill = () => {
    if (!newWantName.trim()) return;
    setSkillsWanted([
      ...skillsWanted,
      { name: newWantName.trim(), category: newWantCat, level: newWantLvl }
    ]);
    setNewWantName('');
  };

  const handleRemoveWantedSkill = (index: number) => {
    setSkillsWanted(skillsWanted.filter((_, idx) => idx !== index));
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const updated: UserProfile = {
      ...currentUser,
      name,
      avatar,
      bio,
      education,
      experience,
      languages: languages.split(',').map(l => l.trim()).filter(Boolean),
      availability,
      skillLevel,
      timeZone,
      portfolio: {
        github: github.trim() || undefined,
        linkedin: linkedin.trim() || undefined,
        behance: behance.trim() || undefined,
        portfolioUrl: portfolioUrl.trim() || undefined,
      },
      skillsOffered,
      skillsWanted
    };

    onSaveProfile(updated);
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 3000);
  };

  return (
    <div id="profile-view-root" className="max-w-4xl mx-auto space-y-8 text-xs text-text-sub pb-12">
      {/* 🚀 Profile Identity Hero */}
      <div className="relative rounded-3xl bg-surface-raised border border-white/10 text-white p-6 sm:p-10 shadow-2xl overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-violet-600/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-1/4 w-80 h-80 bg-fuchsia-600/10 rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6 relative z-10">
          <div className="relative group">
            <img 
              src={avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&auto=format&fit=crop&q=80'} 
              alt={name} 
              referrerPolicy="no-referrer"
              className="w-24 h-24 sm:w-28 sm:h-28 rounded-3xl object-cover border-2 border-violet-500/40 shadow-xl"
            />
            <div className="absolute -bottom-2 -right-2 p-1.5 bg-violet-600 border-2 border-surface-base rounded-xl text-white shadow-md">
              <Award className="w-4 h-4" />
            </div>
          </div>

          <div className="space-y-2 flex-1">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/5 border border-white/10 rounded-full text-xs font-bold uppercase tracking-widest text-lavender-300">
              <User className="w-3.5 h-3.5 text-violet-400" />
              <span>SkillSwap Identity</span>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <h1 className="text-2xl sm:text-4xl font-black text-white tracking-tight font-display">
                {name || 'Swapper Profile'}
              </h1>
              <span className="px-2.5 py-0.5 bg-violet-500/20 text-lavender-300 border border-violet-500/30 rounded-full text-xs font-bold">
                {skillLevel}
              </span>
            </div>

            <p className="text-text-sub text-xs sm:text-sm max-w-2xl leading-relaxed">
              {bio || 'Passionate skill exchanger building collaborative mastery.'}
            </p>
          </div>
        </div>

        {/* Key Stats Bar */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 pt-6 mt-6 border-t border-white/10 relative z-10">
          <div className="p-3 bg-surface-base/80 rounded-2xl border border-white/5 text-center">
            <span className="text-[10px] text-text-dim uppercase font-bold block">Exchanges</span>
            <span className="text-lg font-black text-white">{currentUser.successfulExchanges ?? 0}</span>
          </div>

          <div className="p-3 bg-surface-base/80 rounded-2xl border border-white/5 text-center">
            <span className="text-[10px] text-text-dim uppercase font-bold block">Rating</span>
            <span className="text-lg font-black text-amber-300 flex items-center justify-center gap-1">
              <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
              {currentUser.rating?.toFixed(1) || '5.0'}
            </span>
          </div>

          <div className="p-3 bg-surface-base/80 rounded-2xl border border-white/5 text-center">
            <span className="text-[10px] text-text-dim uppercase font-bold block">Hours</span>
            <span className="text-lg font-black text-violet-300">~{((currentUser.successfulExchanges ?? 0) * 1.5).toFixed(0)}h</span>
          </div>

          <div className="p-3 bg-surface-base/80 rounded-2xl border border-white/5 text-center">
            <span className="text-[10px] text-text-dim uppercase font-bold block">Streak</span>
            <span className="text-lg font-black text-orange-400">{currentUser.loginStreak ?? 1}d 🔥</span>
          </div>

          <div className="p-3 bg-surface-base/80 rounded-2xl border border-white/5 text-center col-span-2 sm:col-span-1">
            <span className="text-[10px] text-text-dim uppercase font-bold block">Credits</span>
            <span className="text-lg font-black text-emerald-400">{currentUser.credits ?? 100}</span>
          </div>
        </div>
      </div>

      <form onSubmit={handleFormSubmit} className="space-y-6">
        
        {/* Core Profile Card */}
        <div className="bg-surface-base rounded-3xl border border-white/10 shadow-xl p-6 sm:p-8 space-y-6">
          <h3 className="text-sm font-bold text-white border-b border-white/10 pb-3 flex items-center gap-2">
            <User className="w-4 h-4 text-violet-400" />
            General Personal Details
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div>
              <label className="block font-semibold text-text-sub mb-1.5">Full Name</label>
              <input 
                type="text" 
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full bg-surface-raised border border-white/10 text-white rounded-xl p-3 text-xs focus:outline-none focus:ring-2 focus:ring-violet-500"
              />
            </div>

            <div>
              <label className="block font-semibold text-text-sub mb-1.5">Avatar Image URL</label>
              <input 
                type="url" 
                required
                value={avatar}
                onChange={(e) => setAvatar(e.target.value)}
                className="w-full bg-surface-raised border border-white/10 text-white rounded-xl p-3 text-xs focus:outline-none focus:ring-2 focus:ring-violet-500"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block font-semibold text-text-sub mb-1.5">Short Introduction Bio</label>
              <textarea 
                rows={3}
                required
                placeholder="Give a friendly summary of your experience, what you teach, and how you want to learn..."
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                className="w-full bg-surface-raised border border-white/10 text-white rounded-xl p-3 text-xs focus:outline-none focus:ring-2 focus:ring-violet-500 placeholder:text-text-muted"
              />
            </div>

            <div>
              <label className="block font-semibold text-text-sub mb-1.5">Education (Degrees, schools)</label>
              <input 
                type="text" 
                placeholder="e.g. M.S. in Computer Science, NYU"
                value={education}
                onChange={(e) => setEducation(e.target.value)}
                className="w-full bg-surface-raised border border-white/10 text-white rounded-xl p-3 text-xs focus:outline-none focus:ring-2 focus:ring-violet-500 placeholder:text-text-muted"
              />
            </div>

            <div>
              <label className="block font-semibold text-text-sub mb-1.5">Experience (Work experience, jobs)</label>
              <input 
                type="text" 
                placeholder="e.g. Lead Designer at CreativeCorp, 5 yrs"
                value={experience}
                onChange={(e) => setExperience(e.target.value)}
                className="w-full bg-surface-raised border border-white/10 text-white rounded-xl p-3 text-xs focus:outline-none focus:ring-2 focus:ring-violet-500 placeholder:text-text-muted"
              />
            </div>

            <div>
              <label className="block font-semibold text-text-sub mb-1.5">Languages Spoken (comma separated)</label>
              <input 
                type="text" 
                required
                placeholder="e.g. English, Spanish, French"
                value={languages}
                onChange={(e) => setLanguages(e.target.value)}
                className="w-full bg-surface-raised border border-white/10 text-white rounded-xl p-3 text-xs focus:outline-none focus:ring-2 focus:ring-violet-500 placeholder:text-text-muted"
              />
            </div>

            <div>
              <label className="block font-semibold text-text-sub mb-1.5">Time Zone abbreviation</label>
              <input 
                type="text" 
                required
                placeholder="e.g. EST, PST, GMT, IST"
                value={timeZone}
                onChange={(e) => setTimeZone(e.target.value)}
                className="w-full bg-surface-raised border border-white/10 text-white rounded-xl p-3 text-xs focus:outline-none focus:ring-2 focus:ring-violet-500 placeholder:text-text-muted"
              />
            </div>
          </div>
        </div>

        {/* Level and Availability Preferences */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          
          {/* Availability Card */}
          <div className="bg-surface-base rounded-3xl border border-white/10 shadow-xl p-6 space-y-4">
            <h3 className="text-sm font-bold text-white border-b border-white/10 pb-3 flex items-center gap-2">
              <Clock className="w-4 h-4 text-emerald-400" />
              Availability Preference
            </h3>

            <div className="space-y-3">
              <p className="text-text-sub text-xs">Choose which general parts of the day swappers can schedule sessions with you:</p>
              <div className="flex flex-col gap-2">
                {(['Morning', 'Afternoon', 'Evening'] as const).map(slot => (
                  <label key={slot} className="flex items-center gap-2.5 p-3 bg-surface-raised border border-white/10 rounded-xl hover:bg-surface-interactive cursor-pointer transition">
                    <input 
                      type="checkbox"
                      checked={availability.includes(slot)}
                      onChange={() => handleToggleAvailability(slot)}
                      className="rounded border-white/20 bg-surface-base text-violet-500 focus:ring-violet-500 w-4 h-4 cursor-pointer"
                    />
                    <span className="font-bold text-text-main text-xs">{slot} Availability</span>
                  </label>
                ))}
              </div>
            </div>
          </div>

          {/* Expert Levels */}
          <div className="bg-surface-base rounded-3xl border border-white/10 shadow-xl p-6 space-y-4">
            <h3 className="text-sm font-bold text-white border-b border-white/10 pb-3 flex items-center gap-2">
              <Award className="w-4 h-4 text-amber-400" />
              General Experience Level
            </h3>

            <div className="space-y-3">
              <p className="text-text-sub text-xs">How do you classify your general competency across your listed skill sets?</p>
              <div className="grid grid-cols-3 gap-2">
                {(['Beginner', 'Intermediate', 'Expert'] as const).map(lvl => (
                  <button
                    key={lvl}
                    type="button"
                    onClick={() => setSkillLevel(lvl)}
                    className={`py-3 border rounded-xl text-xs font-bold transition cursor-pointer ${
                      skillLevel === lvl 
                        ? 'bg-violet-600 border-violet-500 text-white shadow-lg shadow-violet-500/25' 
                        : 'bg-surface-raised border-white/10 hover:border-white/20 text-text-sub hover:text-white'
                    }`}
                  >
                    {lvl}
                  </button>
                ))}
              </div>
            </div>
          </div>

        </div>

        {/* Portfolio links */}
        <div className="bg-surface-base rounded-3xl border border-white/10 shadow-xl p-6 space-y-4">
          <h3 className="text-sm font-bold text-white border-b border-white/10 pb-3 flex items-center gap-2">
            <LinkIcon className="w-4 h-4 text-violet-400" />
            Socials & Professional Portfolio URLs
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block font-semibold text-text-sub mb-1.5">GitHub Profile URL</label>
              <input 
                type="url" 
                placeholder="https://github.com/your-username"
                value={github}
                onChange={(e) => setGithub(e.target.value)}
                className="w-full bg-surface-raised border border-white/10 text-white rounded-xl p-3 text-xs focus:outline-none focus:ring-2 focus:ring-violet-500 placeholder:text-text-muted"
              />
            </div>

            <div>
              <label className="block font-semibold text-text-sub mb-1.5">LinkedIn Profile URL</label>
              <input 
                type="url" 
                placeholder="https://linkedin.com/in/your-username"
                value={linkedin}
                onChange={(e) => setLinkedin(e.target.value)}
                className="w-full bg-surface-raised border border-white/10 text-white rounded-xl p-3 text-xs focus:outline-none focus:ring-2 focus:ring-violet-500 placeholder:text-text-muted"
              />
            </div>

            <div>
              <label className="block font-semibold text-text-sub mb-1.5">Behance / Dribbble Profile URL</label>
              <input 
                type="url" 
                placeholder="https://behance.net/your-username"
                value={behance}
                onChange={(e) => setBehance(e.target.value)}
                className="w-full bg-surface-raised border border-white/10 text-white rounded-xl p-3 text-xs focus:outline-none focus:ring-2 focus:ring-violet-500 placeholder:text-text-muted"
              />
            </div>

            <div>
              <label className="block font-semibold text-text-sub mb-1.5">Personal Portfolio/Website URL</label>
              <input 
                type="url" 
                placeholder="https://yourwebsite.com"
                value={portfolioUrl}
                onChange={(e) => setPortfolioUrl(e.target.value)}
                className="w-full bg-surface-raised border border-white/10 text-white rounded-xl p-3 text-xs focus:outline-none focus:ring-2 focus:ring-violet-500 placeholder:text-text-muted"
              />
            </div>
          </div>
        </div>

        {/* Skills Directory Manager */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          
          {/* Skills Offered Manager */}
          <div className="bg-surface-base rounded-3xl border border-white/10 shadow-xl p-6 space-y-4">
            <h3 className="text-sm font-bold text-white border-b border-white/10 pb-3 flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-violet-400" />
              Manage Skills Offered (Teaches)
            </h3>

            <div className="space-y-3">
              {/* Add form */}
              <div className="bg-surface-raised p-4 rounded-2xl border border-white/10 space-y-3">
                <p className="font-bold text-white">Add a teaching skill</p>
                <div className="space-y-2.5">
                  <input 
                    type="text" 
                    placeholder="e.g. React Frontend Development"
                    value={newOfferName}
                    onChange={(e) => setNewOfferName(e.target.value)}
                    className="w-full bg-surface-base border border-white/10 text-white rounded-xl p-2.5 text-xs focus:outline-none focus:ring-2 focus:ring-violet-500 placeholder:text-text-muted"
                  />
                  
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <select 
                      value={newOfferCat} 
                      onChange={(e) => setNewOfferCat(e.target.value)}
                      className="bg-surface-base border border-white/10 text-white rounded-xl p-2.5 focus:outline-none"
                    >
                      {CATEGORIES.map(c => (
                        <option key={c} value={c}>{c}</option>
                      ))}
                    </select>

                    <select 
                      value={newOfferLvl} 
                      onChange={(e) => setNewOfferLvl(e.target.value as any)}
                      className="bg-surface-base border border-white/10 text-white rounded-xl p-2.5 focus:outline-none font-bold"
                    >
                      <option value="Beginner">Beginner</option>
                      <option value="Intermediate">Intermediate</option>
                      <option value="Expert">Expert</option>
                    </select>
                  </div>

                  <button
                    type="button"
                    onClick={handleAddOfferedSkill}
                    className="w-full bg-violet-600 hover:bg-violet-500 text-white rounded-xl py-2.5 font-bold flex items-center justify-center gap-1.5 text-xs transition cursor-pointer border-0 shadow-md shadow-violet-500/20"
                  >
                    <Plus className="w-3.5 h-3.5" /> Add Skill
                  </button>
                </div>
              </div>

              {/* Skills List */}
              <div className="space-y-2">
                {skillsOffered.length === 0 ? (
                  <p className="text-text-muted italic text-center py-4">No skills listed yet.</p>
                ) : (
                  skillsOffered.map((sk, index) => (
                    <div key={index} className="flex items-center justify-between p-3.5 bg-surface-raised border border-white/5 rounded-xl">
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="font-bold text-white">{sk.name}</p>
                          <VerifiedSkillBadge teacherId={currentUser.id} skillName={sk.name} allReviews={allReviews} />
                        </div>
                        <p className="text-[11px] text-text-sub mt-0.5">{sk.category} • {sk.level}</p>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleRemoveOfferedSkill(index)}
                        className="text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 p-1.5 rounded-lg transition border-0 cursor-pointer"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

          {/* Skills Wanted Manager */}
          <div className="bg-surface-base rounded-3xl border border-white/10 shadow-xl p-6 space-y-4">
            <h3 className="text-sm font-bold text-white border-b border-white/10 pb-3 flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-lavender-300" />
              Manage Skills Wanted (Wants)
            </h3>

            <div className="space-y-3">
              {/* Add form */}
              <div className="bg-surface-raised p-4 rounded-2xl border border-white/10 space-y-3">
                <p className="font-bold text-white">Add a learning goal</p>
                <div className="space-y-2.5">
                  <input 
                    type="text" 
                    placeholder="e.g. Spanish Conversation"
                    value={newWantName}
                    onChange={(e) => setNewWantName(e.target.value)}
                    className="w-full bg-surface-base border border-white/10 text-white rounded-xl p-2.5 text-xs focus:outline-none focus:ring-2 focus:ring-violet-500 placeholder:text-text-muted"
                  />
                  
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <select 
                      value={newWantCat} 
                      onChange={(e) => setNewWantCat(e.target.value)}
                      className="bg-surface-base border border-white/10 text-white rounded-xl p-2.5 focus:outline-none"
                    >
                      {CATEGORIES.map(c => (
                        <option key={c} value={c}>{c}</option>
                      ))}
                    </select>

                    <select 
                      value={newWantLvl} 
                      onChange={(e) => setNewWantLvl(e.target.value as any)}
                      className="bg-surface-base border border-white/10 text-white rounded-xl p-2.5 focus:outline-none font-bold"
                    >
                      <option value="Beginner">Beginner</option>
                      <option value="Intermediate">Intermediate</option>
                      <option value="Expert">Expert</option>
                    </select>
                  </div>

                  <button
                    type="button"
                    onClick={handleAddWantedSkill}
                    className="w-full bg-surface-interactive hover:bg-white/15 text-white border border-white/15 rounded-xl py-2.5 font-bold flex items-center justify-center gap-1.5 text-xs transition cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" /> Add Goal
                  </button>
                </div>
              </div>

              {/* Skills List */}
              <div className="space-y-2">
                {skillsWanted.length === 0 ? (
                  <p className="text-text-muted italic text-center py-4">No learning goals listed yet.</p>
                ) : (
                  skillsWanted.map((sk, index) => (
                    <div key={index} className="flex items-center justify-between p-3.5 bg-surface-raised border border-white/5 rounded-xl">
                      <div>
                        <p className="font-bold text-white">{sk.name}</p>
                        <p className="text-[11px] text-text-sub mt-0.5">{sk.category} • {sk.level}</p>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleRemoveWantedSkill(index)}
                        className="text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 p-1.5 rounded-lg transition border-0 cursor-pointer"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

        </div>

        {/* Reviews Received Section */}
        <div className="bg-surface-base rounded-3xl border border-white/10 shadow-xl p-6 space-y-4">
          <div className="flex items-center justify-between border-b border-white/10 pb-3">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Star className="w-4 h-4 text-amber-400 fill-amber-400" />
              Student Reviews & Ratings Received ({allReviews.filter(r => r.teacherId === currentUser.id).length})
            </h3>
            <span className="text-xs font-bold text-amber-300 bg-amber-500/10 border border-amber-500/20 px-2.5 py-1 rounded-lg flex items-center gap-1">
              ★ {currentUser.rating?.toFixed(1) || '5.0'} Aggregate Rating
            </span>
          </div>

          {(() => {
            const userReviews = allReviews
              .filter(r => r.teacherId === currentUser.id)
              .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

            if (userReviews.length === 0) {
              return (
                <EmptyState
                  preset="certificates"
                  title="No Student Reviews Yet"
                  description="Complete skill-swap barter sessions with peers to receive verified feedback, star ratings, and testimonials!"
                />
              );
            }

            return (
              <div className="space-y-3 max-h-72 overflow-y-auto pr-1">
                {userReviews.map((rev) => (
                  <div key={rev.id} className="p-4 bg-surface-raised border border-white/5 rounded-2xl text-xs space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-white">{rev.learnerName}</span>
                        {rev.skillName && (
                          <span className="px-2 py-0.5 bg-violet-500/20 text-lavender-300 border border-violet-500/30 rounded-md font-semibold text-[10px]">
                            {rev.skillName}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-1.5">
                        <div className="flex items-center text-amber-400">
                          {Array.from({ length: 5 }).map((_, i) => (
                            <Star
                              key={i}
                              className={`w-3.5 h-3.5 ${i < rev.rating ? 'fill-amber-400 text-amber-400' : 'text-zinc-700'}`}
                            />
                          ))}
                        </div>
                        <span className="text-[10px] text-text-dim ml-1">
                          {new Date(rev.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                    <p className="text-text-sub italic leading-relaxed">{rev.comment || 'No written feedback provided.'}</p>
                  </div>
                ))}
              </div>
            );
          })()}
        </div>

        {/* Submit Actions */}
        <div className="flex flex-wrap items-center justify-between gap-4 pt-6 border-t border-white/10">
          <div>
            {onLogout && (
              <button
                type="button"
                onClick={onLogout}
                className="px-4 py-2.5 bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 border border-rose-500/20 rounded-xl font-bold text-xs transition flex items-center gap-1.5 cursor-pointer"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Log Out of Account</span>
              </button>
            )}
          </div>
          <div className="flex items-center gap-3">
            {saveSuccess && (
              <span className="flex items-center gap-1 text-emerald-400 font-bold text-xs">
                <Check className="w-4 h-4 text-emerald-400 stroke-[3]" /> Saved successfully!
              </span>
            )}
            <button
              type="submit"
              disabled={isSaving}
              className="px-6 py-3 bg-violet-600 hover:bg-violet-500 text-white rounded-xl font-bold shadow-lg shadow-violet-500/25 transition flex items-center gap-2 cursor-pointer border-0 disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              {isSaving ? 'Saving...' : 'Save Profile Changes'}
            </button>
          </div>
        </div>

      </form>

      {/* Danger Zone Section */}
      <div className="mt-10 pt-6 border-t border-white/10">
        <div className="bg-rose-500/10 border border-rose-500/20 rounded-3xl p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <h4 className="text-sm font-bold text-rose-300 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-rose-400" />
              Danger Zone
            </h4>
            <p className="text-xs text-rose-300/80">
              Permanently delete your account and all associated bookings, notifications, and profile data.
            </p>
          </div>
          <button
            type="button"
            onClick={() => {
              setShowDeleteModal(true);
              setDeleteConfirmText('');
              setDeletePassword('');
              setDeleteError('');
            }}
            className="px-4 py-2.5 bg-rose-600 hover:bg-rose-500 text-white rounded-xl font-bold text-xs transition shadow-lg shadow-rose-950/40 flex items-center gap-1.5 cursor-pointer border-0 shrink-0"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Delete Account</span>
          </button>
        </div>
      </div>

      {/* Delete Account Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-surface-base rounded-3xl max-w-md w-full p-6 sm:p-8 shadow-2xl border border-white/10 space-y-6">
            
            {/* Modal Header */}
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-rose-500/20 text-rose-400 border border-rose-500/30 rounded-2xl">
                  <Trash2 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">Delete Account</h3>
                  <p className="text-xs text-rose-400 font-semibold">This action cannot be undone</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  setShowDeleteModal(false);
                  setDeleteConfirmText('');
                  setDeletePassword('');
                  setDeleteError('');
                }}
                className="text-text-dim hover:text-white p-1 rounded-lg border-0 bg-transparent cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Warning Text */}
            <div className="p-4 bg-rose-500/10 border border-rose-500/20 rounded-2xl text-xs text-rose-200 space-y-1.5">
              <p className="font-bold flex items-center gap-1.5 text-rose-300">
                <AlertTriangle className="w-4 h-4 shrink-0 text-rose-400" />
                Permanent Data Removal
              </p>
              <p className="leading-relaxed text-text-sub">
                Deleting your account will permanently wipe your profile, cancel pending bookings, delete notifications, and remove your chat history.
              </p>
            </div>

            {/* Error Message */}
            {deleteError && (
              <div className="p-3 bg-amber-500/10 border border-amber-500/20 text-amber-300 rounded-2xl text-xs flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                <span className="leading-snug">{deleteError}</span>
              </div>
            )}

            {/* Confirmation Inputs */}
            <div className="space-y-4">
              {/* Type DELETE field */}
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-text-sub">
                  To confirm, type <span className="text-rose-400 font-mono bg-rose-500/10 px-1.5 py-0.5 rounded border border-rose-500/20">DELETE</span>:
                </label>
                <input
                  type="text"
                  value={deleteConfirmText}
                  onChange={(e) => setDeleteConfirmText(e.target.value)}
                  placeholder="Type DELETE"
                  className="w-full bg-surface-raised border border-white/10 text-white rounded-xl px-3.5 py-2.5 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-rose-500"
                />
              </div>

              {/* Password Field */}
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-text-sub">
                  Re-enter your current password:
                </label>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-3 w-3.5 h-3.5 text-text-dim" />
                  <input
                    type={showDeletePassword ? "text" : "password"}
                    value={deletePassword}
                    onChange={(e) => setDeletePassword(e.target.value)}
                    placeholder="Your current password"
                    className="w-full bg-surface-raised border border-white/10 text-white rounded-xl pl-10 pr-10 py-2.5 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-rose-500 placeholder:text-text-muted"
                  />
                  <button
                    type="button"
                    onClick={() => setShowDeletePassword(!showDeletePassword)}
                    className="absolute right-3.5 top-3 text-text-dim hover:text-white border-0 bg-transparent cursor-pointer p-0"
                    title={showDeletePassword ? "Hide password" : "Show password"}
                  >
                    {showDeletePassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => {
                  setShowDeleteModal(false);
                  setDeleteConfirmText('');
                  setDeletePassword('');
                  setDeleteError('');
                }}
                disabled={isDeletingAccount}
                className="px-4 py-2.5 bg-surface-raised hover:bg-surface-interactive text-text-sub text-xs font-bold rounded-xl transition cursor-pointer border border-white/10"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={deleteConfirmText !== 'DELETE' || !deletePassword || isDeletingAccount}
                onClick={handleConfirmDeleteAccount}
                className="px-5 py-2.5 bg-rose-600 hover:bg-rose-500 disabled:bg-surface-raised disabled:text-text-dim disabled:cursor-not-allowed text-white text-xs font-bold rounded-xl shadow-lg transition flex items-center gap-1.5 cursor-pointer border-0"
              >
                <Trash2 className="w-3.5 h-3.5" />
                {isDeletingAccount ? 'Deleting...' : 'Permanently Delete Account'}
              </button>
            </div>

          </div>
        </div>
      )}
    </div>
  );
}

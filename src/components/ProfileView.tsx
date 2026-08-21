import React, { useState, useRef, useEffect } from 'react';
import { 
  User, Mail, FileText, GraduationCap, Globe, Clock, Award, 
  Trash2, Plus, Save, BookOpen, Link as LinkIcon, AlertCircle, Check, LogOut,
  AlertTriangle, Lock, Eye, EyeOff, X, Star, Camera, Upload, Loader2, Image as ImageIcon
} from 'lucide-react';
import { UserProfile, Skill, Review } from '../types';
import { VerifiedSkillBadge } from './VerifiedSkillBadge';
import { EmptyState } from './ui';
import { supabase } from '../lib/supabase';

interface ProfileViewProps {
  currentUser: UserProfile;
  onSaveProfile: (updatedProfile: UserProfile) => void;
  isSaving: boolean;
  onLogout?: () => void;
  onDeleteAccount?: (password: string) => Promise<{ success: boolean; error?: string }>;
  allReviews?: Review[];
}

const AVATAR_PRESETS = [
  'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=150&h=150&q=80',
  'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=150&h=150&q=80',
  'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?auto=format&fit=crop&w=150&h=150&q=80',
  'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=150&h=150&q=80',
  'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=150&h=150&q=80',
  'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&h=150&q=80'
];

const CATEGORIES = [
  'Programming', 'Graphic Design', 'Video Editing', 'Digital Marketing',
  'Photography', 'Music', 'Fitness', 'Cooking', 'Language Learning',
  'Public Speaking', 'Business'
];

const ProfileView = React.memo(function ProfileView({ currentUser, onSaveProfile, isSaving, onLogout, onDeleteAccount, allReviews = [] }: ProfileViewProps) {
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
  
  // Avatar upload state
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const [avatarUploadError, setAvatarUploadError] = useState<string | null>(null);
  const [avatarUploadSuccess, setAvatarUploadSuccess] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Sync state if currentUser changes from outside
  useEffect(() => {
    if (currentUser?.avatar && currentUser.avatar !== avatar && !isUploadingAvatar) {
      setAvatar(currentUser.avatar);
    }
  }, [currentUser?.avatar]);
  
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

  const handleAvatarFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Reset file input so re-selecting same file triggers onChange
    e.target.value = '';

    setAvatarUploadError(null);
    setAvatarUploadSuccess(false);

    // 2. Client-side validation
    if (!file.type.startsWith('image/')) {
      setAvatarUploadError('Please select a valid image file (PNG, JPEG, WebP, GIF, etc.).');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setAvatarUploadError('Avatar image must be under 5MB.');
      return;
    }

    if (!currentUser?.id) {
      setAvatarUploadError('User authentication session not found. Please log in.');
      return;
    }

    // 3. Optimistic preview
    const previousAvatar = avatar;
    const previewUrl = URL.createObjectURL(file);
    setAvatar(previewUrl);
    setIsUploadingAvatar(true);

    try {
      // a. Generate unique filename inside user's folder: {user_id}/{timestamp}-{cleanName}
      const cleanName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
      const filePath = `${currentUser.id}/${Date.now()}-${cleanName}`;

      // b. Upload via Supabase storage
      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, file, {
          upsert: true,
          contentType: file.type
        });

      if (uploadError) {
        throw uploadError;
      }

      // c. Get public URL
      const { data: urlData } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath);

      const publicUrl = urlData.publicUrl;

      // Clean up object URL and set real public URL
      URL.revokeObjectURL(previewUrl);
      setAvatar(publicUrl);

      // d. Save to user profile via existing onSaveProfile flow
      const updatedProfile: UserProfile = {
        ...currentUser,
        name,
        avatar: publicUrl,
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

      onSaveProfile(updatedProfile);
      setAvatarUploadSuccess(true);
      setTimeout(() => setAvatarUploadSuccess(false), 4000);

      // 4. Best-effort cleanup of old avatar file if previously uploaded to 'avatars' bucket
      const oldAvatarUrl = currentUser.avatar;
      if (oldAvatarUrl && (oldAvatarUrl.includes('/avatars/') || oldAvatarUrl.includes('avatars'))) {
        try {
          const marker = '/avatars/';
          const idx = oldAvatarUrl.indexOf(marker);
          if (idx !== -1) {
            const oldFilePath = decodeURIComponent(oldAvatarUrl.substring(idx + marker.length).split('?')[0]);
            if (oldFilePath && oldFilePath.startsWith(`${currentUser.id}/`)) {
              await supabase.storage.from('avatars').remove([oldFilePath]);
            }
          }
        } catch (cleanupErr) {
          console.warn('Failed to cleanup old avatar from storage:', cleanupErr);
        }
      }
    } catch (err: any) {
      console.error('Failed to upload avatar:', err);
      URL.revokeObjectURL(previewUrl);
      setAvatar(previousAvatar);
      setAvatarUploadError(err.message || 'Failed to upload avatar image. Please try again.');
    } finally {
      setIsUploadingAvatar(false);
    }
  };

  const handleSelectPresetAvatar = (presetUrl: string) => {
    setAvatar(presetUrl);
    setAvatarUploadError(null);
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
      {/* Hidden File Input for Avatar Upload */}
      <input 
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleAvatarFileSelect}
        className="hidden"
      />

      {/* 🚀 Profile Identity Hero */}
      <div className="relative rounded-3xl bg-surface-raised border border-white/10 text-white p-6 sm:p-10 shadow-2xl overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-violet-600/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-1/4 w-80 h-80 bg-fuchsia-600/10 rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6 relative z-10">
          <div className="relative group">
            <div className="relative w-24 h-24 sm:w-28 sm:h-28 rounded-3xl overflow-hidden border-2 border-violet-500/40 shadow-xl bg-surface-base">
              <img 
                src={avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&auto=format&fit=crop&q=80'} 
                alt={name} 
                referrerPolicy="no-referrer"
                className="w-full h-full object-cover"
              />
              {isUploadingAvatar && (
                <div className="absolute inset-0 bg-black/75 backdrop-blur-xs flex flex-col items-center justify-center text-white gap-1 z-20">
                  <Loader2 className="w-6 h-6 animate-spin text-violet-400" />
                  <span className="text-[10px] font-bold text-violet-200">Uploading...</span>
                </div>
              )}
              {!isUploadingAvatar && (
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isSaving}
                  title="Change Avatar Photo"
                  className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center text-white gap-1 cursor-pointer border-0 z-10"
                >
                  <Camera className="w-5 h-5 text-violet-300" />
                  <span className="text-[10px] font-bold text-violet-100">Change</span>
                </button>
              )}
            </div>
            <div className="absolute -bottom-2 -right-2 p-1.5 bg-violet-600 border-2 border-surface-base rounded-xl text-white shadow-md z-20">
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
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={isUploadingAvatar || isSaving}
                className="inline-flex items-center gap-1.5 px-3 py-1 bg-white/10 hover:bg-white/20 text-white rounded-full text-xs font-medium transition cursor-pointer border border-white/15 disabled:opacity-50"
              >
                {isUploadingAvatar ? (
                  <>
                    <Loader2 className="w-3 h-3 animate-spin" />
                    <span>Uploading Avatar...</span>
                  </>
                ) : (
                  <>
                    <Upload className="w-3 h-3 text-violet-300" />
                    <span>Change Avatar</span>
                  </>
                )}
              </button>
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

            {/* Profile Avatar Upload & Selection Card */}
            <div className="md:col-span-2 p-4 sm:p-5 bg-surface-raised border border-white/10 rounded-2xl space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="relative w-12 h-12 rounded-2xl overflow-hidden border border-violet-500/40 shrink-0 bg-surface-base">
                    <img 
                      src={avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&auto=format&fit=crop&q=80'} 
                      alt="Avatar preview" 
                      className="w-full h-full object-cover"
                    />
                    {isUploadingAvatar && (
                      <div className="absolute inset-0 bg-black/75 flex items-center justify-center">
                        <Loader2 className="w-4 h-4 animate-spin text-violet-400" />
                      </div>
                    )}
                  </div>
                  <div>
                    <label className="block font-bold text-white text-xs">Profile Avatar</label>
                    <p className="text-[11px] text-text-sub">Upload a custom image (PNG, JPG, WebP under 5MB) or choose from presets.</p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isUploadingAvatar || isSaving}
                  className="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-violet-600 hover:bg-violet-500 disabled:opacity-50 text-white font-bold rounded-xl text-xs shadow-lg shadow-violet-600/20 transition cursor-pointer border-0 shrink-0"
                >
                  {isUploadingAvatar ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Uploading...</span>
                    </>
                  ) : (
                    <>
                      <Upload className="w-3.5 h-3.5" />
                      <span>Upload Avatar</span>
                    </>
                  )}
                </button>
              </div>

              {avatarUploadError && (
                <div className="p-3 bg-rose-500/10 border border-rose-500/20 rounded-xl flex items-center gap-2 text-xs text-rose-300">
                  <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
                  <span>{avatarUploadError}</span>
                </div>
              )}

              {avatarUploadSuccess && (
                <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl flex items-center gap-2 text-xs text-emerald-300">
                  <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>Avatar photo uploaded and profile saved successfully!</span>
                </div>
              )}

              {/* Preset Avatars */}
              <div className="space-y-2 pt-2 border-t border-white/5">
                <span className="text-[11px] font-semibold text-text-muted block">Or choose a preset avatar:</span>
                <div className="flex flex-wrap items-center gap-2.5">
                  {AVATAR_PRESETS.map((presetUrl, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => handleSelectPresetAvatar(presetUrl)}
                      className={`relative w-10 h-10 rounded-xl overflow-hidden border-2 transition cursor-pointer p-0 bg-surface-base ${
                        avatar === presetUrl 
                          ? 'border-violet-500 ring-2 ring-violet-500/40 scale-105' 
                          : 'border-white/10 hover:border-white/30 opacity-75 hover:opacity-100'
                      }`}
                    >
                      <img src={presetUrl} alt={`Preset ${idx + 1}`} className="w-full h-full object-cover" />
                      {avatar === presetUrl && (
                        <div className="absolute inset-0 bg-violet-600/30 flex items-center justify-center">
                          <Check className="w-3.5 h-3.5 text-white stroke-[3]" />
                        </div>
                      )}
                    </button>
                  ))}
                </div>
              </div>

              {/* Direct URL input */}
              <div className="pt-2 border-t border-white/5">
                <label className="block text-[11px] font-semibold text-text-muted mb-1">Avatar Image URL (optional direct link):</label>
                <input 
                  type="url" 
                  required
                  value={avatar}
                  onChange={(e) => {
                    setAvatar(e.target.value);
                    setAvatarUploadError(null);
                  }}
                  placeholder="https://..."
                  className="w-full bg-surface-base border border-white/10 text-white rounded-xl p-2.5 text-xs focus:outline-none focus:ring-2 focus:ring-violet-500 placeholder:text-text-muted"
                />
              </div>
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
});

export default ProfileView;

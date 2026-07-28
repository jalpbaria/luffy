import React, { useState } from 'react';
import { 
  User, Mail, FileText, GraduationCap, Globe, Clock, Award, 
  Trash2, Plus, Save, BookOpen, Link as LinkIcon, AlertCircle, Check, LogOut,
  AlertTriangle, Lock, Eye, EyeOff, X
} from 'lucide-react';
import { UserProfile, Skill, Review } from '../types';
import { VerifiedSkillBadge } from './VerifiedSkillBadge';

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
    <div id="profile-view-root" className="max-w-4xl mx-auto space-y-6 text-xs text-slate-700">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-serif font-semibold tracking-tight text-slate-900">Manage Swap Profile</h1>
          <p className="text-slate-500 mt-1 text-sm">Refine your profile to get discovered and get more matching swap requests.</p>
        </div>
      </div>

      <form onSubmit={handleFormSubmit} className="space-y-6">
        
        {/* Core Profile Card */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 space-y-5">
          <h3 className="text-sm font-semibold text-slate-800 border-b border-slate-100 pb-2 flex items-center gap-2">
            <User className="w-4 h-4 text-indigo-500" />
            General Personal Details
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block font-semibold text-slate-600 mb-1">Full Name</label>
              <input 
                type="text" 
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full border border-slate-200 rounded-lg p-2.5 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-600 mb-1">Avatar Image URL</label>
              <input 
                type="url" 
                required
                value={avatar}
                onChange={(e) => setAvatar(e.target.value)}
                className="w-full border border-slate-200 rounded-lg p-2.5 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block font-semibold text-slate-600 mb-1">Short Introduction Bio</label>
              <textarea 
                rows={3}
                required
                placeholder="Give a friendly summary of your experience, what you teach, and how you want to learn..."
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                className="w-full border border-slate-200 rounded-lg p-2.5 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-600 mb-1">Education (Degrees, schools)</label>
              <input 
                type="text" 
                placeholder="e.g. M.S. in Computer Science, NYU"
                value={education}
                onChange={(e) => setEducation(e.target.value)}
                className="w-full border border-slate-200 rounded-lg p-2.5 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-600 mb-1">Experience (Work experience, jobs)</label>
              <input 
                type="text" 
                placeholder="e.g. Lead Designer at CreativeCorp, 5 yrs"
                value={experience}
                onChange={(e) => setExperience(e.target.value)}
                className="w-full border border-slate-200 rounded-lg p-2.5 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-600 mb-1">Languages Spoken (comma separated)</label>
              <input 
                type="text" 
                required
                placeholder="e.g. English, Spanish, French"
                value={languages}
                onChange={(e) => setLanguages(e.target.value)}
                className="w-full border border-slate-200 rounded-lg p-2.5 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-600 mb-1">Time Zone abbreviation</label>
              <input 
                type="text" 
                required
                placeholder="e.g. EST, PST, GMT, IST"
                value={timeZone}
                onChange={(e) => setTimeZone(e.target.value)}
                className="w-full border border-slate-200 rounded-lg p-2.5 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>
        </div>

        {/* Level and Availability Preferences */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          
          {/* Availability Card */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 space-y-4">
            <h3 className="text-sm font-semibold text-slate-800 border-b border-slate-100 pb-2 flex items-center gap-2">
              <Clock className="w-4 h-4 text-emerald-500" />
              Availability Preference
            </h3>

            <div className="space-y-3">
              <p className="text-slate-500 text-xs">Choose which general parts of the day swappers can schedule sessions with you:</p>
              <div className="flex flex-col gap-2">
                {(['Morning', 'Afternoon', 'Evening'] as const).map(slot => (
                  <label key={slot} className="flex items-center gap-2 p-2 border border-slate-100 rounded-lg hover:bg-slate-50 cursor-pointer">
                    <input 
                      type="checkbox"
                      checked={availability.includes(slot)}
                      onChange={() => handleToggleAvailability(slot)}
                      className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 w-4 h-4"
                    />
                    <span className="font-semibold text-slate-700 text-xs">{slot} Availability</span>
                  </label>
                ))}
              </div>
            </div>
          </div>

          {/* Expert Levels */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 space-y-4">
            <h3 className="text-sm font-semibold text-slate-800 border-b border-slate-100 pb-2 flex items-center gap-2">
              <Award className="w-4 h-4 text-amber-500" />
              General Experience Level
            </h3>

            <div className="space-y-3">
              <p className="text-slate-500 text-xs">How do you classify your general competency across your listed skill sets?</p>
              <div className="grid grid-cols-3 gap-2">
                {(['Beginner', 'Intermediate', 'Expert'] as const).map(lvl => (
                  <button
                    key={lvl}
                    type="button"
                    onClick={() => setSkillLevel(lvl)}
                    className={`py-3 border rounded-xl text-xs font-semibold transition ${
                      skillLevel === lvl 
                        ? 'bg-indigo-600 border-indigo-600 text-white shadow-sm' 
                        : 'bg-white border-slate-200 hover:border-slate-300 text-slate-700'
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
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 space-y-4">
          <h3 className="text-sm font-semibold text-slate-800 border-b border-slate-100 pb-2 flex items-center gap-2">
            <LinkIcon className="w-4 h-4 text-slate-500" />
            Socials & Professional Portfolio URLs
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block font-semibold text-slate-600 mb-1">GitHub Profile URL</label>
              <input 
                type="url" 
                placeholder="https://github.com/your-username"
                value={github}
                onChange={(e) => setGithub(e.target.value)}
                className="w-full border border-slate-200 rounded-lg p-2.5 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-600 mb-1">LinkedIn Profile URL</label>
              <input 
                type="url" 
                placeholder="https://linkedin.com/in/your-username"
                value={linkedin}
                onChange={(e) => setLinkedin(e.target.value)}
                className="w-full border border-slate-200 rounded-lg p-2.5 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-600 mb-1">Behance / Dribbble Profile URL</label>
              <input 
                type="url" 
                placeholder="https://behance.net/your-username"
                value={behance}
                onChange={(e) => setBehance(e.target.value)}
                className="w-full border border-slate-200 rounded-lg p-2.5 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-600 mb-1">Personal Portfolio/Website URL</label>
              <input 
                type="url" 
                placeholder="https://yourwebsite.com"
                value={portfolioUrl}
                onChange={(e) => setPortfolioUrl(e.target.value)}
                className="w-full border border-slate-200 rounded-lg p-2.5 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>
        </div>

        {/* Skills Directory Manager */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          
          {/* Skills Offered Manager */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 space-y-4">
            <h3 className="text-sm font-semibold text-slate-800 border-b border-slate-100 pb-2 flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-indigo-500" />
              Manage Skills Offered (Teaches)
            </h3>

            <div className="space-y-3">
              {/* Add form */}
              <div className="bg-slate-50 p-3 rounded-lg border border-slate-150 space-y-2">
                <p className="font-semibold text-slate-800">Add a teaching skill</p>
                <div className="space-y-2">
                  <input 
                    type="text" 
                    placeholder="e.g. React Frontend Development"
                    value={newOfferName}
                    onChange={(e) => setNewOfferName(e.target.value)}
                    className="w-full border border-slate-250 bg-white rounded p-2 focus:outline-none"
                  />
                  
                  <div className="grid grid-cols-2 gap-1.5 text-[10px]">
                    <select 
                      value={newOfferCat} 
                      onChange={(e) => setNewOfferCat(e.target.value)}
                      className="border border-slate-250 bg-white rounded p-2 focus:outline-none"
                    >
                      {CATEGORIES.map(c => (
                        <option key={c} value={c}>{c}</option>
                      ))}
                    </select>

                    <select 
                      value={newOfferLvl} 
                      onChange={(e) => setNewOfferLvl(e.target.value as any)}
                      className="border border-slate-250 bg-white rounded p-2 focus:outline-none font-bold"
                    >
                      <option value="Beginner">Beginner</option>
                      <option value="Intermediate">Intermediate</option>
                      <option value="Expert">Expert</option>
                    </select>
                  </div>

                  <button
                    type="button"
                    onClick={handleAddOfferedSkill}
                    className="w-full bg-indigo-600 hover:bg-indigo-700 text-white rounded py-2 font-bold flex items-center justify-center gap-1.5 text-xs transition"
                  >
                    <Plus className="w-3.5 h-3.5" /> Add Skill
                  </button>
                </div>
              </div>

              {/* Skills List */}
              <div className="space-y-1.5">
                {skillsOffered.length === 0 ? (
                  <p className="text-slate-400 italic text-center py-4">No skills listed yet.</p>
                ) : (
                  skillsOffered.map((sk, index) => (
                    <div key={index} className="flex items-center justify-between p-2.5 bg-slate-50 border border-slate-100 rounded-xl">
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="font-semibold text-slate-800">{sk.name}</p>
                          <VerifiedSkillBadge teacherId={currentUser.id} skillName={sk.name} allReviews={allReviews} />
                        </div>
                        <p className="text-[10px] text-slate-500 mt-0.5">{sk.category} • {sk.level}</p>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleRemoveOfferedSkill(index)}
                        className="text-rose-500 hover:text-rose-700 hover:bg-rose-50 p-1.5 rounded-lg transition"
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
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 space-y-4">
            <h3 className="text-sm font-semibold text-slate-800 border-b border-slate-100 pb-2 flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-amber-500" />
              Manage Skills Wanted (Wants)
            </h3>

            <div className="space-y-3">
              {/* Add form */}
              <div className="bg-slate-50 p-3 rounded-lg border border-slate-150 space-y-2">
                <p className="font-semibold text-slate-800">Add a learning goal</p>
                <div className="space-y-2">
                  <input 
                    type="text" 
                    placeholder="e.g. Spanish Conversation"
                    value={newWantName}
                    onChange={(e) => setNewWantName(e.target.value)}
                    className="w-full border border-slate-250 bg-white rounded p-2 focus:outline-none"
                  />
                  
                  <div className="grid grid-cols-2 gap-1.5 text-[10px]">
                    <select 
                      value={newWantCat} 
                      onChange={(e) => setNewWantCat(e.target.value)}
                      className="border border-slate-250 bg-white rounded p-2 focus:outline-none"
                    >
                      {CATEGORIES.map(c => (
                        <option key={c} value={c}>{c}</option>
                      ))}
                    </select>

                    <select 
                      value={newWantLvl} 
                      onChange={(e) => setNewWantLvl(e.target.value as any)}
                      className="border border-slate-250 bg-white rounded p-2 focus:outline-none font-bold"
                    >
                      <option value="Beginner">Beginner</option>
                      <option value="Intermediate">Intermediate</option>
                      <option value="Expert">Expert</option>
                    </select>
                  </div>

                  <button
                    type="button"
                    onClick={handleAddWantedSkill}
                    className="w-full bg-amber-600 hover:bg-amber-700 text-white rounded py-2 font-bold flex items-center justify-center gap-1.5 text-xs transition"
                  >
                    <Plus className="w-3.5 h-3.5" /> Add Goal
                  </button>
                </div>
              </div>

              {/* Skills List */}
              <div className="space-y-1.5">
                {skillsWanted.length === 0 ? (
                  <p className="text-slate-400 italic text-center py-4">No learning goals listed yet.</p>
                ) : (
                  skillsWanted.map((sk, index) => (
                    <div key={index} className="flex items-center justify-between p-2.5 bg-slate-50 border border-slate-100 rounded-xl">
                      <div>
                        <p className="font-semibold text-slate-800">{sk.name}</p>
                        <p className="text-[10px] text-slate-500 mt-0.5">{sk.category} • {sk.level}</p>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleRemoveWantedSkill(index)}
                        className="text-rose-500 hover:text-rose-700 hover:bg-rose-50 p-1.5 rounded-lg transition"
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

        {/* Submit Actions */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-4 border-t border-slate-200">
          <div>
            {onLogout && (
              <button
                type="button"
                onClick={onLogout}
                className="px-4 py-2 bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 rounded-lg font-semibold text-xs transition flex items-center gap-1.5 cursor-pointer"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Log Out of Account</span>
              </button>
            )}
          </div>
          <div className="flex items-center gap-3">
            {saveSuccess && (
              <span className="flex items-center gap-1 text-emerald-600 font-semibold text-xs">
                <Check className="w-4 h-4 text-emerald-500 stroke-[3]" /> Saved successfully!
              </span>
            )}
            <button
              type="submit"
              disabled={isSaving}
              className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-bold shadow-md transition flex items-center gap-2 cursor-pointer border-0"
            >
              <Save className="w-4 h-4" />
              {isSaving ? 'Saving...' : 'Save Profile Changes'}
            </button>
          </div>
        </div>

      </form>

      {/* Danger Zone Section */}
      <div className="mt-10 pt-6 border-t border-slate-200">
        <div className="bg-rose-50/70 border border-rose-200/90 rounded-2xl p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <h4 className="text-sm font-bold text-rose-900 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-rose-600" />
              Danger Zone
            </h4>
            <p className="text-xs text-rose-700">
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
            className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-lg font-bold text-xs transition shadow-sm flex items-center gap-1.5 cursor-pointer border-0 shrink-0"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Delete Account</span>
          </button>
        </div>
      </div>

      {/* Delete Account Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-5 animate-in fade-in zoom-in-95 duration-200">
            
            {/* Modal Header */}
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-rose-100 text-rose-600 rounded-xl">
                  <Trash2 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">Delete Account</h3>
                  <p className="text-xs text-rose-600 font-semibold">This action cannot be undone</p>
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
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg border-0 bg-transparent cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Warning Text */}
            <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-900 space-y-1.5">
              <p className="font-bold flex items-center gap-1.5">
                <AlertTriangle className="w-4 h-4 shrink-0 text-rose-600" />
                Permanent Data Removal
              </p>
              <p className="leading-relaxed text-rose-800">
                Deleting your account will permanently wipe your profile, cancel pending bookings, delete notifications, and remove your chat history.
              </p>
            </div>

            {/* Error Message */}
            {deleteError && (
              <div className="p-3 bg-amber-50 border border-amber-200 text-amber-900 rounded-xl text-xs flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <span className="leading-snug">{deleteError}</span>
              </div>
            )}

            {/* Confirmation Inputs */}
            <div className="space-y-3.5">
              {/* Type DELETE field */}
              <div className="space-y-1">
                <label className="block text-xs font-bold text-slate-700">
                  To confirm, type <span className="text-rose-600 font-mono bg-rose-50 px-1 py-0.5 rounded border border-rose-200">DELETE</span>:
                </label>
                <input
                  type="text"
                  value={deleteConfirmText}
                  onChange={(e) => setDeleteConfirmText(e.target.value)}
                  placeholder="Type DELETE"
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-rose-500"
                />
              </div>

              {/* Password Field */}
              <div className="space-y-1">
                <label className="block text-xs font-bold text-slate-700">
                  Re-enter your current password:
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-2.5 w-3.5 h-3.5 text-slate-400" />
                  <input
                    type={showDeletePassword ? "text" : "password"}
                    value={deletePassword}
                    onChange={(e) => setDeletePassword(e.target.value)}
                    placeholder="Your current password"
                    className="w-full bg-slate-50 border border-slate-300 rounded-lg pl-9 pr-9 py-2 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-rose-500"
                  />
                  <button
                    type="button"
                    onClick={() => setShowDeletePassword(!showDeletePassword)}
                    className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600 border-0 bg-transparent cursor-pointer p-0"
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
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-lg transition cursor-pointer border-0"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={deleteConfirmText !== 'DELETE' || !deletePassword || isDeletingAccount}
                onClick={handleConfirmDeleteAccount}
                className="px-5 py-2 bg-rose-600 hover:bg-rose-700 disabled:bg-slate-300 disabled:cursor-not-allowed text-white text-xs font-bold rounded-lg shadow-sm transition flex items-center gap-1.5 cursor-pointer border-0"
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

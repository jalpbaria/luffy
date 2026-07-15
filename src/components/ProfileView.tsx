import React, { useState } from 'react';
import { 
  User, Mail, FileText, GraduationCap, Globe, Clock, Award, 
  Trash2, Plus, Save, BookOpen, Link as LinkIcon, AlertCircle, Check
} from 'lucide-react';
import { UserProfile, Skill } from '../types';

interface ProfileViewProps {
  currentUser: UserProfile;
  onSaveProfile: (updatedProfile: UserProfile) => void;
  isSaving: boolean;
}

const CATEGORIES = [
  'Programming', 'Graphic Design', 'Video Editing', 'Digital Marketing',
  'Photography', 'Music', 'Fitness', 'Cooking', 'Language Learning',
  'Public Speaking', 'Business'
];

export default function ProfileView({ currentUser, onSaveProfile, isSaving }: ProfileViewProps) {
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
                        <p className="font-semibold text-slate-800">{sk.name}</p>
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
        <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200">
          {saveSuccess && (
            <span className="flex items-center gap-1 text-emerald-600 font-semibold text-xs">
              <Check className="w-4 h-4 text-emerald-500 stroke-[3]" /> Saved successfully!
            </span>
          )}
          <button
            type="submit"
            disabled={isSaving}
            className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-bold shadow-md transition flex items-center gap-2"
          >
            <Save className="w-4 h-4" />
            {isSaving ? 'Saving...' : 'Save Profile Changes'}
          </button>
        </div>

      </form>
    </div>
  );
}

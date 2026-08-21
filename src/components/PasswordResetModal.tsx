import React, { useState } from 'react';
import { AlertCircle, Check, Lock } from 'lucide-react';
import { supabase } from '../lib/supabase';

interface PasswordResetModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const PasswordResetModal: React.FC<PasswordResetModalProps> = React.memo(({ isOpen, onClose }) => {
  const [newPassword, setNewPassword] = useState('');
  const [resetError, setResetError] = useState('');
  const [resetSuccess, setResetSuccess] = useState('');
  const [isResetting, setIsResetting] = useState(false);

  if (!isOpen) return null;

  const handlePasswordUpdateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setResetError('');
    setResetSuccess('');
    setIsResetting(true);

    if (newPassword.length < 6) {
      setResetError('Password must be at least 6 characters long.');
      setIsResetting(false);
      return;
    }

    try {
      const { error } = await supabase.auth.updateUser({ password: newPassword });
      if (error) {
        setResetError(error.message);
      } else {
        setResetSuccess('Your password has been updated successfully!');
        setNewPassword('');
      }
    } catch (err: any) {
      setResetError(err.message || 'An error occurred. Please try again.');
    } finally {
      setIsResetting(false);
    }
  };

  const handleClose = () => {
    setNewPassword('');
    setResetError('');
    setResetSuccess('');
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center z-[100] p-4">
      <div className="bg-zinc-900 rounded-[24px] max-w-sm w-full p-6 shadow-2xl border border-zinc-800 flex flex-col gap-4 text-left">
        <div className="space-y-1">
          <h3 className="text-base font-bold text-white">Set New Password</h3>
          <p className="text-xs text-zinc-400">Please choose a secure new password for your account.</p>
        </div>

        {resetError && (
          <div className="p-3 bg-rose-500/10 text-rose-300 border border-rose-500/20 rounded-xl flex items-start gap-2.5 text-xs">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-400 mt-0.5" />
            <p>{resetError}</p>
          </div>
        )}

        {resetSuccess ? (
          <div className="space-y-4">
            <div className="p-3 bg-emerald-500/10 text-emerald-300 border border-emerald-500/20 rounded-xl flex items-start gap-2.5 text-xs">
              <Check className="w-4 h-4 shrink-0 text-emerald-400 mt-0.5" />
              <p>{resetSuccess}</p>
            </div>
            <button
              onClick={handleClose}
              className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold rounded-xl text-xs cursor-pointer border-0 shadow-lg shadow-indigo-600/20"
            >
              Close & Sign In
            </button>
          </div>
        ) : (
          <form onSubmit={handlePasswordUpdateSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-zinc-400 uppercase tracking-wider">New Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-2.5 w-4 h-4 text-zinc-500" />
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder:text-zinc-600 focus:outline-none focus:ring-2 focus:ring-indigo-500/40 focus:border-indigo-500"
                />
              </div>
            </div>

            <div className="flex gap-3">
              <button
                type="button"
                onClick={handleClose}
                className="flex-1 py-2.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-semibold rounded-xl text-xs cursor-pointer border-0"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isResetting}
                className="flex-1 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold rounded-xl text-xs cursor-pointer border-0 disabled:opacity-50 shadow-lg shadow-indigo-600/20"
              >
                {isResetting ? 'Saving...' : 'Update Password'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
});

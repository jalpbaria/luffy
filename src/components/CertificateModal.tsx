import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Certificate } from '../types';
import { Award, CheckCircle, Download, Share2, Sparkles, X, ShieldCheck } from 'lucide-react';
import { triggerCelebrationConfetti } from '../lib/gamification';

interface CertificateModalProps {
  certificate: Certificate | null;
  onClose: () => void;
}

export const CertificateModal: React.FC<CertificateModalProps> = ({ certificate, onClose }) => {
  if (!certificate) return null;

  const handleDownload = () => {
    triggerCelebrationConfetti();
    alert(`Downloading Official Skill Certificate: ${certificate.certificateCode}.pdf`);
  };

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: certificate.title,
        text: `I earned my verified certificate in ${certificate.skillName} on SkillSwap!`,
        url: window.location.href
      }).catch(() => {});
    } else {
      navigator.clipboard.writeText(window.location.href);
      alert('Certificate verification link copied to clipboard!');
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 z-50 overflow-y-auto">
        <motion.div
          initial={{ scale: 0.9, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.9, opacity: 0, y: 20 }}
          className="bg-white rounded-[32px] w-full max-w-2xl border border-amber-200 shadow-2xl overflow-hidden relative"
        >
          {/* Header Close Bar */}
          <div className="p-4 bg-slate-900 text-white flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-amber-400" />
              <span className="font-extrabold text-xs tracking-wider uppercase">Official Skill Certificate</span>
            </div>
            <button
              onClick={onClose}
              className="p-1 rounded-full hover:bg-slate-800 text-slate-400 hover:text-white transition cursor-pointer border-0"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Certificate Inner Frame */}
          <div className="p-8 sm:p-12 text-center bg-gradient-to-b from-amber-50/50 via-white to-amber-50/30 relative border-8 border-double border-amber-300 m-4 rounded-2xl shadow-inner">
            
            {/* Watermark Logo */}
            <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 opacity-[0.03] pointer-events-none">
              <Award className="w-80 h-80 text-amber-900" />
            </div>

            <div className="space-y-6 relative z-10">
              <div className="flex items-center justify-center gap-2">
                <div className="w-14 h-14 rounded-full bg-amber-100 border border-amber-300 flex items-center justify-center text-amber-600 shadow-md">
                  <Award className="w-8 h-8" />
                </div>
              </div>

              <div>
                <span className="text-xs font-bold tracking-widest uppercase text-amber-800 block">
                  SkillSwap Peer Academy
                </span>
                <h1 className="text-2xl sm:text-3xl font-black text-slate-900 mt-1 font-serif">
                  Certificate of Peer Mastery
                </h1>
                <p className="text-xs text-slate-500 mt-1">This official document verifies that</p>
              </div>

              <div className="py-2 border-b-2 border-slate-900 max-w-md mx-auto">
                <h2 className="text-2xl sm:text-3xl font-extrabold text-indigo-900 tracking-tight">
                  {certificate.recipientName}
                </h2>
              </div>

              <div className="space-y-1">
                <p className="text-xs text-slate-600">has successfully demonstrated proficiency and peer exchange in</p>
                <h3 className="text-lg sm:text-xl font-black text-slate-900">
                  {certificate.skillName}
                </h3>
              </div>

              <div className="grid grid-cols-2 gap-4 max-w-md mx-auto text-left pt-6 border-t border-amber-200/80 text-xs">
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">Issue Date</span>
                  <span className="font-extrabold text-slate-800">{certificate.issueDate}</span>
                </div>
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">Certificate Code</span>
                  <span className="font-extrabold text-indigo-600 font-mono text-[11px]">{certificate.certificateCode}</span>
                </div>
              </div>

              <div className="flex items-center justify-center gap-2 text-[11px] text-emerald-700 font-bold bg-emerald-50 px-4 py-2 rounded-xl border border-emerald-200 max-w-xs mx-auto">
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                <span>Verified by SkillSwap Blockchain Peer Seal</span>
              </div>
            </div>
          </div>

          {/* Bottom Action Controls */}
          <div className="p-6 bg-slate-50 border-t border-slate-200 flex flex-wrap items-center justify-between gap-3">
            <span className="text-xs text-slate-500 font-medium">
              Shareable credential link generated
            </span>
            <div className="flex items-center gap-2">
              <button
                onClick={handleShare}
                className="px-4 py-2 bg-white border border-slate-200 hover:bg-slate-100 text-slate-700 rounded-xl font-bold text-xs transition flex items-center gap-1.5 cursor-pointer"
              >
                <Share2 className="w-4 h-4" /> Share
              </button>
              <button
                onClick={handleDownload}
                className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-extrabold text-xs transition shadow-md shadow-indigo-500/20 flex items-center gap-1.5 cursor-pointer"
              >
                <Download className="w-4 h-4" /> Download PDF
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

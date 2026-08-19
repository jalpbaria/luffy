import React from 'react';
import { motion } from 'motion/react';
import { isReducedMotion } from '../motion/tokens';

export interface GradientMeshProps {
  className?: string;
}

export const GradientMesh: React.FC<GradientMeshProps> = ({ className = '' }) => {
  const reduced = isReducedMotion();

  return (
    <div
      aria-hidden="true"
      className={`pointer-events-none fixed inset-0 overflow-hidden select-none -z-10 ${className}`}
    >
      {/* Top Left Subtle Electric Violet Light Source */}
      <motion.div
        animate={
          reduced
            ? undefined
            : {
                x: [0, 40, -20, 0],
                y: [0, -30, 20, 0],
                scale: [1, 1.1, 0.95, 1],
              }
        }
        transition={{
          duration: 22,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
        className="absolute -top-[15%] -left-[10%] w-[55vw] h-[55vw] max-w-[800px] max-h-[800px] rounded-full bg-gradient-to-br from-violet-600/12 via-purple-700/8 to-transparent blur-[140px]"
      />

      {/* Top Right Soft Lavender Subtle Atmospheric Glow */}
      <motion.div
        animate={
          reduced
            ? undefined
            : {
                x: [0, -35, 25, 0],
                y: [0, 40, -20, 0],
                scale: [1, 0.92, 1.08, 1],
              }
        }
        transition={{
          duration: 26,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
        className="absolute top-[5%] -right-[15%] w-[50vw] h-[50vw] max-w-[700px] max-h-[700px] rounded-full bg-gradient-to-bl from-purple-500/10 via-lavender-300/5 to-transparent blur-[150px]"
      />

      {/* Bottom Center Dim Violet Aura */}
      <motion.div
        animate={
          reduced
            ? undefined
            : {
                scale: [1, 1.06, 0.98, 1],
                opacity: [0.35, 0.5, 0.35],
              }
        }
        transition={{
          duration: 18,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
        className="absolute bottom-[-20%] left-[20%] w-[60vw] h-[45vw] max-w-[900px] rounded-full bg-gradient-to-t from-violet-950/20 via-indigo-900/10 to-transparent blur-[160px]"
      />
    </div>
  );
};

GradientMesh.displayName = 'GradientMesh';
export default GradientMesh;

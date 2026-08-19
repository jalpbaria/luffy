import React from 'react';
import { NoiseOverlay } from './NoiseOverlay';
import { GradientMesh } from './GradientMesh';

export interface AmbientBackgroundProps {
  children?: React.ReactNode;
  showNoise?: boolean;
  className?: string;
}

export const AmbientBackground: React.FC<AmbientBackgroundProps> = ({
  children,
  showNoise = true,
  className = '',
}) => {
  return (
    <div className={`min-h-screen bg-bg-base text-text-main relative selection:bg-violet-500/30 selection:text-violet-200 ${className}`}>
      {/* Background Gradient Mesh with Slow/Imperceptible Atmospheric Light */}
      <GradientMesh />

      {/* Subtle Grain Overlay for Tactile Texture */}
      {showNoise && <NoiseOverlay opacity={0.032} />}

      {/* App Content */}
      <div className="relative z-10">{children}</div>
    </div>
  );
};

AmbientBackground.displayName = 'AmbientBackground';
export default AmbientBackground;

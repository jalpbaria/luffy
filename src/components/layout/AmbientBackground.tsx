import React from 'react';
import { NoiseOverlay } from './NoiseOverlay';
import { GradientMesh } from './GradientMesh';
import { CosmicNebulaBackground } from './CosmicNebulaBackground';

export interface AmbientBackgroundProps {
  children?: React.ReactNode;
  showNoise?: boolean;
  className?: string;
  variant?: 'default' | 'cosmic';
}

export const AmbientBackground: React.FC<AmbientBackgroundProps> = ({
  children,
  showNoise = true,
  className = '',
  variant = 'cosmic',
}) => {
  return (
    <div className={`min-h-screen ${variant === 'default' ? 'bg-[#090A0F]' : 'bg-[#030206]'} text-slate-100 relative selection:bg-violet-500/30 selection:text-violet-200 ${className}`}>
      {/* Background Layer: Cosmic Nebula or Standard Gradient Mesh */}
      {variant === 'default' ? (
        <GradientMesh />
      ) : (
        <CosmicNebulaBackground />
      )}

      {/* Subtle Grain Overlay for Tactile Texture */}
      {showNoise && <NoiseOverlay opacity={variant === 'cosmic' ? 0.02 : 0.032} />}

      {/* App Content */}
      <div className="relative z-10 flex-1 flex flex-col w-full">{children}</div>
    </div>
  );
};

AmbientBackground.displayName = 'AmbientBackground';
export default AmbientBackground;


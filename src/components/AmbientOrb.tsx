import React from 'react';

export interface AmbientOrbProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Color tone for the glowing radial gradient */
  tone?: 'brass' | 'sage';
  /** Optional custom Tailwind classes */
  className?: string;
  /** Size preset of the orb */
  size?: 'sm' | 'md' | 'lg' | 'xl';
}

export const AmbientOrb: React.FC<AmbientOrbProps> = ({
  tone = 'brass',
  className = '',
  size = 'lg',
  ...props
}) => {
  const sizeClasses = {
    sm: 'w-48 h-48 blur-2xl',
    md: 'w-72 h-72 blur-3xl',
    lg: 'w-96 h-96 blur-3xl',
    xl: 'w-[32rem] h-[32rem] blur-[80px]',
  }[size] || 'w-96 h-96 blur-3xl';

  const toneClasses = {
    brass: 'bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-brass/35 via-brass-light/15 to-transparent',
    sage: 'bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-sage/35 via-sage-light/15 to-transparent',
  }[tone];

  return (
    <div
      aria-hidden="true"
      className={`absolute pointer-events-none rounded-full select-none -z-10 motion-safe:animate-orb-pulse motion-safe:animate-orb-drift ${sizeClasses} ${toneClasses} ${className}`}
      {...props}
    />
  );
};

AmbientOrb.displayName = 'AmbientOrb';
export default AmbientOrb;

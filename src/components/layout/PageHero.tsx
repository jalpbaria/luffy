import React from 'react';
import { RevealText } from '../motion/RevealText';

export interface PageHeroProps {
  eyebrow?: string;
  eyebrowIcon?: React.ReactNode;
  title: string;
  description?: string;
  actionSlot?: React.ReactNode;
  secondaryActionSlot?: React.ReactNode;
  className?: string;
}

export const PageHero: React.FC<PageHeroProps> = ({
  eyebrow,
  eyebrowIcon,
  title,
  description,
  actionSlot,
  secondaryActionSlot,
  className = '',
}) => {
  return (
    <div className={`relative py-6 sm:py-10 space-y-4 max-w-4xl ${className}`}>
      {/* Optional Eyebrow Pill */}
      {eyebrow && (
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-violet-950/60 border border-violet-500/25 text-violet-300 text-xs font-semibold shadow-xs">
          {eyebrowIcon && <span className="text-violet-400">{eyebrowIcon}</span>}
          <span>{eyebrow}</span>
        </div>
      )}

      {/* Oversized Responsive Heading with Tight Letter Spacing */}
      <h1 className="text-display-hero">
        <RevealText text={title} />
      </h1>

      {/* Supporting Text with Crisp Contrast */}
      {description && (
        <p className="text-body-lead max-w-2xl">
          {description}
        </p>
      )}

      {/* Action Slots */}
      {(actionSlot || secondaryActionSlot) && (
        <div className="pt-2 flex flex-wrap items-center gap-3 sm:gap-4">
          {actionSlot}
          {secondaryActionSlot}
        </div>
      )}
    </div>
  );
};

PageHero.displayName = 'PageHero';
export default PageHero;

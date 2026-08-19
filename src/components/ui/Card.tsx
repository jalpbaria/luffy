import React from 'react';
import { motion, HTMLMotionProps } from 'motion/react';
import { Spotlight } from '../motion/Spotlight';
import { motionTokens } from '../motion/tokens';

export type CardVariant = 'surface' | 'feature' | 'editorial' | 'interactive';

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: CardVariant;
  children: React.ReactNode;
  className?: string;
  interactive?: boolean;
  accentBorder?: boolean;
  glass?: boolean;
  gradientBg?: boolean;
  glow?: boolean;
}

/**
 * Foundation Card Component with 3 Architectures:
 * 1. Surface (minimal dark container)
 * 2. Feature (large atmospheric component with glow/spotlight)
 * 3. Editorial (large typography/image composition, no heavy boundary)
 */
export const Card = React.forwardRef<HTMLDivElement, CardProps>(
  (
    {
      variant = 'surface',
      children,
      className = '',
      interactive = false,
      accentBorder = false,
      glass = false,
      gradientBg = false,
      glow = false,
      ...props
    },
    ref
  ) => {
    // 1. Editorial Card (borderless framing, emphasis on whitespace and typography hierarchy)
    if (variant === 'editorial') {
      return (
        <div
          ref={ref}
          className={`relative p-0 text-slate-100 ${className}`}
          {...props}
        >
          {children}
        </div>
      );
    }

    // 2. Feature Card (large atmospheric component with subtle violet glow & elevated dark gradient)
    if (variant === 'feature') {
      return (
        <div
          ref={ref}
          className={`dark-feature-surface p-7 sm:p-9 text-slate-100 ${
            glow ? 'shadow-[0_0_40px_rgba(139,92,246,0.25)]' : ''
          } ${className}`}
          {...props}
        >
          <Spotlight tone="violet" opacity={0.12} className="w-full h-full">
            {children}
          </Spotlight>
        </div>
      );
    }

    // 3. Surface Card (minimal dark container with 1px subtle border)
    const baseClasses = interactive
      ? 'dark-surface-interactive cursor-pointer select-none'
      : 'dark-surface';

    return (
      <div
        ref={ref}
        className={`${baseClasses} p-5 sm:p-6.5 text-slate-100 ${
          accentBorder ? 'border-t-2 border-t-violet-500' : ''
        } ${gradientBg ? 'bg-gradient-to-br from-[#181926] via-[#13141C] to-[#0E0F17]' : ''} ${className}`}
        {...props}
      >
        {children}
      </div>
    );
  }
);
Card.displayName = 'Card';

// Convenience Alias Components for Distinct Typologies
export const SurfaceCard = React.forwardRef<HTMLDivElement, CardProps>((props, ref) => (
  <Card ref={ref} variant="surface" {...props} />
));
SurfaceCard.displayName = 'SurfaceCard';

export const FeatureCard = React.forwardRef<HTMLDivElement, CardProps>((props, ref) => (
  <Card ref={ref} variant="feature" {...props} />
));
FeatureCard.displayName = 'FeatureCard';

export const EditorialCard = React.forwardRef<HTMLDivElement, CardProps>((props, ref) => (
  <Card ref={ref} variant="editorial" {...props} />
));
EditorialCard.displayName = 'EditorialCard';

export interface MotionCardProps extends Omit<HTMLMotionProps<'div'>, 'children'> {
  variant?: CardVariant;
  children: React.ReactNode;
  className?: string;
  interactive?: boolean;
  glowOnHover?: boolean;
}

export const MotionCard = React.forwardRef<HTMLDivElement, MotionCardProps>(
  (
    {
      variant = 'surface',
      children,
      className = '',
      interactive = true,
      glowOnHover = false,
      ...props
    },
    ref
  ) => {
    return (
      <motion.div
        ref={ref}
        whileHover={
          interactive
            ? {
                y: -3,
                transition: { duration: motionTokens.duration.fast, ease: motionTokens.ease.outCubic },
              }
            : undefined
        }
        whileTap={interactive ? { scale: 0.992 } : undefined}
        className={`dark-surface p-5 sm:p-6.5 relative overflow-hidden transition-all duration-300 ${
          interactive ? 'hover:border-white/[0.14] hover:bg-[#181924]/90' : ''
        } ${
          glowOnHover ? 'hover:border-violet-500/30 hover:shadow-[0_0_28px_rgba(139,92,246,0.2)]' : ''
        } ${className}`}
        {...props}
      >
        {children}
      </motion.div>
    );
  }
);
MotionCard.displayName = 'MotionCard';

export const CardHeader: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({
  children,
  className = '',
  ...props
}) => (
  <div className={`space-y-1.5 mb-4 ${className}`} {...props}>
    {children}
  </div>
);

export const CardTitle: React.FC<React.HTMLAttributes<HTMLHeadingElement>> = ({
  children,
  className = '',
  ...props
}) => (
  <h3 className={`font-bold text-white text-base sm:text-lg tracking-tight ${className}`} {...props}>
    {children}
  </h3>
);

export const CardDescription: React.FC<React.HTMLAttributes<HTMLParagraphElement>> = ({
  children,
  className = '',
  ...props
}) => (
  <p className={`text-slate-400 text-xs sm:text-sm leading-relaxed ${className}`} {...props}>
    {children}
  </p>
);

export const CardContent: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({
  children,
  className = '',
  ...props
}) => (
  <div className={`${className}`} {...props}>
    {children}
  </div>
);

export const CardFooter: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({
  children,
  className = '',
  ...props
}) => (
  <div className={`pt-4 mt-4 border-t border-white/[0.06] flex items-center justify-between ${className}`} {...props}>
    {children}
  </div>
);

export interface BentoCardProps extends React.HTMLAttributes<HTMLDivElement> {
  badge?: string;
  icon?: React.ReactNode;
  title: string;
  description?: string;
  children?: React.ReactNode;
  gradient?: string;
  className?: string;
}

export const BentoCard: React.FC<BentoCardProps> = ({
  badge,
  icon,
  title,
  description,
  children,
  gradient,
  className = '',
  ...props
}) => {
  return (
    <motion.div
      whileHover={{ y: -3 }}
      transition={{ duration: motionTokens.duration.fast, ease: motionTokens.ease.outCubic }}
      className={`dark-surface p-6 flex flex-col justify-between relative overflow-hidden group hover:border-white/[0.14] hover:shadow-[0_0_24px_rgba(139,92,246,0.14)] transition-all duration-300 ${
        gradient || ''
      } ${className}`}
      {...props}
    >
      {/* Background Subtle Ambient Violet Glow */}
      <div className="absolute -top-12 -right-12 w-36 h-36 bg-violet-600/10 rounded-full blur-3xl group-hover:bg-violet-600/20 transition-all duration-500" />

      <div className="space-y-3 z-10">
        <div className="flex items-center justify-between">
          {icon && (
            <div className="w-10 h-10 rounded-xl bg-violet-950/60 border border-violet-500/25 flex items-center justify-center text-violet-300 shadow-xs group-hover:scale-105 group-hover:border-violet-400/40 transition-all duration-300">
              {icon}
            </div>
          )}
          {badge && (
            <span className="px-2.5 py-0.5 bg-white/[0.06] text-slate-300 text-[10px] font-bold rounded-full border border-white/[0.08] uppercase tracking-wider">
              {badge}
            </span>
          )}
        </div>
        <div>
          <h4 className="font-bold text-white text-base sm:text-lg tracking-tight group-hover:text-violet-200 transition-colors">
            {title}
          </h4>
          {description && (
            <p className="text-slate-400 text-xs sm:text-sm mt-1 leading-relaxed">
              {description}
            </p>
          )}
        </div>
      </div>
      {children && <div className="mt-4 z-10">{children}</div>}
    </motion.div>
  );
};

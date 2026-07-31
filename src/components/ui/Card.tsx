import React from 'react';
import { motion, HTMLMotionProps } from 'motion/react';

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  className?: string;
  interactive?: boolean;
  accentBorder?: boolean;
  glass?: boolean;
  gradientBg?: boolean;
}

export const Card = React.forwardRef<HTMLDivElement, CardProps>(
  ({ children, className = '', interactive = false, accentBorder = false, glass = false, gradientBg = false, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={`${
          glass 
            ? 'bg-white/80 backdrop-blur-xl border border-white/60 shadow-lg shadow-indigo-500/5 rounded-3xl' 
            : interactive 
            ? 'bg-white rounded-3xl border border-slate-200/80 shadow-sm hover:shadow-xl hover:shadow-indigo-500/10 hover:border-indigo-200 transition-all duration-300' 
            : 'bg-white rounded-3xl border border-slate-200/80 shadow-sm'
        } ${gradientBg ? 'bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 text-white border-indigo-500/30' : ''} ${
          accentBorder ? 'border-t-4 border-t-indigo-500' : ''
        } p-5 sm:p-6.5 ${className}`}
        {...props}
      >
        {children}
      </div>
    );
  }
);
Card.displayName = 'Card';

export interface MotionCardProps extends Omit<HTMLMotionProps<'div'>, 'children'> {
  children: React.ReactNode;
  className?: string;
  interactive?: boolean;
  glass?: boolean;
  glowOnHover?: boolean;
}

export const MotionCard = React.forwardRef<HTMLDivElement, MotionCardProps>(
  ({ children, className = '', interactive = true, glass = false, glowOnHover = false, ...props }, ref) => {
    return (
      <motion.div
        ref={ref}
        whileHover={interactive ? { y: -4, transition: { duration: 0.25, ease: 'easeOut' } } : undefined}
        whileTap={interactive ? { scale: 0.995 } : undefined}
        className={`${
          glass
            ? 'bg-white/80 backdrop-blur-xl border border-white/60 shadow-lg shadow-indigo-500/5 rounded-3xl'
            : 'bg-white rounded-3xl border border-slate-200/80 shadow-sm hover:shadow-xl hover:shadow-indigo-500/10 hover:border-indigo-200/80 transition-all duration-300'
        } ${glowOnHover ? 'hover:border-indigo-300 hover:ring-4 hover:ring-indigo-500/10' : ''} p-5 sm:p-6.5 relative overflow-hidden ${className}`}
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
  <h3 className={`font-extrabold text-slate-900 text-base sm:text-lg tracking-tight ${className}`} {...props}>
    {children}
  </h3>
);

export const CardDescription: React.FC<React.HTMLAttributes<HTMLParagraphElement>> = ({
  children,
  className = '',
  ...props
}) => (
  <p className={`text-slate-500 text-xs sm:text-sm leading-relaxed ${className}`} {...props}>
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
  <div className={`pt-4 mt-4 border-t border-slate-100 flex items-center justify-between ${className}`} {...props}>
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
      whileHover={{ y: -4 }}
      transition={{ duration: 0.25 }}
      className={`bg-white rounded-3xl border border-slate-200/80 p-6 flex flex-col justify-between relative overflow-hidden group shadow-sm hover:shadow-xl hover:shadow-indigo-500/10 hover:border-indigo-300 transition-all duration-300 ${
        gradient || ''
      } ${className}`}
      {...props}
    >
      {/* Background Subtle Accent Light */}
      <div className="absolute -top-12 -right-12 w-32 h-32 bg-indigo-500/5 rounded-full blur-2xl group-hover:bg-indigo-500/15 transition-all duration-500" />
      
      <div className="space-y-3 z-10">
        <div className="flex items-center justify-between">
          {icon && (
            <div className="w-11 h-11 rounded-2xl bg-indigo-50 border border-indigo-100/80 flex items-center justify-center text-indigo-600 shadow-xs group-hover:scale-110 group-hover:bg-indigo-600 group-hover:text-white transition-all duration-300">
              {icon}
            </div>
          )}
          {badge && (
            <span className="px-3 py-1 bg-slate-100/90 text-slate-700 text-[10px] font-extrabold rounded-full border border-slate-200 uppercase tracking-wider shadow-2xs">
              {badge}
            </span>
          )}
        </div>
        <div>
          <h4 className="font-extrabold text-slate-900 text-lg tracking-tight group-hover:text-indigo-600 transition-colors">
            {title}
          </h4>
          {description && (
            <p className="text-slate-500 text-xs sm:text-sm mt-1 leading-relaxed">
              {description}
            </p>
          )}
        </div>
      </div>
      {children && <div className="mt-4 z-10">{children}</div>}
    </motion.div>
  );
};

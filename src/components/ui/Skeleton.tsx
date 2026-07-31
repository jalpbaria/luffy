import React from 'react';

export interface SkeletonProps {
  className?: string;
  variant?: 'text' | 'circular' | 'rectangular' | 'card';
  width?: string | number;
  height?: string | number;
}

export const Skeleton: React.FC<SkeletonProps> = ({
  className = '',
  variant = 'text',
  width,
  height,
}) => {
  const baseClasses = 'animate-pulse bg-slate-200/80 rounded-2xl';

  const variantClasses = {
    text: 'h-4 w-full rounded-md',
    circular: 'rounded-full shrink-0',
    rectangular: 'rounded-2xl',
    card: 'rounded-3xl h-48 w-full border border-slate-200/60 p-6 space-y-4',
  }[variant];

  const style: React.CSSProperties = {
    width: width !== undefined ? width : undefined,
    height: height !== undefined ? height : undefined,
  };

  if (variant === 'card') {
    return (
      <div className={`bg-white rounded-3xl border border-slate-200/80 p-6 space-y-4 shadow-2xs ${className}`}>
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-slate-200/80 animate-pulse shrink-0" />
          <div className="space-y-2 flex-1">
            <div className="h-4 bg-slate-200/80 rounded-md w-1/2 animate-pulse" />
            <div className="h-3 bg-slate-200/60 rounded-md w-1/3 animate-pulse" />
          </div>
        </div>
        <div className="space-y-2 pt-2">
          <div className="h-3 bg-slate-200/70 rounded-md w-full animate-pulse" />
          <div className="h-3 bg-slate-200/60 rounded-md w-4/5 animate-pulse" />
        </div>
        <div className="h-10 bg-slate-200/80 rounded-2xl w-full animate-pulse mt-4" />
      </div>
    );
  }

  return <div className={`${baseClasses} ${variantClasses} ${className}`} style={style} />;
};

export const CardSkeletonGrid: React.FC<{ count?: number }> = ({ count = 6 }) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {Array.from({ length: count }).map((_, idx) => (
        <Skeleton key={idx} variant="card" />
      ))}
    </div>
  );
};

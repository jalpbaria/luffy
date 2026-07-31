import React, { useState } from 'react';

export type AvatarSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl';

export interface AvatarProps {
  src?: string;
  name?: string;
  size?: AvatarSize;
  isOnline?: boolean;
  xpLevel?: number;
  className?: string;
}

export const Avatar: React.FC<AvatarProps> = ({
  src,
  name = 'User',
  size = 'md',
  isOnline = false,
  xpLevel,
  className = '',
}) => {
  const [hasError, setHasError] = useState(false);

  const sizeClasses = {
    xs: 'w-6 h-6 text-[10px]',
    sm: 'w-8 h-8 text-xs',
    md: 'w-10 h-10 text-sm',
    lg: 'w-12 h-12 text-base',
    xl: 'w-16 h-16 text-xl',
  }[size];

  const getInitials = (n: string) => {
    const parts = n.trim().split(' ');
    if (parts.length >= 2) {
      return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    }
    return n.slice(0, 2).toUpperCase();
  };

  return (
    <div className={`relative inline-block shrink-0 ${className}`}>
      <div
        className={`${sizeClasses} rounded-full overflow-hidden bg-gradient-to-br from-indigo-500 via-purple-500 to-cyan-500 p-0.5 shadow-sm`}
      >
        <div className="w-full h-full rounded-full bg-slate-900 flex items-center justify-center overflow-hidden">
          {src && !hasError ? (
            <img
              src={src}
              alt={name}
              onError={() => setHasError(true)}
              className="w-full h-full object-cover"
            />
          ) : (
            <span className="font-extrabold text-white tracking-wider">
              {getInitials(name)}
            </span>
          )}
        </div>
      </div>

      {/* Online Status Dot */}
      {isOnline && (
        <span className="absolute bottom-0 right-0 w-3 h-3 bg-emerald-500 border-2 border-white rounded-full shadow-xs" />
      )}

      {/* Optional XP Level Badge */}
      {xpLevel !== undefined && (
        <span className="absolute -bottom-1 -right-1 px-1.5 py-0.2 bg-gradient-to-r from-amber-500 to-orange-500 text-white font-extrabold text-[9px] rounded-full border border-white shadow-xs">
          Lvl {xpLevel}
        </span>
      )}
    </div>
  );
};

export interface AvatarGroupProps {
  avatars: Array<{ src?: string; name: string }>;
  max?: number;
  size?: AvatarSize;
}

export const AvatarGroup: React.FC<AvatarGroupProps> = ({
  avatars,
  max = 4,
  size = 'sm',
}) => {
  const visibleAvatars = avatars.slice(0, max);
  const remainingCount = avatars.length - max;

  return (
    <div className="flex items-center -space-x-2 overflow-hidden">
      {visibleAvatars.map((av, idx) => (
        <Avatar key={idx} src={av.src} name={av.name} size={size} className="ring-2 ring-white rounded-full" />
      ))}
      {remainingCount > 0 && (
        <div className="w-8 h-8 rounded-full bg-slate-100 text-slate-700 text-xs font-bold border-2 border-white flex items-center justify-center shadow-2xs">
          +{remainingCount}
        </div>
      )}
    </div>
  );
};

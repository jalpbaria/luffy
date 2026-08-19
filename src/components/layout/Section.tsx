import React from 'react';

export interface SectionProps extends React.HTMLAttributes<HTMLElement> {
  children: React.ReactNode;
  containerWidth?: 'sm' | 'md' | 'lg' | 'xl' | 'full';
  topDivider?: boolean;
  className?: string;
}

export const Section: React.FC<SectionProps> = ({
  children,
  containerWidth = 'xl',
  topDivider = false,
  className = '',
  ...props
}) => {
  const widthClasses = {
    sm: 'max-w-3xl',
    md: 'max-w-5xl',
    lg: 'max-w-6xl',
    xl: 'max-w-7xl',
    full: 'max-w-full',
  }[containerWidth];

  return (
    <section
      className={`relative w-full ${topDivider ? 'border-t border-white/[0.06] pt-10 sm:pt-14' : ''} ${className}`}
      {...props}
    >
      <div className={`w-full mx-auto px-4 sm:px-6 lg:px-8 ${widthClasses}`}>
        {children}
      </div>
    </section>
  );
};

Section.displayName = 'Section';
export default Section;

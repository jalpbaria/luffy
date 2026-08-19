import React from 'react';
import { AmbientBackground } from './AmbientBackground';

export interface AppShellProps {
  children: React.ReactNode;
  navbar?: React.ReactNode;
  footer?: React.ReactNode;
  className?: string;
}

export const AppShell: React.FC<AppShellProps> = ({
  children,
  navbar,
  footer,
  className = '',
}) => {
  return (
    <AmbientBackground className={`flex flex-col min-h-screen ${className}`}>
      {/* Floating Global Navbar */}
      {navbar}

      {/* Main App Container */}
      <main className="flex-1 w-full max-w-[1440px] mx-auto px-4 sm:px-7 lg:px-10 py-5 sm:py-8 lg:py-10 pb-24 lg:pb-10">
        {children}
      </main>

      {/* Optional Global Footer */}
      {footer}
    </AmbientBackground>
  );
};

AppShell.displayName = 'AppShell';
export default AppShell;

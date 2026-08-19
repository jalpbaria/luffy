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
      <main className="flex-1 w-full max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-4 sm:py-8">
        {children}
      </main>

      {/* Optional Global Footer */}
      {footer}
    </AmbientBackground>
  );
};

AppShell.displayName = 'AppShell';
export default AppShell;

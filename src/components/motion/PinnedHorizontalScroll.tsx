import React, { useRef, useState, useEffect } from 'react';
import { motion, useScroll, useTransform, useReducedMotion } from 'motion/react';

export interface PinnedHorizontalScrollProps {
  children: React.ReactNode;
  /** Optional custom title or header element */
  header?: React.ReactNode;
  /** Height multiplier for scroll distance (e.g. 2.5 = 250vh height). Default: 2.5 */
  scrollDistanceMultiplier?: number;
  /** Additional container classes */
  className?: string;
}

export const PinnedHorizontalScroll: React.FC<PinnedHorizontalScrollProps> = ({
  children,
  header,
  scrollDistanceMultiplier = 2.5,
  className = '',
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const prefersReducedMotion = useReducedMotion();
  
  const [isMobile, setIsMobile] = useState(false);
  const [scrollRange, setScrollRange] = useState(0);

  // Check viewport width to disable pinning on mobile/tablets
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 1024);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Compute scroll offset based on track width vs viewport width
  useEffect(() => {
    if (isMobile || prefersReducedMotion) return;

    const measure = () => {
      if (trackRef.current && containerRef.current) {
        const trackWidth = trackRef.current.scrollWidth;
        const viewportWidth = trackRef.current.offsetWidth;
        const overflowDistance = Math.max(0, trackWidth - viewportWidth + 64);
        setScrollRange(overflowDistance);
      }
    };

    measure();
    const timer = setTimeout(measure, 150);
    window.addEventListener('resize', measure);
    return () => {
      clearTimeout(timer);
      window.removeEventListener('resize', measure);
    };
  }, [isMobile, prefersReducedMotion, children]);

  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ['start start', 'end end'],
  });

  // Transform-only GPU acceleration
  const x = useTransform(
    scrollYProgress,
    [0, 1],
    [0, -scrollRange],
    { ease: (t) => t } // Linear interpolation across scroll delta
  );

  const scrollProgressWidth = useTransform(scrollYProgress, [0, 1], ['0%', '100%']);

  // Mobile / Reduced Motion Fallback: Natural swipeable horizontal track or vertical layout without scroll-jacking
  if (isMobile || prefersReducedMotion) {
    return (
      <div className={`space-y-4 ${className}`}>
        {header && <div>{header}</div>}
        <div className="flex items-stretch gap-4 overflow-x-auto snap-x snap-mandatory pb-4 pt-1 px-1 scrollbar-none -mx-4 sm:mx-0 px-4 sm:px-0">
          {children}
        </div>
      </div>
    );
  }

  // Desktop Pinned Horizontal Scroll Section
  return (
    <div
      ref={containerRef}
      style={{ height: `${scrollDistanceMultiplier * 100}vh` }}
      className={`relative ${className}`}
    >
      {/* Sticky viewport pinned container */}
      <div className="sticky top-20 h-[calc(100vh-6rem)] max-h-[640px] flex flex-col justify-between overflow-hidden py-4">
        {header && (
          <div className="flex items-center justify-between gap-4 mb-4 shrink-0">
            <div className="flex-1">{header}</div>
            
            {/* Scroll progress bar indicator */}
            <div className="hidden sm:flex items-center gap-2 bg-slate-100 border border-slate-200/80 px-3 py-1.5 rounded-full text-[11px] font-bold text-slate-500 shrink-0">
              <span>Scroll to browse</span>
              <div className="w-16 h-1.5 bg-slate-200 rounded-full overflow-hidden">
                <motion.div
                  style={{ width: scrollProgressWidth }}
                  className="h-full bg-indigo-600 rounded-full"
                />
              </div>
            </div>
          </div>
        )}

        {/* Horizontal Track pinned and driven strictly by GPU transform */}
        <div className="relative flex-1 flex items-center overflow-hidden">
          <motion.div
            ref={trackRef}
            style={{ x, willChange: 'transform' }}
            className="flex items-stretch gap-5 pr-12 will-change-transform"
          >
            {children}
          </motion.div>
        </div>
      </div>
    </div>
  );
};

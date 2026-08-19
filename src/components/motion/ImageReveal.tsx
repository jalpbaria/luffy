import React from 'react';
import { motion, HTMLMotionProps } from 'motion/react';
import { motionTokens } from './tokens';

export interface ImageRevealProps extends Omit<HTMLMotionProps<'div'>, 'children'> {
  src: string;
  alt?: string;
  aspectRatio?: 'square' | 'video' | 'portrait' | 'wide' | 'auto' | string;
  className?: string;
  imageClassName?: string;
  delay?: number;
  duration?: number;
  glow?: boolean;
  priority?: boolean;
}

export const ImageReveal: React.FC<ImageRevealProps> = ({
  src,
  alt = '',
  aspectRatio = 'auto',
  className = '',
  imageClassName = '',
  delay = 0.1,
  duration = motionTokens.duration.cinematic,
  glow = false,
  priority = false,
  ...props
}) => {
  const aspectClasses = {
    square: 'aspect-square',
    video: 'aspect-video',
    portrait: 'aspect-[3/4]',
    wide: 'aspect-[21/9]',
    auto: '',
  }[aspectRatio] || aspectRatio;

  return (
    <div className={`relative overflow-hidden rounded-2xl ${aspectClasses} ${className}`}>
      {/* Optional subtle electric violet backlight glow */}
      {glow && (
        <div
          aria-hidden="true"
          className="absolute -inset-2 bg-violet-600/20 blur-xl rounded-3xl -z-10"
        />
      )}

      {/* Main image container with clip-path mask reveal */}
      <motion.div
        initial={{
          opacity: 0,
          scale: 1.06,
          y: 12,
          filter: 'blur(8px)',
          clipPath: 'inset(10% 0% 10% 0% round 16px)',
        }}
        whileInView={{
          opacity: 1,
          scale: 1,
          y: 0,
          filter: 'blur(0px)',
          clipPath: 'inset(0% 0% 0% 0% round 16px)',
        }}
        viewport={{ once: true, margin: '-20px' }}
        transition={{
          duration,
          delay,
          ease: motionTokens.ease.outExpo,
        }}
        className="w-full h-full relative overflow-hidden"
        {...props}
      >
        <img
          src={src}
          alt={alt}
          loading={priority ? 'eager' : 'lazy'}
          className={`w-full h-full object-cover select-none ${imageClassName}`}
          referrerPolicy="no-referrer"
        />
      </motion.div>
    </div>
  );
};

ImageReveal.displayName = 'ImageReveal';
export default ImageReveal;

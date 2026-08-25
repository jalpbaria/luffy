import { useState, useEffect, useCallback, RefObject } from 'react';

export function useFullscreen(targetRef?: RefObject<HTMLElement | null>) {
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isFallback, setIsFallback] = useState(false);

  const getElement = useCallback(() => {
    return targetRef?.current || document.documentElement;
  }, [targetRef]);

  const enterFullscreen = useCallback(async () => {
    try {
      const el = getElement();
      if (!el) {
        setIsFullscreen(true);
        setIsFallback(true);
        return;
      }

      const requestMethod =
        el.requestFullscreen ||
        (el as any).webkitRequestFullscreen ||
        (el as any).mozRequestFullScreen ||
        (el as any).msRequestFullscreen;

      if (requestMethod) {
        try {
          await requestMethod.call(el);
          setIsFullscreen(true);
          setIsFallback(false);
          return;
        } catch (err) {
          console.warn('Native requestFullscreen failed, enabling CSS fullscreen fallback:', err);
        }
      }

      // Fallback for iOS Safari or when native Fullscreen API is unsupported/rejected
      setIsFullscreen(true);
      setIsFallback(true);
    } catch (err) {
      console.warn('Fallback fullscreen activated:', err);
      setIsFullscreen(true);
      setIsFallback(true);
    }
  }, [getElement]);

  const exitFullscreen = useCallback(async () => {
    try {
      const hasNativeFullscreen = !!(
        document.fullscreenElement ||
        (document as any).webkitFullscreenElement ||
        (document as any).mozFullScreenElement ||
        (document as any).msFullscreenElement
      );

      if (hasNativeFullscreen) {
        if (document.exitFullscreen) {
          await document.exitFullscreen();
        } else if ((document as any).webkitExitFullscreen) {
          await (document as any).webkitExitFullscreen();
        } else if ((document as any).mozCancelFullScreen) {
          await (document as any).mozCancelFullScreen();
        } else if ((document as any).msExitFullscreen) {
          await (document as any).msExitFullscreen();
        }
      }
    } catch (err) {
      console.warn('exitFullscreen error:', err);
    } finally {
      setIsFullscreen(false);
      setIsFallback(false);
    }
  }, []);

  const toggleFullscreen = useCallback(async () => {
    if (isFullscreen) {
      await exitFullscreen();
    } else {
      await enterFullscreen();
    }
  }, [isFullscreen, enterFullscreen, exitFullscreen]);

  useEffect(() => {
    const handleFullscreenChange = () => {
      const fullscreenElement =
        document.fullscreenElement ||
        (document as any).webkitFullscreenElement ||
        (document as any).mozFullScreenElement ||
        (document as any).msFullscreenElement;

      if (targetRef && targetRef.current) {
        const isTargetActive = fullscreenElement === targetRef.current;
        if (!isTargetActive && !isFallback) {
          setIsFullscreen(false);
        }
      } else {
        if (!fullscreenElement && !isFallback) {
          setIsFullscreen(false);
        }
      }
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    document.addEventListener('webkitfullscreenchange', handleFullscreenChange);
    document.addEventListener('mozfullscreenchange', handleFullscreenChange);
    document.addEventListener('MSFullscreenChange', handleFullscreenChange);

    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
      document.removeEventListener('webkitfullscreenchange', handleFullscreenChange);
      document.removeEventListener('mozfullscreenchange', handleFullscreenChange);
      document.removeEventListener('MSFullscreenChange', handleFullscreenChange);
    };
  }, [targetRef, isFallback]);

  return { isFullscreen, isFallback, toggleFullscreen, enterFullscreen, exitFullscreen };
}

export default useFullscreen;

import { useState, useEffect } from 'react';

interface WindowSize {
  width: number;
  height: number;
  isLandscape: boolean;
  isMobileLandscape: boolean;
}

export function useWindowSize(): WindowSize {
  const [size, setSize] = useState<WindowSize>(() => {
    const w = typeof window !== 'undefined' ? window.innerWidth : 1024;
    const h = typeof window !== 'undefined' ? window.innerHeight : 768;
    return { width: w, height: h, isLandscape: w > h, isMobileLandscape: w > h && h < 500 };
  });

  useEffect(() => {
    const handleResize = () => {
      const w = window.innerWidth;
      const h = window.innerHeight;
      setSize({ width: w, height: h, isLandscape: w > h, isMobileLandscape: w > h && h < 500 });
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return size;
}

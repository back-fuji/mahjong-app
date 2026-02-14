import { useState, useEffect } from 'react';

interface WindowSize {
  width: number;
  height: number;
  isLandscape: boolean;
  isMobileLandscape: boolean;
}

/** SP縦持ち時はCSS回転で横向き表示するため、w/hを入れ替えて扱う */
function calcSize(): WindowSize {
  const rawW = typeof window !== 'undefined' ? window.innerWidth : 1024;
  const rawH = typeof window !== 'undefined' ? window.innerHeight : 768;

  // SP縦持ち（CSS .sp-force-landscape が効いている状態）: w/hを入れ替え
  const isForcedLandscape = rawW <= 768 && rawH > rawW;
  const w = isForcedLandscape ? rawH : rawW;
  const h = isForcedLandscape ? rawW : rawH;

  return {
    width: w,
    height: h,
    isLandscape: w > h,
    isMobileLandscape: (w > h && h < 500) || isForcedLandscape,
  };
}

export function useWindowSize(): WindowSize {
  const [size, setSize] = useState<WindowSize>(calcSize);

  useEffect(() => {
    const handleResize = () => setSize(calcSize());
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return size;
}

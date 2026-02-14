import { useState, useEffect } from 'react';

/** SP縦向きかどうか（768px以下かつ portrait）。このとき「横向きにして下さい」を表示 */
export function useIsMobilePortrait(): boolean {
  const [isPortrait, setIsPortrait] = useState(() => {
    if (typeof window === 'undefined') return false;
    return window.matchMedia('(max-width: 768px) and (orientation: portrait)').matches;
  });
  useEffect(() => {
    const m = window.matchMedia('(max-width: 768px) and (orientation: portrait)');
    const handler = () => setIsPortrait(m.matches);
    m.addEventListener('change', handler);
    return () => m.removeEventListener('change', handler);
  }, []);
  return isPortrait;
}

import React, { useState, useRef, useCallback } from 'react';

interface Props {
  message: string;
  hint?: string;
  borderColorClass: string;
  /** 'game'（CPU対戦）または 'online'（オンライン対戦） */
  variant?: 'game' | 'online';
}

/**
 * スマホでドラッグ移動できるステータスインジケーター。
 * PCでは従来通り画面左中央に固定表示。
 */
export const DraggableStatusIndicator: React.FC<Props> = ({
  message,
  hint,
  borderColorClass,
  variant = 'game',
}) => {
  const [pos, setPos] = useState<{ x: number; y: number } | null>(null);
  const dragOffset = useRef({ x: 0, y: 0 });
  const elementRef = useRef<HTMLDivElement>(null);
  const isDragging = useRef(false);

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    const touch = e.touches[0];
    const rect = elementRef.current?.getBoundingClientRect();
    if (rect) {
      dragOffset.current = {
        x: touch.clientX - rect.left,
        y: touch.clientY - rect.top,
      };
    }
    isDragging.current = true;
  }, []);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (!isDragging.current) return;
    e.preventDefault();
    const touch = e.touches[0];
    const newX = touch.clientX - dragOffset.current.x;
    const newY = touch.clientY - dragOffset.current.y;
    const el = elementRef.current;
    if (el) {
      const maxX = window.innerWidth - el.offsetWidth;
      const maxY = window.innerHeight - el.offsetHeight;
      setPos({
        x: Math.max(0, Math.min(newX, maxX)),
        y: Math.max(0, Math.min(newY, maxY)),
      });
    } else {
      setPos({ x: newX, y: newY });
    }
  }, []);

  const handleTouchEnd = useCallback(() => {
    isDragging.current = false;
  }, []);

  const mobileStyle: React.CSSProperties | undefined = pos
    ? { position: 'fixed', left: pos.x, top: pos.y }
    : undefined;

  const isOnline = variant === 'online';
  const innerClass = isOnline
    ? `bg-black/20 backdrop-blur-md border ${borderColorClass} px-2 py-1 sm:px-6 sm:py-2 rounded-xl shadow-lg transition-colors touch-none select-none cursor-grab active:cursor-grabbing`
    : `bg-black/40 backdrop-blur-md border ${borderColorClass} px-2 py-1 sm:px-3 sm:py-2 rounded-xl shadow-lg transition-colors touch-none select-none cursor-grab active:cursor-grabbing`;

  return (
    <div
      ref={elementRef}
      className={
        pos
          ? 'z-50'
          : 'fixed bottom-[100px] left-2 sm:bottom-auto sm:left-3 sm:top-1/2 sm:-translate-y-1/2 z-50'
      }
      style={mobileStyle}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      <div className={innerClass}>
        <div
          className={
            isOnline
              ? 'text-white/90 font-bold text-xs sm:text-lg text-center whitespace-nowrap'
              : 'text-white/90 font-bold text-xs sm:text-sm text-center whitespace-nowrap'
          }
        >
          {message}
        </div>
        {hint && (
          <div
            className={
              isOnline
                ? 'text-white/60 text-[9px] sm:text-sm text-center max-w-[120px] sm:max-w-none leading-tight'
                : 'text-white/60 text-[9px] sm:text-[10px] text-center max-w-[120px] sm:max-w-[100px] leading-tight'
            }
          >
            {hint}
          </div>
        )}
      </div>
    </div>
  );
};

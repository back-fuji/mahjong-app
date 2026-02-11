import React from 'react';

interface CallAnnouncementProps {
  text: string; // 'ポン' | 'チー' | 'カン'
}

/**
 * 鳴き演出: カットインエフェクト（小さめ版）
 */
export const CallAnnouncement: React.FC<CallAnnouncementProps> = ({ text }) => {
  return (
    <div className="fixed inset-0 z-[150] flex items-center justify-center pointer-events-none overflow-hidden">
      {/* 短い白フラッシュ */}
      <div className="absolute inset-0 bg-white cutin-flash" style={{ opacity: 0 }} />

      {/* 斜めスラッシュ */}
      <div
        className="absolute cutin-slash-left"
        style={{
          width: '200%', height: '4px',
          top: '46%',
          background: 'linear-gradient(90deg, transparent, #f97316, transparent)',
          boxShadow: '0 0 12px rgba(249, 115, 22, 0.6)',
        }}
      />

      {/* 帯 */}
      <div
        className="absolute"
        style={{
          width: '100%', height: '80px',
          top: 'calc(50% - 40px)',
          background: 'linear-gradient(180deg, transparent, rgba(120, 40, 0, 0.7) 20%, rgba(120, 40, 0, 0.7) 80%, transparent)',
          animation: 'cutin-band-left 0.8s ease-in-out forwards',
        }}
      />

      {/* テキスト */}
      <div
        className="relative cutin-text-small"
        style={{
          fontFamily: '"Yu Mincho", "游明朝", "Hiragino Mincho Pro", "ヒラギノ明朝 Pro", "MS PMincho", serif',
          fontSize: '4rem',
          fontWeight: 900,
          color: '#f97316',
          textShadow: '0 0 30px rgba(249, 115, 22, 0.6), 0 0 60px rgba(249, 115, 22, 0.3), 0 4px 8px rgba(0,0,0,0.5)',
          letterSpacing: '0.2em',
          zIndex: 10,
        }}
      >
        {text}
      </div>
    </div>
  );
};

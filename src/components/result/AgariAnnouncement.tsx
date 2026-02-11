import React from 'react';

interface AgariAnnouncementProps {
  text: string; // 'ツモ' or 'ロン'
}

/**
 * 和了時の大きなアナウンス表示
 * 画面中央に明朝体でオレンジ色テイストで表示
 */
export const AgariAnnouncement: React.FC<AgariAnnouncementProps> = ({ text }) => {
  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center pointer-events-none">
      {/* 背景オーバーレイ */}
      <div className="absolute inset-0 bg-black/50" />

      {/* テキスト */}
      <div
        className="relative animate-agari-announce"
        style={{
          fontFamily: '"Yu Mincho", "游明朝", "Hiragino Mincho Pro", "ヒラギノ明朝 Pro", "MS PMincho", serif',
          fontSize: '8rem',
          fontWeight: 900,
          color: '#f97316',
          textShadow: '0 0 40px rgba(249, 115, 22, 0.8), 0 0 80px rgba(249, 115, 22, 0.4), 0 4px 8px rgba(0,0,0,0.6)',
          letterSpacing: '0.2em',
        }}
      >
        {text}
      </div>
    </div>
  );
};

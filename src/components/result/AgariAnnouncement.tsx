import React from 'react';

interface AgariAnnouncementProps {
  text: string; // 'ツモ' or 'ロン' or 'リーチ'
  /** スライドインの方向（0=下/自分, 1=右, 2=上/対面, 3=左） */
  direction?: number;
}

const SLIDE_CLASSES = ['slide-in-bottom', 'slide-in-right', 'slide-in-top', 'slide-in-left'] as const;
const WIND_LABELS = ['', '下家', '対面', '上家'] as const;

/**
 * 和了/リーチ時のカットインエフェクト
 * アニメの必殺技のような演出: 帯 + スラッシュ + フラッシュ + テキスト
 * direction指定時は該当プレイヤーの方向からスライドインする
 */
export const AgariAnnouncement: React.FC<AgariAnnouncementProps> = ({ text, direction }) => {
  const isRiichi = text === 'リーチ';
  const mainColor = isRiichi ? '#3b82f6' : '#f97316';
  const glowColor = isRiichi ? 'rgba(59, 130, 246, 0.8)' : 'rgba(249, 115, 22, 0.8)';
  const bandColor = isRiichi ? 'rgba(30, 64, 175, 0.85)' : 'rgba(120, 40, 0, 0.85)';

  const slideClass = direction !== undefined ? SLIDE_CLASSES[direction] ?? '' : '';
  const windLabel = direction !== undefined && direction > 0 ? WIND_LABELS[direction] : '';

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center pointer-events-none overflow-hidden">
      {/* 背景暗転 */}
      <div className="absolute inset-0 bg-black/60 cutin-flash" />

      {/* 白フラッシュ */}
      <div className="absolute inset-0 bg-white cutin-flash" style={{ animationDelay: '0.05s' }} />

      {/* 斜めスラッシュライン */}
      <div
        className="absolute cutin-slash-left"
        style={{
          width: '200%', height: '8px',
          top: '42%',
          background: `linear-gradient(90deg, transparent, ${mainColor}, transparent)`,
          boxShadow: `0 0 20px ${glowColor}`,
        }}
      />
      <div
        className="absolute cutin-slash-right"
        style={{
          width: '200%', height: '6px',
          top: '56%',
          background: `linear-gradient(90deg, transparent, ${mainColor}80, transparent)`,
          boxShadow: `0 0 15px ${glowColor}`,
        }}
      />

      {/* 背景帯（上下から挟む） */}
      <div
        className="absolute cutin-band-left"
        style={{
          width: '100%', height: '50%',
          top: '25%',
          background: `linear-gradient(180deg, transparent, ${bandColor} 20%, ${bandColor} 80%, transparent)`,
        }}
      />

      {/* 集中線エフェクト（放射状） */}
      {[...Array(12)].map((_, i) => (
        <div
          key={i}
          className="absolute"
          style={{
            width: '200%',
            height: '2px',
            top: '50%',
            left: '50%',
            transformOrigin: '0% 50%',
            transform: `rotate(${i * 30}deg)`,
            background: `linear-gradient(90deg, transparent 40%, ${mainColor}40 60%, transparent)`,
            animation: `cutin-speed-line 0.6s ease-out ${0.1 + i * 0.02}s forwards`,
            opacity: 0,
          }}
        />
      ))}

      {/* テキスト（方向付きスライドイン） */}
      <div
        className={`relative ${slideClass || 'cutin-text'}`}
        style={{
          fontFamily: '"Yu Mincho", "游明朝", "Hiragino Mincho Pro", "ヒラギノ明朝 Pro", "MS PMincho", serif',
          fontSize: isRiichi ? '6rem' : '8rem',
          fontWeight: 900,
          color: mainColor,
          textShadow: `0 0 40px ${glowColor}, 0 0 80px ${glowColor}, 0 4px 8px rgba(0,0,0,0.8), 0 0 120px ${glowColor}`,
          letterSpacing: '0.3em',
          WebkitTextStroke: `2px ${mainColor}`,
          zIndex: 10,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
        }}
      >
        {/* 家の表示（対面・上家・下家） */}
        {windLabel && (
          <div style={{
            fontSize: '1.5rem',
            letterSpacing: '0.1em',
            WebkitTextStroke: `1px ${mainColor}`,
            marginBottom: '-0.5rem',
          }}>
            {windLabel}
          </div>
        )}
        {text}
      </div>
    </div>
  );
};

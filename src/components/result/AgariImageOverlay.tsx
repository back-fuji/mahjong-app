import React from 'react';

interface AgariImageOverlayProps {
  isTsumo: boolean;
  /** 和了者の相対位置: 0=自分(下), 1=右(下家), 2=上(対面), 3=左(上家) */
  direction: number;
}

// 方向ごとに画像を画面中央からその方向へオフセット
const OFFSET_STYLES: React.CSSProperties[] = [
  { marginTop: '18vh' },   // 0: 下（自分）
  { marginLeft: '25vw' },  // 1: 右（下家）
  { marginTop: '-18vh' },  // 2: 上（対面）
  { marginLeft: '-25vw' }, // 3: 左（上家）
];

export const AgariImageOverlay: React.FC<AgariImageOverlayProps> = ({ isTsumo, direction }) => {
  const imgSrc = isTsumo ? '/agari/tumo.png' : '/agari/ron.png';
  const offsetStyle = OFFSET_STYLES[direction] ?? OFFSET_STYLES[0];

  return (
    <div
      className="fixed inset-0 z-[200] pointer-events-none flex items-center justify-center"
      style={{ background: 'rgba(0,0,0,0.45)' }}
    >
      <img
        src={imgSrc}
        alt={isTsumo ? 'ツモ' : 'ロン'}
        className="agari-image-appear"
        style={{
          width: 'min(42vw, 320px)',
          height: 'auto',
          ...offsetStyle,
          filter: 'drop-shadow(0 0 24px rgba(255,220,80,0.7))',
        }}
      />
    </div>
  );
};

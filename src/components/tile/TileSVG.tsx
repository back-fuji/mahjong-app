import React from 'react';
import type { TileId, TileInstance } from '../../core/types/tile.ts';
import { TON, NAN, SHA, PEI, HAKU, HATSU, CHUN } from '../../core/types/tile.ts';

interface TileSVGProps {
  tile?: TileInstance | null;
  tileId?: TileId;
  width?: number;
  height?: number;
  faceDown?: boolean;
  onClick?: () => void;
  selected?: boolean;
  dimmed?: boolean;
  sideways?: boolean;
  /** 追加回転角度（sidewaysと合算される。-90=左回転, 90=右回転, 180=逆さ） */
  rotation?: -90 | 90 | 180;
  /** 鳴き対象のハイライト（オレンジの光） */
  highlighted?: boolean;
  className?: string;
}

// tileId と isRed から /tiles/ 配下の画像パスを返す
function getTileImagePath(tileId: number, isRed: boolean): string {
  // 赤ドラ
  if (isRed) {
    if (tileId === 4)  return '/tiles/aka3-66-90-l.png'; // 赤五萬
    if (tileId === 13) return '/tiles/aka1-66-90-l.png'; // 赤五筒
    if (tileId === 22) return '/tiles/aka2-66-90-l.png'; // 赤五索
  }
  // 萬子 (tileId 0-8)
  if (tileId >= 0 && tileId <= 8) {
    return `/tiles/man${tileId + 1}-66-90-l.png`;
  }
  // 筒子 (tileId 9-17)
  if (tileId >= 9 && tileId <= 17) {
    return `/tiles/pin${tileId - 8}-66-90-l.png`;
  }
  // 索子 (tileId 18-26)
  if (tileId >= 18 && tileId <= 26) {
    return `/tiles/sou${tileId - 17}-66-90-l.png`;
  }
  // 字牌
  const jiMap: Record<number, string> = {
    [TON]:   '/tiles/ji1-66-90-l.png', // 東
    [NAN]:   '/tiles/ji2-66-90-l.png', // 南
    [SHA]:   '/tiles/ji3-66-90-l.png', // 西
    [PEI]:   '/tiles/ji4-66-90-l.png', // 北
    [HATSU]: '/tiles/ji5-66-90-l.png', // 發
    [HAKU]:  '/tiles/ji6-66-90-l.png', // 白
    [CHUN]:  '/tiles/ji7-66-90-l.png', // 中
  };
  return jiMap[tileId] ?? '/tiles/man1-66-90-l.png';
}

export const TileSVG: React.FC<TileSVGProps> = ({
  tile,
  tileId: propTileId,
  width = 40,
  height = 56,
  faceDown = false,
  onClick,
  selected = false,
  dimmed = false,
  sideways = false,
  rotation,
  highlighted = false,
  className = '',
}) => {
  const tileId = tile?.id ?? propTileId ?? 0;
  const isRed = tile?.isRed ?? false;

  // sideways（90度）+ rotation（追加角度）を合算
  const totalAngle = ((sideways ? 90 : 0) + (rotation ?? 0) + 360) % 360;
  const isSwapped = totalAngle === 90 || totalAngle === 270;
  const wrapperW = isSwapped ? height : width;
  const wrapperH = isSwapped ? width : height;

  const wrapTile = (el: React.ReactElement) => (
    <div style={{ width: wrapperW, height: wrapperH, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
      {el}
    </div>
  );

  if (faceDown) {
    const svgEl = (
      <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} className={className}
        style={{ transform: totalAngle !== 0 ? `rotate(${totalAngle}deg)` : undefined }}>
        {/* 牌の裏面 */}
        <rect x="0.5" y="0.5" width={width - 1} height={height - 1} rx="2.5" fill="#6B5040" />
        <rect x="1.5" y="1.5" width={width - 3} height={height - 3} rx="2" fill="#1a3a6a" />
        <rect x="3" y="3" width={width - 6} height={height - 6} rx="1.5" fill="#1e4080" />
        {/* 裏面模様 */}
        <line x1={width * 0.2} y1={height * 0.2} x2={width * 0.8} y2={height * 0.8} stroke="rgba(255,255,255,0.15)" strokeWidth="1" />
        <line x1={width * 0.8} y1={height * 0.2} x2={width * 0.2} y2={height * 0.8} stroke="rgba(255,255,255,0.15)" strokeWidth="1" />
      </svg>
    );
    return totalAngle !== 0 ? wrapTile(svgEl) : svgEl;
  }

  const isClickable = !!onClick;
  const glowFilter = selected
    ? 'drop-shadow(0 0 8px #fbbf24) drop-shadow(0 0 16px #f59e0b)'
    : highlighted
      ? 'drop-shadow(0 0 6px #fb923c) drop-shadow(0 0 12px #f97316)'
      : undefined;

  const transformParts: string[] = [];
  if (totalAngle !== 0) transformParts.push(`rotate(${totalAngle}deg)`);
  if (selected) transformParts.push('translateY(-12px) scale(1.05)');
  const transformStr = transformParts.join(' ') || undefined;

  const imgPath = getTileImagePath(tileId, isRed);

  const svgEl = (
    <svg
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      className={`${className} ${isClickable ? 'cursor-pointer hover:brightness-110' : ''}`}
      onClick={onClick}
      {...(isClickable ? { 'data-interactive-tile': 'true' } : {})}
      style={{
        transition: 'transform 0.15s ease-out, filter 0.15s ease-out',
        transform: transformStr,
        filter: dimmed ? 'brightness(0.6)' : glowFilter,
      }}
    >
      {/* 牌画像 */}
      <image href={imgPath} x="0" y="0" width={width} height={height} preserveAspectRatio="xMidYMid meet" />

      {/* 選択ハイライト枠 */}
      {selected && (
        <rect x="0" y="0" width={width} height={height} rx="3"
          fill="none" stroke="#fbbf24" strokeWidth="2.5" opacity="0.9" />
      )}
      {/* 鳴き対象ハイライト */}
      {highlighted && !selected && (
        <rect x="0" y="0" width={width} height={height} rx="3"
          fill="none" stroke="#f97316" strokeWidth="2" opacity="0.85" />
      )}
      {/* クリック可能インジケーター */}
      {isClickable && !selected && (
        <rect x="1.5" y="1.5" width={width - 3} height={height - 3} rx="2"
          fill="none" stroke="#4ade80" strokeWidth="1" strokeDasharray="3 2" opacity="0.6" />
      )}
    </svg>
  );

  return totalAngle !== 0 ? wrapTile(svgEl) : svgEl;
};

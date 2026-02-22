import React from 'react';
import type { TileId, TileInstance } from '../../core/types/tile.ts';
import { HAKU, HATSU, CHUN, TON, NAN, SHA, PEI } from '../../core/types/tile.ts';
import { getSuit, SuitType, tileNumber } from '../../core/tile/tile-utils.ts';

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

  const suit = getSuit(tileId);
  const num = tileNumber(tileId);

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
      {/* ===== 牌の本体（リアルデザイン） ===== */}
      {renderTileBody(width, height, selected)}

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

      {/* ===== 牌面の絵柄 ===== */}
      {suit === SuitType.Jihai
        ? renderHonorTile(tileId, width, height)
        : suit === SuitType.Man
          ? renderManTile(num, isRed, width, height)
          : suit === SuitType.Pin
            ? renderPinTile(num, isRed, width, height)
            : renderSouTile(num, isRed, width, height)
      }
    </svg>
  );

  return totalAngle !== 0 ? wrapTile(svgEl) : svgEl;
};

// ============================================================
// 牌の本体（アイボリー色）
// ============================================================
function renderTileBody(w: number, h: number, selected: boolean): React.ReactNode {
  const face = selected ? '#FFFBEB' : '#F4ECC0';
  const border = selected ? '#C8A800' : '#7A6040';
  return (
    <>
      <rect x="0" y="0" width={w} height={h} rx="3" fill={border} />
      <rect x="1" y="1" width={w - 2} height={h - 2} rx="2.5" fill={face} />
    </>
  );
}

// ============================================================
// 萬子（Man）: 赤漢数字 + 萬
// ============================================================
const MAN_CHARS = ['一', '二', '三', '四', '五', '六', '七', '八', '九'];

function renderManTile(num: number, isRed: boolean, w: number, h: number): React.ReactNode {
  const color = isRed ? '#CC0000' : '#CC2222';
  const numChar = MAN_CHARS[num] ?? String(num + 1);
  return (
    <g>
      <text
        x={w / 2} y={h * 0.44}
        textAnchor="middle" dominantBaseline="middle"
        fontSize={h * 0.40} fontWeight="bold" fill={color}
        fontFamily="'Noto Serif SC', 'Noto Serif JP', serif"
        style={{ userSelect: 'none' }}
      >
        {numChar}
      </text>
      <text
        x={w / 2} y={h * 0.78}
        textAnchor="middle" dominantBaseline="middle"
        fontSize={h * 0.22} fontWeight="bold" fill={color}
        fontFamily="'Noto Serif SC', 'Noto Serif JP', serif"
        style={{ userSelect: 'none' }}
      >
        萬
      </text>
    </g>
  );
}

// ============================================================
// 筒子（Pin）: 同心円（筒を正面から見た形）
// ============================================================
// 各数字の円の位置 [x率, y率][]
const PIN_DOTS: Array<Array<[number, number]>> = [
  [[0.5, 0.50]],                                                                    // 1
  [[0.5, 0.30], [0.5, 0.70]],                                                       // 2
  [[0.5, 0.22], [0.5, 0.50], [0.5, 0.78]],                                         // 3
  [[0.30, 0.28], [0.70, 0.28], [0.30, 0.72], [0.70, 0.72]],                        // 4
  [[0.30, 0.23], [0.70, 0.23], [0.50, 0.50], [0.30, 0.77], [0.70, 0.77]],         // 5
  [[0.30, 0.20], [0.70, 0.20], [0.30, 0.50], [0.70, 0.50], [0.30, 0.80], [0.70, 0.80]], // 6
  [[0.50, 0.13], [0.30, 0.35], [0.70, 0.35], [0.30, 0.57], [0.70, 0.57], [0.30, 0.79], [0.70, 0.79]], // 7
  [[0.30, 0.14], [0.70, 0.14], [0.30, 0.38], [0.70, 0.38], [0.30, 0.62], [0.70, 0.62], [0.30, 0.86], [0.70, 0.86]], // 8
  [[0.22, 0.18], [0.50, 0.18], [0.78, 0.18], [0.22, 0.50], [0.50, 0.50], [0.78, 0.50], [0.22, 0.82], [0.50, 0.82], [0.78, 0.82]], // 9
];

function renderPinTile(num: number, isRed: boolean, w: number, h: number): React.ReactNode {
  const dots = PIN_DOTS[num] ?? [];
  // 1筒は大きめ、多い数字は小さめ
  const baseR = num === 0
    ? Math.min(w, h) * 0.28
    : num <= 2
      ? Math.min(w, h) * 0.16
      : Math.min(w, h) * 0.13;

  // 色: 赤ドラは赤系、通常は緑系（リアルの筒子に合わせた同心円）
  const c1 = isRed ? '#9B1010' : '#1A6B3A'; // 外リング
  const c2 = isRed ? '#CC3333' : '#3A9B5A'; // 中リング
  const c3 = isRed ? '#FFAAAA' : '#C0EEC8'; // 中央（筒の穴）

  return (
    <g>
      {dots.map(([fx, fy], i) => {
        const cx = fx * w;
        const cy = fy * h;
        return (
          <g key={i}>
            <circle cx={cx} cy={cy} r={baseR} fill={c1} />
            <circle cx={cx} cy={cy} r={baseR * 0.70} fill={c2} />
            <circle cx={cx} cy={cy} r={baseR * 0.40} fill={c3} />
          </g>
        );
      })}
    </g>
  );
}

// ============================================================
// 索子（Sou）: 竹の柄
// ============================================================
// [列X率, 本数][] で竹の配置を定義
const SOU_LAYOUT: Array<Array<[number, number]>> = [
  [[0.50, 1]],                              // 1
  [[0.50, 2]],                              // 2
  [[0.50, 3]],                              // 3
  [[0.32, 2], [0.68, 2]],                   // 4
  [[0.32, 2], [0.68, 3]],                   // 5
  [[0.32, 3], [0.68, 3]],                   // 6
  [[0.20, 3], [0.50, 1], [0.80, 3]],       // 7
  [[0.32, 4], [0.68, 4]],                   // 8
  [[0.20, 3], [0.50, 3], [0.80, 3]],       // 9
];

function renderSouTile(num: number, isRed: boolean, w: number, h: number): React.ReactNode {
  const layout = SOU_LAYOUT[num] ?? [[0.5, 1]];
  const numCols = layout.length;

  const bambooW = w * (numCols === 1 ? 0.30 : numCols === 2 ? 0.24 : 0.18);
  const padY = h * 0.07;

  const bambooColor = isRed ? '#CC2222' : '#2A7D3E';
  const nodeColor   = isRed ? '#881111' : '#1A5020';

  const isOneSou = num === 0;

  return (
    <g>
      {layout.map(([colX, count], colIdx) => {
        const cx = colX * w;
        const availH = h - 2 * padY;

        if (isOneSou && colIdx === 0) {
          const birdR = bambooW * 0.50;
          const birdY = padY + birdR;
          const stickTop = birdY + birdR + h * 0.03;
          const stickH = h - stickTop - padY;
          return (
            <g key={colIdx}>
              <circle cx={cx} cy={birdY} r={birdR} fill="#1E8040" />
              <circle cx={cx} cy={birdY} r={birdR * 0.48} fill="#4CAF50" />
              <rect x={cx - bambooW / 2} y={stickTop} width={bambooW} height={stickH} rx={bambooW * 0.2} fill={bambooColor} />
              <line x1={cx - bambooW / 2 + 0.5} y1={stickTop + stickH * 0.5} x2={cx + bambooW / 2 - 0.5} y2={stickTop + stickH * 0.5}
                stroke={nodeColor} strokeWidth="1" />
            </g>
          );
        }

        const gap = count > 1 ? availH * 0.08 : 0;
        const segH = (availH - gap * (count - 1)) / count;
        return Array.from({ length: count }, (_, segIdx) => {
          const segTop = padY + segIdx * (segH + gap);
          const midY = segTop + segH * 0.5;
          return (
            <g key={`${colIdx}-${segIdx}`}>
              <rect x={cx - bambooW / 2} y={segTop} width={bambooW} height={segH} rx={bambooW * 0.2} fill={bambooColor} />
              <line x1={cx - bambooW / 2 + 0.5} y1={midY} x2={cx + bambooW / 2 - 0.5} y2={midY}
                stroke={nodeColor} strokeWidth="0.8" />
            </g>
          );
        });
      })}
    </g>
  );
}

// ============================================================
// 字牌（Honor）
// ============================================================
const JIHAI_MAP: Record<number, { char: string; color: string }> = {
  [TON]:  { char: '東', color: '#1A1A1A' },
  [NAN]:  { char: '南', color: '#1A1A1A' },
  [SHA]:  { char: '西', color: '#1A1A1A' },
  [PEI]:  { char: '北', color: '#1A1A1A' },
  [HAKU]: { char: '',   color: '#888888' },
  [HATSU]:{ char: '發', color: '#1A7A2A' },
  [CHUN]: { char: '中', color: '#CC1111' },
};

function renderHonorTile(tileId: number, w: number, h: number): React.ReactNode {
  const info = JIHAI_MAP[tileId];
  if (!info) return null;

  // 白（発光する枠だけ）
  if (tileId === HAKU) {
    return (
      <rect
        x={w * 0.18} y={h * 0.18}
        width={w * 0.64} height={h * 0.64}
        rx="2"
        fill="none" stroke="#777777" strokeWidth={Math.max(1, w * 0.05)}
      />
    );
  }

  return (
    <text
      x={w / 2} y={h * 0.50 + 1}
      textAnchor="middle" dominantBaseline="middle"
      fontSize={h * 0.52} fontWeight="bold" fill={info.color}
      fontFamily="'Noto Serif SC', 'Noto Serif JP', serif"
      style={{ userSelect: 'none' }}
    >
      {info.char}
    </text>
  );
}

import React from 'react';
import type { TileId, TileInstance } from '../../core/types/tile.ts';
import { TILE_SHORT, HAKU, HATSU, CHUN, TON, NAN, SHA, PEI } from '../../core/types/tile.ts';
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
  className?: string;
}

const SUIT_COLORS: Record<number, string> = {
  [SuitType.Man]: '#e22',
  [SuitType.Pin]: '#28a',
  [SuitType.Sou]: '#2a5',
  [SuitType.Jihai]: '#333',
};

const JIHAI_CHARS: Record<number, { char: string; color: string }> = {
  [TON]: { char: '東', color: '#333' },
  [NAN]: { char: '南', color: '#333' },
  [SHA]: { char: '西', color: '#333' },
  [PEI]: { char: '北', color: '#333' },
  [HAKU]: { char: '', color: '#999' },
  [HATSU]: { char: '發', color: '#2a5' },
  [CHUN]: { char: '中', color: '#e22' },
};

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
  className = '',
}) => {
  const tileId = tile?.id ?? propTileId ?? 0;
  const isRed = tile?.isRed ?? false;
  const svgW = sideways ? height : width;
  const svgH = sideways ? width : height;

  if (faceDown) {
    return (
      <svg width={svgW} height={svgH} viewBox={`0 0 ${width} ${height}`} className={className}
        style={{ transform: sideways ? 'rotate(90deg)' : undefined }}>
        <rect x="1" y="1" width={width - 2} height={height - 2} rx="3" fill="#2563eb" stroke="#1e40af" strokeWidth="1" />
        <rect x="4" y="4" width={width - 8} height={height - 8} rx="2" fill="#1d4ed8" />
      </svg>
    );
  }

  const suit = getSuit(tileId);
  const num = tileNumber(tileId);

  return (
    <svg
      width={svgW}
      height={svgH}
      viewBox={`0 0 ${width} ${height}`}
      className={`${className} ${onClick ? 'cursor-pointer' : ''} ${selected ? 'translate-y-[-8px]' : ''} ${dimmed ? 'opacity-40' : ''}`}
      onClick={onClick}
      style={{
        transition: 'transform 0.1s',
        transform: `${sideways ? 'rotate(90deg) ' : ''}${selected ? 'translateY(-8px)' : ''}`,
        filter: dimmed ? 'brightness(0.6)' : undefined,
      }}
    >
      {/* 牌の背景 */}
      <rect x="1" y="1" width={width - 2} height={height - 2} rx="3"
        fill="#f8f6f0" stroke="#888" strokeWidth="1" />

      {/* 牌面 */}
      {suit === SuitType.Jihai ? (
        renderJihai(tileId, width, height)
      ) : (
        renderNumberTile(suit, num, isRed, width, height)
      )}
    </svg>
  );
};

function renderJihai(tileId: number, w: number, h: number): React.ReactNode {
  const info = JIHAI_CHARS[tileId];
  if (!info) return null;

  // 白（白牌 = 枠だけ）
  if (tileId === HAKU) {
    return (
      <rect x={w * 0.2} y={h * 0.2} width={w * 0.6} height={h * 0.6}
        fill="none" stroke="#aaa" strokeWidth="2" rx="2" />
    );
  }

  return (
    <text x={w / 2} y={h / 2 + 2} textAnchor="middle" dominantBaseline="middle"
      fontSize={h * 0.5} fontWeight="bold" fill={info.color}
      fontFamily="serif"
    >
      {info.char}
    </text>
  );
}

function renderNumberTile(suit: SuitType, num: number, isRed: boolean, w: number, h: number): React.ReactNode {
  const color = isRed ? '#e22' : SUIT_COLORS[suit];
  const suitChar = suit === SuitType.Man ? '萬' : suit === SuitType.Pin ? '●' : '';
  const displayNum = num + 1;

  return (
    <g>
      {/* 数字 */}
      <text x={w / 2} y={suit === SuitType.Sou ? h * 0.45 : h * 0.38} textAnchor="middle" dominantBaseline="middle"
        fontSize={h * 0.35} fontWeight="bold" fill={color}
        fontFamily="serif"
      >
        {suit === SuitType.Sou ? renderSouChar(displayNum) : displayNum}
      </text>

      {/* スート表示 */}
      {suit === SuitType.Man && (
        <text x={w / 2} y={h * 0.72} textAnchor="middle" dominantBaseline="middle"
          fontSize={h * 0.25} fill={color} fontFamily="serif"
        >
          萬
        </text>
      )}

      {suit === SuitType.Pin && (
        renderPinDots(displayNum, w, h, color)
      )}

      {suit === SuitType.Sou && (
        <text x={w / 2} y={h * 0.75} textAnchor="middle" dominantBaseline="middle"
          fontSize={h * 0.2} fill={color} fontFamily="serif"
        >
          索
        </text>
      )}
    </g>
  );
}

function renderSouChar(num: number): string {
  const chars = ['', '一', '二', '三', '四', '五', '六', '七', '八', '九'];
  return chars[num] || String(num);
}

function renderPinDots(num: number, w: number, h: number, color: string): React.ReactNode {
  // 簡易版: 数字+●表示
  return (
    <g>
      <text x={w / 2} y={h * 0.7} textAnchor="middle" dominantBaseline="middle"
        fontSize={h * 0.2} fill={color}
      >
        {'●'.repeat(Math.min(num, 3))}
      </text>
      {num > 3 && (
        <text x={w / 2} y={h * 0.85} textAnchor="middle" dominantBaseline="middle"
          fontSize={h * 0.15} fill={color}
        >
          {'●'.repeat(Math.min(num - 3, 3))}
        </text>
      )}
    </g>
  );
}

import React from 'react';
import type { TileInstance } from '../../core/types/tile.ts';
import { TileSVG } from '../tile/TileSVG.tsx';

interface DiscardPoolProps {
  discards: TileInstance[];
  riichiTurn: number;
  tileWidth?: number;
  tileHeight?: number;
}

export const DiscardPool: React.FC<DiscardPoolProps> = ({
  discards,
  riichiTurn,
  tileWidth = 30,
  tileHeight = 42,
}) => {
  // 6枚×3段
  const rows: TileInstance[][] = [[], [], []];
  discards.forEach((tile, i) => {
    const row = Math.min(Math.floor(i / 6), 2);
    rows[row].push(tile);
  });

  return (
    <div className="flex flex-col items-center gap-0">
      {rows.map((row, ri) => (
        <div key={ri} className="flex">
          {row.map((tile, ti) => {
            const globalIdx = ri * 6 + ti;
            const isRiichi = riichiTurn >= 0 && globalIdx === riichiTurn;
            return (
              <TileSVG
                key={tile.index}
                tile={tile}
                width={tileWidth}
                height={tileHeight}
                sideways={isRiichi}
              />
            );
          })}
        </div>
      ))}
    </div>
  );
};

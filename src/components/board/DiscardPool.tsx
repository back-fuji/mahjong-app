import React from 'react';
import type { TileInstance } from '../../core/types/tile.ts';
import { TileSVG } from '../tile/TileSVG.tsx';

interface DiscardPoolProps {
  discards: TileInstance[];
  riichiTurn: number;
  tileWidth?: number;
  tileHeight?: number;
  /** 縦向き配置（左右プレイヤー用） */
  vertical?: boolean;
}

export const DiscardPool: React.FC<DiscardPoolProps> = ({
  discards,
  riichiTurn,
  tileWidth = 30,
  tileHeight = 42,
  vertical = false,
}) => {
  if (vertical) {
    // 縦向き: 3枚×複数列
    const cols: TileInstance[][] = [];
    discards.forEach((tile, i) => {
      const col = Math.floor(i / 3);
      if (!cols[col]) cols[col] = [];
      cols[col].push(tile);
    });

    return (
      <div className="flex flex-row gap-0">
        {cols.map((col, ci) => (
          <div key={ci} className="flex flex-col">
            {col.map((tile, ti) => {
              const globalIdx = ci * 3 + ti;
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
  }

  // 横向き: 6枚×4段（流局時24枚対応）
  const rows: TileInstance[][] = [[], [], [], []];
  discards.forEach((tile, i) => {
    const row = Math.min(Math.floor(i / 6), 3);
    rows[row].push(tile);
  });

  return (
    <div className="flex flex-col items-center gap-0">
      {rows.map((row, ri) => (
        row.length > 0 && (
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
        )
      ))}
    </div>
  );
};

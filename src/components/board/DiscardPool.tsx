import React from 'react';
import { motion } from 'framer-motion';
import type { TileInstance } from '../../core/types/tile.ts';
import { TileSVG } from '../tile/TileSVG.tsx';

interface DiscardPoolProps {
  discards: TileInstance[];
  /** リーチ宣言牌の捨て牌配列中のインデックス (-1なら未リーチ) */
  riichiDiscardIndex: number;
  tileWidth?: number;
  tileHeight?: number;
  /** 縦向き配置（左右プレイヤー用） */
  vertical?: boolean;
  /** 最後の捨て牌をハイライト */
  highlightLast?: boolean;
  /** プレイヤーの位置（捨て牌の並び方向を制御） */
  position?: 'bottom' | 'top' | 'left' | 'right';
}

/** 最後の牌に入場アニメーションを付与するラッパー */
const AnimatedTileWrapper: React.FC<{ isLast: boolean; children: React.ReactNode }> = ({ isLast, children }) => {
  if (!isLast) return <>{children}</>;
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.5 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.15, ease: 'easeOut' }}
      style={{ display: 'inline-flex' }}
    >
      {children}
    </motion.div>
  );
};

export const DiscardPool: React.FC<DiscardPoolProps> = ({
  discards,
  riichiDiscardIndex,
  tileWidth = 30,
  tileHeight = 42,
  vertical = false,
  highlightLast = false,
  position = 'bottom',
}) => {
  const lastIdx = highlightLast && discards.length > 0 ? discards.length - 1 : -1;
  // リーチ宣言牌の実効インデックス。そのインデックスの牌が存在するなら横向きにする。
  // riichiDiscardIndex が設定されていれば、そのインデックス以降で最初に存在する牌を横向き表示
  const riichiTurn = riichiDiscardIndex;

  if (vertical) {
    // 縦向き: 3枚×複数列
    const cols: TileInstance[][] = [];
    discards.forEach((tile, i) => {
      const col = Math.floor(i / 3);
      if (!cols[col]) cols[col] = [];
      cols[col].push(tile);
    });

    // 右プレイヤー: そのプレイヤーから見て左→右に並ぶように、
    //   自分(下)からは上から下に列が進み、各列は右から左に牌が並ぶ
    // 左プレイヤー: そのプレイヤーから見て左→右に並ぶように、
    //   自分(下)からは下から上に列が進み、各列は左から右に牌が並ぶ

    if (position === 'right') {
      // 右プレイヤー: 列は上→下(そのまま)、各列内は逆順(下→上)
      return (
        <div className="flex flex-col gap-0">
          {cols.map((col, ci) => (
            <div key={ci} className="flex flex-row-reverse">
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
                    highlighted={globalIdx === lastIdx}
                  />
                );
              })}
            </div>
          ))}
        </div>
      );
    }

    if (position === 'left') {
      // 左プレイヤー: 列は下→上(逆順)、各列内はそのまま(上→下)
      return (
        <div className="flex flex-col-reverse gap-0">
          {cols.map((col, ci) => (
            <div key={ci} className="flex flex-row">
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
                    highlighted={globalIdx === lastIdx}
                  />
                );
              })}
            </div>
          ))}
        </div>
      );
    }

    // デフォルトの縦向き（以前の挙動）
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
                  highlighted={globalIdx === lastIdx}
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

  // 対面（上）は180度回転: 行も牌も逆順に並べる
  if (position === 'top') {
    return (
      <div className="flex flex-col items-center gap-0">
        {[...rows].reverse().map((row, ri) => (
          row.length > 0 && (
            <div key={ri} className="flex flex-row-reverse">
              {row.map((tile, ti) => {
                // 元のインデックスを復元
                const origRowIdx = 3 - ri;
                const origTileIdx = row.length - 1 - ti;
                const globalIdx = origRowIdx * 6 + origTileIdx;
                const isRiichi = riichiTurn >= 0 && globalIdx === riichiTurn;
                return (
                  <TileSVG
                    key={tile.index}
                    tile={tile}
                    width={tileWidth}
                    height={tileHeight}
                    sideways={isRiichi}
                    highlighted={globalIdx === lastIdx}
                  />
                );
              })}
            </div>
          )
        ))}
      </div>
    );
  }

  // 自分（下）：通常の向き
  return (
    <div className="flex flex-col items-center gap-0">
      {rows.map((row, ri) => (
        row.length > 0 && (
          <div key={ri} className="flex">
            {row.map((tile, ti) => {
              const globalIdx = ri * 6 + ti;
              const isRiichi = riichiTurn >= 0 && globalIdx === riichiTurn;
              return (
                <AnimatedTileWrapper key={tile.index} isLast={globalIdx === discards.length - 1}>
                  <TileSVG
                    tile={tile}
                    width={tileWidth}
                    height={tileHeight}
                    sideways={isRiichi}
                    highlighted={globalIdx === lastIdx}
                  />
                </AnimatedTileWrapper>
              );
            })}
          </div>
        )
      ))}
    </div>
  );
};

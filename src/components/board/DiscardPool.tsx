import React from 'react';
import { motion } from 'framer-motion';
import type { TileId, TileInstance } from '../../core/types/tile.ts';
import { TileSVG } from '../tile/TileSVG.tsx';

interface DiscardPoolProps {
  discards: TileInstance[];
  /** リーチ宣言牌の捨て牌配列中のインデックス (-1なら未リーチ) */
  riichiDiscardIndex: number;
  /** リーチ宣言牌のユニークID（tile.index）。指定時はこちらで照合 */
  riichiTileUniqueIndex?: number;
  tileWidth?: number;
  tileHeight?: number;
  /** 最後の捨て牌をハイライト */
  highlightLast?: boolean;
  /** 手牌で選択した牌の種類（TileId）。同じ種類の捨て牌をハイライト */
  highlightTileId?: TileId;
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
  highlightLast = false,
  highlightTileId,
  position = 'bottom',
}) => {
  const lastIdx = highlightLast && discards.length > 0 ? discards.length - 1 : -1;
  const riichiTurn = riichiDiscardIndex;

  const isHighlighted = (tile: TileInstance, globalIdx: number) =>
    globalIdx === lastIdx || (highlightTileId != null && tile.id === highlightTileId);

  // 横向き: 6枚×4段（流局時24枚対応）
  const rows: TileInstance[][] = [[], [], [], []];
  discards.forEach((tile, i) => {
    const row = Math.min(Math.floor(i / 6), 3);
    rows[row].push(tile);
  });

  // 左右プレイヤー: 通常レイアウト（6列×4段）を丸ごと回転
  if (position === 'right') {
    // 右プレイヤー: 通常の並びを -90度回転（反時計回り）
    // 元の並びは自分(bottom)と同じ左→右、上→下
    // 回転後は上が自分側（中央側）になる
    return (
      <div
        style={{ transform: 'rotate(-90deg)', transformOrigin: 'center center' }}
      >
        <div className="flex flex-col items-start gap-0">
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
                      highlighted={isHighlighted(tile, globalIdx)}
                    />
                  );
                })}
              </div>
            )
          ))}
        </div>
      </div>
    );
  }

  if (position === 'left') {
    // 左プレイヤー: 通常の並びを +90度回転（時計回り）
    return (
      <div
        style={{ transform: 'rotate(90deg)', transformOrigin: 'center center' }}
      >
        <div className="flex flex-col items-start gap-0">
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
                      highlighted={isHighlighted(tile, globalIdx)}
                    />
                  );
                })}
              </div>
            )
          ))}
        </div>
      </div>
    );
  }

  // 対面（上）: 行も牌も逆順に並べ、各牌を180度回転させて対面プレイヤー向きに
  if (position === 'top') {
    return (
      <div className="flex flex-col items-end gap-0">
        {[...rows].reverse().map((row, ri) => (
          row.length > 0 && (
            <div key={ri} className="flex flex-row-reverse">
              {row.map((tile, ti) => {
                // 元のインデックスを復元（tiは元の行内順序をそのまま保持）
                const origRowIdx = 3 - ri;
                const globalIdx = origRowIdx * 6 + ti;
                const isRiichi = riichiTurn >= 0 && globalIdx === riichiTurn;
                return (
                  <TileSVG
                    key={tile.index}
                    tile={tile}
                    width={tileWidth}
                    height={tileHeight}
                    sideways={isRiichi}
                    rotation={180}
                    highlighted={isHighlighted(tile, globalIdx)}
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
    <div className="flex flex-col items-start gap-0">
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
                    highlighted={isHighlighted(tile, globalIdx)}
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

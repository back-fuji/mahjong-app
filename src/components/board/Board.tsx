import React, { useMemo } from 'react';
import type { GameState } from '../../core/types/game-state.ts';
import type { TileId, TileInstance } from '../../core/types/tile.ts';
import { HandDisplay } from '../hand/HandDisplay.tsx';
import { DiscardPool } from './DiscardPool.tsx';
import { CenterInfo } from './CenterInfo.tsx';
import { useWindowSize } from '../../hooks/useWindowSize.ts';

interface BoardProps {
  gameState: GameState;
  humanPlayerIndex: number;
  selectedTile: TileInstance | null;
  onTileClick: (tile: TileInstance) => void;
  /** 鳴き対象のハイライト牌ID */
  highlightTileIds?: TileId[];
  /** 最後の打牌をハイライトするプレイヤーのインデックス（-1 = なし） */
  highlightLastDiscardPlayer?: number;
  /** 喰い替え禁止牌ID（dimmed表示用） */
  dimmedTileIds?: TileId[];
  /** ドラッグ開始 */
  onDragStart?: (tile: TileInstance) => void;
  /** ドロップ（打牌） */
  onDrop?: (tile: TileInstance) => void;
}

export const Board: React.FC<BoardProps> = ({
  gameState,
  humanPlayerIndex,
  selectedTile,
  onTileClick,
  highlightTileIds,
  highlightLastDiscardPlayer = -1,
  dimmedTileIds,
  onDragStart,
  onDrop,
}) => {
  const { players, round, currentPlayer, doraIndicators } = gameState;
  const windowSize = useWindowSize();

  // 相対位置: 0=自分(下), 1=右, 2=対面, 3=左
  const getRelativeIndex = (rel: number) => (humanPlayerIndex + rel) % 4;

  const bottomIdx = humanPlayerIndex;
  const rightIdx = getRelativeIndex(1);
  const topIdx = getRelativeIndex(2);
  const leftIdx = getRelativeIndex(3);

  // レスポンシブ牌サイズ計算
  const sizes = useMemo(() => {
    const w = windowSize.width;
    const isMobile = w < 640;
    const isTablet = w >= 640 && w < 1024;

    if (isMobile) {
      return {
        topDiscard: { w: 18, h: 24 },
        sideDiscard: { w: 15, h: 20 },
        bottomDiscard: { w: 20, h: 28 },
        topHand: { w: 16, h: 22 },
        sideHand: { w: 13, h: 18 },
        bottomHand: { w: 30, h: 42 },
      };
    }
    if (isTablet) {
      return {
        topDiscard: { w: 22, h: 30 },
        sideDiscard: { w: 18, h: 24 },
        bottomDiscard: { w: 24, h: 34 },
        topHand: { w: 20, h: 28 },
        sideHand: { w: 15, h: 22 },
        bottomHand: { w: 38, h: 52 },
      };
    }
    return {
      topDiscard: { w: 26, h: 36 },
      sideDiscard: { w: 22, h: 30 },
      bottomDiscard: { w: 28, h: 38 },
      topHand: { w: 24, h: 34 },
      sideHand: { w: 18, h: 26 },
      bottomHand: { w: 48, h: 66 },
    };
  }, [windowSize.width]);

  const { topDiscard, sideDiscard, bottomDiscard } = sizes;

  // 左右の捨て牌エリア
  const sideDiscardArea = { w: sideDiscard.w * 6, h: sideDiscard.h * 3 };

  return (
    <div className="w-full h-full flex flex-col items-center justify-between p-2 select-none">
      {/* 上（対面） - 手牌（外側）→ 捨て牌（中央寄り） */}
      <div className="flex flex-col items-center gap-0 flex-shrink-0">
        <HandDisplay
          hand={players[topIdx].hand}
          isCurrentPlayer={false}
          showTiles={false}
          tileWidth={sizes.topHand.w}
          tileHeight={sizes.topHand.h}
        />
        <div className="flex items-end justify-center" style={{ minHeight: topDiscard.h * 4 }}>
          <DiscardPool
            discards={players[topIdx].discards}
            riichiDiscardIndex={players[topIdx].riichiDiscardIndex}
            tileWidth={topDiscard.w}
            tileHeight={topDiscard.h}
            highlightLast={highlightLastDiscardPlayer === topIdx}
            position="top"
          />
        </div>
      </div>

      {/* 中段: 左・中央・右 — 捨て牌を中央寄りに配置 */}
      <div className="flex items-center justify-center w-full max-w-6xl flex-shrink-0">
        {/* 左（上家）- 手牌（左外側）→ 捨て牌（中央寄り） */}
        <div className="flex flex-row items-center gap-0.5 flex-shrink-0">
          <HandDisplay
            hand={players[leftIdx].hand}
            isCurrentPlayer={false}
            showTiles={false}
            tileWidth={sizes.sideHand.w}
            tileHeight={sizes.sideHand.h}
            vertical={true}
          />
          <div style={{ width: sideDiscardArea.w, height: sideDiscardArea.h }} className="flex items-center justify-end">
            <DiscardPool
              discards={players[leftIdx].discards}
              riichiDiscardIndex={players[leftIdx].riichiDiscardIndex}
              tileWidth={sideDiscard.w}
              tileHeight={sideDiscard.h}
              vertical={true}
              highlightLast={highlightLastDiscardPlayer === leftIdx}
              position="left"
            />
          </div>
        </div>

        {/* 中央情報（局情報+ドラ内蔵） */}
        <div className="flex flex-col items-center flex-shrink-0 mx-2">
          <CenterInfo
            round={round}
            players={players}
            currentPlayer={currentPlayer}
            doraIndicators={doraIndicators}
            myIndex={humanPlayerIndex}
          />
        </div>

        {/* 右（下家）- 捨て牌（中央寄り）→ 手牌（右外側） */}
        <div className="flex flex-row items-center gap-0.5 flex-shrink-0">
          <div style={{ width: sideDiscardArea.w, height: sideDiscardArea.h }} className="flex items-center justify-start">
            <DiscardPool
              discards={players[rightIdx].discards}
              riichiDiscardIndex={players[rightIdx].riichiDiscardIndex}
              tileWidth={sideDiscard.w}
              tileHeight={sideDiscard.h}
              vertical={true}
              highlightLast={highlightLastDiscardPlayer === rightIdx}
              position="right"
            />
          </div>
          <HandDisplay
            hand={players[rightIdx].hand}
            isCurrentPlayer={false}
            showTiles={false}
            tileWidth={sizes.sideHand.w}
            tileHeight={sizes.sideHand.h}
            vertical={true}
          />
        </div>
      </div>

      {/* 下（自分） - 捨て牌（中央寄り）→ 手牌（外側） */}
      <div className="flex flex-col items-center gap-0 flex-shrink-0">
        <div
          className="flex items-start justify-center"
          style={{ minHeight: bottomDiscard.h * 3 }}
          onDragOver={(e) => { e.preventDefault(); e.dataTransfer.dropEffect = 'move'; }}
          onDrop={(e) => {
            e.preventDefault();
            try {
              const data = JSON.parse(e.dataTransfer.getData('text/plain'));
              if (data && typeof data.index === 'number' && onDrop) {
                // 手牌からドロップされた牌を見つける
                const player = players[bottomIdx];
                const allTiles = player.hand.tsumo
                  ? [...player.hand.closed, player.hand.tsumo]
                  : [...player.hand.closed];
                const tile = allTiles.find(t => t.index === data.index);
                if (tile) onDrop(tile);
              }
            } catch {}
          }}
        >
          <DiscardPool
            discards={players[bottomIdx].discards}
            riichiDiscardIndex={players[bottomIdx].riichiDiscardIndex}
            tileWidth={bottomDiscard.w}
            tileHeight={bottomDiscard.h}
            highlightLast={highlightLastDiscardPlayer === bottomIdx}
            position="bottom"
          />
        </div>
        <HandDisplay
          hand={players[bottomIdx].hand}
          isCurrentPlayer={currentPlayer === bottomIdx && (gameState.phase === 'discard' || gameState.phase === 'riichi_confirm')}
          selectedTile={selectedTile}
          onTileClick={onTileClick}
          tileWidth={sizes.bottomHand.w}
          tileHeight={sizes.bottomHand.h}
          showTiles={true}
          highlightTileIds={highlightTileIds}
          dimmedTileIds={dimmedTileIds}
          onDragStart={onDragStart}
        />
      </div>
    </div>
  );
};

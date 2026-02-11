import React from 'react';
import type { GameState } from '../../core/types/game-state.ts';
import type { TileId, TileInstance } from '../../core/types/tile.ts';
import { HandDisplay } from '../hand/HandDisplay.tsx';
import { DiscardPool } from './DiscardPool.tsx';
import { CenterInfo } from './CenterInfo.tsx';

interface BoardProps {
  gameState: GameState;
  humanPlayerIndex: number;
  selectedTile: TileInstance | null;
  onTileClick: (tile: TileInstance) => void;
  /** 鳴き対象のハイライト牌ID */
  highlightTileIds?: TileId[];
}

export const Board: React.FC<BoardProps> = ({
  gameState,
  humanPlayerIndex,
  selectedTile,
  onTileClick,
  highlightTileIds,
}) => {
  const { players, round, currentPlayer, doraIndicators } = gameState;

  // 相対位置: 0=自分(下), 1=右, 2=対面, 3=左
  const getRelativeIndex = (rel: number) => (humanPlayerIndex + rel) % 4;

  const bottomIdx = humanPlayerIndex;
  const rightIdx = getRelativeIndex(1);
  const topIdx = getRelativeIndex(2);
  const leftIdx = getRelativeIndex(3);

  // 捨て牌サイズ（小さめに固定）
  const topDiscardW = 26, topDiscardH = 36;
  const sideDiscardW = 22, sideDiscardH = 30;
  const bottomDiscardW = 28, bottomDiscardH = 38;

  // 捨て牌エリアの予約サイズ（最大24枚=6×4行 / 3×8列を想定）
  const topDiscardArea = { w: topDiscardW * 6, h: topDiscardH * 4 };
  const sideDiscardArea = { w: sideDiscardW * 8, h: sideDiscardH * 3 };
  const bottomDiscardArea = { w: bottomDiscardW * 6, h: bottomDiscardH * 4 };

  return (
    <div className="w-full h-full flex flex-col items-center justify-between p-2 select-none">
      {/* 上（対面） - 手牌と捨て牌 */}
      <div className="flex flex-col items-center gap-0.5 flex-shrink-0">
        <HandDisplay
          hand={players[topIdx].hand}
          isCurrentPlayer={false}
          showTiles={false}
          tileWidth={24}
          tileHeight={34}
        />
        <div style={{ width: topDiscardArea.w, height: topDiscardArea.h }} className="flex items-start justify-center">
          <DiscardPool
            discards={players[topIdx].discards}
            riichiTurn={players[topIdx].riichiTurn}
            tileWidth={topDiscardW}
            tileHeight={topDiscardH}
          />
        </div>
      </div>

      {/* 中段: 左・中央・右 */}
      <div className="flex items-center justify-between w-full max-w-6xl flex-shrink-0">
        {/* 左（上家）- 手牌と捨て牌を縦並び */}
        <div className="flex flex-row items-center gap-0.5 flex-shrink-0">
          <HandDisplay
            hand={players[leftIdx].hand}
            isCurrentPlayer={false}
            showTiles={false}
            tileWidth={18}
            tileHeight={26}
            vertical={true}
          />
          <div style={{ width: sideDiscardArea.w, height: sideDiscardArea.h }} className="flex items-center justify-start">
            <DiscardPool
              discards={players[leftIdx].discards}
              riichiTurn={players[leftIdx].riichiTurn}
              tileWidth={sideDiscardW}
              tileHeight={sideDiscardH}
              vertical={true}
            />
          </div>
        </div>

        {/* 中央情報（局情報+ドラ内蔵） */}
        <div className="flex flex-col items-center flex-shrink-0">
          <CenterInfo
            round={round}
            players={players}
            currentPlayer={currentPlayer}
            doraIndicators={doraIndicators}
            myIndex={humanPlayerIndex}
          />
        </div>

        {/* 右（下家）- 捨て牌と手牌を縦並び */}
        <div className="flex flex-row items-center gap-0.5 flex-shrink-0">
          <div style={{ width: sideDiscardArea.w, height: sideDiscardArea.h }} className="flex items-center justify-end">
            <DiscardPool
              discards={players[rightIdx].discards}
              riichiTurn={players[rightIdx].riichiTurn}
              tileWidth={sideDiscardW}
              tileHeight={sideDiscardH}
              vertical={true}
            />
          </div>
          <HandDisplay
            hand={players[rightIdx].hand}
            isCurrentPlayer={false}
            showTiles={false}
            tileWidth={18}
            tileHeight={26}
            vertical={true}
          />
        </div>
      </div>

      {/* 下（自分） - 捨て牌と手牌 */}
      <div className="flex flex-col items-center gap-0.5 flex-shrink-0">
        <div style={{ width: bottomDiscardArea.w, height: bottomDiscardArea.h }} className="flex items-end justify-center">
          <DiscardPool
            discards={players[bottomIdx].discards}
            riichiTurn={players[bottomIdx].riichiTurn}
            tileWidth={bottomDiscardW}
            tileHeight={bottomDiscardH}
          />
        </div>
        <HandDisplay
          hand={players[bottomIdx].hand}
          isCurrentPlayer={currentPlayer === bottomIdx && (gameState.phase === 'discard' || gameState.phase === 'riichi_confirm')}
          selectedTile={selectedTile}
          onTileClick={onTileClick}
          tileWidth={48}
          tileHeight={66}
          showTiles={true}
          highlightTileIds={highlightTileIds}
        />
      </div>
    </div>
  );
};

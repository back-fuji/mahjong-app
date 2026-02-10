import React from 'react';
import type { GameState } from '../../core/types/game-state.ts';
import type { TileInstance } from '../../core/types/tile.ts';
import { HandDisplay } from '../hand/HandDisplay.tsx';
import { DiscardPool } from './DiscardPool.tsx';
import { CenterInfo } from './CenterInfo.tsx';
import { TileSVG } from '../tile/TileSVG.tsx';
import { WIND_NAMES } from '../../core/types/player.ts';

interface BoardProps {
  gameState: GameState;
  humanPlayerIndex: number;
  selectedTile: TileInstance | null;
  onTileClick: (tile: TileInstance) => void;
}

export const Board: React.FC<BoardProps> = ({
  gameState,
  humanPlayerIndex,
  selectedTile,
  onTileClick,
}) => {
  const { players, round, currentPlayer, doraIndicators } = gameState;

  // 相対位置: 0=自分(下), 1=右, 2=対面, 3=左
  const getRelativeIndex = (rel: number) => (humanPlayerIndex + rel) % 4;

  const bottomIdx = humanPlayerIndex;
  const rightIdx = getRelativeIndex(1);
  const topIdx = getRelativeIndex(2);
  const leftIdx = getRelativeIndex(3);

  return (
    <div className="w-full h-full flex flex-col items-center justify-between p-4 select-none">
      {/* 上（対面） - 手牌と捨て牌を横並び */}
      <div className="flex flex-col items-center gap-1">
        <HandDisplay
          hand={players[topIdx].hand}
          isCurrentPlayer={false}
          showTiles={false}
          tileWidth={28}
          tileHeight={38}
        />
        <DiscardPool
          discards={players[topIdx].discards}
          riichiTurn={players[topIdx].riichiTurn}
          tileWidth={32}
          tileHeight={44}
        />
      </div>

      {/* 中段: 左・中央・右 */}
      <div className="flex items-center justify-between w-full max-w-6xl">
        {/* 左（上家）- 手牌と捨て牌を縦並び */}
        <div className="flex flex-row items-center gap-1">
          <HandDisplay
            hand={players[leftIdx].hand}
            isCurrentPlayer={false}
            showTiles={false}
            tileWidth={20}
            tileHeight={28}
            vertical={true}
          />
          <DiscardPool
            discards={players[leftIdx].discards}
            riichiTurn={players[leftIdx].riichiTurn}
            tileWidth={28}
            tileHeight={38}
            vertical={true}
          />
        </div>

        {/* 中央情報 */}
        <div className="flex flex-col items-center gap-3">
          <CenterInfo round={round} players={players} currentPlayer={currentPlayer} myIndex={humanPlayerIndex} />

          {/* ドラ表示 */}
          <div className="flex items-center gap-2">
            <span className="text-base text-gray-300 mr-2">ドラ</span>
            {doraIndicators.map((t, i) => (
              <TileSVG key={i} tile={t} width={36} height={50} />
            ))}
          </div>
        </div>

        {/* 右（下家）- 捨て牌と手牌を縦並び */}
        <div className="flex flex-row items-center gap-1">
          <DiscardPool
            discards={players[rightIdx].discards}
            riichiTurn={players[rightIdx].riichiTurn}
            tileWidth={28}
            tileHeight={38}
            vertical={true}
          />
          <HandDisplay
            hand={players[rightIdx].hand}
            isCurrentPlayer={false}
            showTiles={false}
            tileWidth={20}
            tileHeight={28}
            vertical={true}
          />
        </div>
      </div>

      {/* 下（自分） - 捨て牌と手牌、名前を中央下で表示 */}
      <div className="flex flex-col items-center gap-1">
        <DiscardPool
          discards={players[bottomIdx].discards}
          riichiTurn={players[bottomIdx].riichiTurn}
          tileWidth={36}
          tileHeight={50}
        />
        <HandDisplay
          hand={players[bottomIdx].hand}
          isCurrentPlayer={currentPlayer === bottomIdx && (gameState.phase === 'discard' || gameState.phase === 'riichi_confirm')}
          selectedTile={selectedTile}
          onTileClick={onTileClick}
          tileWidth={52}
          tileHeight={72}
          showTiles={true}
        />
      </div>
    </div>
  );
};

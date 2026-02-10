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
    <div className="w-full h-full flex flex-col items-center justify-between p-2 select-none">
      {/* 上（対面） */}
      <div className="flex flex-col items-center gap-1">
        <div className="flex items-center gap-2 text-sm text-gray-400">
          <span>{WIND_NAMES[players[topIdx].seatWind]}</span>
          <span>{players[topIdx].name}</span>
          <span className="font-mono">{players[topIdx].score}</span>
          {players[topIdx].isRiichi && <span className="text-red-400 font-bold">リーチ</span>}
        </div>
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
          tileWidth={22}
          tileHeight={30}
        />
      </div>

      {/* 中段: 左・中央・右 */}
      <div className="flex items-center justify-between w-full max-w-4xl">
        {/* 左 */}
        <div className="flex flex-col items-center gap-1">
          <div className="text-xs text-gray-400">
            {WIND_NAMES[players[leftIdx].seatWind]} {players[leftIdx].name}
            <span className="ml-1 font-mono">{players[leftIdx].score}</span>
            {players[leftIdx].isRiichi && <span className="text-red-400 ml-1">R</span>}
          </div>
          <DiscardPool
            discards={players[leftIdx].discards}
            riichiTurn={players[leftIdx].riichiTurn}
            tileWidth={20}
            tileHeight={28}
          />
        </div>

        {/* 中央情報 */}
        <div className="flex flex-col items-center gap-2">
          <CenterInfo round={round} players={players} currentPlayer={currentPlayer} />

          {/* ドラ表示 */}
          <div className="flex items-center gap-1">
            <span className="text-xs text-gray-400 mr-1">ドラ</span>
            {doraIndicators.map((t, i) => (
              <TileSVG key={i} tile={t} width={24} height={33} />
            ))}
          </div>
        </div>

        {/* 右 */}
        <div className="flex flex-col items-center gap-1">
          <div className="text-xs text-gray-400">
            {WIND_NAMES[players[rightIdx].seatWind]} {players[rightIdx].name}
            <span className="ml-1 font-mono">{players[rightIdx].score}</span>
            {players[rightIdx].isRiichi && <span className="text-red-400 ml-1">R</span>}
          </div>
          <DiscardPool
            discards={players[rightIdx].discards}
            riichiTurn={players[rightIdx].riichiTurn}
            tileWidth={20}
            tileHeight={28}
          />
        </div>
      </div>

      {/* 下（自分） */}
      <div className="flex flex-col items-center gap-1">
        <DiscardPool
          discards={players[bottomIdx].discards}
          riichiTurn={players[bottomIdx].riichiTurn}
          tileWidth={26}
          tileHeight={36}
        />
        <div className="flex items-center gap-2 text-sm">
          <span className="text-yellow-400">{WIND_NAMES[players[bottomIdx].seatWind]}</span>
          <span>{players[bottomIdx].name}</span>
          <span className="font-mono text-yellow-300">{players[bottomIdx].score}</span>
          {players[bottomIdx].isRiichi && <span className="text-red-400 font-bold">リーチ</span>}
        </div>
        <HandDisplay
          hand={players[bottomIdx].hand}
          isCurrentPlayer={currentPlayer === bottomIdx && (gameState.phase === 'discard' || gameState.phase === 'riichi_confirm')}
          selectedTile={selectedTile}
          onTileClick={onTileClick}
          tileWidth={42}
          tileHeight={58}
          showTiles={true}
        />
      </div>
    </div>
  );
};

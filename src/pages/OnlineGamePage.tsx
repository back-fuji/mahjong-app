import React, { useCallback, useMemo } from 'react';
import type { TileInstance } from '../core/types/tile.ts';
import { TileSVG } from '../components/tile/TileSVG.tsx';
import { DiscardPool } from '../components/board/DiscardPool.tsx';
import { HandDisplay } from '../components/hand/HandDisplay.tsx';
import { CenterInfo } from '../components/board/CenterInfo.tsx';
import { ActionBar } from '../components/actions/ActionBar.tsx';
import { RoundResultModal } from '../components/result/RoundResultModal.tsx';
import { WIND_NAMES } from '../core/types/player.ts';
import { MeldType } from '../core/types/meld.ts';

interface OnlineGamePageProps {
  gameState: any;
  sendAction: (action: { type: string;[key: string]: unknown }) => void;
}

export const OnlineGamePage: React.FC<OnlineGamePageProps> = ({ gameState, sendAction }) => {
  const [selectedTile, setSelectedTile] = React.useState<TileInstance | null>(null);

  if (!gameState) return null;

  const myIndex: number = gameState.myIndex;
  const actions: string[] = gameState.availableActions || [];
  const players = gameState.players;
  const round = gameState.round;

  const getRelativeIndex = (rel: number) => (myIndex + rel) % 4;
  const bottomIdx = myIndex;
  const rightIdx = getRelativeIndex(1);
  const topIdx = getRelativeIndex(2);
  const leftIdx = getRelativeIndex(3);

  const myPlayer = players[myIndex];
  const myHand = {
    closed: myPlayer.closed || [],
    melds: myPlayer.melds || [],
    tsumo: myPlayer.tsumo || undefined,
  };

  const handleTileClick = (tile: TileInstance) => {
    if (selectedTile?.index === tile.index) {
      sendAction({ type: 'discard', tileIndex: tile.index });
      setSelectedTile(null);
    } else {
      setSelectedTile(tile);
    }
  };

  return (
    <div className="w-full h-screen bg-green-900 overflow-hidden relative flex flex-col items-center justify-between p-2 select-none">
      {/* 上（対面） */}
      <div className="flex flex-col items-center gap-1">
        <div className="text-sm text-gray-400">
          {WIND_NAMES[players[topIdx].seatWind]} {players[topIdx].name}
          <span className="ml-1 font-mono">{players[topIdx].score}</span>
          {players[topIdx].isRiichi && <span className="text-red-400 ml-1">リーチ</span>}
        </div>
        <div className="flex">
          {Array.from({ length: players[topIdx].closedCount || 0 }, (_, i) => (
            <TileSVG key={i} width={28} height={38} faceDown />
          ))}
        </div>
        <DiscardPool
          discards={players[topIdx].discards}
          riichiTurn={-1}
          tileWidth={22}
          tileHeight={30}
        />
      </div>

      {/* 中段 */}
      <div className="flex items-center justify-between w-full max-w-4xl">
        <div className="flex flex-col items-center gap-1">
          <div className="text-xs text-gray-400">
            {WIND_NAMES[players[leftIdx].seatWind]} {players[leftIdx].name}
            <span className="ml-1 font-mono">{players[leftIdx].score}</span>
          </div>
          <DiscardPool discards={players[leftIdx].discards} riichiTurn={-1} tileWidth={20} tileHeight={28} />
        </div>

        <div className="flex flex-col items-center gap-2">
          <CenterInfo round={round} players={players} currentPlayer={gameState.currentPlayer} />
          <div className="flex items-center gap-1">
            <span className="text-xs text-gray-400 mr-1">ドラ</span>
            {gameState.doraIndicators?.map((t: TileInstance, i: number) => (
              <TileSVG key={i} tile={t} width={24} height={33} />
            ))}
          </div>
        </div>

        <div className="flex flex-col items-center gap-1">
          <div className="text-xs text-gray-400">
            {WIND_NAMES[players[rightIdx].seatWind]} {players[rightIdx].name}
            <span className="ml-1 font-mono">{players[rightIdx].score}</span>
          </div>
          <DiscardPool discards={players[rightIdx].discards} riichiTurn={-1} tileWidth={20} tileHeight={28} />
        </div>
      </div>

      {/* 下（自分） */}
      <div className="flex flex-col items-center gap-1">
        <DiscardPool discards={players[bottomIdx].discards} riichiTurn={-1} tileWidth={26} tileHeight={36} />
        <div className="text-sm">
          <span className="text-yellow-400">{WIND_NAMES[players[bottomIdx].seatWind]}</span>
          <span className="ml-1">{players[bottomIdx].name}</span>
          <span className="ml-1 font-mono text-yellow-300">{players[bottomIdx].score}</span>
        </div>
        <HandDisplay
          hand={myHand}
          isCurrentPlayer={actions.includes('discard')}
          selectedTile={selectedTile}
          onTileClick={handleTileClick}
          tileWidth={42}
          tileHeight={58}
          showTiles={true}
        />
      </div>

      {/* アクションバー */}
      <ActionBar
        canTsumoAgari={actions.includes('tsumo_agari')}
        canRon={actions.includes('ron')}
        canRiichi={actions.includes('riichi')}
        canChi={actions.includes('chi')}
        canPon={actions.includes('pon')}
        canKan={actions.includes('kan')}
        canSkip={actions.includes('skip_call')}
        onTsumoAgari={() => sendAction({ type: 'tsumo_agari' })}
        onRon={() => sendAction({ type: 'ron' })}
        onRiichi={() => {
          if (selectedTile) sendAction({ type: 'riichi', tileIndex: selectedTile.index });
        }}
        onChi={() => sendAction({ type: 'chi', tiles: [] })}
        onPon={() => sendAction({ type: 'pon' })}
        onKan={() => sendAction({ type: 'kan' })}
        onSkip={() => sendAction({ type: 'skip_call' })}
      />

      {selectedTile && actions.includes('discard') && (
        <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-40">
          <button
            onClick={() => {
              sendAction({ type: 'discard', tileIndex: selectedTile.index });
              setSelectedTile(null);
            }}
            className="px-6 py-2 bg-orange-600 hover:bg-orange-700 rounded-lg text-white font-bold shadow-lg"
          >
            打牌
          </button>
        </div>
      )}

      {gameState.phase === 'round_result' && gameState.roundResult && (
        <RoundResultModal
          result={gameState.roundResult}
          players={players}
          onNext={() => sendAction({ type: 'next_round' })}
        />
      )}
    </div>
  );
};

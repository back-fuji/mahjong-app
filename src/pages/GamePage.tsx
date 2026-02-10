import React, { useCallback } from 'react';
import { useGameStore } from '../store/gameStore.ts';
import { Board } from '../components/board/Board.tsx';
import { ActionBar } from '../components/actions/ActionBar.tsx';
import { RoundResultModal } from '../components/result/RoundResultModal.tsx';
import type { TileInstance } from '../core/types/tile.ts';

export const GamePage: React.FC = () => {
  const gameState = useGameStore(s => s.gameState);
  const humanPlayerIndex = useGameStore(s => s.humanPlayerIndex);
  const selectedTile = useGameStore(s => s.selectedTile);
  const setSelectedTile = useGameStore(s => s.setSelectedTile);
  const discardTile = useGameStore(s => s.discardTile);
  const declareRiichi = useGameStore(s => s.declareRiichi);
  const declareTsumoAgari = useGameStore(s => s.declareTsumoAgari);
  const declareRon = useGameStore(s => s.declareRon);
  const callPon = useGameStore(s => s.callPon);
  const callChi = useGameStore(s => s.callChi);
  const callKan = useGameStore(s => s.callKan);
  const skipCall = useGameStore(s => s.skipCall);
  const nextRound = useGameStore(s => s.nextRound);
  const actions = useGameStore(s => s.getAvailableActions)();

  const handleTileClick = useCallback((tile: TileInstance) => {
    if (!gameState) return;

    if (selectedTile?.index === tile.index) {
      // ダブルクリックで打牌
      discardTile(tile);
    } else {
      setSelectedTile(tile);
    }
  }, [gameState, selectedTile, discardTile, setSelectedTile]);

  const handleDiscard = useCallback(() => {
    if (selectedTile) {
      discardTile(selectedTile);
    }
  }, [selectedTile, discardTile]);

  if (!gameState) return null;

  return (
    <div className="w-full h-screen bg-green-900 overflow-hidden relative">
      <Board
        gameState={gameState}
        humanPlayerIndex={humanPlayerIndex}
        selectedTile={selectedTile}
        onTileClick={handleTileClick}
      />

      <ActionBar
        canTsumoAgari={actions.canTsumoAgari}
        canRon={actions.canRon}
        canRiichi={actions.canRiichi}
        canChi={actions.canChi}
        canPon={actions.canPon}
        canKan={actions.canKan}
        canSkip={actions.canSkip}
        onTsumoAgari={declareTsumoAgari}
        onRon={declareRon}
        onRiichi={() => {
          if (selectedTile && actions.riichiTiles.some(t => t.id === selectedTile.id)) {
            declareRiichi(selectedTile);
          } else if (actions.riichiTiles.length > 0) {
            declareRiichi(actions.riichiTiles[0]);
          }
        }}
        onChi={() => {
          if (actions.chiOptions.length > 0) {
            callChi(actions.chiOptions[0]);
          }
        }}
        onPon={callPon}
        onKan={() => callKan(actions.kanTiles[0])}
        onSkip={skipCall}
      />

      {/* 選択した牌を打牌するボタン */}
      {selectedTile && actions.canDiscard && (
        <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-40">
          <button
            onClick={handleDiscard}
            className="px-6 py-2 bg-orange-600 hover:bg-orange-700 rounded-lg text-white font-bold shadow-lg transition-colors"
          >
            打牌
          </button>
        </div>
      )}

      {/* 局結果モーダル */}
      {gameState.phase === 'round_result' && gameState.roundResult && (
        <RoundResultModal
          result={gameState.roundResult}
          players={gameState.players}
          onNext={nextRound}
        />
      )}
    </div>
  );
};

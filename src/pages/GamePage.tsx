import React, { useCallback } from 'react';
import { useGameStore } from '../store/gameStore.ts';
import { Board } from '../components/board/Board.tsx';
import { ActionBar } from '../components/actions/ActionBar.tsx';
import { RoundResultModal } from '../components/result/RoundResultModal.tsx';
import type { TileInstance } from '../core/types/tile.ts';
import { TILE_SHORT } from '../core/types/tile.ts';

/** フェーズに応じた状態メッセージ */
function getPhaseMessage(
  phase: string, 
  isMyTurn: boolean, 
  selectedTile: TileInstance | null,
  canDiscard: boolean,
  canCall: boolean
): { message: string; hint: string; color: string } {
  if (phase === 'round_result') {
    return { message: '局終了', hint: '', color: 'bg-purple-600' };
  }
  
  if (!isMyTurn) {
    return { message: '相手の番', hint: 'お待ちください...', color: 'bg-gray-600' };
  }

  if (canCall) {
    return { message: '鳴きチャンス', hint: 'ポン・チー・カンまたはスキップ', color: 'bg-blue-600' };
  }

  if (canDiscard) {
    if (selectedTile) {
      const tileName = TILE_SHORT[selectedTile.id] || '?';
      return { 
        message: `選択中: ${tileName}`, 
        hint: '打牌ボタンで捨てる / 他の牌をクリックで変更', 
        color: 'bg-amber-600' 
      };
    }
    return { message: 'あなたの番', hint: '捨てる牌を選んでください', color: 'bg-green-600' };
  }

  return { message: '処理中...', hint: '', color: 'bg-gray-600' };
}

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
  const declareKyuushu = useGameStore(s => s.declareKyuushu);
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

  const isMyTurn = gameState.currentPlayer === humanPlayerIndex;
  const canCall = actions.canPon || actions.canChi || actions.canRon;
  const phaseInfo = getPhaseMessage(
    gameState.phase, 
    isMyTurn, 
    selectedTile, 
    actions.canDiscard,
    canCall
  );

  return (
    <div className="w-full h-screen bg-green-900 overflow-hidden relative">
      {/* ステータスインジケーター */}
      <div className="fixed top-3 left-1/2 -translate-x-1/2 z-50">
        <div className={`${phaseInfo.color} px-6 py-2 rounded-full shadow-lg transition-all`}>
          <div className="text-white font-bold text-lg text-center">{phaseInfo.message}</div>
          {phaseInfo.hint && (
            <div className="text-white/80 text-sm text-center">{phaseInfo.hint}</div>
          )}
        </div>
      </div>

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
        canKyuushu={actions.canKyuushu}
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
        onKyuushu={declareKyuushu}
      />

      {/* 選択した牌を打牌するボタン - 左下に配置 */}
      {selectedTile && actions.canDiscard && (
        <div className="fixed bottom-6 left-6 z-40">
          <button
            onClick={handleDiscard}
            className="px-10 py-4 bg-orange-500 hover:bg-orange-600 rounded-2xl text-white font-bold text-xl shadow-xl transition-all hover:scale-105 active:scale-95 ring-4 ring-orange-300/50"
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

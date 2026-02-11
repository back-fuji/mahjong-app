import React, { useCallback, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useGameStore } from '../store/gameStore.ts';
import { Board } from '../components/board/Board.tsx';
import { ActionBar } from '../components/actions/ActionBar.tsx';
import { RoundResultModal } from '../components/result/RoundResultModal.tsx';
import type { TileInstance } from '../core/types/tile.ts';
import { TILE_SHORT } from '../core/types/tile.ts';

/** フェーズに応じた状態メッセージ（グラスUI用：border色で状態を表す） */
function getPhaseMessage(
  phase: string,
  isMyTurn: boolean,
  selectedTile: TileInstance | null,
  canDiscard: boolean,
  canCall: boolean
): { message: string; hint: string; borderColor: string } {
  if (phase === 'round_result') {
    return { message: '局終了', hint: '', borderColor: 'border-purple-400/60' };
  }

  if (!isMyTurn) {
    return { message: '相手の番', hint: 'お待ちください...', borderColor: 'border-gray-400/40' };
  }

  if (canCall) {
    return { message: '鳴きチャンス', hint: 'ポン・チー・カンまたはスキップ', borderColor: 'border-blue-400/60' };
  }

  if (canDiscard) {
    if (selectedTile) {
      const tileName = TILE_SHORT[selectedTile.id] || '?';
      return {
        message: `選択中: ${tileName}`,
        hint: '打牌ボタンで捨てる / 他の牌をクリックで変更',
        borderColor: 'border-amber-400/60'
      };
    }
    return { message: 'あなたの番', hint: '捨てる牌を選んでください', borderColor: 'border-green-400/60' };
  }

  return { message: '処理中...', hint: '', borderColor: 'border-gray-400/40' };
}

export const GamePage: React.FC = () => {
  const navigate = useNavigate();
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

  // ゲーム終了時に結果画面へ遷移
  useEffect(() => {
    if (gameState?.phase === 'game_result') {
      navigate('/result');
    }
  }, [gameState?.phase, navigate]);

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

  // 手牌以外のクリックで選択解除
  const handleBackgroundClick = useCallback((e: React.MouseEvent) => {
    const target = e.target as Element;
    if (!target.closest('[data-interactive-tile]') && !target.closest('button')) {
      setSelectedTile(null);
    }
  }, [setSelectedTile]);

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
    <div className="w-full h-screen bg-green-900 overflow-hidden relative" onClick={handleBackgroundClick}>
      {/* ステータスインジケーター（グラスUI） */}
      <div className="fixed top-3 left-1/2 -translate-x-1/2 z-50 pointer-events-none">
        <div className={`bg-black/20 backdrop-blur-md border ${phaseInfo.borderColor} px-6 py-2 rounded-full shadow-lg transition-all`}>
          <div className="text-white/90 font-bold text-lg text-center">{phaseInfo.message}</div>
          {phaseInfo.hint && (
            <div className="text-white/60 text-sm text-center">{phaseInfo.hint}</div>
          )}
        </div>
      </div>

      <Board
        gameState={gameState}
        humanPlayerIndex={humanPlayerIndex}
        selectedTile={selectedTile}
        onTileClick={handleTileClick}
        highlightTileIds={actions.callHighlightTiles}
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

      {/* 打牌ボタン - 左下グラスUI */}
      {selectedTile && actions.canDiscard && (
        <div className="fixed bottom-6 left-6 z-40">
          <button
            onClick={handleDiscard}
            className="px-10 py-4 bg-white/10 backdrop-blur-md border border-orange-400/50 rounded-2xl
              text-white font-bold text-xl shadow-lg transition-all hover:bg-white/20
              hover:scale-105 active:scale-95"
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

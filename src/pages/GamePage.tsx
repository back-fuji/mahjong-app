import React, { useCallback, useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useGameStore } from '../store/gameStore.ts';
import { Board } from '../components/board/Board.tsx';
import { ActionBar } from '../components/actions/ActionBar.tsx';
import { TenpaiIndicator } from '../components/actions/TenpaiIndicator.tsx';
import { ChiSelector } from '../components/actions/ChiSelector.tsx';
import { CallAnnouncement } from '../components/effects/CallAnnouncement.tsx';
import { RoundResultModal } from '../components/result/RoundResultModal.tsx';
import { AgariAnnouncement } from '../components/result/AgariAnnouncement.tsx';
import { AchievementToast } from '../components/effects/AchievementToast.tsx';
import { soundEngine } from '../audio/sound-engine.ts';
import { autoSave } from '../db/save-load.ts';
import { saveGameHistory } from '../db/game-history.ts';
import { checkRoundAchievements, checkGameEndAchievements, setAchievementUnlockCallback } from '../achievements/achievement-tracker.ts';
import type { TileInstance } from '../core/types/tile.ts';
import { TILE_NAMES } from '../core/types/tile.ts';

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
      const tileName = (TILE_NAMES[selectedTile.id] || '?') + (selectedTile.isRed ? '(赤)' : '');
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

  // ツモ/ロン アナウンス表示
  const [showAnnouncement, setShowAnnouncement] = useState(false);
  const [showDetailedResult, setShowDetailedResult] = useState(false);
  const [announcementText, setAnnouncementText] = useState('');

  // チー候補選択
  const [showChiSelector, setShowChiSelector] = useState(false);

  // 鳴き演出
  const [callAnnouncementText, setCallAnnouncementText] = useState<string | null>(null);
  const prevPhaseRef = useRef(gameState?.phase);

  // 実績トースト
  const [achievementToastIds, setAchievementToastIds] = useState<string[]>([]);

  // 実績コールバック登録
  useEffect(() => {
    setAchievementUnlockCallback((ids) => {
      setAchievementToastIds(prev => [...prev, ...ids]);
    });
    return () => setAchievementUnlockCallback(() => {});
  }, []);

  // ゲーム終了時に結果画面へ遷移 + 対局履歴を保存 + 実績チェック
  useEffect(() => {
    if (gameState?.phase === 'game_result') {
      saveGameHistory(gameState, humanPlayerIndex).catch(() => {});
      checkGameEndAchievements(gameState, humanPlayerIndex).catch(() => {});
      // 少し待ってから遷移（実績トーストを見せるため）
      const timer = setTimeout(() => navigate('/result'), 500);
      return () => clearTimeout(timer);
    }
  }, [gameState?.phase, navigate]);

  // 自動セーブ（ページ離脱時）
  useEffect(() => {
    const handleUnload = () => {
      if (gameState && gameState.phase !== 'game_result') {
        autoSave(gameState, humanPlayerIndex).catch(() => {});
      }
    };
    window.addEventListener('beforeunload', handleUnload);
    return () => window.removeEventListener('beforeunload', handleUnload);
  }, [gameState, humanPlayerIndex]);

  // 局結果時に実績チェック
  useEffect(() => {
    if (gameState?.phase === 'round_result' && gameState.roundResult) {
      checkRoundAchievements(gameState.roundResult, humanPlayerIndex).catch(() => {});
    }
  }, [gameState?.phase, gameState?.roundResult, humanPlayerIndex]);

  // リーチ演出
  const [showRiichiAnnouncement, setShowRiichiAnnouncement] = useState(false);
  const prevRiichiRef = useRef<boolean[]>([]);
  const riichiTimerRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  // リーチ状態の変化を追跡する文字列（依存配列用）
  const riichiKey = gameState?.players.map(p => p.isRiichi ? '1' : '0').join('') ?? '';

  useEffect(() => {
    if (!gameState) return;
    const currentRiichi = gameState.players.map(p => p.isRiichi);
    const prevRiichi = prevRiichiRef.current;
    prevRiichiRef.current = currentRiichi;

    // いずれかのプレイヤーが新たにリーチした
    if (prevRiichi.length === 4) {
      for (let i = 0; i < 4; i++) {
        if (currentRiichi[i] && !prevRiichi[i]) {
          // queueMicrotaskで非同期化（react-hooks/set-state-in-effect対策）
          queueMicrotask(() => {
            setShowRiichiAnnouncement(true);
            if (riichiTimerRef.current) clearTimeout(riichiTimerRef.current);
            riichiTimerRef.current = setTimeout(() => setShowRiichiAnnouncement(false), 2000);
          });
          return;
        }
      }
    }
    return () => {
      if (riichiTimerRef.current) clearTimeout(riichiTimerRef.current);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [riichiKey]);

  // 局結果が和了の場合、まずアナウンスを2秒表示してから詳細表示
  useEffect(() => {
    if (gameState?.phase === 'round_result' && gameState.roundResult?.agari && gameState.roundResult.agari.length > 0) {
      const agari = gameState.roundResult.agari[0];
      setAnnouncementText(agari.isTsumo ? 'ツモ' : 'ロン');
      setShowAnnouncement(true);
      setShowDetailedResult(false);

      const timer = setTimeout(() => {
        setShowAnnouncement(false);
        setShowDetailedResult(true);
      }, 2000);

      return () => clearTimeout(timer);
    } else if (gameState?.phase === 'round_result') {
      // 流局の場合は直接結果モーダルを表示
      setShowAnnouncement(false);
      setShowDetailedResult(true);
    } else {
      setShowAnnouncement(false);
      setShowDetailedResult(false);
    }
  }, [gameState?.phase, gameState?.roundResult]);

  // 鳴き演出: calling -> discard に遷移した時（ポン/チー/カンが成立した時）
  useEffect(() => {
    if (!gameState) return;
    const prevPhase = prevPhaseRef.current;
    prevPhaseRef.current = gameState.phase;

    // calling -> discard は鳴き成立を意味する
    if (prevPhase === 'calling' && gameState.phase === 'discard') {
      // 最新の副露を確認して演出する
      const currentPlayer = gameState.players[gameState.currentPlayer];
      const lastMeld = currentPlayer.hand.melds[currentPlayer.hand.melds.length - 1];
      if (lastMeld) {
        const callName = lastMeld.type === 'chi' ? 'チー'
          : lastMeld.type === 'pon' ? 'ポン'
          : (lastMeld.type === 'minkan' || lastMeld.type === 'ankan' || lastMeld.type === 'shouminkan') ? 'カン'
          : null;
        if (callName) {
          soundEngine.playCallSound(lastMeld.type === 'chi' ? 'chi' : lastMeld.type === 'pon' ? 'pon' : 'kan');
          setCallAnnouncementText(callName);
          setTimeout(() => setCallAnnouncementText(null), 800);
        }
      }
    }
  }, [gameState?.phase, gameState?.currentPlayer]);

  const handleTileClick = useCallback((tile: TileInstance) => {
    if (!gameState) return;
    // 喰い替え禁止牌はクリック不可
    if (actions.kuikaeDisallowedTiles.includes(tile.id)) return;

    if (selectedTile?.index === tile.index) {
      // ダブルクリックで打牌
      discardTile(tile);
    } else {
      setSelectedTile(tile);
    }
  }, [gameState, selectedTile, discardTile, setSelectedTile, actions.kuikaeDisallowedTiles]);

  const handleDiscard = useCallback(() => {
    if (selectedTile && !actions.kuikaeDisallowedTiles.includes(selectedTile.id)) {
      discardTile(selectedTile);
    }
  }, [selectedTile, discardTile, actions.kuikaeDisallowedTiles]);

  // 手牌以外のクリックで選択解除
  const handleBackgroundClick = useCallback((e: React.MouseEvent) => {
    const target = e.target as Element;
    if (!target.closest('[data-interactive-tile]') && !target.closest('button')) {
      setSelectedTile(null);
    }
  }, [setSelectedTile]);

  // キーボードショートカット
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!gameState) return;
      const player = gameState.players[humanPlayerIndex];
      const closed = player.hand.closed;
      const tsumo = player.hand.tsumo;
      const allTiles = tsumo ? [...closed, tsumo] : [...closed];

      // 数字キー(1-9)で手牌選択 (左から番号)
      if (e.key >= '1' && e.key <= '9') {
        const idx = parseInt(e.key, 10) - 1;
        if (idx < allTiles.length) {
          const tile = allTiles[idx];
          if (!actions.kuikaeDisallowedTiles.includes(tile.id)) {
            setSelectedTile(tile);
          }
        }
        return;
      }
      // 0キーで最後の手牌選択
      if (e.key === '0') {
        if (allTiles.length > 0) {
          const tile = allTiles[allTiles.length - 1];
          if (!actions.kuikaeDisallowedTiles.includes(tile.id)) {
            setSelectedTile(tile);
          }
        }
        return;
      }

      // Enter/Space: 打牌
      if ((e.key === 'Enter' || e.key === ' ') && selectedTile && actions.canDiscard) {
        e.preventDefault();
        if (!actions.kuikaeDisallowedTiles.includes(selectedTile.id)) {
          discardTile(selectedTile);
        }
        return;
      }

      // 左右矢印: 手牌選択を移動
      if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') {
        e.preventDefault();
        const allowedTiles = allTiles.filter(t => !actions.kuikaeDisallowedTiles.includes(t.id));
        if (allowedTiles.length === 0) return;
        if (!selectedTile) {
          setSelectedTile(e.key === 'ArrowLeft' ? allowedTiles[allowedTiles.length - 1] : allowedTiles[0]);
          return;
        }
        const currentIdx = allowedTiles.findIndex(t => t.index === selectedTile.index);
        if (currentIdx === -1) {
          setSelectedTile(allowedTiles[0]);
          return;
        }
        const newIdx = e.key === 'ArrowRight'
          ? (currentIdx + 1) % allowedTiles.length
          : (currentIdx - 1 + allowedTiles.length) % allowedTiles.length;
        setSelectedTile(allowedTiles[newIdx]);
        return;
      }

      // Escape: 選択解除 / チー選択キャンセル
      if (e.key === 'Escape') {
        setShowChiSelector(false);
        setSelectedTile(null);
        return;
      }

      // アクションショートカット
      if (e.key === 'r' && actions.canRiichi) {
        if (selectedTile && actions.riichiTiles.some(t => t.id === selectedTile.id)) {
          declareRiichi(selectedTile);
        } else if (actions.riichiTiles.length > 0) {
          declareRiichi(actions.riichiTiles[0]);
        }
        return;
      }
      if (e.key === 't' && actions.canTsumoAgari) { declareTsumoAgari(); return; }
      if (e.key === 'o' && actions.canRon) { declareRon(); return; }
      if (e.key === 'p' && actions.canPon) { callPon(); return; }
      if (e.key === 'c' && actions.canChi) {
        if (actions.chiOptions.length > 1) {
          setShowChiSelector(true);
        } else if (actions.chiOptions.length === 1) {
          callChi(actions.chiOptions[0]);
        }
        return;
      }
      if (e.key === 'k' && actions.canKan) { callKan(actions.kanTiles[0]); return; }
      if (e.key === 's' && actions.canSkip) { skipCall(); return; }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [gameState, humanPlayerIndex, selectedTile, actions, discardTile, setSelectedTile,
      declareRiichi, declareTsumoAgari, declareRon, callPon, callChi, callKan, skipCall]);

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
      {/* ヘルプ・役一覧ボタン（右上） */}
      <div className="fixed top-2 right-2 sm:top-4 sm:right-4 z-50 flex gap-1">
        <button
          onClick={() => navigate('/help')}
          className="w-8 h-8 sm:w-9 sm:h-9 bg-black/30 backdrop-blur-md border border-white/20 rounded-full
            text-white/70 hover:text-white hover:bg-black/50 transition-all text-sm sm:text-base font-bold"
          title="ヘルプ"
        >
          ?
        </button>
        <button
          onClick={() => navigate('/yaku')}
          className="w-8 h-8 sm:w-9 sm:h-9 bg-black/30 backdrop-blur-md border border-white/20 rounded-full
            text-white/70 hover:text-white hover:bg-black/50 transition-all text-[10px] sm:text-xs font-bold"
          title="役一覧"
        >
          役
        </button>
      </div>

      {/* ステータスインジケーター
          SP: 画面下部の捨て牌の近く（bottom-[160px]）、中央寄せ
          PC: 画面最左、縦中央 */}
      <div className="fixed bottom-[160px] left-1/2 -translate-x-1/2 sm:bottom-auto sm:left-3 sm:top-1/2 sm:-translate-y-1/2 sm:translate-x-0 z-50 pointer-events-none">
        <div className={`bg-black/40 backdrop-blur-md border ${phaseInfo.borderColor} px-2 py-1 sm:px-3 sm:py-2 rounded-xl shadow-lg transition-all`}>
          <div className="text-white/90 font-bold text-xs sm:text-sm text-center whitespace-nowrap">{phaseInfo.message}</div>
          {phaseInfo.hint && (
            <div className="text-white/60 text-[9px] sm:text-[10px] text-center max-w-[120px] sm:max-w-[100px] leading-tight">{phaseInfo.hint}</div>
          )}
        </div>
      </div>

      <Board
        gameState={gameState}
        humanPlayerIndex={humanPlayerIndex}
        selectedTile={selectedTile}
        onTileClick={handleTileClick}
        highlightTileIds={actions.callHighlightTiles}
        highlightLastDiscardPlayer={
          gameState.phase === 'calling' && gameState.lastDiscard
            ? gameState.lastDiscard.playerIndex
            : -1
        }
        dimmedTileIds={actions.kuikaeDisallowedTiles}
        onDragStart={(tile) => setSelectedTile(tile)}
        onDrop={(tile) => {
          if (actions.canDiscard && !actions.kuikaeDisallowedTiles.includes(tile.id)) {
            discardTile(tile);
          }
        }}
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
          if (actions.chiOptions.length > 1) {
            setShowChiSelector(true);
          } else if (actions.chiOptions.length === 1) {
            callChi(actions.chiOptions[0]);
          }
        }}
        onPon={callPon}
        onKan={() => callKan(actions.kanTiles[0])}
        onSkip={skipCall}
        onKyuushu={declareKyuushu}
      />

      {/* 打牌ボタン（左下） */}
      {selectedTile && actions.canDiscard && (
        <div className="fixed bottom-16 sm:bottom-6 left-4 sm:left-6 z-40">
          <button
            onClick={handleDiscard}
            className="px-6 py-3 sm:px-10 sm:py-4 bg-white/10 backdrop-blur-md border border-orange-400/50 rounded-2xl
              text-white font-bold text-base sm:text-xl shadow-lg transition-all hover:bg-white/20
              hover:scale-105 active:scale-95"
          >
            打牌
          </button>
        </div>
      )}

      {/* テンパイ/フリテンインジケーター（右下） */}
      {gameState.phase !== 'round_result' && gameState.phase !== 'game_result' && (
        <div className="fixed bottom-16 sm:bottom-6 right-4 sm:right-6 z-40">
          <TenpaiIndicator gameState={gameState} humanPlayerIndex={humanPlayerIndex} />
        </div>
      )}

      {/* チー候補選択 */}
      {showChiSelector && actions.chiOptions.length > 1 && (
        <ChiSelector
          options={actions.chiOptions}
          onSelect={(opt) => {
            setShowChiSelector(false);
            callChi(opt);
          }}
          onCancel={() => setShowChiSelector(false)}
        />
      )}

      {/* 鳴き演出（ポン/チー/カン） */}
      {callAnnouncementText && (
        <CallAnnouncement text={callAnnouncementText} />
      )}

      {/* リーチ カットイン */}
      {showRiichiAnnouncement && (
        <AgariAnnouncement text="リーチ" />
      )}

      {/* ツモ/ロン カットイン（2秒表示） */}
      {showAnnouncement && (
        <AgariAnnouncement text={announcementText} />
      )}

      {/* 局結果モーダル（詳細表示） */}
      {showDetailedResult && gameState.phase === 'round_result' && gameState.roundResult && (
        <RoundResultModal
          result={gameState.roundResult}
          players={gameState.players}
          onNext={nextRound}
        />
      )}

      {/* 実績解除トースト */}
      {achievementToastIds.length > 0 && (
        <AchievementToast
          achievementIds={achievementToastIds}
          onDone={() => setAchievementToastIds([])}
        />
      )}
    </div>
  );
};

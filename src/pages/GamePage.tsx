import React, { useCallback, useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useIsMobilePortrait } from '../hooks/useIsMobilePortrait.ts';
import { useWindowSize } from '../hooks/useWindowSize.ts';
import { LandscapePrompt } from '../components/LandscapePrompt.tsx';
import { DraggableStatusIndicator } from '../components/DraggableStatusIndicator.tsx';
import { useGameStore } from '../store/gameStore.ts';
import { Board } from '../components/board/Board.tsx';
import { ActionBar } from '../components/actions/ActionBar.tsx';
import { TenpaiIndicator } from '../components/actions/TenpaiIndicator.tsx';
import { ChiSelector } from '../components/actions/ChiSelector.tsx';
import { CallAnnouncement } from '../components/effects/CallAnnouncement.tsx';
import { RoundResultModal } from '../components/result/RoundResultModal.tsx';
import { AgariAnnouncement } from '../components/result/AgariAnnouncement.tsx';
import { AgariImageOverlay } from '../components/result/AgariImageOverlay.tsx';
import { AgariVideoOverlay } from '../components/result/AgariVideoOverlay.tsx';
import { AchievementToast } from '../components/effects/AchievementToast.tsx';
import { soundEngine } from '../audio/sound-engine.ts';
import { autoSave } from '../db/save-load.ts';
import { saveGameHistory } from '../db/game-history.ts';
import { checkRoundAchievements, checkGameEndAchievements, setAchievementUnlockCallback } from '../achievements/achievement-tracker.ts';
import type { TileInstance } from '../core/types/tile.ts';
import { TILE_NAMES } from '../core/types/tile.ts';
import { getWaitingTiles } from '../core/agari/agari.ts';
import { toCount34 } from '../core/tile/tile-utils.ts';

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
  const isMobilePortrait = useIsMobilePortrait();
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
  const { isMobileLandscape } = useWindowSize();
  const hasActionBar = actions.canTsumoAgari || actions.canRon || actions.canRiichi ||
    actions.canChi || actions.canPon || actions.canKan || actions.canKyuushu || actions.canSkip;
  const showDiscardButton = Boolean(selectedTile && actions.canDiscard);
  const groupBottomLeft = isMobileLandscape && hasActionBar && showDiscardButton;

  // 和了演出: 自分が和了→動画(2.5s) / 他者が和了→画像(ツモ4s/ロン6s) → 盤面手牌公開(2.0s) → 結果モーダル
  const [showAgariVideo, setShowAgariVideo] = useState(false);
  const [showAgariImage, setShowAgariImage] = useState(false);
  const [agariIsTsumo, setAgariIsTsumo] = useState(false);
  const [agariDirection, setAgariDirection] = useState(0);
  const [showAgariBoard, setShowAgariBoard] = useState(false);
  const [showDetailedResult, setShowDetailedResult] = useState(false);

  // チー候補選択
  const [showChiSelector, setShowChiSelector] = useState(false);

  // 鳴き演出
  const [callAnnouncementText, setCallAnnouncementText] = useState<string | null>(null);
  const prevPhaseRef = useRef(gameState?.phase);
  const prevMeldCountsRef = useRef<number[]>(gameState?.players.map(p => p.hand.melds.length) ?? []);

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

  // 局結果が和了の場合:
  //   自分が和了 → 動画(2.5s) → 盤面手牌公開(2.0s) → 結果モーダル
  //   他者が和了 → 画像(2.0s) → 盤面手牌公開(2.0s) → 結果モーダル
  useEffect(() => {
    if (gameState?.phase === 'round_result' && gameState.roundResult?.agari && gameState.roundResult.agari.length > 0) {
      const agari = gameState.roundResult.agari[0];
      setAgariIsTsumo(agari.isTsumo);
      // 和了者の相対位置: 0=自分(下), 1=右(下家), 2=上(対面), 3=左(上家)
      setAgariDirection((agari.winner - humanPlayerIndex + 4) % 4);
      setShowAgariBoard(false);
      setShowDetailedResult(false);

      const isSelfWin = agari.winner === humanPlayerIndex;

      if (isSelfWin) {
        // 自分が和了: 動画(2.5s) → 手牌公開(2.0s) → 結果モーダル
        setShowAgariVideo(true);
        setShowAgariImage(false);

        const timer1 = setTimeout(() => {
          setShowAgariVideo(false);
          setShowAgariBoard(true);
        }, 2500);

        const timer2 = setTimeout(() => {
          setShowAgariBoard(false);
          setShowDetailedResult(true);
        }, 4500);

        return () => {
          clearTimeout(timer1);
          clearTimeout(timer2);
        };
      } else {
        // 他者が和了: ツモ画像(4s) / ロン画像(6s) → 手牌公開(2.0s) → 結果モーダル
        setShowAgariVideo(false);
        setShowAgariImage(true);

        const imageDuration = agari.isTsumo ? 4000 : 6000; // ツモ4秒 / ロン6秒（従来の2倍）
        const boardDuration = 2000;

        const timer1 = setTimeout(() => {
          setShowAgariImage(false);
          setShowAgariBoard(true);
        }, imageDuration);

        const timer2 = setTimeout(() => {
          setShowAgariBoard(false);
          setShowDetailedResult(true);
        }, imageDuration + boardDuration);

        return () => {
          clearTimeout(timer1);
          clearTimeout(timer2);
        };
      }
    } else if (gameState?.phase === 'round_result') {
      // 流局の場合は直接結果モーダルを表示
      setShowAgariVideo(false);
      setShowAgariImage(false);
      setShowAgariBoard(false);
      setShowDetailedResult(true);
    } else {
      setShowAgariVideo(false);
      setShowAgariImage(false);
      setShowAgariBoard(false);
      setShowDetailedResult(false);
    }
  }, [gameState?.phase, gameState?.roundResult]);

  // 鳴き演出: メルド数の変化を検知（ポン/チー/暗槓/加槓/大明槓すべて対応）
  const meldKey = gameState?.players.map(p => p.hand.melds.length).join(',') ?? '';
  useEffect(() => {
    if (!gameState) return;
    const prevPhase = prevPhaseRef.current;
    prevPhaseRef.current = gameState.phase;

    const currentMeldCounts = gameState.players.map(p => p.hand.melds.length);
    const prevCounts = prevMeldCountsRef.current;
    prevMeldCountsRef.current = currentMeldCounts;

    // メルド数が増えたプレイヤーを検出
    for (let i = 0; i < Math.min(currentMeldCounts.length, prevCounts.length); i++) {
      if (currentMeldCounts[i] > prevCounts[i]) {
        const player = gameState.players[i];
        const lastMeld = player.hand.melds[player.hand.melds.length - 1];
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
        break;
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [meldKey]);

  const handleTileClick = useCallback((tile: TileInstance) => {
    if (!gameState) return;
    // リーチ後は牌選択不可
    if (gameState.players[humanPlayerIndex].isRiichi) return;
    // 喰い替え禁止牌はクリック不可
    if (actions.kuikaeDisallowedTiles.includes(tile.id)) return;

    if (selectedTile?.index === tile.index) {
      // ダブルクリックで打牌
      discardTile(tile);
    } else {
      setSelectedTile(tile);
    }
  }, [gameState, humanPlayerIndex, selectedTile, discardTile, setSelectedTile, actions.kuikaeDisallowedTiles]);

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

  // リーチ後は捨てる牌を選べないので、自分の番が来たら自動で打牌（ツモ切り）
  const didAutoDiscardRiichiRef = useRef(false);
  useEffect(() => {
    if (!gameState) return;
    const player = gameState.players[humanPlayerIndex];
    const isRiichiDiscardTurn =
      gameState.phase === 'discard' &&
      gameState.currentPlayer === humanPlayerIndex &&
      player.isRiichi &&
      player.hand.tsumo != null;
    let timeoutId: ReturnType<typeof setTimeout> | undefined;
    const tsumoTile = player.hand.tsumo ?? null;
    if (isRiichiDiscardTurn && !didAutoDiscardRiichiRef.current && tsumoTile) {
      didAutoDiscardRiichiRef.current = true;
      timeoutId = setTimeout(() => {
        discardTile(tsumoTile);
      }, 120);
    } else if (!isRiichiDiscardTurn) {
      didAutoDiscardRiichiRef.current = false;
    }
    return () => {
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, [gameState, humanPlayerIndex, discardTile]);

  // キーボードショートカット
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!gameState) return;
      const player = gameState.players[humanPlayerIndex];
      const closed = player.hand.closed;
      const tsumo = player.hand.tsumo;
      const allTiles = tsumo ? [...closed, tsumo] : [...closed];

      // リーチ後は牌選択キーを無効化
      const isRiichi = player.isRiichi;

      // 数字キー(1-9)で手牌選択 (左から番号)
      if (e.key >= '1' && e.key <= '9') {
        if (!isRiichi) {
          const idx = parseInt(e.key, 10) - 1;
          if (idx < allTiles.length) {
            const tile = allTiles[idx];
            if (!actions.kuikaeDisallowedTiles.includes(tile.id)) {
              setSelectedTile(tile);
            }
          }
        }
        return;
      }
      // 0キーで最後の手牌選択
      if (e.key === '0') {
        if (!isRiichi && allTiles.length > 0) {
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

      // 左右矢印: 手牌選択を移動（リーチ後は無効）
      if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') {
        e.preventDefault();
        if (isRiichi) return;
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

      // アクションショートカット（リーチは選択した牌があるときだけ）
      if (e.key === 'r' && actions.canRiichi) {
        if (selectedTile && actions.riichiTiles.some(t => t.index === selectedTile.index)) {
          declareRiichi(selectedTile);
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

  // テンパイ状態で「この牌を捨てるとテンパイにならない」選択をしているか
  const discardSelectedLosesTenpai = (() => {
    if (gameState.phase !== 'discard' || !selectedTile || !actions.canDiscard) return false;
    const player = gameState.players[humanPlayerIndex];
    const hand = player.hand;
    const allTiles = [...hand.closed, ...(hand.tsumo ? [hand.tsumo] : [])];
    if (allTiles.length !== 14) return false;
    const remaining = allTiles.filter(t => t.index !== selectedTile.index);
    if (remaining.length !== 13) return false;
    const counts13 = toCount34(remaining);
    const waitsAfterDiscard = getWaitingTiles(counts13, hand.melds);
    if (waitsAfterDiscard.length > 0) return false; // 捨ててもテンパイ
    const isCurrentTenpai = allTiles.some(t => {
      const rest = allTiles.filter(x => x.index !== t.index);
      return getWaitingTiles(toCount34(rest), hand.melds).length > 0;
    });
    return isCurrentTenpai;
  })();

  let phaseInfo = getPhaseMessage(
    gameState.phase,
    isMyTurn,
    selectedTile,
    actions.canDiscard,
    canCall
  );
  if (discardSelectedLosesTenpai && selectedTile) {
    phaseInfo = {
      ...phaseInfo,
      hint: 'この牌を捨てるとテンパイにならない',
    };
  }

  return (
    <>
      {/* デバッグ用: オーバーレイ常時非表示 */}
      {/* {isMobilePortrait && <LandscapePrompt />} */}
      <div className="w-full h-[100dvh] bg-green-900 overflow-hidden relative sp-force-landscape" onClick={handleBackgroundClick}>
      {/* ヘルプ・役一覧ボタン（右上） */}
      <div className="fixed top-2 right-2 sm:top-4 sm:right-4 z-50 flex gap-1">
        <button
          onClick={() => {
            if (window.confirm('ホームに戻りますか？（対局は中断されます）')) {
              navigate('/');
            }
          }}
          className="w-8 h-8 sm:w-9 sm:h-9 bg-black/30 backdrop-blur-md border border-white/20 rounded-full
            text-white/70 hover:text-white hover:bg-black/50 transition-all text-sm sm:text-base font-bold"
          title="ホーム"
        >
          &#x2302;
        </button>
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
          SP: 打牌ボタンのすぐ上、左寄せ（ドラッグで移動可）
          PC: 画面最左、縦中央 */}
      <DraggableStatusIndicator
        message={phaseInfo.message}
        hint={phaseInfo.hint}
        borderColorClass={phaseInfo.borderColor}
      />

      <Board
        gameState={gameState}
        humanPlayerIndex={humanPlayerIndex}
        selectedTile={selectedTile}
        onTileClick={handleTileClick}
        highlightTileIds={actions.callHighlightTiles}
        highlightLastDiscardPlayer={
          gameState.phase === 'calling' && gameState.lastDiscard && actions.canSkip
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
        agariInfo={showAgariBoard && gameState.roundResult?.agari?.[0] ? {
          winner: gameState.roundResult.agari[0].winner,
          loser: gameState.roundResult.agari[0].loser,
          isTsumo: gameState.roundResult.agari[0].isTsumo,
        } : undefined}
      />

      {/* 左下: リーチと打牌が被らないよう、両方出る場合は1行に並べる */}
      {groupBottomLeft ? (
        <div className="fixed bottom-2 left-2 z-50 flex flex-row items-center gap-2 flex-wrap">
          <ActionBar
            inline
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
              if (selectedTile && actions.riichiTiles.some(t => t.index === selectedTile.index)) {
                declareRiichi(selectedTile);
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
          <button
            onClick={handleDiscard}
            className="px-6 py-3 bg-white/10 backdrop-blur-md border border-orange-400/50 rounded-2xl
              text-white font-bold text-base shadow-lg transition-all hover:bg-white/20
              hover:scale-105 active:scale-95"
          >
            打牌
          </button>
        </div>
      ) : (
        <>
          {!showAgariBoard && <ActionBar
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
              if (selectedTile && actions.riichiTiles.some(t => t.index === selectedTile.index)) {
                declareRiichi(selectedTile);
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
          />}
          {showDiscardButton && (
            <div className="fixed bottom-2 left-2 sm:bottom-6 sm:left-6 z-40">
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
        </>
      )}

      {/* テンパイ/フリテンインジケーター（右下） */}
      {gameState.phase !== 'round_result' && gameState.phase !== 'game_result' && (
        <div className="fixed bottom-2 sm:bottom-6 right-2 sm:right-6 z-40">
          <TenpaiIndicator
            gameState={gameState}
            humanPlayerIndex={humanPlayerIndex}
            selectedTile={selectedTile}
          />
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

      {/* 自分が和了: 動画オーバーレイ（2.5s） */}
      {showAgariVideo && <AgariVideoOverlay />}

      {/* 他者が和了: ツモ/ロン 画像オーバーレイ（ツモ4s / ロン6s） */}
      {showAgariImage && (
        <AgariImageOverlay isTsumo={agariIsTsumo} direction={agariDirection} />
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
    </>
  );
};

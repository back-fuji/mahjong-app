import React from 'react';
import { useNavigate } from 'react-router-dom';
import { DraggableStatusIndicator } from '../components/DraggableStatusIndicator.tsx';
import type { TileInstance } from '../core/types/tile.ts';
import type { CallOption } from '../core/types/meld.ts';
import { TileSVG } from '../components/tile/TileSVG.tsx';
import { DiscardPool } from '../components/board/DiscardPool.tsx';
import { HandDisplay } from '../components/hand/HandDisplay.tsx';
import { CenterInfo } from '../components/board/CenterInfo.tsx';
import { ActionBar } from '../components/actions/ActionBar.tsx';
import { ChiSelector } from '../components/actions/ChiSelector.tsx';
import { RoundResultModal } from '../components/result/RoundResultModal.tsx';
import { AgariImageOverlay } from '../components/result/AgariImageOverlay.tsx';
import { AgariVideoOverlay, preloadAgariVideo } from '../components/result/AgariVideoOverlay.tsx';
import { AgariAnnouncement } from '../components/result/AgariAnnouncement.tsx';
import { CallAnnouncement } from '../components/effects/CallAnnouncement.tsx';
import { TILE_SHORT } from '../core/types/tile.ts';
import { MeldType } from '../core/types/meld.ts';
import type { Meld } from '../core/types/meld.ts';

/** フェーズに応じた状態メッセージ */
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

  if (!isMyTurn && !canCall) {
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

interface OnlineGamePageProps {
  gameState: any;
  sendAction: (action: { type: string;[key: string]: unknown }) => void;
}

export const OnlineGamePage: React.FC<OnlineGamePageProps> = ({ gameState, sendAction }) => {
  const navigate = useNavigate();
  const [selectedTile, setSelectedTile] = React.useState<TileInstance | null>(null);
  const [showChiSelector, setShowChiSelector] = React.useState(false);

  // 和了演出
  const [showAgariVideo, setShowAgariVideo] = React.useState(false);
  const [showAgariImage, setShowAgariImage] = React.useState(false);
  const [agariIsTsumo, setAgariIsTsumo] = React.useState(false);
  const [agariDirection, setAgariDirection] = React.useState(0);
  const [showDetailedResult, setShowDetailedResult] = React.useState(false);

  // 鳴き演出
  const [callAnnouncementText, setCallAnnouncementText] = React.useState<string | null>(null);
  const prevMeldCountsRef = React.useRef<number[]>([]);

  // リーチ演出
  const [showRiichiAnnouncement, setShowRiichiAnnouncement] = React.useState(false);
  const prevRiichiRef = React.useRef<boolean[]>([]);
  const riichiTimerRef = React.useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  // リーチ後自動ツモ切り（二重実行防止）
  const didAutoDiscardRiichiRef = React.useRef(false);

  // 和了動画の事前読み込み
  React.useEffect(() => {
    preloadAgariVideo();
  }, []);

  // 和了演出
  React.useEffect(() => {
    if (!gameState) return;
    if (gameState.phase === 'round_result' && gameState.roundResult?.agari?.length > 0) {
      const agari = gameState.roundResult.agari[0];
      const myIdx: number = gameState.myIndex ?? 0;
      setAgariIsTsumo(agari.isTsumo);
      setAgariDirection((agari.winner - myIdx + 4) % 4);
      setShowDetailedResult(false);

      const isSelfWin = agari.winner === myIdx;
      if (isSelfWin) {
        setShowAgariVideo(true);
        setShowAgariImage(false);
        const t1 = setTimeout(() => setShowAgariVideo(false), 2000);
        const t2 = setTimeout(() => setShowDetailedResult(true), 2000);
        return () => { clearTimeout(t1); clearTimeout(t2); };
      } else {
        setShowAgariVideo(false);
        setShowAgariImage(true);
        const imageDuration = agari.isTsumo ? 3000 : 4500;
        const t1 = setTimeout(() => setShowAgariImage(false), imageDuration);
        const t2 = setTimeout(() => setShowDetailedResult(true), imageDuration);
        return () => { clearTimeout(t1); clearTimeout(t2); };
      }
    } else if (gameState.phase === 'round_result') {
      setShowAgariVideo(false);
      setShowAgariImage(false);
      setShowDetailedResult(true);
    } else {
      setShowAgariVideo(false);
      setShowAgariImage(false);
      setShowDetailedResult(false);
    }
  }, [gameState?.phase, gameState?.roundResult]);

  // フェーズ変化時にChiSelectorを閉じる
  React.useEffect(() => {
    setShowChiSelector(false);
  }, [gameState?.phase]);

  // 鳴き演出（メルド数の変化を検知）
  const meldKey = gameState?.players?.map((p: any) => p.melds?.length ?? 0).join(',') ?? '';
  React.useEffect(() => {
    if (!gameState?.players) return;
    const currentCounts = gameState.players.map((p: any) => p.melds?.length ?? 0);
    const prevCounts = prevMeldCountsRef.current;
    prevMeldCountsRef.current = currentCounts;

    if (prevCounts.length !== currentCounts.length) return;
    for (let i = 0; i < currentCounts.length; i++) {
      if (currentCounts[i] > prevCounts[i]) {
        const melds: Meld[] = gameState.players[i].melds ?? [];
        const lastMeld = melds[melds.length - 1];
        if (lastMeld) {
          const callName = lastMeld.type === 'chi' ? 'チー'
            : lastMeld.type === 'pon' ? 'ポン'
            : (lastMeld.type === 'minkan' || lastMeld.type === 'ankan' || lastMeld.type === 'shouminkan') ? 'カン'
            : null;
          if (callName) {
            setCallAnnouncementText(callName);
            setTimeout(() => setCallAnnouncementText(null), 800);
          }
        }
        break;
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [meldKey]);

  // リーチ演出（リーチ状態変化を検知）
  const riichiKey = gameState?.players?.map((p: any) => p.isRiichi ? '1' : '0').join('') ?? '';
  React.useEffect(() => {
    if (!gameState?.players) return;
    const currentRiichi = gameState.players.map((p: any) => !!p.isRiichi);
    const prevRiichi = prevRiichiRef.current;
    prevRiichiRef.current = currentRiichi;

    if (prevRiichi.length === 4) {
      for (let i = 0; i < 4; i++) {
        if (currentRiichi[i] && !prevRiichi[i]) {
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

  // リーチ後自動ツモ切り
  React.useEffect(() => {
    if (!gameState) return;
    const myIdx: number = gameState.myIndex ?? 0;
    const player = gameState.players?.[myIdx];
    const isRiichiDiscardTurn =
      gameState.phase === 'discard' &&
      gameState.currentPlayer === myIdx &&
      player?.isRiichi &&
      player?.tsumo != null;

    if (isRiichiDiscardTurn && !didAutoDiscardRiichiRef.current && player?.tsumo) {
      didAutoDiscardRiichiRef.current = true;
      const timer = setTimeout(() => {
        sendAction({ type: 'discard', tileIndex: player.tsumo.index });
      }, 120);
      return () => clearTimeout(timer);
    } else if (!isRiichiDiscardTurn) {
      didAutoDiscardRiichiRef.current = false;
    }
  }, [gameState?.phase, gameState?.currentPlayer, gameState?.myIndex, sendAction]);

  if (!gameState) return null;

  const myIndex: number = gameState.myIndex;
  const actions: string[] = gameState.availableActions || [];
  const chiOptions: CallOption[] = gameState.chiOptions || [];
  const kanTiles: number[] = gameState.kanTiles || [];
  const players = gameState.players;
  const round = gameState.round;

  const getRelativeIndex = (rel: number) => (myIndex + rel) % 4;
  const bottomIdx = myIndex;
  const rightIdx = getRelativeIndex(1);
  const topIdx = getRelativeIndex(2);
  const leftIdx = getRelativeIndex(3);

  const myPlayer = players[myIndex];
  const kuikaeDisallowedTiles: number[] = myPlayer.kuikaeDisallowedTiles || [];
  const myHand = {
    closed: myPlayer.closed || [],
    melds: myPlayer.melds || [],
    tsumo: myPlayer.tsumo || undefined,
  };

  const handleTileClick = (tile: TileInstance) => {
    if (kuikaeDisallowedTiles.includes(tile.id)) return;
    if (selectedTile?.index === tile.index) {
      sendAction({ type: 'discard', tileIndex: tile.index });
      setSelectedTile(null);
    } else {
      setSelectedTile(tile);
    }
  };

  const handleBackgroundClick = (e: React.MouseEvent) => {
    const target = e.target as Element;
    if (!target.closest('[data-interactive-tile]') && !target.closest('button')) {
      setSelectedTile(null);
    }
  };

  const handleChi = () => {
    if (chiOptions.length === 0) return;
    if (chiOptions.length === 1) {
      sendAction({ type: 'chi', tiles: chiOptions[0].tiles });
    } else {
      setShowChiSelector(true);
    }
  };

  const handleChiSelect = (option: CallOption) => {
    setShowChiSelector(false);
    sendAction({ type: 'chi', tiles: option.tiles });
  };

  const handleKan = () => {
    sendAction({ type: 'kan', tileId: kanTiles[0] });
  };

  // ステータス計算
  const isMyTurn = gameState.currentPlayer === myIndex;
  const canDiscard = actions.includes('discard');
  const canCall = actions.includes('pon') || actions.includes('chi') || actions.includes('ron');
  const phaseInfo = getPhaseMessage(gameState.phase, isMyTurn, selectedTile, canDiscard, canCall);

  return (
    <div
      className="w-full h-[100dvh] bg-green-900 overflow-hidden relative flex flex-col items-center justify-between p-4 select-none sp-force-landscape"
      onClick={handleBackgroundClick}
    >
      {/* ホームボタン・ヘルプ・役一覧ボタン（右上） */}
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
          onClick={() => navigate('/yaku')}
          className="w-8 h-8 sm:w-9 sm:h-9 bg-black/30 backdrop-blur-md border border-white/20 rounded-full
            text-white/70 hover:text-white hover:bg-black/50 transition-all text-[10px] sm:text-xs font-bold"
          title="役一覧"
        >
          役
        </button>
      </div>

      {/* ステータスインジケーター */}
      <DraggableStatusIndicator
        message={phaseInfo.message}
        hint={phaseInfo.hint}
        borderColorClass={phaseInfo.borderColor}
        variant="online"
      />

      {/* 上（対面） - 手牌と捨て牌を横並び */}
      <div className="flex flex-col items-center gap-1">
        <div className="flex items-end">
          <div className="flex">
            {Array.from({ length: players[topIdx].closedCount || 0 }, (_, i) => (
              <TileSVG key={i} width={28} height={38} faceDown />
            ))}
          </div>
          {players[topIdx].melds && players[topIdx].melds.length > 0 && (
            <div className="ml-2 pl-2 border-l border-white/20 flex items-end gap-1">
              {players[topIdx].melds.map((meld: Meld, mi: number) => (
                <div key={mi} className="flex items-end">
                  {meld.tiles.map((tile: TileInstance, ti: number) => {
                    const isCalled = meld.calledTile && tile.index === meld.calledTile.index;
                    return (
                      <TileSVG
                        key={tile.index}
                        tile={tile}
                        width={28}
                        height={38}
                        sideways={!!isCalled}
                        faceDown={meld.type === MeldType.AnKan && (ti === 0 || ti === 3)}
                      />
                    );
                  })}
                </div>
              ))}
            </div>
          )}
        </div>
        <DiscardPool
          discards={players[topIdx].discards}
          riichiDiscardIndex={players[topIdx].riichiDiscardIndex ?? -1}
          tileWidth={32}
          tileHeight={44}
          position="top"
        />
      </div>

      {/* 中段 */}
      <div className="flex items-center justify-between w-full max-w-6xl">
        {/* 左（上家）- 手牌と捨て牌を縦並び */}
        <div className="flex flex-row items-center gap-1">
          <div className="flex flex-col items-center gap-0.5">
            <div className="flex flex-col items-center">
              {Array.from({ length: players[leftIdx].closedCount || 0 }, (_, i) => (
                <TileSVG key={i} width={20} height={28} faceDown />
              ))}
            </div>
            {players[leftIdx].melds && players[leftIdx].melds.length > 0 && (
              <div className="mt-2 flex flex-row items-center gap-1 border-t border-white/20 pt-1">
                {players[leftIdx].melds.map((meld: Meld, mi: number) => (
                  <div key={mi} className="flex flex-row items-center">
                    {meld.tiles.map((tile: TileInstance, ti: number) => {
                      const isCalled = meld.calledTile && tile.index === meld.calledTile.index;
                      return (
                        <TileSVG
                          key={tile.index}
                          tile={tile}
                          width={20}
                          height={28}
                          sideways={!!isCalled}
                          faceDown={meld.type === MeldType.AnKan && (ti === 0 || ti === 3)}
                          rotation={90}
                        />
                      );
                    })}
                  </div>
                ))}
              </div>
            )}
          </div>
          <DiscardPool
            discards={players[leftIdx].discards}
            riichiDiscardIndex={players[leftIdx].riichiDiscardIndex ?? -1}
            tileWidth={28}
            tileHeight={38}
            position="left"
          />
        </div>

        <div className="flex flex-col items-center">
          <CenterInfo
            round={round}
            players={players}
            currentPlayer={gameState.currentPlayer}
            doraIndicators={gameState.doraIndicators || []}
            myIndex={myIndex}
          />
        </div>

        {/* 右（下家）- 捨て牌と手牌を縦並び */}
        <div className="flex flex-row items-center gap-1">
          <DiscardPool
            discards={players[rightIdx].discards}
            riichiDiscardIndex={players[rightIdx].riichiDiscardIndex ?? -1}
            tileWidth={28}
            tileHeight={38}
            position="right"
          />
          <div className="flex flex-col items-center gap-0.5">
            <div className="flex flex-col items-center">
              {Array.from({ length: players[rightIdx].closedCount || 0 }, (_, i) => (
                <TileSVG key={i} width={20} height={28} faceDown />
              ))}
            </div>
            {players[rightIdx].melds && players[rightIdx].melds.length > 0 && (
              <div className="mt-2 flex flex-row items-center gap-1 border-t border-white/20 pt-1">
                {players[rightIdx].melds.map((meld: Meld, mi: number) => (
                  <div key={mi} className="flex flex-row items-center">
                    {meld.tiles.map((tile: TileInstance, ti: number) => {
                      const isCalled = meld.calledTile && tile.index === meld.calledTile.index;
                      return (
                        <TileSVG
                          key={tile.index}
                          tile={tile}
                          width={20}
                          height={28}
                          sideways={!!isCalled}
                          faceDown={meld.type === MeldType.AnKan && (ti === 0 || ti === 3)}
                          rotation={-90}
                        />
                      );
                    })}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 下（自分） - 捨て牌と手牌 */}
      <div className="flex flex-col items-center gap-1">
        <DiscardPool
          discards={players[bottomIdx].discards}
          riichiDiscardIndex={players[bottomIdx].riichiDiscardIndex ?? -1}
          tileWidth={36}
          tileHeight={50}
        />
        <HandDisplay
          hand={myHand}
          isCurrentPlayer={actions.includes('discard')}
          selectedTile={selectedTile}
          onTileClick={handleTileClick}
          tileWidth={52}
          tileHeight={72}
          showTiles={true}
          dimmedTileIds={kuikaeDisallowedTiles}
        />
      </div>

      {/* アクションバー - 右側に縦配置 */}
      <ActionBar
        canTsumoAgari={actions.includes('tsumo_agari')}
        canRon={actions.includes('ron')}
        canRiichi={actions.includes('riichi')}
        canChi={actions.includes('chi')}
        canPon={actions.includes('pon')}
        canKan={actions.includes('kan')}
        canSkip={actions.includes('skip_call')}
        canKyuushu={actions.includes('kyuushu')}
        onTsumoAgari={() => sendAction({ type: 'tsumo_agari' })}
        onRon={() => sendAction({ type: 'ron' })}
        onRiichi={() => {
          if (selectedTile) sendAction({ type: 'riichi', tileIndex: selectedTile.index });
        }}
        onChi={handleChi}
        onPon={() => sendAction({ type: 'pon' })}
        onKan={handleKan}
        onSkip={() => sendAction({ type: 'skip_call' })}
        onKyuushu={() => sendAction({ type: 'kyuushu' })}
      />

      {/* チー候補選択ポップアップ */}
      {showChiSelector && chiOptions.length > 1 && (
        <ChiSelector
          options={chiOptions}
          onSelect={handleChiSelect}
          onCancel={() => setShowChiSelector(false)}
        />
      )}

      {/* 打牌ボタン - 左下グラスUI */}
      {selectedTile && actions.includes('discard') && (
        <div className="fixed bottom-2 left-2 sm:bottom-6 sm:left-6 z-40">
          <button
            onClick={() => {
              if (!kuikaeDisallowedTiles.includes(selectedTile.id)) {
                sendAction({ type: 'discard', tileIndex: selectedTile.index });
                setSelectedTile(null);
              }
            }}
            className="px-6 py-3 sm:px-10 sm:py-4 bg-white/10 backdrop-blur-md border border-orange-400/50 rounded-2xl
              text-white font-bold text-base sm:text-xl shadow-lg transition-all hover:bg-white/20
              hover:scale-105 active:scale-95"
          >
            打牌
          </button>
        </div>
      )}

      {/* 鳴き演出（ポン/チー/カン） */}
      {callAnnouncementText && (
        <CallAnnouncement text={callAnnouncementText} />
      )}

      {/* リーチカットイン */}
      {showRiichiAnnouncement && (
        <AgariAnnouncement text="リーチ" />
      )}

      {/* 自分が和了: 動画オーバーレイ（2s） */}
      {showAgariVideo && <AgariVideoOverlay />}

      {/* 他者が和了: ツモ/ロン 画像オーバーレイ */}
      {showAgariImage && (
        <AgariImageOverlay isTsumo={agariIsTsumo} direction={agariDirection} />
      )}

      {/* 局結果モーダル */}
      {showDetailedResult && gameState.roundResult && (
        <RoundResultModal
          result={gameState.roundResult}
          players={players}
          onNext={() => sendAction({ type: 'next_round' })}
        />
      )}
    </div>
  );
};

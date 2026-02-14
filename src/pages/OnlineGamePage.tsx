import React from 'react';
import type { TileInstance } from '../core/types/tile.ts';
import { TileSVG } from '../components/tile/TileSVG.tsx';
import { DiscardPool } from '../components/board/DiscardPool.tsx';
import { HandDisplay } from '../components/hand/HandDisplay.tsx';
import { CenterInfo } from '../components/board/CenterInfo.tsx';
import { ActionBar } from '../components/actions/ActionBar.tsx';
import { RoundResultModal } from '../components/result/RoundResultModal.tsx';
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
): { message: string; hint: string; color: string } {
  if (phase === 'round_result') {
    return { message: '局終了', hint: '', color: 'bg-purple-600' };
  }
  
  if (!isMyTurn && !canCall) {
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

  // ステータス計算
  const isMyTurn = gameState.currentPlayer === myIndex;
  const canDiscard = actions.includes('discard');
  const canCall = actions.includes('pon') || actions.includes('chi') || actions.includes('ron');
  const phaseInfo = getPhaseMessage(gameState.phase, isMyTurn, selectedTile, canDiscard, canCall);

  return (
    <div className="w-full h-[100dvh] bg-green-900 overflow-hidden relative flex flex-col items-center justify-between p-4 select-none sp-force-landscape">
      {/* ステータスインジケーター（グラスUI）
          SP: 打牌ボタンのすぐ上、左寄せ
          PC: 画面最左、縦中央 */}
      <div className="fixed bottom-[100px] left-2 sm:bottom-auto sm:left-3 sm:top-1/2 sm:-translate-y-1/2 z-50 pointer-events-none">
        <div className="bg-black/20 backdrop-blur-md border border-white/20 px-2 py-1 sm:px-6 sm:py-2 rounded-xl shadow-lg transition-all">
          <div className="text-white/90 font-bold text-xs sm:text-lg text-center whitespace-nowrap">{phaseInfo.message}</div>
          {phaseInfo.hint && (
            <div className="text-white/60 text-[9px] sm:text-sm text-center max-w-[120px] sm:max-w-none leading-tight">{phaseInfo.hint}</div>
          )}
        </div>
      </div>

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
          riichiDiscardIndex={-1}
          tileWidth={32}
          tileHeight={44}
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
            riichiDiscardIndex={-1} 
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
            riichiDiscardIndex={-1}
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
          riichiDiscardIndex={-1} 
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
        onChi={() => sendAction({ type: 'chi', tiles: [] })}
        onPon={() => sendAction({ type: 'pon' })}
        onKan={() => sendAction({ type: 'kan' })}
        onSkip={() => sendAction({ type: 'skip_call' })}
        onKyuushu={() => sendAction({ type: 'kyuushu' })}
      />

      {/* 打牌ボタン - 左下グラスUI */}
      {selectedTile && actions.includes('discard') && (
        <div className="fixed bottom-2 left-2 sm:bottom-6 sm:left-6 z-40">
          <button
            onClick={() => {
              sendAction({ type: 'discard', tileIndex: selectedTile.index });
              setSelectedTile(null);
            }}
            className="px-6 py-3 sm:px-10 sm:py-4 bg-white/10 backdrop-blur-md border border-orange-400/50 rounded-2xl
              text-white font-bold text-base sm:text-xl shadow-lg transition-all hover:bg-white/20
              hover:scale-105 active:scale-95"
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

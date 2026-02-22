import React, { useState, useMemo, useEffect } from 'react';
import type { TileId, TileInstance } from '../../core/types/tile.ts';
import type { GameState } from '../../core/types/game-state.ts';
import { TILE_NAMES } from '../../core/types/tile.ts';
import { toCount34 } from '../../core/tile/tile-utils.ts';
import { getWaitingTiles } from '../../core/agari/agari.ts';
import { TileSVG } from '../tile/TileSVG.tsx';

interface TenpaiIndicatorProps {
  gameState: GameState;
  humanPlayerIndex: number;
}

/**
 * 見えている牌（捨て牌、副露、ドラ表示牌）からある牌IDの残り枚数を計算
 */
function countRemainingTiles(tileId: TileId, gameState: GameState, humanPlayerIndex: number): number {
  let used = 0;

  // 全プレイヤーの捨て牌
  for (const player of gameState.players) {
    for (const t of player.discards) {
      if (t.id === tileId) used++;
    }
    // 副露の牌
    for (const meld of player.hand.melds) {
      for (const t of meld.tiles) {
        if (t.id === tileId) used++;
      }
    }
  }

  // 自分の手牌
  const myHand = gameState.players[humanPlayerIndex].hand;
  for (const t of myHand.closed) {
    if (t.id === tileId) used++;
  }
  if (myHand.tsumo && myHand.tsumo.id === tileId) {
    used++;
  }

  // ドラ表示牌
  for (const t of gameState.doraIndicators) {
    if (t.id === tileId) used++;
  }

  return Math.max(0, 4 - used);
}

/**
 * フリテンの原因牌を取得: 自分の待ち牌のうち自分の捨て牌にある牌
 */
function getFuritenTiles(gameState: GameState, humanPlayerIndex: number): TileId[] {
  const player = gameState.players[humanPlayerIndex];
  const hand = player.hand;

  let closedTiles: TileInstance[];
  if (hand.tsumo) {
    closedTiles = hand.closed;
  } else {
    closedTiles = hand.closed;
  }

  const counts = toCount34(closedTiles);
  const totalClosed = counts.reduce((a, b) => a + b, 0);
  const meldCount = hand.melds.length;
  const expectedClosed = 13 - meldCount * 3;
  if (totalClosed !== expectedClosed) return [];

  const waits = getWaitingTiles(counts, hand.melds);
  if (waits.length === 0) return [];

  const discardIds = new Set(player.discards.map(t => t.id));
  return waits.filter(w => discardIds.has(w));
}

export const TenpaiIndicator: React.FC<TenpaiIndicatorProps> = ({
  gameState,
  humanPlayerIndex,
}) => {
  const [showTooltip, setShowTooltip] = useState(false);
  const [isPC, setIsPC] = useState(false);

  useEffect(() => {
    // タッチデバイスでなければPCとみなす
    setIsPC(!('ontouchstart' in window));
  }, []);

  const tenpaiInfo = useMemo(() => {
    const player = gameState.players[humanPlayerIndex];
    const hand = player.hand;

    let closedTiles: TileInstance[];
    if (hand.tsumo) {
      closedTiles = hand.closed;
    } else {
      closedTiles = hand.closed;
    }

    const counts = toCount34(closedTiles);
    const totalClosed = counts.reduce((a, b) => a + b, 0);
    const meldCount = hand.melds.length;

    // 門前手牌が13枚（副露分差し引き）でなければテンパイ判定しない
    const expectedClosed = 13 - meldCount * 3;
    if (totalClosed !== expectedClosed) return null;

    const waits = getWaitingTiles(counts, hand.melds);
    if (waits.length === 0) return null;

    return waits.map(tileId => ({
      tileId,
      remaining: countRemainingTiles(tileId, gameState, humanPlayerIndex),
    }));
  }, [gameState, humanPlayerIndex]);

  const furitenTiles = useMemo(() => {
    return getFuritenTiles(gameState, humanPlayerIndex);
  }, [gameState, humanPlayerIndex]);

  const player = gameState.players[humanPlayerIndex];
  const isFuriten = player.isFuriten || player.tempFuriten;

  if (!tenpaiInfo) return null;

  const totalRemaining = tenpaiInfo.reduce((sum, w) => sum + w.remaining, 0);

  return (
    <div className="flex flex-col items-end gap-2">
      {/* テンパイインジケーター */}
      <div
        className="relative"
        onMouseEnter={() => setShowTooltip(true)}
        onMouseLeave={() => setShowTooltip(false)}
      >
        {/* テンパイアイコン */}
        <div className={`flex items-center gap-1.5 px-3 py-2 backdrop-blur-md border
          rounded-xl cursor-pointer transition-all shadow-lg
          ${isFuriten
            ? 'bg-red-500/20 border-red-400/60 hover:bg-red-500/30'
            : 'bg-orange-500/20 border-orange-400/60 hover:bg-orange-500/30'
          }`}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none"
            stroke={isFuriten ? '#ef4444' : '#f97316'} strokeWidth="2.5"
            strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" />
          </svg>
          <span className={`font-bold text-sm ${isFuriten ? 'text-red-300' : 'text-orange-300'}`}>
            {isFuriten ? 'フリテン' : '聴牌'}
          </span>
          <span className={`text-xs ${isFuriten ? 'text-red-200/70' : 'text-orange-200/70'}`}>
            残{totalRemaining}枚
          </span>
        </div>

        {/* ツールチップ: 待ち牌一覧（PCでは常時表示） */}
        {(isPC || showTooltip) && (
          <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 z-[100]
            bg-gray-900/95 backdrop-blur-md border border-orange-400/40 rounded-xl p-3 shadow-2xl
            min-w-[200px]"
          >
            <div className="text-orange-300 font-bold text-sm mb-2 text-center">待ち牌</div>
            <div className="flex flex-wrap gap-2 justify-center">
              {tenpaiInfo.map(({ tileId, remaining }) => (
                <div key={tileId} className="flex flex-col items-center gap-0.5">
                  <TileSVG tileId={tileId} width={32} height={44} />
                  <div className="text-xs text-center">
                    <span className="text-white/80">{TILE_NAMES[tileId]}</span>
                  </div>
                  <div className={`text-xs font-bold ${remaining > 0 ? 'text-orange-300' : 'text-red-400'}`}>
                    残{remaining}枚
                  </div>
                </div>
              ))}
            </div>
            {/* 矢印 */}
            <div className="absolute top-full left-1/2 -translate-x-1/2 w-0 h-0
              border-l-[8px] border-l-transparent
              border-r-[8px] border-r-transparent
              border-t-[8px] border-t-gray-900/95" />
          </div>
        )}
      </div>

      {/* フリテン表示エリア（右下に表示） */}
      {isFuriten && furitenTiles.length > 0 && (
        <div className="bg-red-900/40 backdrop-blur-md border border-red-400/40 rounded-xl p-2 shadow-lg">
          <div className="text-red-300 font-bold text-xs mb-1 text-center">フリテン原因牌</div>
          <div className="flex flex-wrap gap-1 justify-center">
            {furitenTiles.map((tileId) => (
              <div key={tileId} className="flex flex-col items-center gap-0.5">
                <TileSVG tileId={tileId} width={28} height={38} />
                <div className="text-xs text-red-200/80">{TILE_NAMES[tileId]}</div>
              </div>
            ))}
          </div>
          {player.tempFuriten && !player.isFuriten && (
            <div className="text-red-400/70 text-[10px] text-center mt-1">同巡フリテン</div>
          )}
        </div>
      )}
    </div>
  );
};

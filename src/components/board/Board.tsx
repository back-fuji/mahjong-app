import React, { useMemo } from 'react';
import type { GameState } from '../../core/types/game-state.ts';
import type { TileId, TileInstance } from '../../core/types/tile.ts';
import { HandDisplay } from '../hand/HandDisplay.tsx';
import { DiscardPool } from './DiscardPool.tsx';
import { CenterInfo } from './CenterInfo.tsx';
import { WIND_NAMES } from '../../core/types/player.ts';
import { useWindowSize } from '../../hooks/useWindowSize.ts';

interface AgariInfo {
  winner: number;
  loser: number;
  isTsumo: boolean;
}

interface BoardProps {
  gameState: GameState;
  humanPlayerIndex: number;
  selectedTile: TileInstance | null;
  onTileClick: (tile: TileInstance) => void;
  /** 鳴き対象のハイライト牌ID */
  highlightTileIds?: TileId[];
  /** 最後の打牌をハイライトするプレイヤーのインデックス（-1 = なし） */
  highlightLastDiscardPlayer?: number;
  /** 喰い替え禁止牌ID（dimmed表示用） */
  dimmedTileIds?: TileId[];
  /** ドラッグ開始 */
  onDragStart?: (tile: TileInstance) => void;
  /** ドロップ（打牌） */
  onDrop?: (tile: TileInstance) => void;
  /** 和了演出情報 */
  agariInfo?: AgariInfo;
}

export const Board: React.FC<BoardProps> = ({
  gameState,
  humanPlayerIndex,
  selectedTile,
  onTileClick,
  highlightTileIds,
  highlightLastDiscardPlayer = -1,
  dimmedTileIds,
  onDragStart,
  onDrop,
  agariInfo,
}) => {
  const { players, round, currentPlayer, doraIndicators } = gameState;
  const windowSize = useWindowSize();

  // 相対位置: 0=自分(下), 1=右, 2=対面, 3=左
  const getRelativeIndex = (rel: number) => (humanPlayerIndex + rel) % 4;

  const bottomIdx = humanPlayerIndex;
  const rightIdx = getRelativeIndex(1);
  const topIdx = getRelativeIndex(2);
  const leftIdx = getRelativeIndex(3);

  // agariInfo時のハイライト: ロン時は放銃者の最後の打牌をハイライト
  const effectiveHighlightLastDiscard = agariInfo
    ? (agariInfo.isTsumo ? -1 : agariInfo.loser)
    : highlightLastDiscardPlayer;

  // レスポンシブ牌サイズ計算
  const sizes = useMemo(() => {
    const w = windowSize.width;
    const isMobile = w < 640;
    const isTablet = w >= 640 && w < 1024;

    if (windowSize.isMobileLandscape) {
      return {
        topDiscard: { w: 18, h: 25 },
        sideDiscard: { w: 17, h: 24 },
        bottomDiscard: { w: 18, h: 25 },
        topHand: { w: 14, h: 20 },
        sideHand: { w: 11, h: 16 },
        bottomHand: { w: 24, h: 33 },
      };
    }
    if (isMobile) {
      return {
        topDiscard: { w: 16, h: 22 },
        sideDiscard: { w: 14, h: 19 },
        bottomDiscard: { w: 20, h: 28 },
        topHand: { w: 16, h: 22 },
        sideHand: { w: 13, h: 18 },
        bottomHand: { w: 30, h: 42 },
      };
    }
    if (isTablet) {
      return {
        topDiscard: { w: 20, h: 28 },
        sideDiscard: { w: 17, h: 23 },
        bottomDiscard: { w: 24, h: 34 },
        topHand: { w: 20, h: 28 },
        sideHand: { w: 15, h: 22 },
        bottomHand: { w: 38, h: 52 },
      };
    }
    return {
      topDiscard: { w: 24, h: 33 },
      sideDiscard: { w: 20, h: 27 },
      bottomDiscard: { w: 28, h: 38 },
      topHand: { w: 24, h: 34 },
      sideHand: { w: 18, h: 26 },
      bottomHand: { w: 48, h: 66 },
    };
  }, [windowSize.width, windowSize.isMobileLandscape]);

  const { topDiscard, sideDiscard, bottomDiscard } = sizes;

  // 左右の捨て牌エリアサイズ（回転後の表示サイズを考慮）
  const sideDiscardPreRotateW = sideDiscard.w * 6;
  const sideDiscardPreRotateH = sideDiscard.h * 4;
  const sideDiscardAreaW = sideDiscardPreRotateH;
  const sideDiscardAreaH = sideDiscardPreRotateW;

  // 各プレイヤーの手牌公開判定
  const shouldShowTiles = (playerIdx: number) => {
    if (playerIdx === bottomIdx) return true;
    if (agariInfo && playerIdx === agariInfo.winner) return true;
    return false;
  };

  const isMobileLandscape = windowSize.isMobileLandscape;

  return (
    <div className={`w-full h-full flex flex-col items-center justify-between select-none overflow-hidden ${isMobileLandscape ? 'p-0.5 gap-0' : 'p-2'}`}>
      {/* 上（対面） */}
      <div className={`flex flex-col items-center gap-0 flex-shrink-0 ${isMobileLandscape ? 'mt-0' : ''}`}>
        <div className="flex items-center gap-1">
          <HandDisplay
            hand={players[topIdx].hand}
            isCurrentPlayer={false}
            showTiles={shouldShowTiles(topIdx)}
            tileWidth={sizes.topHand.w}
            tileHeight={sizes.topHand.h}
          />
          <div className={`${isMobileLandscape ? 'text-[8px]' : 'text-[10px] sm:text-xs'} text-gray-300 font-bold whitespace-nowrap px-1`}>
            <span className={players[topIdx].seatWind === 0 ? 'text-red-400' : 'text-yellow-400'}>{WIND_NAMES[players[topIdx].seatWind]}</span>
            {players[topIdx].seatWind === 0 && <span className="text-red-400 text-[8px] ml-0.5">親</span>}
            <span className="ml-0.5">{players[topIdx].name}</span>
          </div>
        </div>
        <div className="flex items-end justify-center" style={{ minHeight: topDiscard.h * (isMobileLandscape ? 2.5 : 4) }}>
          <DiscardPool
            discards={players[topIdx].discards}
            riichiDiscardIndex={players[topIdx].riichiDiscardIndex}
            tileWidth={topDiscard.w}
            tileHeight={topDiscard.h}
            highlightLast={effectiveHighlightLastDiscard === topIdx}
            highlightTileId={selectedTile?.id}
            position="top"
          />
        </div>
      </div>

      {/* 中段: 左・中央・右 */}
      <div className={`flex items-center w-full max-w-6xl flex-shrink-0 ${isMobileLandscape ? 'my-0 justify-between' : 'justify-center'}`}>
        {/* 左（上家） */}
        <div className="flex flex-row items-center gap-0.5 flex-shrink-0">
          <div className="flex flex-col items-center gap-0.5">
            <HandDisplay
              hand={players[leftIdx].hand}
              isCurrentPlayer={false}
              showTiles={shouldShowTiles(leftIdx)}
              tileWidth={sizes.sideHand.w}
              tileHeight={sizes.sideHand.h}
              vertical={true}
            />
            <div className={`${isMobileLandscape ? 'text-[7px]' : 'text-[9px] sm:text-[10px]'} text-gray-300 font-bold whitespace-nowrap`}>
              <span className={players[leftIdx].seatWind === 0 ? 'text-red-400' : 'text-yellow-400'}>{WIND_NAMES[players[leftIdx].seatWind]}</span>
              {players[leftIdx].seatWind === 0 && <span className="text-red-400 text-[7px] ml-0.5">親</span>}
              <span className="ml-0.5">{players[leftIdx].name}</span>
            </div>
          </div>
          <div
            className="flex items-center justify-center"
            style={{ width: sideDiscardAreaW, height: sideDiscardAreaH }}
          >
            <DiscardPool
              discards={players[leftIdx].discards}
              riichiDiscardIndex={players[leftIdx].riichiDiscardIndex}
              tileWidth={sideDiscard.w}
              tileHeight={sideDiscard.h}
              highlightLast={effectiveHighlightLastDiscard === leftIdx}
              highlightTileId={selectedTile?.id}
              position="left"
            />
          </div>
        </div>

        {/* 中央情報 */}
        <div className={`flex flex-col items-center flex-shrink-0 ${isMobileLandscape ? 'mx-0.5' : 'mx-2'}`}>
          <CenterInfo
            round={round}
            players={players}
            currentPlayer={currentPlayer}
            doraIndicators={doraIndicators}
            myIndex={humanPlayerIndex}
            compact={isMobileLandscape}
          />
        </div>

        {/* 右（下家） */}
        <div className="flex flex-row items-center gap-0.5 flex-shrink-0">
          <div
            className="flex items-center justify-center"
            style={{ width: sideDiscardAreaW, height: sideDiscardAreaH }}
          >
            <DiscardPool
              discards={players[rightIdx].discards}
              riichiDiscardIndex={players[rightIdx].riichiDiscardIndex}
              tileWidth={sideDiscard.w}
              tileHeight={sideDiscard.h}
              highlightLast={effectiveHighlightLastDiscard === rightIdx}
              highlightTileId={selectedTile?.id}
              position="right"
            />
          </div>
          <div className="flex flex-col items-center gap-0.5">
            <div className={`${isMobileLandscape ? 'text-[7px]' : 'text-[9px] sm:text-[10px]'} text-gray-300 font-bold whitespace-nowrap`}>
              <span className={players[rightIdx].seatWind === 0 ? 'text-red-400' : 'text-yellow-400'}>{WIND_NAMES[players[rightIdx].seatWind]}</span>
              {players[rightIdx].seatWind === 0 && <span className="text-red-400 text-[7px] ml-0.5">親</span>}
              <span className="ml-0.5">{players[rightIdx].name}</span>
            </div>
            <HandDisplay
              hand={players[rightIdx].hand}
              isCurrentPlayer={false}
              showTiles={shouldShowTiles(rightIdx)}
              tileWidth={sizes.sideHand.w}
              tileHeight={sizes.sideHand.h}
              vertical={true}
            />
          </div>
        </div>
      </div>

      {/* 下（自分） */}
      <div className={`flex flex-col items-center gap-0 ${isMobileLandscape ? 'mb-0 flex-shrink min-h-0' : 'flex-shrink-0'}`}>
        <div
          className="flex items-start justify-center"
          // style={{ minHeight: bottomDiscard.h * (isMobileLandscape ? 2 : 3) }}
          onDragOver={(e) => { e.preventDefault(); e.dataTransfer.dropEffect = 'move'; }}
          onDrop={(e) => {
            e.preventDefault();
            try {
              const data = JSON.parse(e.dataTransfer.getData('text/plain'));
              if (data && typeof data.index === 'number' && onDrop) {
                const player = players[bottomIdx];
                const allTiles = player.hand.tsumo
                  ? [...player.hand.closed, player.hand.tsumo]
                  : [...player.hand.closed];
                const tile = allTiles.find(t => t.index === data.index);
                if (tile) onDrop(tile);
              }
            } catch { /* ignore parse errors from drag data */ }
          }}
        >
          <DiscardPool
            discards={players[bottomIdx].discards}
            riichiDiscardIndex={players[bottomIdx].riichiDiscardIndex}
            tileWidth={bottomDiscard.w}
            tileHeight={bottomDiscard.h}
            highlightLast={effectiveHighlightLastDiscard === bottomIdx}
            highlightTileId={selectedTile?.id}
            position="bottom"
          />
        </div>
        <div className="flex items-center gap-1 max-w-full w-full px-1">
          <div className="flex-1 min-w-0">
            <HandDisplay
              hand={players[bottomIdx].hand}
              isCurrentPlayer={!agariInfo && currentPlayer === bottomIdx && (gameState.phase === 'discard' || gameState.phase === 'riichi_confirm')}
              selectedTile={agariInfo ? null : selectedTile}
              onTileClick={agariInfo ? undefined : onTileClick}
              tileWidth={sizes.bottomHand.w}
              tileHeight={sizes.bottomHand.h}
              showTiles={true}
              highlightTileIds={agariInfo ? undefined : highlightTileIds}
              dimmedTileIds={agariInfo ? undefined : dimmedTileIds}
              onDragStart={agariInfo ? undefined : onDragStart}
            />
          </div>
          <div className={`${isMobileLandscape ? 'text-[8px]' : 'text-[10px] sm:text-xs'} text-gray-300 font-bold whitespace-nowrap flex-shrink-0`}>
            <span className={players[bottomIdx].seatWind === 0 ? 'text-red-400' : 'text-yellow-400'}>{WIND_NAMES[players[bottomIdx].seatWind]}</span>
            {players[bottomIdx].seatWind === 0 && <span className="text-red-400 text-[8px] ml-0.5">親</span>}
            <span className="ml-0.5">{players[bottomIdx].name}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

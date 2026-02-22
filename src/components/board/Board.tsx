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
  // 親コンテナを縦3等分し、各セクションの高さを基準にサイズを決定する
  const sizes = useMemo(() => {
    const W = windowSize.width;
    const H = windowSize.height;
    const sH = H / 3; // 各セクションの高さ

    if (windowSize.isMobileLandscape) {
      // SP横向き: 高さが少ないため固定値
      return {
        topDiscard: { w: 18, h: 25 },
        sideDiscard: { w: 17, h: 24 },
        bottomDiscard: { w: 18, h: 25 },
        topHand: { w: 14, h: 20 },
        sideHand: { w: 11, h: 16 },
        bottomHand: { w: 24, h: 33 },
      };
    }

    // 上下セクション: 捨て牌(最大4行) + 手牌(1行)が収まるサイズ
    const discardH = Math.max(16, Math.min(50, Math.floor(sH * 0.17)));
    const discardW = Math.max(11, Math.floor(discardH * 0.72));

    const topHandH = Math.max(18, Math.min(55, Math.floor(sH * 0.20)));
    const topHandW = Math.max(13, Math.floor(topHandH * 0.72));

    // 自分の手牌: 高さと横幅の両方を制約
    // 14枚（13+ツモ）が画面幅に収まる最大幅
    const bottomHandW_maxFromW = Math.floor((W - 30) / 14);
    const bottomHandH_fromH = Math.min(90, Math.floor(sH * 0.28));
    const bottomHandH = Math.max(28, Math.min(bottomHandH_fromH, Math.floor(bottomHandW_maxFromW / 0.72)));
    const bottomHandW = Math.max(20, Math.floor(bottomHandH * 0.72));

    // 中段サイドプレイヤー: 横幅制約
    // 中段の横: 2×(sideHandH + 4×sideDiscardH) + 260(center) ≤ W
    // sideHandH ≈ sideDiscardH × 1.1  →  合計係数: 2×(1.1+4) = 10.2
    const centerW = 260;
    const sideDiscardH_fromW = Math.floor((W - centerW - 20) / 10.2);
    // 高さ制約: 6×sideDiscardW ≤ sH  →  sideDiscardH ≤ sH/4.3
    const sideDiscardH_fromH = Math.floor(sH / 4.5);
    const sideDiscardH = Math.max(12, Math.min(40, Math.min(sideDiscardH_fromW, sideDiscardH_fromH)));
    const sideDiscardW = Math.max(8, Math.floor(sideDiscardH * 0.72));
    const sideHandH = Math.max(12, Math.min(44, Math.floor(sideDiscardH * 1.1)));
    const sideHandW = Math.max(8, Math.floor(sideHandH * 0.72));

    return {
      topDiscard: { w: discardW, h: discardH },
      sideDiscard: { w: sideDiscardW, h: sideDiscardH },
      bottomDiscard: { w: discardW, h: discardH },
      topHand: { w: topHandW, h: topHandH },
      sideHand: { w: sideHandW, h: sideHandH },
      bottomHand: { w: bottomHandW, h: bottomHandH },
    };
  }, [windowSize.width, windowSize.height, windowSize.isMobileLandscape]);

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
    // 親コンテナを縦3等分: flex-col, 各子要素が flex-1 で1/3を占める
    <div className={`w-full h-full flex flex-col items-center select-none overflow-hidden ${isMobileLandscape ? 'gap-0' : ''}`}>

      {/* ===== 上（対面）- 全体の1/3 ===== */}
      <div className="flex-1 min-h-0 w-full flex flex-col items-center justify-center overflow-hidden">
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
        <div className="flex items-end justify-center mt-1">
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

      {/* ===== 中段: 左・中央・右 - 全体の1/3 ===== */}
      <div className={`flex-1 min-h-0 w-full flex items-center overflow-hidden ${isMobileLandscape ? 'justify-between' : 'justify-center gap-2'}`}>
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
              sidePosition="left"
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
        <div className={`flex flex-col items-center flex-shrink-0 ${isMobileLandscape ? 'mx-0.5' : ''}`}>
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
              sidePosition="right"
            />
          </div>
        </div>
      </div>

      {/* ===== 下（自分）- 全体の1/3 ===== */}
      <div className={`flex-1 min-h-0 w-full flex flex-col items-center justify-center overflow-hidden ${isMobileLandscape ? '' : ''}`}>
        <div
          className="flex items-start justify-center"
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
        <div className="flex items-center justify-center gap-2 mt-1 px-1">
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

import React from 'react';
import type { Hand } from '../../core/types/hand.ts';
import type { TileId, TileInstance } from '../../core/types/tile.ts';
import { MeldType } from '../../core/types/meld.ts';
import { TileSVG } from '../tile/TileSVG.tsx';

interface HandDisplayProps {
  hand: Hand;
  isCurrentPlayer: boolean;
  selectedTile?: TileInstance | null;
  onTileClick?: (tile: TileInstance) => void;
  tileWidth?: number;
  tileHeight?: number;
  showTiles?: boolean;
  /** 縦並び表示（左右のプレイヤー用） */
  vertical?: boolean;
  /** 鳴き対象のハイライト牌ID */
  highlightTileIds?: TileId[];
  /** 喰い替え禁止牌ID（dimmed表示用） */
  dimmedTileIds?: TileId[];
  /** ドラッグ開始時のコールバック */
  onDragStart?: (tile: TileInstance) => void;
}

export const HandDisplay: React.FC<HandDisplayProps> = ({
  hand,
  isCurrentPlayer,
  selectedTile,
  onTileClick,
  tileWidth = 40,
  tileHeight = 56,
  showTiles = true,
  vertical = false,
  highlightTileIds,
  dimmedTileIds,
  onDragStart,
}) => {
  const highlightSet = highlightTileIds ? new Set(highlightTileIds) : null;
  const dimmedSet = dimmedTileIds ? new Set(dimmedTileIds) : null;

  const makeDragProps = (tile: TileInstance) => {
    if (!isCurrentPlayer || !onDragStart || dimmedSet?.has(tile.id)) return {};
    return {
      draggable: true,
      onDragStart: (e: React.DragEvent) => {
        e.dataTransfer.setData('text/plain', JSON.stringify({ index: tile.index, id: tile.id }));
        e.dataTransfer.effectAllowed = 'move';
        onDragStart(tile);
      },
    };
  };
  const hasMelds = hand.melds.length > 0;

  if (vertical) {
    // 縦並び表示（左右プレイヤー用）
    return (
      <div className="flex flex-col items-center gap-0.5">
        {/* 副露（上に表示 - 画面からはみ出さないように） */}
        {hasMelds && (
          <div className="mb-1 flex flex-row items-center gap-1 bg-black/30 rounded px-1 py-0.5">
            {hand.melds.map((meld, mi) => (
              <div key={mi} className="flex flex-row items-center">
                {meld.tiles.map((tile, ti) => {
                  const isCalled = meld.calledTile && tile.index === meld.calledTile.index;
                  return (
                    <TileSVG
                      key={tile.index}
                      tile={tile}
                      width={tileWidth}
                      height={tileHeight}
                      sideways={!!isCalled}
                      faceDown={meld.type === MeldType.AnKan && (ti === 0 || ti === 3)}
                    />
                  );
                })}
              </div>
            ))}
          </div>
        )}

        {/* 門前手牌 */}
        <div className="flex flex-col items-center">
          {hand.closed.map((tile) => (
            <TileSVG
              key={tile.index}
              tile={tile}
              width={tileWidth}
              height={tileHeight}
              faceDown={!showTiles}
              selected={selectedTile?.index === tile.index}
              onClick={isCurrentPlayer && onTileClick ? () => onTileClick(tile) : undefined}
            />
          ))}
        </div>

        {/* ツモ牌 */}
        {hand.tsumo && (
          <div className="mt-2">
            <TileSVG
              tile={hand.tsumo}
              width={tileWidth}
              height={tileHeight}
              faceDown={!showTiles}
              selected={selectedTile?.index === hand.tsumo.index}
              onClick={isCurrentPlayer && onTileClick ? () => onTileClick(hand.tsumo!) : undefined}
            />
          </div>
        )}
      </div>
    );
  }

  // 横並び表示（自分・対面用）
  // SP時に横幅が収まらない場合はスクロール可能にする
  return (
    <div className="max-w-full">
      <div className="flex items-end w-max">
        {/* 門前手牌 */}
        <div className="flex items-end">
          {hand.closed.map((tile) => (
            <div key={tile.index} {...makeDragProps(tile)} style={{ cursor: isCurrentPlayer && !dimmedSet?.has(tile.id) ? 'grab' : undefined }}>
              <TileSVG
                tile={tile}
                width={tileWidth}
                height={tileHeight}
                faceDown={!showTiles}
                selected={selectedTile?.index === tile.index}
                highlighted={!!highlightSet?.has(tile.id)}
                dimmed={!!dimmedSet?.has(tile.id)}
                onClick={isCurrentPlayer && onTileClick && !dimmedSet?.has(tile.id) ? () => onTileClick(tile) : undefined}
              />
            </div>
          ))}
        </div>

        {/* ツモ牌（少し離す）- showTiles時はスペースを常に確保して手牌のずれを防止 */}
        {showTiles ? (
          <div className="ml-2 sm:ml-4" style={{ width: tileWidth, minWidth: tileWidth }}>
            {hand.tsumo && (
              <div {...makeDragProps(hand.tsumo)} style={{ cursor: isCurrentPlayer && !dimmedSet?.has(hand.tsumo.id) ? 'grab' : undefined }}>
                <TileSVG
                  tile={hand.tsumo}
                  width={tileWidth}
                  height={tileHeight}
                  faceDown={false}
                  selected={selectedTile?.index === hand.tsumo.index}
                  highlighted={!!highlightSet?.has(hand.tsumo.id)}
                  dimmed={!!dimmedSet?.has(hand.tsumo.id)}
                  onClick={isCurrentPlayer && onTileClick && !dimmedSet?.has(hand.tsumo.id) ? () => onTileClick(hand.tsumo!) : undefined}
                />
              </div>
            )}
          </div>
        ) : hand.tsumo ? (
          <div className="ml-2 sm:ml-4">
            <TileSVG
              tile={hand.tsumo}
              width={tileWidth}
              height={tileHeight}
              faceDown={true}
            />
          </div>
        ) : null}

        {/* 副露（右側に離して表示） */}
        {hasMelds && (
          <div className="ml-2 sm:ml-4 pl-1 sm:pl-2 flex items-end gap-1 sm:gap-2 bg-black/30 rounded py-0.5 px-1">
            {hand.melds.map((meld, mi) => (
              <div key={mi} className="flex items-end">
                {meld.tiles.map((tile, ti) => {
                  const isCalled = meld.calledTile && tile.index === meld.calledTile.index;
                  return (
                    <TileSVG
                      key={tile.index}
                      tile={tile}
                      width={tileWidth}
                      height={tileHeight}
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
  );
};

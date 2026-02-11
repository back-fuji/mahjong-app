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
}) => {
  const highlightSet = highlightTileIds ? new Set(highlightTileIds) : null;
  const hasMelds = hand.melds.length > 0;

  if (vertical) {
    // 縦並び表示（左右プレイヤー用）
    return (
      <div className="flex flex-col items-center gap-0.5">
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

        {/* 副露（下に離して表示） */}
        {hasMelds && (
          <div className="mt-4 flex flex-col items-center gap-1">
            {hand.melds.map((meld, mi) => (
              <div key={mi} className="flex flex-col items-center">
                {meld.tiles.map((tile, ti) => {
                  const isCalled = meld.calledTile && tile.index === meld.calledTile.index;
                  return (
                    <TileSVG
                      key={tile.index}
                      tile={tile}
                      width={tileWidth * 0.85}
                      height={tileHeight * 0.85}
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
    );
  }

  // 横並び表示（自分・対面用）
  return (
    <div className="flex items-end">
      {/* 門前手牌 */}
      <div className="flex items-end">
        {hand.closed.map((tile) => (
          <TileSVG
            key={tile.index}
            tile={tile}
            width={tileWidth}
            height={tileHeight}
            faceDown={!showTiles}
            selected={selectedTile?.index === tile.index}
            highlighted={!!highlightSet?.has(tile.id)}
            onClick={isCurrentPlayer && onTileClick ? () => onTileClick(tile) : undefined}
          />
        ))}
      </div>

      {/* ツモ牌（少し離す） */}
      {hand.tsumo && (
        <div className="ml-4">
          <TileSVG
            tile={hand.tsumo}
            width={tileWidth}
            height={tileHeight}
            faceDown={!showTiles}
            selected={selectedTile?.index === hand.tsumo.index}
            highlighted={!!highlightSet?.has(hand.tsumo.id)}
            onClick={isCurrentPlayer && onTileClick ? () => onTileClick(hand.tsumo!) : undefined}
          />
        </div>
      )}

      {/* 副露（右側に大きく離して表示） */}
      {hasMelds && (
        <div className="ml-10 flex items-end gap-2">
          {hand.melds.map((meld, mi) => (
            <div key={mi} className="flex items-end">
              {meld.tiles.map((tile, ti) => {
                const isCalled = meld.calledTile && tile.index === meld.calledTile.index;
                return (
                  <TileSVG
                    key={tile.index}
                    tile={tile}
                    width={tileWidth * 0.85}
                    height={tileHeight * 0.85}
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
  );
};

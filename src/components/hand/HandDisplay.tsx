import React from 'react';
import type { Hand } from '../../core/types/hand.ts';
import type { TileInstance } from '../../core/types/tile.ts';
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
}

export const HandDisplay: React.FC<HandDisplayProps> = ({
  hand,
  isCurrentPlayer,
  selectedTile,
  onTileClick,
  tileWidth = 40,
  tileHeight = 56,
  showTiles = true,
}) => {
  return (
    <div className="flex items-end gap-1">
      {/* 副露 */}
      {hand.melds.map((meld, mi) => (
        <div key={mi} className="flex items-end mr-2">
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
            onClick={isCurrentPlayer && onTileClick ? () => onTileClick(tile) : undefined}
          />
        ))}
      </div>

      {/* ツモ牌（少し離す） */}
      {hand.tsumo && (
        <div className="ml-3">
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
};

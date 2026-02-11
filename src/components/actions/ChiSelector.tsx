import React from 'react';
import type { CallOption } from '../../core/types/meld.ts';
import { TileSVG } from '../tile/TileSVG.tsx';
import { TILE_SHORT } from '../../core/types/tile.ts';

interface ChiSelectorProps {
  options: CallOption[];
  onSelect: (option: CallOption) => void;
  onCancel: () => void;
}

/**
 * 複数チー候補から選択するポップアップ
 */
export const ChiSelector: React.FC<ChiSelectorProps> = ({ options, onSelect, onCancel }) => {
  return (
    <div className="fixed bottom-24 left-6 z-[60]
      bg-gray-900/95 backdrop-blur-md border border-orange-400/50 rounded-2xl p-4 shadow-2xl">
      <div className="text-orange-300 font-bold text-sm mb-3 text-center">チーの組み合わせを選択</div>
      <div className="flex flex-wrap gap-3 justify-center">
        {options.map((opt, i) => {
          // 3枚を昇順にソート（calledTile含む）
          const allTiles = [...opt.tiles, opt.calledTile].sort((a, b) => a - b);
          return (
            <button
              key={i}
              onClick={() => onSelect(opt)}
              className="flex items-end gap-0.5 px-2 py-2 rounded-xl border border-gray-600
                hover:border-orange-400 hover:bg-orange-500/10 transition-all cursor-pointer
                active:scale-95"
            >
              {allTiles.map((tileId, ti) => {
                const isCalled = tileId === opt.calledTile;
                return (
                  <div key={ti} className="flex flex-col items-center">
                    <TileSVG
                      tileId={tileId}
                      width={36}
                      height={50}
                      highlighted={isCalled}
                    />
                    <span className={`text-[10px] mt-0.5 ${isCalled ? 'text-orange-400' : 'text-gray-400'}`}>
                      {TILE_SHORT[tileId]}
                    </span>
                  </div>
                );
              })}
            </button>
          );
        })}
      </div>
      <button
        onClick={onCancel}
        className="w-full mt-3 py-2 text-sm text-gray-400 hover:text-white
          bg-gray-800/50 hover:bg-gray-700/50 rounded-lg transition-colors"
      >
        やめる
      </button>
    </div>
  );
};

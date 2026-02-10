import React from 'react';
import type { Player } from '../../core/types/player.ts';
import { WIND_NAMES } from '../../core/types/player.ts';

interface GameResultScreenProps {
  players: Player[];
  onBackToMenu: () => void;
  onPlayAgain: () => void;
}

export const GameResultScreen: React.FC<GameResultScreenProps> = ({
  players,
  onBackToMenu,
  onPlayAgain,
}) => {
  const sorted = [...players].sort((a, b) => b.score - a.score);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-gray-900 to-green-900">
      <div className="bg-gray-900/90 rounded-2xl p-8 max-w-md w-full mx-4 text-white">
        <h1 className="text-3xl font-bold text-center text-yellow-400 mb-6">対局結果</h1>

        <div className="space-y-3 mb-8">
          {sorted.map((p, rank) => (
            <div
              key={p.id}
              className={`flex items-center justify-between p-3 rounded-lg ${
                rank === 0 ? 'bg-yellow-600/30 border border-yellow-500' :
                'bg-gray-800'
              }`}
            >
              <div className="flex items-center gap-3">
                <span className={`text-2xl font-bold ${
                  rank === 0 ? 'text-yellow-400' : 'text-gray-500'
                }`}>
                  {rank + 1}
                </span>
                <div>
                  <div className="font-bold">{p.name}</div>
                  <div className="text-xs text-gray-400">{p.isHuman ? 'プレイヤー' : 'CPU'}</div>
                </div>
              </div>
              <div className={`text-xl font-mono font-bold ${
                p.score >= 25000 ? 'text-green-400' : 'text-red-400'
              }`}>
                {p.score.toLocaleString()}
              </div>
            </div>
          ))}
        </div>

        <div className="flex gap-3">
          <button
            onClick={onPlayAgain}
            className="flex-1 py-3 bg-blue-600 hover:bg-blue-700 rounded-lg font-bold transition-colors"
          >
            もう一度
          </button>
          <button
            onClick={onBackToMenu}
            className="flex-1 py-3 bg-gray-700 hover:bg-gray-600 rounded-lg font-bold transition-colors"
          >
            メニューへ
          </button>
        </div>
      </div>
    </div>
  );
};

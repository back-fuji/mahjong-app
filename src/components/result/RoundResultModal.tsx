import React from 'react';
import type { RoundResult } from '../../core/types/game-state.ts';
import type { Player } from '../../core/types/player.ts';
import { WIND_NAMES } from '../../core/types/player.ts';
import { TILE_NAMES } from '../../core/types/tile.ts';

interface RoundResultModalProps {
  result: RoundResult;
  players: Player[];
  onNext: () => void;
}

export const RoundResultModal: React.FC<RoundResultModalProps> = ({ result, players, onNext }) => {
  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
      <div className="bg-gray-900 rounded-2xl p-6 max-w-lg w-full mx-4 text-white">
        {result.agari && result.agari.length > 0 ? (
          result.agari.map((agari, i) => {
            const winner = players[agari.winner];
            const score = agari.scoreResult;
            return (
              <div key={i} className="mb-4">
                <h2 className="text-2xl font-bold text-center text-yellow-400 mb-3">
                  {agari.isTsumo ? 'ツモ!' : 'ロン!'}
                </h2>
                <div className="text-center text-lg mb-2">
                  {WIND_NAMES[winner.seatWind]} {winner.name}
                </div>

                <div className="bg-gray-800 rounded-lg p-3 mb-3">
                  <div className="space-y-1">
                    {score.yaku.map((y, yi) => (
                      <div key={yi} className="flex justify-between text-sm">
                        <span>{y.name}</span>
                        <span className="text-yellow-300">
                          {y.isYakuman ? '役満' : `${y.han}翻`}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="text-center">
                  <div className="text-sm text-gray-400">{score.label}</div>
                  <div className="text-3xl font-bold text-yellow-300">
                    {score.payment.total.toLocaleString()}点
                  </div>
                  {agari.isTsumo && score.payment.tsumoKo && (
                    <div className="text-sm text-gray-400 mt-1">
                      {score.payment.tsumoOya
                        ? `${score.payment.tsumoKo}/${score.payment.tsumoOya}`
                        : `${score.payment.tsumoKo}オール`
                      }
                    </div>
                  )}
                </div>
              </div>
            );
          })
        ) : result.draw ? (
          <div className="text-center">
            <h2 className="text-2xl font-bold text-gray-400 mb-3">流局</h2>
            <div className="text-sm mb-2">
              テンパイ: {result.draw.tenpaiPlayers.length > 0
                ? result.draw.tenpaiPlayers.map(i => players[i].name).join(', ')
                : 'なし'
              }
            </div>
            {result.draw.tenpaiPlayers.length > 0 && result.draw.tenpaiPlayers.length < 4 && (
              <div className="text-sm text-gray-400">ノーテン罰符</div>
            )}
          </div>
        ) : null}

        <button
          onClick={onNext}
          className="w-full mt-4 py-3 bg-blue-600 hover:bg-blue-700 rounded-lg font-bold text-lg transition-colors"
        >
          次へ
        </button>
      </div>
    </div>
  );
};

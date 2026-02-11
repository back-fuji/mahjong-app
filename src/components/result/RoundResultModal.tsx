import React from 'react';
import { motion } from 'framer-motion';
import type { RoundResult } from '../../core/types/game-state.ts';
import type { Player } from '../../core/types/player.ts';
import { WIND_NAMES } from '../../core/types/player.ts';
import { TileSVG } from '../tile/TileSVG.tsx';
import { MeldType } from '../../core/types/meld.ts';

interface RoundResultModalProps {
  result: RoundResult;
  players: Player[];
  onNext: () => void;
}

export const RoundResultModal: React.FC<RoundResultModalProps> = ({ result, players, onNext }) => {
  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-[100]">
      <div className="bg-gray-900 rounded-2xl p-6 max-w-2xl w-full mx-4 text-white max-h-[90vh] overflow-y-auto">
        {result.agari && result.agari.length > 0 ? (
          result.agari.map((agari, i) => {
            const winner = players[agari.winner];
            const score = agari.scoreResult;
            return (
              <div key={i} className="mb-4">
                {/* 和了タイトル */}
                <h2
                  className="text-3xl font-bold text-center mb-3"
                  style={{
                    fontFamily: '"Yu Mincho", "游明朝", "Hiragino Mincho Pro", "ヒラギノ明朝 Pro", "MS PMincho", serif',
                    color: '#f97316',
                    textShadow: '0 0 20px rgba(249, 115, 22, 0.4)',
                  }}
                >
                  {agari.isTsumo ? 'ツモ' : 'ロン'}
                </h2>

                <div className="text-center text-lg mb-3">
                  <span className="text-orange-300 font-bold">{WIND_NAMES[winner.seatWind]}</span>
                  <span className="ml-2">{winner.name}</span>
                  {!agari.isTsumo && agari.loser >= 0 && (
                    <span className="text-gray-400 text-sm ml-2">
                      ← {players[agari.loser].name} 放銃
                    </span>
                  )}
                </div>

                {/* 手牌公開 */}
                <div className="bg-gray-800 rounded-xl p-3 mb-3">
                  <div className="text-xs text-gray-400 mb-1.5">和了者の手牌</div>
                  <div className="flex items-end justify-center flex-wrap gap-0.5">
                    {/* 門前手牌（staggered flip animation） */}
                    {winner.hand.closed.map((tile, idx) => (
                      <motion.div
                        key={tile.index}
                        initial={{ rotateY: 180, opacity: 0 }}
                        animate={{ rotateY: 0, opacity: 1 }}
                        transition={{ delay: idx * 0.06, duration: 0.3, ease: 'easeOut' }}
                        style={{ display: 'inline-flex' }}
                      >
                        <TileSVG
                          tile={tile}
                          width={36}
                          height={50}
                        />
                      </motion.div>
                    ))}

                    {/* ツモ牌（少し離す） */}
                    {winner.hand.tsumo && (
                      <div className="ml-3">
                        <TileSVG
                          tile={winner.hand.tsumo}
                          width={36}
                          height={50}
                          highlighted
                        />
                      </div>
                    )}

                    {/* 副露 */}
                    {winner.hand.melds.length > 0 && (
                      <div className="ml-6 flex items-end gap-1.5">
                        {winner.hand.melds.map((meld, mi) => (
                          <div key={mi} className="flex items-end border-l border-gray-600 pl-1.5">
                            {meld.tiles.map((tile, ti) => {
                              const isCalled = meld.calledTile && tile.index === meld.calledTile.index;
                              return (
                                <TileSVG
                                  key={tile.index}
                                  tile={tile}
                                  width={30}
                                  height={42}
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

                {/* 役一覧 */}
                <div className="bg-gray-800 rounded-xl p-3 mb-3">
                  <div className="space-y-1.5">
                    {score.yaku.map((y, yi) => (
                      <div key={yi} className="flex justify-between items-center text-sm">
                        <div className="flex flex-col">
                          <span className="text-white/90">{y.name}</span>
                          {y.reading && (
                            <span className="text-gray-400 text-xs">{y.reading}</span>
                          )}
                        </div>
                        <span
                          className="font-bold ml-4 whitespace-nowrap"
                          style={{
                            color: y.isYakuman ? '#ef4444' : '#fbbf24',
                          }}
                        >
                          {y.isYakuman
                            ? (y.han >= 26 ? 'ダブル役満' : '役満')
                            : `${y.han}翻`
                          }
                        </span>
                      </div>
                    ))}
                  </div>

                  {/* 合計翻数と符 */}
                  <div className="border-t border-gray-700 mt-2 pt-2 flex justify-between items-center">
                    <span className="text-gray-400 text-sm">合計</span>
                    <span className="text-orange-300 font-bold">
                      {score.isYakuman
                        ? `${score.yakumanCount >= 2 ? 'ダブル' : ''}役満`
                        : `${score.han}翻 ${score.fu}符`
                      }
                    </span>
                  </div>
                </div>

                {/* 点数表示 */}
                <div className="text-center bg-gradient-to-r from-orange-900/30 via-orange-800/40 to-orange-900/30 rounded-xl p-4">
                  {score.label && (
                    <div
                      className="text-lg font-bold mb-1"
                      style={{
                        fontFamily: '"Yu Mincho", "游明朝", "Hiragino Mincho Pro", "ヒラギノ明朝 Pro", "MS PMincho", serif',
                        color: '#f97316',
                      }}
                    >
                      {score.label}
                    </div>
                  )}
                  <div
                    className="text-4xl font-black"
                    style={{
                      fontFamily: '"Yu Mincho", "游明朝", "Hiragino Mincho Pro", "ヒラギノ明朝 Pro", "MS PMincho", serif',
                      color: '#fbbf24',
                      textShadow: '0 0 20px rgba(251, 191, 36, 0.4)',
                    }}
                  >
                    {score.payment.total.toLocaleString()}点
                  </div>
                  {agari.isTsumo && score.payment.tsumoKo && (
                    <div className="text-sm text-gray-400 mt-1">
                      {score.payment.tsumoOya
                        ? `${score.payment.tsumoKo.toLocaleString()}点 / ${score.payment.tsumoOya.toLocaleString()}点`
                        : `${score.payment.tsumoKo.toLocaleString()}点 オール`
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
          className="w-full mt-4 py-3 bg-orange-600 hover:bg-orange-700 rounded-lg font-bold text-lg transition-colors"
        >
          次へ
        </button>
      </div>
    </div>
  );
};

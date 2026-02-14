import React from 'react';
import type { RoundState } from '../../core/types/game-state.ts';
import type { Player } from '../../core/types/player.ts';
import type { TileInstance } from '../../core/types/tile.ts';
import { WIND_NAMES } from '../../core/types/player.ts';
import { TileSVG } from '../tile/TileSVG.tsx';

interface CenterInfoProps {
  round: RoundState;
  players: Player[];
  currentPlayer: number;
  doraIndicators: TileInstance[];
  /** 自分のプレイヤーインデックス（ダイヤ型配置の基準） */
  myIndex?: number;
  /** コンパクトモード（SP横向き用） */
  compact?: boolean;
}

export const CenterInfo: React.FC<CenterInfoProps> = ({ round, players, currentPlayer, doraIndicators, myIndex = 0, compact = false }) => {
  const bakazeStr = WIND_NAMES[round.bakaze];
  const kyokuNum = (round.kyoku % 4) + 1;
  const roundLabel = `${bakazeStr}${kyokuNum}局`;

  // ダイヤ型配置: 上=対面(+2), 右=下家(+1), 下=自分(+0), 左=上家(+3)
  const getRelativeIndex = (rel: number) => (myIndex + rel) % 4;
  const topPlayer = players[getRelativeIndex(2)];    // 対面
  const rightPlayer = players[getRelativeIndex(1)];  // 下家
  const bottomPlayer = players[getRelativeIndex(0)]; // 自分
  const leftPlayer = players[getRelativeIndex(3)];   // 上家

  const PlayerCell: React.FC<{ player: Player; playerIndex: number }> = ({ player, playerIndex }) => {
    const isCurrent = playerIndex === currentPlayer;
    return (
      <div
        className={`${compact ? 'px-1 py-0' : 'px-1.5 py-0.5'} rounded text-center ${compact ? 'min-w-[40px]' : 'min-w-[60px]'} transition-all ${
          isCurrent
            ? 'bg-yellow-500/30 text-white ring-1 ring-yellow-400'
            : 'bg-green-800/50 text-gray-300'
        }`}
      >
        <div className={`${compact ? 'text-[9px]' : 'text-sm'} font-bold leading-tight ${isCurrent ? 'text-yellow-300' : 'text-gray-400'}`}>
          {WIND_NAMES[player.seatWind]}
        </div>
        <div className={`${compact ? 'text-[8px]' : 'text-xs'} font-mono leading-tight`}>{player.score.toLocaleString()}</div>
      </div>
    );
  };

  const doraTileW = compact ? 18 : 28;
  const doraTileH = compact ? 24 : 38;

  return (
    <div
      className="bg-green-900/90 rounded-2xl p-2 text-center"
      style={{ width: compact ? 180 : 260, minHeight: compact ? 140 : 220 }}
    >
      {/* 局情報 */}
      <div className={`${compact ? 'text-xs' : 'text-base'} font-bold text-yellow-300 leading-tight`}>{roundLabel}</div>
      <div className={`${compact ? 'text-[9px]' : 'text-xs'} text-gray-300 leading-tight`}>
        残り{round.remainingTiles}枚
        {round.honba > 0 && <span> {round.honba}本場</span>}
        {round.riichiSticks > 0 && <span> 供託{round.riichiSticks}</span>}
      </div>

      {/* ダイヤ型プレイヤー配置 */}
      <div className={`grid grid-cols-3 gap-0.5 ${compact ? 'w-[160px]' : 'w-[240px]'} mx-auto my-1`}>
        <div />
        <div className="flex justify-center">
          <PlayerCell player={topPlayer} playerIndex={getRelativeIndex(2)} />
        </div>
        <div />

        <div className="flex justify-center">
          <PlayerCell player={leftPlayer} playerIndex={getRelativeIndex(3)} />
        </div>
        <div />
        <div className="flex justify-center">
          <PlayerCell player={rightPlayer} playerIndex={getRelativeIndex(1)} />
        </div>

        <div />
        <div className="flex justify-center">
          <PlayerCell player={bottomPlayer} playerIndex={getRelativeIndex(0)} />
        </div>
        <div />
      </div>

      {/* ドラ表示 */}
      <div className="flex items-center justify-center gap-1 mt-1">
        <span className={`${compact ? 'text-[8px]' : 'text-xs'} text-gray-400 mr-1`}>ドラ</span>
        <div className="flex gap-0.5">
          {[0, 1, 2, 3, 4].map(i => (
            <div key={i} style={{ width: doraTileW, height: doraTileH }}>
              {doraIndicators[i] ? (
                <TileSVG tile={doraIndicators[i]} width={doraTileW} height={doraTileH} />
              ) : (
                <div className="w-full h-full rounded border border-green-700/50 bg-green-800/30" />
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

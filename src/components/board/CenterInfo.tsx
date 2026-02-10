import React from 'react';
import type { RoundState } from '../../core/types/game-state.ts';
import type { Player } from '../../core/types/player.ts';
import { WIND_NAMES } from '../../core/types/player.ts';

interface CenterInfoProps {
  round: RoundState;
  players: Player[];
  currentPlayer: number;
  /** 自分のプレイヤーインデックス（ダイヤ型配置の基準） */
  myIndex?: number;
}

export const CenterInfo: React.FC<CenterInfoProps> = ({ round, players, currentPlayer, myIndex = 0 }) => {
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
        className={`px-2 py-1 rounded-lg text-center min-w-[70px] transition-all ${
          isCurrent 
            ? 'bg-yellow-500/30 text-white ring-2 ring-yellow-400' 
            : 'bg-green-800/50 text-gray-300'
        }`}
      >
        <div className={`text-base font-bold ${isCurrent ? 'text-yellow-300' : 'text-gray-400'}`}>
          {WIND_NAMES[player.seatWind]}
        </div>
        <div className="text-sm font-mono">{player.score.toLocaleString()}</div>
      </div>
    );
  };

  return (
    <div className="bg-green-900/90 rounded-2xl p-3 text-center">
      {/* 局情報 */}
      <div className="text-xl font-bold text-yellow-300 mb-1">{roundLabel}</div>
      <div className="text-sm text-gray-300 mb-1">
        {round.honba > 0 && <span>{round.honba}本場 </span>}
        {round.riichiSticks > 0 && <span>供託{round.riichiSticks}</span>}
      </div>
      <div className="text-xs text-gray-400 mb-2">残り {round.remainingTiles} 枚</div>

      {/* ダイヤ型プレイヤー配置 - グリッドレイアウト */}
      <div className="grid grid-cols-3 gap-1 w-[240px] mx-auto">
        {/* 1行目: 空 - 上(対面) - 空 */}
        <div />
        <div className="flex justify-center">
          <PlayerCell player={topPlayer} playerIndex={getRelativeIndex(2)} />
        </div>
        <div />
        
        {/* 2行目: 左(上家) - 空 - 右(下家) */}
        <div className="flex justify-center">
          <PlayerCell player={leftPlayer} playerIndex={getRelativeIndex(3)} />
        </div>
        <div />
        <div className="flex justify-center">
          <PlayerCell player={rightPlayer} playerIndex={getRelativeIndex(1)} />
        </div>
        
        {/* 3行目: 空 - 下(自分) - 空 */}
        <div />
        <div className="flex justify-center">
          <PlayerCell player={bottomPlayer} playerIndex={getRelativeIndex(0)} />
        </div>
        <div />
      </div>
    </div>
  );
};

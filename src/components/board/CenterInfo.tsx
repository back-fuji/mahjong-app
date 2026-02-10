import React from 'react';
import type { RoundState } from '../../core/types/game-state.ts';
import type { Player } from '../../core/types/player.ts';
import { WIND_NAMES } from '../../core/types/player.ts';

interface CenterInfoProps {
  round: RoundState;
  players: Player[];
  currentPlayer: number;
}

export const CenterInfo: React.FC<CenterInfoProps> = ({ round, players, currentPlayer }) => {
  const bakazeStr = WIND_NAMES[round.bakaze];
  const kyokuNum = (round.kyoku % 4) + 1;
  const roundLabel = `${bakazeStr}${kyokuNum}局`;

  return (
    <div className="bg-green-900/80 rounded-xl p-3 text-center min-w-[180px]">
      <div className="text-lg font-bold text-yellow-300">{roundLabel}</div>
      <div className="text-sm text-gray-300">
        {round.honba > 0 && <span>{round.honba}本場 </span>}
        {round.riichiSticks > 0 && <span>供託{round.riichiSticks}</span>}
      </div>
      <div className="text-xs text-gray-400 mt-1">残り{round.remainingTiles}枚</div>

      <div className="mt-2 grid grid-cols-2 gap-1 text-xs">
        {players.map((p, i) => (
          <div
            key={p.id}
            className={`px-2 py-1 rounded ${
              i === currentPlayer ? 'bg-yellow-600/50 text-white' : 'text-gray-400'
            }`}
          >
            <span>{WIND_NAMES[p.seatWind]}</span>
            <span className="ml-1">{p.name}</span>
            <span className="ml-1 font-mono">{p.score}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

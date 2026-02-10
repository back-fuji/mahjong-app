import React, { useState } from 'react';
import type { GameRules } from '../core/types/game-state.ts';
import { DEFAULT_RULES } from '../core/types/game-state.ts';
import { useGameStore } from '../store/gameStore.ts';

export const MenuPage: React.FC = () => {
  const startGame = useGameStore(s => s.startGame);
  const [gameType, setGameType] = useState<'tonpu' | 'hanchan'>('hanchan');
  const [hasRedDora, setHasRedDora] = useState(true);
  const [kuitan, setKuitan] = useState(true);

  const handleStart = () => {
    const rules: GameRules = {
      ...DEFAULT_RULES,
      gameType,
      hasRedDora,
      kuitan,
    };
    startGame(rules);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-gray-900 to-green-900">
      <div className="bg-gray-900/90 rounded-2xl p-8 max-w-sm w-full mx-4 text-white">
        <h1 className="text-4xl font-bold text-center mb-2 text-yellow-400">
          麻雀
        </h1>
        <p className="text-center text-gray-400 text-sm mb-8">Japanese Mahjong</p>

        <div className="space-y-4 mb-8">
          <div className="flex items-center justify-between">
            <span>ゲーム種別</span>
            <select
              value={gameType}
              onChange={(e) => setGameType(e.target.value as 'tonpu' | 'hanchan')}
              className="bg-gray-800 rounded px-3 py-1 text-sm"
            >
              <option value="hanchan">半荘戦</option>
              <option value="tonpu">東風戦</option>
            </select>
          </div>

          <label className="flex items-center justify-between cursor-pointer">
            <span>赤ドラ</span>
            <input
              type="checkbox"
              checked={hasRedDora}
              onChange={(e) => setHasRedDora(e.target.checked)}
              className="w-5 h-5 accent-yellow-500"
            />
          </label>

          <label className="flex items-center justify-between cursor-pointer">
            <span>喰いタン</span>
            <input
              type="checkbox"
              checked={kuitan}
              onChange={(e) => setKuitan(e.target.checked)}
              className="w-5 h-5 accent-yellow-500"
            />
          </label>
        </div>

        <button
          onClick={handleStart}
          className="w-full py-4 bg-green-600 hover:bg-green-700 rounded-xl text-xl font-bold
            transition-all hover:scale-[1.02] active:scale-[0.98] shadow-lg mb-3"
        >
          CPU対戦を開始
        </button>

        <button
          onClick={() => useGameStore.getState().setScreen('lobby')}
          className="w-full py-3 bg-blue-600 hover:bg-blue-700 rounded-xl text-lg font-bold
            transition-all hover:scale-[1.02] active:scale-[0.98] shadow-lg"
        >
          オンライン対戦
        </button>

        <p className="text-center text-gray-500 text-xs mt-6">
          4人打ちリーチ麻雀 / CPU 3人と対戦 or オンライン対人戦
        </p>
      </div>
    </div>
  );
};

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import type { GameRules } from '../core/types/game-state.ts';
import { DEFAULT_RULES } from '../core/types/game-state.ts';
import { useGameStore } from '../store/gameStore.ts';
import { useSettingsStore } from '../store/settingsStore.ts';
import type { AiDifficulty } from '../store/settingsStore.ts';
import { InstallPrompt } from '../components/pwa/InstallPrompt.tsx';

export const MenuPage: React.FC = () => {
  const startGame = useGameStore(s => s.startGame);
  const navigate = useNavigate();
  const [gameType, setGameType] = useState<'tonpu' | 'hanchan'>('hanchan');
  const [hasRedDora, setHasRedDora] = useState(true);
  const [kuitan, setKuitan] = useState(true);
  const { aiDifficulty, setAiDifficulty } = useSettingsStore();

  const handleStart = () => {
    const rules: GameRules = {
      ...DEFAULT_RULES,
      gameType,
      hasRedDora,
      kuitan,
    };
    startGame(rules);
    navigate('/game');
  };

  return (
    <div className="min-h-screen flex items-center justify-center theme-gradient">
      <div className="theme-bg-card rounded-2xl p-8 max-w-sm w-full mx-4 text-white">
        <h1 className="text-4xl font-bold text-center mb-2 theme-text-accent">
          麻雀
        </h1>
        <p className="text-center text-gray-400 text-sm mb-8">Japanese Mahjong</p>

        <div className="space-y-5 mb-8">
          <div>
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
            <p className="text-gray-500 text-xs mt-1 leading-relaxed">
              半荘戦は東場・南場の計8局（親が2周）、東風戦は東場のみ4局の短期決戦です。
            </p>
          </div>

          <div>
            <label className="flex items-center justify-between cursor-pointer">
              <span>赤ドラ</span>
              <input
                type="checkbox"
                checked={hasRedDora}
                onChange={(e) => setHasRedDora(e.target.checked)}
                className="w-5 h-5 accent-yellow-500"
              />
            </label>
            <p className="text-gray-500 text-xs mt-1 leading-relaxed">
              各スート（萬子・筒子・索子）の5に1枚ずつ赤牌を入れます。赤牌はドラとして1翻加算されます。
            </p>
          </div>

          <div>
            <label className="flex items-center justify-between cursor-pointer">
              <span>喰いタン</span>
              <input
                type="checkbox"
                checked={kuitan}
                onChange={(e) => setKuitan(e.target.checked)}
                className="w-5 h-5 accent-yellow-500"
              />
            </label>
            <p className="text-gray-500 text-xs mt-1 leading-relaxed">
              ONにすると、ポンやチーで鳴いた状態でもタンヤオ（断么九）が成立します。OFFの場合、タンヤオは門前（鳴きなし）限定になります。
            </p>
          </div>

          {/* AI難易度 */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <span>CPU強さ</span>
            </div>
            <div className="flex gap-2">
              {([
                { value: 'easy' as AiDifficulty, label: '初級' },
                { value: 'normal' as AiDifficulty, label: '中級' },
                { value: 'hard' as AiDifficulty, label: '上級' },
              ]).map(({ value, label }) => {
                const isActive = aiDifficulty === value;
                return (
                  <button
                    key={value}
                    onClick={() => setAiDifficulty(value)}
                    className={`flex-1 py-1.5 rounded-lg text-sm font-medium transition-all
                      ${isActive
                        ? 'bg-yellow-500 text-black'
                        : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                      }`}
                  >
                    {label}
                  </button>
                );
              })}
            </div>
            <p className="text-gray-500 text-xs mt-1 leading-relaxed">
              {aiDifficulty === 'easy' && '初級: ミスあり・防御なし。初心者向け。'}
              {aiDifficulty === 'normal' && '中級: 効率重視＋基本防御。'}
              {aiDifficulty === 'hard' && '上級: 高度な防御＋点数状況判断。'}
            </p>
          </div>
        </div>

        <button
          onClick={handleStart}
          className="w-full py-4 bg-green-600 hover:bg-green-700 rounded-xl text-xl font-bold
            transition-all hover:scale-[1.02] active:scale-[0.98] shadow-lg mb-3"
        >
          CPU対戦を開始
        </button>

        <button
          onClick={() => navigate('/lobby')}
          className="w-full py-3 bg-blue-600 hover:bg-blue-700 rounded-xl text-lg font-bold
            transition-all hover:scale-[1.02] active:scale-[0.98] shadow-lg"
        >
          オンライン対戦
        </button>

        <div className="grid grid-cols-3 gap-2 mt-4">
          <button
            onClick={() => navigate('/settings')}
            className="py-2.5 bg-gray-700 hover:bg-gray-600 rounded-xl text-sm font-medium
              transition-all hover:scale-[1.02] active:scale-[0.98]"
          >
            設定
          </button>
          <button
            onClick={() => navigate('/help')}
            className="py-2.5 bg-gray-700 hover:bg-gray-600 rounded-xl text-sm font-medium
              transition-all hover:scale-[1.02] active:scale-[0.98]"
          >
            ヘルプ
          </button>
          <button
            onClick={() => navigate('/yaku')}
            className="py-2.5 bg-gray-700 hover:bg-gray-600 rounded-xl text-sm font-medium
              transition-all hover:scale-[1.02] active:scale-[0.98]"
          >
            役一覧
          </button>
          <button
            onClick={() => navigate('/tutorial')}
            className="py-2.5 bg-gray-700 hover:bg-gray-600 rounded-xl text-sm font-medium
              transition-all hover:scale-[1.02] active:scale-[0.98]"
          >
            チュートリアル
          </button>
          <button
            onClick={() => navigate('/achievements')}
            className="py-2.5 bg-gray-700 hover:bg-gray-600 rounded-xl text-sm font-medium
              transition-all hover:scale-[1.02] active:scale-[0.98]"
          >
            実績
          </button>
          <button
            onClick={() => navigate('/history')}
            className="py-2.5 bg-gray-700 hover:bg-gray-600 rounded-xl text-sm font-medium
              transition-all hover:scale-[1.02] active:scale-[0.98]"
          >
            対局履歴
          </button>
          <button
            onClick={() => navigate('/saves')}
            className="col-span-3 py-2.5 bg-gray-700 hover:bg-gray-600 rounded-xl text-sm font-medium
              transition-all hover:scale-[1.02] active:scale-[0.98]"
          >
            セーブ/ロード
          </button>
        </div>

        {/* PWA インストールプロンプト */}
        <InstallPrompt />

        <p className="text-center text-gray-500 text-xs mt-6">
          4人打ちリーチ麻雀 / CPU 3人と対戦 or オンライン対人戦
        </p>
      </div>
    </div>
  );
};

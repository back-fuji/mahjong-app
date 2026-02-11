import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useSettingsStore } from '../store/settingsStore.ts';
import type { ThemeType, AiDifficulty, TileSizeType } from '../store/settingsStore.ts';
import { soundEngine } from '../audio/sound-engine.ts';

export const SettingsPage: React.FC = () => {
  const navigate = useNavigate();
  const {
    soundEnabled, setSoundEnabled,
    soundVolume, setSoundVolume,
    voiceEnabled, setVoiceEnabled,
    animationSpeed, setAnimationSpeed,
    theme, setTheme,
    aiDifficulty, setAiDifficulty,
    tileSize, setTileSize,
  } = useSettingsStore();

  return (
    <div className="min-h-screen flex items-center justify-center theme-gradient">
      <div className="theme-bg-card rounded-2xl p-8 max-w-md w-full mx-4 text-white overflow-y-auto max-h-[90vh]">
        <h1 className="text-3xl font-bold text-center mb-6 theme-text-accent">設定</h1>

        <div className="space-y-6">
          {/* UIテーマ */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="font-medium">UIテーマ</span>
            </div>
            <div className="flex gap-2">
              {([
                { value: 'dark' as ThemeType, label: 'ダーク' },
                { value: 'green' as ThemeType, label: 'グリーン' },
                { value: 'classic' as ThemeType, label: '和風' },
              ]).map(({ value, label }) => {
                const isActive = theme === value;
                return (
                  <button
                    key={value}
                    onClick={() => setTheme(value)}
                    className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all
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
            <p className="text-gray-500 text-xs mt-1">画面全体の色合いを変更します。</p>
          </div>

          {/* AI難易度 */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="font-medium">AI難易度</span>
            </div>
            <div className="flex gap-2">
              {([
                { value: 'easy' as AiDifficulty, label: '初級', desc: '攻撃的でミスあり' },
                { value: 'normal' as AiDifficulty, label: '中級', desc: '効率重視+基本防御' },
                { value: 'hard' as AiDifficulty, label: '上級', desc: '高度な押し引き' },
              ]).map(({ value, label }) => {
                const isActive = aiDifficulty === value;
                return (
                  <button
                    key={value}
                    onClick={() => setAiDifficulty(value)}
                    className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all
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
            <p className="text-gray-500 text-xs mt-1">
              {aiDifficulty === 'easy' && '初級: CPUは効率計算にミスがあり、防御をしません。初心者向け。'}
              {aiDifficulty === 'normal' && '中級: 効率重視の打牌＋リーチ者に対する基本的な防御。'}
              {aiDifficulty === 'hard' && '上級: 高度な防御（スジ・カベ分析）＋点数状況判断＋押し引き判断。'}
            </p>
          </div>

          {/* 牌サイズ */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="font-medium">牌サイズ</span>
            </div>
            <div className="flex gap-2">
              {([
                { value: 'small' as TileSizeType, label: '小' },
                { value: 'medium' as TileSizeType, label: '中' },
                { value: 'large' as TileSizeType, label: '大' },
              ]).map(({ value, label }) => {
                const isActive = tileSize === value;
                return (
                  <button
                    key={value}
                    onClick={() => setTileSize(value)}
                    className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all
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
            <p className="text-gray-500 text-xs mt-1">牌の表示サイズを変更します。</p>
          </div>

          <hr className="border-gray-700" />

          {/* サウンド ON/OFF */}
          <div>
            <label className="flex items-center justify-between cursor-pointer">
              <span className="font-medium">サウンド</span>
              <input
                type="checkbox"
                checked={soundEnabled}
                onChange={(e) => setSoundEnabled(e.target.checked)}
                className="w-5 h-5 accent-yellow-500"
              />
            </label>
            <p className="text-gray-500 text-xs mt-1">打牌音や効果音のON/OFFを切り替えます。</p>
          </div>

          {/* 音量スライダー */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <span className="font-medium">音量</span>
              <span className="text-sm text-gray-400">{Math.round(soundVolume * 100)}%</span>
            </div>
            <input
              type="range"
              min="0"
              max="1"
              step="0.05"
              value={soundVolume}
              onChange={(e) => setSoundVolume(parseFloat(e.target.value))}
              className="w-full accent-yellow-500"
              disabled={!soundEnabled}
            />
            <div className="flex justify-end mt-1">
              <button
                onClick={() => soundEngine.playDiscardSound()}
                className="text-xs px-3 py-1 bg-gray-700 hover:bg-gray-600 rounded transition-colors disabled:opacity-50"
                disabled={!soundEnabled}
              >
                テスト再生
              </button>
            </div>
          </div>

          {/* 鳴き声 ON/OFF */}
          <div>
            <label className="flex items-center justify-between cursor-pointer">
              <span className="font-medium">鳴き声（読み上げ）</span>
              <input
                type="checkbox"
                checked={voiceEnabled}
                onChange={(e) => setVoiceEnabled(e.target.checked)}
                className="w-5 h-5 accent-yellow-500"
              />
            </label>
            <p className="text-gray-500 text-xs mt-1">
              ポン・チー・カン・リーチなどの音声読み上げのON/OFFです。
            </p>
            <div className="flex justify-end mt-1">
              <button
                onClick={() => soundEngine.playCallSound('pon')}
                className="text-xs px-3 py-1 bg-gray-700 hover:bg-gray-600 rounded transition-colors disabled:opacity-50"
                disabled={!soundEnabled || !voiceEnabled}
              >
                声テスト
              </button>
            </div>
          </div>

          {/* アニメーション速度 */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="font-medium">アニメーション速度</span>
            </div>
            <div className="flex gap-2">
              {(['fast', 'normal', 'slow'] as const).map((speed) => {
                const label = speed === 'fast' ? '高速' : speed === 'normal' ? '通常' : 'ゆっくり';
                const isActive = animationSpeed === speed;
                return (
                  <button
                    key={speed}
                    onClick={() => setAnimationSpeed(speed)}
                    className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all
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
            <p className="text-gray-500 text-xs mt-1">
              打牌・鳴き演出などのアニメーション速度を変更します。
            </p>
          </div>
        </div>

        <button
          onClick={() => navigate('/')}
          className="w-full mt-8 py-3 bg-gray-700 hover:bg-gray-600 rounded-xl text-lg font-bold
            transition-all hover:scale-[1.02] active:scale-[0.98]"
        >
          戻る
        </button>
      </div>
    </div>
  );
};

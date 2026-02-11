import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useSettingsStore } from '../store/settingsStore.ts';
import { soundEngine } from '../audio/sound-engine.ts';

export const SettingsPage: React.FC = () => {
  const navigate = useNavigate();
  const {
    soundEnabled, setSoundEnabled,
    soundVolume, setSoundVolume,
    voiceEnabled, setVoiceEnabled,
    animationSpeed, setAnimationSpeed,
  } = useSettingsStore();

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-gray-900 to-green-900">
      <div className="bg-gray-900/90 rounded-2xl p-8 max-w-md w-full mx-4 text-white">
        <h1 className="text-3xl font-bold text-center mb-6 text-yellow-400">設定</h1>

        <div className="space-y-6">
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

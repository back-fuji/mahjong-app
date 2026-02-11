import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface Settings {
  /** サウンドON/OFF */
  soundEnabled: boolean;
  /** マスター音量 (0.0 - 1.0) */
  soundVolume: number;
  /** 鳴き声（読み上げ）ON/OFF */
  voiceEnabled: boolean;
  /** アニメーション速度 */
  animationSpeed: 'fast' | 'normal' | 'slow';
}

interface SettingsStore extends Settings {
  setSoundEnabled: (v: boolean) => void;
  setSoundVolume: (v: number) => void;
  setVoiceEnabled: (v: boolean) => void;
  setAnimationSpeed: (v: 'fast' | 'normal' | 'slow') => void;
  /** アニメーション速度に応じたms倍率 */
  getAnimDuration: (baseMs: number) => number;
}

export const useSettingsStore = create<SettingsStore>()(
  persist(
    (set, get) => ({
      soundEnabled: true,
      soundVolume: 0.7,
      voiceEnabled: true,
      animationSpeed: 'normal',

      setSoundEnabled: (v) => set({ soundEnabled: v }),
      setSoundVolume: (v) => set({ soundVolume: Math.max(0, Math.min(1, v)) }),
      setVoiceEnabled: (v) => set({ voiceEnabled: v }),
      setAnimationSpeed: (v) => set({ animationSpeed: v }),

      getAnimDuration: (baseMs: number) => {
        const speed = get().animationSpeed;
        if (speed === 'fast') return baseMs * 0.5;
        if (speed === 'slow') return baseMs * 1.8;
        return baseMs;
      },
    }),
    {
      name: 'mahjong-settings',
    }
  )
);

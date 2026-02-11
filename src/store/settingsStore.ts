import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type ThemeType = 'dark' | 'green' | 'classic';
export type AiDifficulty = 'easy' | 'normal' | 'hard';
export type TileSizeType = 'small' | 'medium' | 'large';

export interface Settings {
  /** サウンドON/OFF */
  soundEnabled: boolean;
  /** マスター音量 (0.0 - 1.0) */
  soundVolume: number;
  /** 鳴き声（読み上げ）ON/OFF */
  voiceEnabled: boolean;
  /** アニメーション速度 */
  animationSpeed: 'fast' | 'normal' | 'slow';
  /** UIテーマ */
  theme: ThemeType;
  /** AI難易度 */
  aiDifficulty: AiDifficulty;
  /** 牌サイズ */
  tileSize: TileSizeType;
}

interface SettingsStore extends Settings {
  setSoundEnabled: (v: boolean) => void;
  setSoundVolume: (v: number) => void;
  setVoiceEnabled: (v: boolean) => void;
  setAnimationSpeed: (v: 'fast' | 'normal' | 'slow') => void;
  setTheme: (v: ThemeType) => void;
  setAiDifficulty: (v: AiDifficulty) => void;
  setTileSize: (v: TileSizeType) => void;
  /** アニメーション速度に応じたms倍率 */
  getAnimDuration: (baseMs: number) => number;
}

/** テーマをHTML要素に適用 */
function applyTheme(theme: ThemeType) {
  document.documentElement.setAttribute('data-theme', theme);
}

export const useSettingsStore = create<SettingsStore>()(
  persist(
    (set, get) => ({
      soundEnabled: true,
      soundVolume: 0.7,
      voiceEnabled: true,
      animationSpeed: 'normal',
      theme: 'dark',
      aiDifficulty: 'normal',
      tileSize: 'medium',

      setSoundEnabled: (v) => set({ soundEnabled: v }),
      setSoundVolume: (v) => set({ soundVolume: Math.max(0, Math.min(1, v)) }),
      setVoiceEnabled: (v) => set({ voiceEnabled: v }),
      setAnimationSpeed: (v) => set({ animationSpeed: v }),
      setTheme: (v) => {
        applyTheme(v);
        set({ theme: v });
      },
      setAiDifficulty: (v) => set({ aiDifficulty: v }),
      setTileSize: (v) => set({ tileSize: v }),

      getAnimDuration: (baseMs: number) => {
        const speed = get().animationSpeed;
        if (speed === 'fast') return baseMs * 0.5;
        if (speed === 'slow') return baseMs * 1.8;
        return baseMs;
      },
    }),
    {
      name: 'mahjong-settings',
      onRehydrateStorage: () => (state) => {
        if (state?.theme) {
          applyTheme(state.theme);
        }
      },
    }
  )
);

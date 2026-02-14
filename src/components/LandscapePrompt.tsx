import React from 'react';

/** SP縦向き時に表示する「スマホを横向きにして下さい」オーバーレイ */
export const LandscapePrompt: React.FC = () => (
  <div className="fixed inset-0 z-[200] flex flex-col items-center justify-center gap-4 bg-green-900/95 backdrop-blur-sm">
    <p className="text-white text-lg sm:text-xl font-bold text-center px-6">
      スマホを横向きにして下さい
    </p>
    <p className="text-white/80 text-sm text-center px-6">
      ゲームは横向きでプレイできます
    </p>
  </div>
);

import React, { useEffect, useState } from 'react';
import { ACHIEVEMENT_DEFINITIONS } from '../../achievements/achievement-definitions.ts';

interface Props {
  achievementIds: string[];
  onDone: () => void;
}

export const AchievementToast: React.FC<Props> = ({ achievementIds, onDone }) => {
  const [currentIdx, setCurrentIdx] = useState(0);
  const [visible, setVisible] = useState(true);

  const currentAch = ACHIEVEMENT_DEFINITIONS.find(a => a.id === achievementIds[currentIdx]);

  useEffect(() => {
    const timer = setTimeout(() => {
      setVisible(false);
      setTimeout(() => {
        if (currentIdx + 1 < achievementIds.length) {
          setCurrentIdx(currentIdx + 1);
          setVisible(true);
        } else {
          onDone();
        }
      }, 300);
    }, 3000);

    return () => clearTimeout(timer);
  }, [currentIdx, achievementIds.length, onDone]);

  if (!currentAch) return null;

  return (
    <div className="fixed top-4 left-1/2 -translate-x-1/2 z-[100] pointer-events-none">
      <div
        className={`bg-gradient-to-r from-yellow-600 to-amber-500 rounded-xl px-5 py-3 shadow-2xl
          flex items-center gap-3 transition-all duration-300
          ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-4'}`}
      >
        <span className="text-2xl">{currentAch.icon}</span>
        <div>
          <p className="text-black font-bold text-sm">実績解除!</p>
          <p className="text-black/80 text-xs">{currentAch.name}</p>
        </div>
      </div>
    </div>
  );
};

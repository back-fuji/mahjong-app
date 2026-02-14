import React from 'react';
import { useWindowSize } from '../../hooks/useWindowSize.ts';

export interface ActionBarProps {
  canTsumoAgari: boolean;
  canRon: boolean;
  canRiichi: boolean;
  canChi: boolean;
  canPon: boolean;
  canKan: boolean;
  canSkip: boolean;
  canKyuushu: boolean;
  onTsumoAgari: () => void;
  onRon: () => void;
  onRiichi: () => void;
  onChi: () => void;
  onPon: () => void;
  onKan: () => void;
  onSkip: () => void;
  onKyuushu: () => void;
}

const ActionButton: React.FC<{
  label: string;
  onClick: () => void;
  borderColor: string;
  visible: boolean;
  /** オレンジグロー付きハイライト */
  glowOrange?: boolean;
  compact?: boolean;
}> = ({ label, onClick, borderColor, visible, glowOrange = false, compact = false }) => {
  if (!visible) return null;
  return (
    <button
      onClick={onClick}
      className={`${compact ? 'px-2 py-1 text-xs min-w-[36px]' : 'px-3 py-2 sm:px-4 min-w-[48px] text-sm sm:text-base'} rounded-xl font-bold text-white shadow-lg transition-all
        hover:scale-105 active:scale-95 backdrop-blur-md border
        ${glowOrange
          ? 'bg-orange-500/30 border-orange-400 ring-2 ring-orange-400/60 shadow-orange-500/40 hover:bg-orange-500/40'
          : `bg-white/10 ${borderColor} hover:bg-white/20`
        }`}
    >
      {label}
    </button>
  );
};

export const ActionBar: React.FC<ActionBarProps> = (props) => {
  const { isMobileLandscape } = useWindowSize();
  const hasAnyAction = props.canTsumoAgari || props.canRon || props.canRiichi ||
    props.canChi || props.canPon || props.canKan || props.canKyuushu;

  if (!hasAnyAction && !props.canSkip) return null;

  return (
    <div className={`fixed ${isMobileLandscape ? 'bottom-2 left-2' : 'bottom-4 left-1/2 -translate-x-1/2'} sm:left-6 sm:translate-x-0 flex flex-row flex-wrap gap-1.5 sm:gap-2 z-50
      bg-black/20 backdrop-blur-md border border-white/15 rounded-2xl ${isMobileLandscape ? 'px-1.5 py-1' : 'px-2 py-2 sm:px-3 sm:py-3'} max-w-[90vw] justify-center`}>
      <ActionButton label="ツモ" onClick={props.onTsumoAgari} borderColor="border-red-400/50" visible={props.canTsumoAgari} compact={isMobileLandscape} />
      <ActionButton label="ロン" onClick={props.onRon} borderColor="border-red-400/50" visible={props.canRon} compact={isMobileLandscape} />
      <ActionButton label="リーチ" onClick={props.onRiichi} borderColor="border-yellow-400/50" visible={props.canRiichi} compact={isMobileLandscape} />
      <ActionButton label="カン" onClick={props.onKan} borderColor="border-orange-400/70" visible={props.canKan} glowOrange compact={isMobileLandscape} />
      <ActionButton label="ポン" onClick={props.onPon} borderColor="border-orange-400/70" visible={props.canPon} glowOrange compact={isMobileLandscape} />
      <ActionButton label="チー" onClick={props.onChi} borderColor="border-orange-400/70" visible={props.canChi} glowOrange compact={isMobileLandscape} />
      <ActionButton label="流局" onClick={props.onKyuushu} borderColor="border-purple-400/50" visible={props.canKyuushu} compact={isMobileLandscape} />
      <ActionButton label="スキップ" onClick={props.onSkip} borderColor="border-gray-400/50" visible={props.canSkip} compact={isMobileLandscape} />
    </div>
  );
};

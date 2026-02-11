import React from 'react';

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
}> = ({ label, onClick, borderColor, visible }) => {
  if (!visible) return null;
  return (
    <button
      onClick={onClick}
      className={`px-4 py-2 rounded-xl font-bold text-white text-base shadow-lg transition-all
        hover:scale-105 active:scale-95 bg-white/10 backdrop-blur-md border ${borderColor}
        hover:bg-white/20`}
    >
      {label}
    </button>
  );
};

export const ActionBar: React.FC<ActionBarProps> = (props) => {
  const hasAnyAction = props.canTsumoAgari || props.canRon || props.canRiichi ||
    props.canChi || props.canPon || props.canKan || props.canKyuushu;

  if (!hasAnyAction && !props.canSkip) return null;

  return (
    <div className="fixed bottom-6 left-6 flex flex-row gap-2 z-50
      bg-black/20 backdrop-blur-md border border-white/15 rounded-2xl px-3 py-3">
      <ActionButton label="ツモ" onClick={props.onTsumoAgari} borderColor="border-red-400/50" visible={props.canTsumoAgari} />
      <ActionButton label="ロン" onClick={props.onRon} borderColor="border-red-400/50" visible={props.canRon} />
      <ActionButton label="リーチ" onClick={props.onRiichi} borderColor="border-yellow-400/50" visible={props.canRiichi} />
      <ActionButton label="カン" onClick={props.onKan} borderColor="border-blue-400/50" visible={props.canKan} />
      <ActionButton label="ポン" onClick={props.onPon} borderColor="border-green-400/50" visible={props.canPon} />
      <ActionButton label="チー" onClick={props.onChi} borderColor="border-teal-400/50" visible={props.canChi} />
      <ActionButton label="流局" onClick={props.onKyuushu} borderColor="border-purple-400/50" visible={props.canKyuushu} />
      <ActionButton label="スキップ" onClick={props.onSkip} borderColor="border-gray-400/50" visible={props.canSkip} />
    </div>
  );
};

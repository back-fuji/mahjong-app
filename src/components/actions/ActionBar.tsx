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
  color: string;
  visible: boolean;
}> = ({ label, onClick, color, visible }) => {
  if (!visible) return null;
  return (
    <button
      onClick={onClick}
      className={`px-5 py-3 rounded-xl font-bold text-white text-base shadow-lg transition-all
        hover:scale-105 active:scale-95 ${color}`}
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
    <div className="fixed right-4 top-1/2 -translate-y-1/2 flex flex-col gap-2 z-50
      bg-black/70 backdrop-blur-sm rounded-xl px-3 py-4">
      <ActionButton label="ツモ" onClick={props.onTsumoAgari} color="bg-red-600 hover:bg-red-700" visible={props.canTsumoAgari} />
      <ActionButton label="ロン" onClick={props.onRon} color="bg-red-600 hover:bg-red-700" visible={props.canRon} />
      <ActionButton label="リーチ" onClick={props.onRiichi} color="bg-yellow-600 hover:bg-yellow-700" visible={props.canRiichi} />
      <ActionButton label="カン" onClick={props.onKan} color="bg-blue-600 hover:bg-blue-700" visible={props.canKan} />
      <ActionButton label="ポン" onClick={props.onPon} color="bg-green-600 hover:bg-green-700" visible={props.canPon} />
      <ActionButton label="チー" onClick={props.onChi} color="bg-teal-600 hover:bg-teal-700" visible={props.canChi} />
      <ActionButton label="流局" onClick={props.onKyuushu} color="bg-purple-600 hover:bg-purple-700" visible={props.canKyuushu} />
      <ActionButton label="スキップ" onClick={props.onSkip} color="bg-gray-600 hover:bg-gray-700" visible={props.canSkip} />
    </div>
  );
};

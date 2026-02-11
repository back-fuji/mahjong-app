import React, { useEffect, useState, useRef, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import type { ReplayRecord, ReplayAction } from '../db/database.ts';
import { ReplayPlayer, type ReplayState } from '../replay/replay-player.ts';

export const ReplayPage: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const playerRef = useRef<ReplayPlayer>(new ReplayPlayer());
  const [replay, setReplay] = useState<ReplayRecord | null>(null);
  const [state, setState] = useState<ReplayState>({
    currentIndex: 0,
    totalActions: 0,
    isPlaying: false,
    speed: 1,
    currentAction: null,
  });
  const [actionLog, setActionLog] = useState<{ action: ReplayAction; index: number }[]>([]);
  const [loading, setLoading] = useState(true);

  const handleAction = useCallback((action: ReplayAction, index: number) => {
    setActionLog(prev => [...prev.slice(-49), { action, index }]);
  }, []);

  useEffect(() => {
    const player = playerRef.current;
    player.setCallbacks(handleAction, setState);

    if (id) {
      player.load(parseInt(id, 10)).then((rec) => {
        setReplay(rec);
        setLoading(false);
      });
    }

    return () => {
      player.stop();
    };
  }, [id, handleAction]);

  const handlePlay = () => playerRef.current.play();
  const handlePause = () => playerRef.current.pause();
  const handleStep = () => playerRef.current.stepForward();
  const handleReset = () => {
    playerRef.current.reset();
    setActionLog([]);
  };
  const handleSpeedChange = (speed: number) => playerRef.current.setSpeed(speed);

  const getActionLabel = (action: ReplayAction) => {
    const playerName = replay?.playerNames[action.playerIndex] ?? `P${action.playerIndex}`;
    const typeLabel: Record<string, string> = {
      tsumo: 'ツモ', discard: '打牌', riichi: 'リーチ',
      pon: 'ポン', chi: 'チー', kan: 'カン', minkan: '明槓',
      tsumo_agari: 'ツモ和了', ron: 'ロン',
    };
    return `${playerName}: ${typeLabel[action.type] ?? action.type}`;
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-gray-900 to-green-900">
        <div className="text-white text-lg">読み込み中...</div>
      </div>
    );
  }

  if (!replay) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-gray-900 to-green-900">
        <div className="text-center text-white">
          <p className="text-lg mb-4">リプレイデータが見つかりません</p>
          <button
            onClick={() => navigate('/history')}
            className="px-6 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors"
          >
            戻る
          </button>
        </div>
      </div>
    );
  }

  const progress = state.totalActions > 0
    ? Math.round((state.currentIndex / state.totalActions) * 100)
    : 0;

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 to-green-900 text-white p-4">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-2xl font-bold text-yellow-400 mb-4 text-center">リプレイ再生</h1>

        {/* メタ情報 */}
        <div className="bg-gray-800/80 rounded-xl p-4 mb-4">
          <div className="flex justify-between text-sm">
            <span className="text-gray-400">日時</span>
            <span>{new Date(replay.date).toLocaleString('ja-JP')}</span>
          </div>
          <div className="flex justify-between text-sm mt-1">
            <span className="text-gray-400">プレイヤー</span>
            <span>{replay.playerNames.join(' / ')}</span>
          </div>
          <div className="flex justify-between text-sm mt-1">
            <span className="text-gray-400">最終スコア</span>
            <span>{replay.finalScores.map(s => s.toLocaleString()).join(' / ')}</span>
          </div>
        </div>

        {/* プログレスバー */}
        <div className="bg-gray-800/80 rounded-xl p-4 mb-4">
          <div className="flex justify-between text-xs text-gray-400 mb-1">
            <span>アクション {state.currentIndex} / {state.totalActions}</span>
            <span>{progress}%</span>
          </div>
          <div className="w-full bg-gray-700 rounded-full h-2">
            <div
              className="bg-yellow-500 h-2 rounded-full transition-all"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        {/* コントロール */}
        <div className="bg-gray-800/80 rounded-xl p-4 mb-4">
          <div className="flex items-center justify-center gap-3">
            <button
              onClick={handleReset}
              className="px-3 py-2 bg-gray-600 hover:bg-gray-500 rounded-lg text-sm transition-colors"
            >
              最初から
            </button>
            {state.isPlaying ? (
              <button
                onClick={handlePause}
                className="px-4 py-2 bg-yellow-600 hover:bg-yellow-700 rounded-lg font-bold transition-colors"
              >
                一時停止
              </button>
            ) : (
              <button
                onClick={handlePlay}
                className="px-4 py-2 bg-green-600 hover:bg-green-700 rounded-lg font-bold transition-colors"
                disabled={state.currentIndex >= state.totalActions}
              >
                再生
              </button>
            )}
            <button
              onClick={handleStep}
              className="px-3 py-2 bg-gray-600 hover:bg-gray-500 rounded-lg text-sm transition-colors"
              disabled={state.isPlaying || state.currentIndex >= state.totalActions}
            >
              1ステップ
            </button>
          </div>

          {/* 速度コントロール */}
          <div className="flex items-center justify-center gap-2 mt-3">
            <span className="text-xs text-gray-400">速度:</span>
            {[0.5, 1, 2, 4].map((speed) => (
              <button
                key={speed}
                onClick={() => handleSpeedChange(speed)}
                className={`px-2 py-1 rounded text-xs transition-colors
                  ${state.speed === speed
                    ? 'bg-yellow-500 text-black font-bold'
                    : 'bg-gray-600 hover:bg-gray-500'
                  }`}
              >
                {speed}x
              </button>
            ))}
          </div>
        </div>

        {/* アクションログ */}
        <div className="bg-gray-800/80 rounded-xl p-4 mb-4 max-h-[300px] overflow-y-auto">
          <div className="text-xs text-gray-400 mb-2">アクションログ</div>
          {actionLog.length === 0 ? (
            <div className="text-gray-500 text-sm text-center py-4">再生するとログが表示されます</div>
          ) : (
            <div className="space-y-0.5">
              {actionLog.map(({ action, index }) => (
                <div key={index} className="text-sm flex justify-between">
                  <span className="text-gray-300">{getActionLabel(action)}</span>
                  <span className="text-gray-500 text-xs">
                    {(action.timestamp / 1000).toFixed(1)}s
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        <button
          onClick={() => navigate('/history')}
          className="w-full py-3 bg-gray-700 hover:bg-gray-600 rounded-xl text-lg font-bold
            transition-all hover:scale-[1.02] active:scale-[0.98]"
        >
          戻る
        </button>
      </div>
    </div>
  );
};

import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import type { GameHistoryRecord } from '../db/database.ts';
import type { ReplayRecord } from '../db/database.ts';
import { getGameHistory, deleteGameHistory, clearGameHistory } from '../db/game-history.ts';
import { db } from '../db/database.ts';

export const HistoryPage: React.FC = () => {
  const navigate = useNavigate();
  const [history, setHistory] = useState<GameHistoryRecord[]>([]);
  const [replays, setReplays] = useState<ReplayRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<'history' | 'replays'>('history');

  const loadData = async () => {
    setLoading(true);
    const [h, r] = await Promise.all([
      getGameHistory(),
      db.replays.orderBy('date').reverse().limit(50).toArray(),
    ]);
    setHistory(h);
    setReplays(r);
    setLoading(false);
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleDeleteHistory = async (id: number) => {
    await deleteGameHistory(id);
    loadData();
  };

  const handleClearAll = async () => {
    await clearGameHistory();
    loadData();
  };

  const handleDeleteReplay = async (id: number) => {
    await db.replays.delete(id);
    loadData();
  };

  const getRankColor = (rank: number) => {
    if (rank === 1) return 'text-yellow-400';
    if (rank === 2) return 'text-gray-300';
    if (rank === 3) return 'text-orange-500';
    return 'text-gray-500';
  };

  const getRankLabel = (rank: number) => {
    return `${rank}位`;
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 to-green-900 text-white p-4">
      <div className="max-w-lg mx-auto">
        <h1 className="text-3xl font-bold text-center mb-6 text-yellow-400">対局記録</h1>

        {/* タブ切替 */}
        <div className="flex gap-1 bg-gray-800/50 rounded-xl p-1 mb-4">
          <button
            onClick={() => setTab('history')}
            className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all
              ${tab === 'history' ? 'bg-yellow-500 text-black' : 'text-gray-400 hover:text-white'}`}
          >
            対局履歴 ({history.length})
          </button>
          <button
            onClick={() => setTab('replays')}
            className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all
              ${tab === 'replays' ? 'bg-yellow-500 text-black' : 'text-gray-400 hover:text-white'}`}
          >
            リプレイ ({replays.length})
          </button>
        </div>

        {loading ? (
          <div className="text-center text-gray-400 py-8">読み込み中...</div>
        ) : tab === 'history' ? (
          <>
            {history.length === 0 ? (
              <div className="text-center text-gray-500 py-8">
                <p className="text-lg mb-2">対局履歴がありません</p>
                <p className="text-sm">対局が終了すると自動的に記録されます。</p>
              </div>
            ) : (
              <>
                <div className="space-y-2 mb-4">
                  {history.map((record) => (
                    <div
                      key={record.id}
                      className="bg-gray-800/80 rounded-xl p-4"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs text-gray-400">
                          {new Date(record.date).toLocaleString('ja-JP')}
                        </span>
                        <span className={`font-bold ${getRankColor(record.humanRank)}`}>
                          {getRankLabel(record.humanRank)}
                        </span>
                      </div>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm text-gray-300">
                          {record.rules.gameType === 'hanchan' ? '半荘戦' : '東風戦'}
                          {record.rules.hasRedDora ? ' / 赤ドラあり' : ''}
                        </span>
                      </div>
                      <div className="grid grid-cols-4 gap-1 text-xs mt-2">
                        {record.playerNames.map((name, i) => (
                          <div
                            key={i}
                            className={`text-center py-1 rounded ${
                              i === record.humanPlayerIndex
                                ? 'bg-yellow-500/20 text-yellow-300'
                                : 'bg-gray-700/50 text-gray-400'
                            }`}
                          >
                            <div className="truncate">{name}</div>
                            <div className="font-bold">{record.finalScores[i].toLocaleString()}</div>
                            <div className={getRankColor(record.rankings[i])}>
                              {getRankLabel(record.rankings[i])}
                            </div>
                          </div>
                        ))}
                      </div>
                      <button
                        onClick={() => handleDeleteHistory(record.id!)}
                        className="mt-2 text-xs text-red-400/60 hover:text-red-400 transition-colors"
                      >
                        削除
                      </button>
                    </div>
                  ))}
                </div>
                {history.length > 0 && (
                  <button
                    onClick={handleClearAll}
                    className="w-full py-2 text-sm text-red-400/60 hover:text-red-400
                      bg-gray-800/50 hover:bg-gray-800 rounded-lg transition-colors mb-4"
                  >
                    全履歴を削除
                  </button>
                )}
              </>
            )}
          </>
        ) : (
          /* リプレイタブ */
          <>
            {replays.length === 0 ? (
              <div className="text-center text-gray-500 py-8">
                <p className="text-lg mb-2">リプレイデータがありません</p>
                <p className="text-sm">対局が終了するとリプレイが自動で保存されます。</p>
              </div>
            ) : (
              <div className="space-y-2">
                {replays.map((rep) => (
                  <div
                    key={rep.id}
                    className="bg-gray-800/80 rounded-xl p-4 flex items-center justify-between"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="text-xs text-gray-400">
                        {new Date(rep.date).toLocaleString('ja-JP')}
                      </div>
                      <div className="text-sm mt-1">
                        {rep.playerNames.join(' / ')}
                      </div>
                      <div className="text-xs text-gray-500 mt-0.5">
                        {rep.actions.length} アクション
                      </div>
                    </div>
                    <div className="flex gap-2 flex-shrink-0">
                      <button
                        onClick={() => navigate(`/replay/${rep.id}`)}
                        className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 rounded-lg text-sm font-medium transition-colors"
                      >
                        再生
                      </button>
                      <button
                        onClick={() => handleDeleteReplay(rep.id!)}
                        className="px-3 py-1.5 bg-red-700/50 hover:bg-red-700 rounded-lg text-sm transition-colors"
                      >
                        削除
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}

        <button
          onClick={() => navigate('/')}
          className="w-full mt-6 py-3 bg-gray-700 hover:bg-gray-600 rounded-xl text-lg font-bold
            transition-all hover:scale-[1.02] active:scale-[0.98]"
        >
          戻る
        </button>
      </div>
    </div>
  );
};

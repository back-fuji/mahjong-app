import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import type { SavedGameRecord } from '../db/database.ts';
import { getSavedGames, loadGame, deleteSavedGame } from '../db/save-load.ts';
import { useGameStore } from '../store/gameStore.ts';

export const SaveLoadPage: React.FC = () => {
  const navigate = useNavigate();
  const [saves, setSaves] = useState<SavedGameRecord[]>([]);
  const [loading, setLoading] = useState(true);

  const loadSaves = async () => {
    setLoading(true);
    const data = await getSavedGames();
    setSaves(data);
    setLoading(false);
  };

  useEffect(() => {
    loadSaves();
  }, []);

  const handleLoad = async (id: number) => {
    const result = await loadGame(id);
    if (!result) return;

    const store = useGameStore.getState();
    store.loadGameState(result.gameState, result.humanPlayerIndex);
    navigate('/game');
  };

  const handleDelete = async (id: number) => {
    await deleteSavedGame(id);
    loadSaves();
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-gray-900 to-green-900">
      <div className="bg-gray-900/90 rounded-2xl p-6 max-w-lg w-full mx-4 text-white max-h-[90vh] overflow-y-auto">
        <h1 className="text-3xl font-bold text-center mb-6 text-yellow-400">セーブ/ロード</h1>

        {loading ? (
          <div className="text-center text-gray-400 py-8">読み込み中...</div>
        ) : saves.length === 0 ? (
          <div className="text-center text-gray-500 py-8">
            <p className="text-lg mb-2">セーブデータがありません</p>
            <p className="text-sm">対局中にページを離れると自動セーブされます。</p>
          </div>
        ) : (
          <div className="space-y-2">
            {saves.map((save) => (
              <div
                key={save.id}
                className="bg-gray-800/80 rounded-xl p-4 flex items-center justify-between gap-3"
              >
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-sm truncate">
                    {save.name}
                    {save.name === '自動セーブ' && (
                      <span className="ml-2 text-xs bg-blue-600/50 px-1.5 py-0.5 rounded">自動</span>
                    )}
                  </div>
                  <div className="text-xs text-gray-400 mt-1">
                    {save.preview.round} / {new Date(save.date).toLocaleString('ja-JP')}
                  </div>
                  <div className="text-xs text-gray-500 mt-0.5">
                    点数: {save.preview.scores.map(s => s.toLocaleString()).join(' / ')}
                  </div>
                </div>
                <div className="flex gap-2 flex-shrink-0">
                  <button
                    onClick={() => handleLoad(save.id!)}
                    className="px-3 py-1.5 bg-green-600 hover:bg-green-700 rounded-lg text-sm font-medium transition-colors"
                  >
                    ロード
                  </button>
                  <button
                    onClick={() => handleDelete(save.id!)}
                    className="px-3 py-1.5 bg-red-700/50 hover:bg-red-700 rounded-lg text-sm transition-colors"
                  >
                    削除
                  </button>
                </div>
              </div>
            ))}
          </div>
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

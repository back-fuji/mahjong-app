import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getAllAchievements, getPlayerStats } from '../achievements/achievement-tracker.ts';
import { CATEGORY_LABELS } from '../achievements/achievement-definitions.ts';
import type { AchievementCategory, AchievementDefinition } from '../achievements/achievement-definitions.ts';
import type { AchievementRecord, PlayerStatsRecord } from '../db/database.ts';

type AchievementWithStatus = {
  definition: AchievementDefinition;
  record: AchievementRecord | null;
};

export const AchievementsPage: React.FC = () => {
  const navigate = useNavigate();
  const [achievements, setAchievements] = useState<AchievementWithStatus[]>([]);
  const [stats, setStats] = useState<PlayerStatsRecord | null>(null);
  const [activeCategory, setActiveCategory] = useState<AchievementCategory | 'all'>('all');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const [achs, playerStats] = await Promise.all([
        getAllAchievements(),
        getPlayerStats(),
      ]);
      setAchievements(achs);
      setStats(playerStats);
      setLoading(false);
    })();
  }, []);

  const filtered = activeCategory === 'all'
    ? achievements
    : achievements.filter(a => a.definition.category === activeCategory);

  const unlockedCount = achievements.filter(a => a.record && a.record.unlockedAt).length;
  const totalCount = achievements.length;

  return (
    <div className="min-h-screen flex items-center justify-center theme-gradient">
      <div className="theme-bg-card rounded-2xl p-6 sm:p-8 max-w-lg w-full mx-4 text-white max-h-[90vh] flex flex-col">
        <h1 className="text-3xl font-bold text-center mb-2 theme-text-accent">実績</h1>

        {/* 統計サマリー */}
        {stats && !loading && (
          <div className="grid grid-cols-4 gap-2 mb-4">
            <StatBadge label="対局" value={stats.totalGames} />
            <StatBadge label="勝利" value={stats.totalWins} />
            <StatBadge label="和了" value={stats.totalAgari} />
            <StatBadge label="解除" value={`${unlockedCount}/${totalCount}`} />
          </div>
        )}

        {/* 進捗バー */}
        <div className="mb-4">
          <div className="flex justify-between text-xs text-gray-400 mb-1">
            <span>実績進捗</span>
            <span>{unlockedCount}/{totalCount} ({totalCount > 0 ? Math.round(unlockedCount / totalCount * 100) : 0}%)</span>
          </div>
          <div className="w-full h-2 bg-gray-700 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-yellow-500 to-amber-400 rounded-full transition-all duration-500"
              style={{ width: `${totalCount > 0 ? (unlockedCount / totalCount * 100) : 0}%` }}
            />
          </div>
        </div>

        {/* カテゴリタブ */}
        <div className="flex gap-1 mb-4 bg-gray-800/50 rounded-lg p-1">
          <CategoryBtn
            active={activeCategory === 'all'}
            onClick={() => setActiveCategory('all')}
          >
            全て
          </CategoryBtn>
          {(Object.keys(CATEGORY_LABELS) as AchievementCategory[]).map(cat => (
            <CategoryBtn
              key={cat}
              active={activeCategory === cat}
              onClick={() => setActiveCategory(cat)}
            >
              {CATEGORY_LABELS[cat]}
            </CategoryBtn>
          ))}
        </div>

        {/* 実績一覧 */}
        <div className="flex-1 overflow-y-auto space-y-2 pr-1">
          {loading ? (
            <p className="text-center text-gray-500 py-8">読み込み中...</p>
          ) : filtered.length === 0 ? (
            <p className="text-center text-gray-500 py-8">該当する実績がありません</p>
          ) : (
            filtered.map(({ definition, record }) => {
              const isUnlocked = !!record && !!record.unlockedAt;
              return (
                <div
                  key={definition.id}
                  className={`rounded-lg p-3 flex items-center gap-3 transition-all
                    ${isUnlocked
                      ? 'bg-yellow-500/10 border border-yellow-500/30'
                      : 'bg-gray-800/50 border border-gray-700/50 opacity-60'
                    }`}
                >
                  <span className={`text-2xl ${isUnlocked ? '' : 'grayscale'}`}>
                    {definition.icon}
                  </span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className={`font-bold text-sm ${isUnlocked ? 'text-yellow-400' : 'text-gray-400'}`}>
                        {definition.name}
                      </span>
                      {isUnlocked && (
                        <span className="text-[10px] text-green-400">解除済</span>
                      )}
                    </div>
                    <p className="text-gray-500 text-xs">{definition.description}</p>

                    {/* 段階的実績の進捗バー */}
                    {definition.maxProgress && (
                      <div className="mt-1">
                        <div className="flex justify-between text-[10px] text-gray-600 mb-0.5">
                          <span>進捗</span>
                          <span>{Math.min(record?.progress ?? 0, definition.maxProgress)}/{definition.maxProgress}</span>
                        </div>
                        <div className="w-full h-1.5 bg-gray-700 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-yellow-500 rounded-full transition-all"
                            style={{ width: `${Math.min(((record?.progress ?? 0) / definition.maxProgress) * 100, 100)}%` }}
                          />
                        </div>
                      </div>
                    )}

                    {isUnlocked && record?.unlockedAt && (
                      <p className="text-[10px] text-gray-600 mt-1">
                        {new Date(record.unlockedAt).toLocaleDateString('ja-JP')}
                      </p>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>

        <button
          onClick={() => navigate('/')}
          className="w-full mt-4 py-3 bg-gray-700 hover:bg-gray-600 rounded-xl text-lg font-bold
            transition-all hover:scale-[1.02] active:scale-[0.98]"
        >
          戻る
        </button>
      </div>
    </div>
  );
};

const StatBadge: React.FC<{ label: string; value: number | string }> = ({ label, value }) => (
  <div className="bg-gray-800/50 rounded-lg px-2 py-2 text-center">
    <p className="text-yellow-400 font-bold text-lg">{value}</p>
    <p className="text-gray-500 text-[10px]">{label}</p>
  </div>
);

const CategoryBtn: React.FC<{ active: boolean; onClick: () => void; children: React.ReactNode }> = ({ active, onClick, children }) => (
  <button
    onClick={onClick}
    className={`flex-1 py-1.5 rounded-md text-xs font-medium transition-all
      ${active
        ? 'bg-yellow-500 text-black'
        : 'text-gray-400 hover:text-white hover:bg-gray-700'
      }`}
  >
    {children}
  </button>
);

/**
 * 実績トラッキングモジュール
 *
 * ゲーム終了時にスコア・役・結果を受け取り、該当する実績を解除する。
 */

import { db } from '../db/database.ts';
import type { AchievementRecord, PlayerStatsRecord } from '../db/database.ts';
import type { GameState, RoundResult } from '../core/types/game-state.ts';
import type { YakuId } from '../core/types/yaku.ts';
import { ACHIEVEMENT_DEFINITIONS } from './achievement-definitions.ts';

/** 新たに解除された実績のIDを返す */
export type AchievementUnlockCallback = (achievementIds: string[]) => void;

let onUnlockCallback: AchievementUnlockCallback | null = null;

/** 実績解除コールバックを設定 */
export function setAchievementUnlockCallback(cb: AchievementUnlockCallback) {
  onUnlockCallback = cb;
}

/** 実績が解除済みかチェック */
async function isUnlocked(id: string): Promise<boolean> {
  const record = await db.achievements.get(id);
  return !!record;
}

/** 実績を解除 */
async function unlock(id: string): Promise<boolean> {
  if (await isUnlocked(id)) return false;
  // 定義に存在するか確認
  if (!ACHIEVEMENT_DEFINITIONS.find(a => a.id === id)) return false;

  await db.achievements.put({
    id,
    unlockedAt: new Date().toISOString(),
    progress: 1,
  });
  return true;
}

/** 進捗を更新（段階的実績用） */
async function updateProgress(id: string, progress: number): Promise<boolean> {
  const def = ACHIEVEMENT_DEFINITIONS.find(a => a.id === id);
  if (!def || !def.maxProgress) return false;

  const existing = await db.achievements.get(id);
  const currentProgress = existing?.progress ?? 0;
  const newProgress = Math.max(currentProgress, progress);

  if (newProgress >= def.maxProgress) {
    // 解除
    await db.achievements.put({
      id,
      unlockedAt: existing?.unlockedAt || new Date().toISOString(),
      progress: newProgress,
    });
    return !existing || currentProgress < def.maxProgress;
  } else {
    // 進捗のみ更新
    await db.achievements.put({
      id,
      unlockedAt: '',
      progress: newProgress,
    });
    return false;
  }
}

/** プレイ統計を取得（なければ初期化） */
async function getStats(): Promise<PlayerStatsRecord> {
  const stats = await db.playerStats.toCollection().first();
  if (stats) return stats;
  const initial: PlayerStatsRecord = {
    totalGames: 0,
    totalWins: 0,
    totalRounds: 0,
    totalAgari: 0,
    totalTsumoAgari: 0,
    totalRonAgari: 0,
    totalManganPlus: 0,
  };
  await db.playerStats.add(initial);
  return initial;
}

/** プレイ統計を更新 */
async function updateStats(update: Partial<PlayerStatsRecord>): Promise<PlayerStatsRecord> {
  const stats = await getStats();
  const updated: PlayerStatsRecord = {
    ...stats,
    ...update,
  };
  await db.playerStats.update(stats.id!, updated);
  return updated;
}

/**
 * 局終了時に呼ばれる — 和了結果から実績をチェック
 */
export async function checkRoundAchievements(
  roundResult: RoundResult,
  humanPlayerIndex: number,
): Promise<void> {
  const newUnlocks: string[] = [];

  if (roundResult.agari) {
    for (const agari of roundResult.agari) {
      if (agari.winner !== humanPlayerIndex) continue;

      // ツモ/ロン
      if (agari.isTsumo) {
        if (await unlock('first_tsumo')) newUnlocks.push('first_tsumo');
      } else {
        if (await unlock('first_ron')) newUnlocks.push('first_ron');
      }

      // 役チェック
      const yakuIds = agari.scoreResult.yaku.map(y => y.id);

      // リーチ和了
      if (yakuIds.includes('riichi' as YakuId)) {
        if (await unlock('first_riichi')) newUnlocks.push('first_riichi');
      }

      // 一発ツモ
      if (yakuIds.includes('ippatsu' as YakuId) && agari.isTsumo) {
        if (await unlock('ippatsu_tsumo')) newUnlocks.push('ippatsu_tsumo');
      }

      // 海底
      if (yakuIds.includes('haitei' as YakuId)) {
        if (await unlock('haitei_win')) newUnlocks.push('haitei_win');
      }

      // 嶺上
      if (yakuIds.includes('rinshan' as YakuId)) {
        if (await unlock('rinshan_win')) newUnlocks.push('rinshan_win');
      }

      // 各役の実績
      const yakuAchievementMap: Record<string, YakuId> = {
        'yaku_tanyao': 'tanyao',
        'yaku_pinfu': 'pinfu',
        'yaku_chiitoi': 'chiitoitsu',
        'yaku_honitsu': 'honitsu',
        'yaku_chinitsu': 'chinitsu',
        'yaku_toitoi': 'toitoi',
        'yaku_ittsu': 'ittsu',
        'yaku_sanshoku': 'sanshoku_doujun',
      };

      for (const [achId, yakuId] of Object.entries(yakuAchievementMap)) {
        if (yakuIds.includes(yakuId)) {
          if (await unlock(achId)) newUnlocks.push(achId);
        }
      }

      // 役満
      if (agari.scoreResult.isYakuman) {
        if (await unlock('yakuman_achieved')) newUnlocks.push('yakuman_achieved');
        if (agari.scoreResult.yakumanCount >= 2) {
          if (await unlock('double_yakuman')) newUnlocks.push('double_yakuman');
        }
      }

      // 満貫以上
      if (agari.scoreResult.han >= 5 || agari.scoreResult.isYakuman) {
        const stats = await getStats();
        const newCount = stats.totalManganPlus + 1;
        await updateStats({ totalManganPlus: newCount });
        if (await updateProgress('mangan_count', newCount)) {
          newUnlocks.push('mangan_count');
        }
      }

      // 統計更新
      const stats = await getStats();
      await updateStats({
        totalAgari: stats.totalAgari + 1,
        totalTsumoAgari: stats.totalTsumoAgari + (agari.isTsumo ? 1 : 0),
        totalRonAgari: stats.totalRonAgari + (agari.isTsumo ? 0 : 1),
      });
    }
  }

  // 局数更新
  const stats = await getStats();
  await updateStats({ totalRounds: stats.totalRounds + 1 });

  if (newUnlocks.length > 0 && onUnlockCallback) {
    onUnlockCallback(newUnlocks);
  }
}

/**
 * ゲーム終了時に呼ばれる — 最終結果から実績をチェック
 */
export async function checkGameEndAchievements(
  gameState: GameState,
  humanPlayerIndex: number,
): Promise<void> {
  const newUnlocks: string[] = [];

  // 初めての対局
  if (await unlock('first_game')) newUnlocks.push('first_game');

  // 統計更新
  const stats = await getStats();
  const newTotalGames = stats.totalGames + 1;
  await updateStats({ totalGames: newTotalGames });

  // ゲーム数実績
  if (await updateProgress('games_10', newTotalGames)) newUnlocks.push('games_10');
  if (await updateProgress('games_50', newTotalGames)) newUnlocks.push('games_50');
  if (newTotalGames >= 100) {
    if (await unlock('games_100')) newUnlocks.push('games_100');
  }

  // 順位チェック
  const scores = gameState.players.map(p => p.score);
  const myScore = scores[humanPlayerIndex];
  const rank = scores.filter(s => s > myScore).length + 1;

  if (rank === 1) {
    if (await unlock('first_win')) newUnlocks.push('first_win');

    const newWins = stats.totalWins + 1;
    await updateStats({ totalWins: newWins });
    if (await updateProgress('wins_5', newWins)) newUnlocks.push('wins_5');
    if (await updateProgress('wins_20', newWins)) newUnlocks.push('wins_20');

    // 完全勝利チェック
    const otherScores = scores.filter((_, i) => i !== humanPlayerIndex);
    if (otherScores.every(s => myScore - s >= 30000)) {
      if (await unlock('perfect_game')) newUnlocks.push('perfect_game');
    }
  }

  if (newUnlocks.length > 0 && onUnlockCallback) {
    onUnlockCallback(newUnlocks);
  }
}

/**
 * 全実績の解除状況を取得
 */
export async function getAllAchievements(): Promise<{
  definition: typeof ACHIEVEMENT_DEFINITIONS[number];
  record: AchievementRecord | null;
}[]> {
  const records = await db.achievements.toArray();
  const recordMap = new Map(records.map(r => [r.id, r]));

  return ACHIEVEMENT_DEFINITIONS.map(def => ({
    definition: def,
    record: recordMap.get(def.id) ?? null,
  }));
}

/**
 * プレイ統計を取得
 */
export async function getPlayerStats(): Promise<PlayerStatsRecord> {
  return getStats();
}

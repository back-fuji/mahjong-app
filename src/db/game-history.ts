import { db, type GameHistoryRecord } from './database.ts';
import type { GameState } from '../core/types/game-state.ts';

/** 対局結果を履歴に保存 */
export async function saveGameHistory(
  gameState: GameState,
  humanPlayerIndex: number
): Promise<number> {
  const scores = gameState.players.map(p => p.score);
  const sorted = [...scores].map((s, i) => ({ s, i })).sort((a, b) => b.s - a.s);
  const rankings = new Array(4).fill(0);
  sorted.forEach((item, rank) => {
    rankings[item.i] = rank + 1;
  });

  const record: GameHistoryRecord = {
    date: new Date().toISOString(),
    rules: gameState.rules,
    playerNames: gameState.players.map(p => p.name),
    finalScores: scores,
    rankings,
    humanPlayerIndex,
    humanRank: rankings[humanPlayerIndex],
    rounds: gameState.round.kyoku + 1,
  };

  return db.gameHistory.add(record);
}

/** 対局履歴を取得（新しい順） */
export async function getGameHistory(limit = 50): Promise<GameHistoryRecord[]> {
  return db.gameHistory.orderBy('date').reverse().limit(limit).toArray();
}

/** 対局履歴を削除 */
export async function deleteGameHistory(id: number): Promise<void> {
  await db.gameHistory.delete(id);
}

/** 全履歴を削除 */
export async function clearGameHistory(): Promise<void> {
  await db.gameHistory.clear();
}

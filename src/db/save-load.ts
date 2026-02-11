import { db, type SavedGameRecord } from './database.ts';
import type { GameState } from '../core/types/game-state.ts';
import { WIND_NAMES } from '../core/types/player.ts';

/**
 * GameState をシリアライズ可能なJSONに変換
 * Map を Object に変換する
 */
function serializeGameState(state: GameState): string {
  return JSON.stringify(state, (key, value) => {
    if (value instanceof Map) {
      return {
        __type: 'Map',
        entries: Array.from(value.entries()),
      };
    }
    return value;
  });
}

/**
 * シリアライズされた JSON から GameState を復元
 */
function deserializeGameState(json: string): GameState {
  return JSON.parse(json, (_key, value) => {
    if (value && typeof value === 'object' && value.__type === 'Map') {
      return new Map(value.entries);
    }
    return value;
  });
}

/** 局名を生成 */
function getRoundName(state: GameState): string {
  const windName = WIND_NAMES[state.round.bakaze];
  return `${windName}${state.round.kyoku + 1}局`;
}

/** ゲームをセーブ */
export async function saveGame(
  gameState: GameState,
  humanPlayerIndex: number,
  name?: string
): Promise<number> {
  const slotName = name ?? `セーブ ${new Date().toLocaleString('ja-JP')}`;
  const record: SavedGameRecord = {
    date: new Date().toISOString(),
    name: slotName,
    gameStateJson: serializeGameState(gameState),
    humanPlayerIndex,
    preview: {
      round: getRoundName(gameState),
      scores: gameState.players.map(p => p.score),
      turn: gameState.round.turn,
    },
  };

  // セーブスロット数を10に制限
  const count = await db.savedGames.count();
  if (count >= 10) {
    const oldest = await db.savedGames.orderBy('date').first();
    if (oldest?.id) {
      await db.savedGames.delete(oldest.id);
    }
  }

  return db.savedGames.add(record);
}

/** セーブデータをロード */
export async function loadGame(id: number): Promise<{
  gameState: GameState;
  humanPlayerIndex: number;
} | null> {
  const record = await db.savedGames.get(id);
  if (!record) return null;

  return {
    gameState: deserializeGameState(record.gameStateJson),
    humanPlayerIndex: record.humanPlayerIndex,
  };
}

/** セーブデータ一覧を取得（新しい順） */
export async function getSavedGames(): Promise<SavedGameRecord[]> {
  return db.savedGames.orderBy('date').reverse().toArray();
}

/** セーブデータを削除 */
export async function deleteSavedGame(id: number): Promise<void> {
  await db.savedGames.delete(id);
}

/** 自動セーブ（beforeunload用） */
export async function autoSave(
  gameState: GameState,
  humanPlayerIndex: number
): Promise<void> {
  // 既存の自動セーブを上書き
  const existing = await db.savedGames.where('name').equals('自動セーブ').first();
  if (existing?.id) {
    await db.savedGames.delete(existing.id);
  }
  await saveGame(gameState, humanPlayerIndex, '自動セーブ');
}

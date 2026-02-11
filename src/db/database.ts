import Dexie, { type Table } from 'dexie';
import type { GameRules } from '../core/types/game-state.ts';

/** 対局履歴レコード */
export interface GameHistoryRecord {
  id?: number;
  date: string;              // ISO string
  rules: GameRules;
  playerNames: string[];
  finalScores: number[];     // 各プレイヤーの最終スコア
  rankings: number[];        // 順位 (1-4)
  humanPlayerIndex: number;
  humanRank: number;         // 人間プレイヤーの順位
  rounds: number;            // 局数
}

/** セーブデータレコード */
export interface SavedGameRecord {
  id?: number;
  date: string;
  name: string;              // スロット名
  gameStateJson: string;     // シリアライズされた GameState
  humanPlayerIndex: number;
  preview: {
    round: string;           // "東1局" など
    scores: number[];
    turn: number;
  };
}

/** リプレイアクション */
export interface ReplayAction {
  timestamp: number;          // ゲーム開始からのms
  type: string;               // 'tsumo' | 'discard' | 'pon' | 'chi' | ...
  playerIndex: number;
  data?: unknown;             // 牌IDなど
}

/** リプレイデータレコード */
export interface ReplayRecord {
  id?: number;
  date: string;
  rules: GameRules;
  /** 山の牌ID配列（再現用） */
  initialWallIndices: number[];
  actions: ReplayAction[];
  playerNames: string[];
  finalScores: number[];
}

class MahjongDB extends Dexie {
  gameHistory!: Table<GameHistoryRecord>;
  savedGames!: Table<SavedGameRecord>;
  replays!: Table<ReplayRecord>;

  constructor() {
    super('mahjong-app');
    this.version(1).stores({
      gameHistory: '++id, date',
      savedGames: '++id, date, name',
      replays: '++id, date',
    });
  }
}

export const db = new MahjongDB();

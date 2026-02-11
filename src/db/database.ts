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

/** 実績レコード */
export interface AchievementRecord {
  id: string;               // 実績ID
  unlockedAt: string;        // 解除日時 (ISO string)
  progress: number;          // 進捗 (段階的な実績用)
}

/** プレイ統計レコード */
export interface PlayerStatsRecord {
  id?: number;
  totalGames: number;        // 総対局数
  totalWins: number;         // 総勝利数（1位回数）
  totalRounds: number;       // 総局数
  totalAgari: number;        // 総和了回数
  totalTsumoAgari: number;   // ツモ和了回数
  totalRonAgari: number;     // ロン和了回数
  totalManganPlus: number;   // 満貫以上の回数
}

class MahjongDB extends Dexie {
  gameHistory!: Table<GameHistoryRecord>;
  savedGames!: Table<SavedGameRecord>;
  replays!: Table<ReplayRecord>;
  achievements!: Table<AchievementRecord>;
  playerStats!: Table<PlayerStatsRecord>;

  constructor() {
    super('mahjong-app');
    this.version(1).stores({
      gameHistory: '++id, date',
      savedGames: '++id, date, name',
      replays: '++id, date',
    });
    this.version(2).stores({
      gameHistory: '++id, date',
      savedGames: '++id, date, name',
      replays: '++id, date',
      achievements: 'id',
      playerStats: '++id',
    });
  }
}

export const db = new MahjongDB();

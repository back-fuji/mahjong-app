import type { ReplayAction, ReplayRecord } from '../db/database.ts';
import type { GameState, GameRules } from '../core/types/game-state.ts';
import { db } from '../db/database.ts';

/**
 * リプレイ記録エンジン
 * 対局中のすべてのアクションを時系列で記録し、後から再生可能にする。
 */
class ReplayRecorder {
  private recording = false;
  private startTime = 0;
  private actions: ReplayAction[] = [];
  private rules: GameRules | null = null;
  private initialWallIndices: number[] = [];
  private playerNames: string[] = [];

  /** 記録開始 */
  start(gameState: GameState) {
    this.recording = true;
    this.startTime = Date.now();
    this.actions = [];
    this.rules = { ...gameState.rules };
    this.initialWallIndices = gameState.wall.map(t => t.index);
    this.playerNames = gameState.players.map(p => p.name);
  }

  /** アクションを記録 */
  record(type: string, playerIndex: number, data?: unknown) {
    if (!this.recording) return;
    this.actions.push({
      timestamp: Date.now() - this.startTime,
      type,
      playerIndex,
      data,
    });
  }

  /** 記録を停止してDBに保存 */
  async stop(finalScores: number[]): Promise<number | undefined> {
    if (!this.recording || !this.rules) return;
    this.recording = false;

    const record: ReplayRecord = {
      date: new Date().toISOString(),
      rules: this.rules,
      initialWallIndices: this.initialWallIndices,
      actions: this.actions,
      playerNames: this.playerNames,
      finalScores,
    };

    try {
      const id = await db.replays.add(record);
      return id as number;
    } catch {
      return undefined;
    }
  }

  /** 記録を破棄 */
  discard() {
    this.recording = false;
    this.actions = [];
  }

  get isRecording() {
    return this.recording;
  }
}

/** シングルトンインスタンス */
export const replayRecorder = new ReplayRecorder();

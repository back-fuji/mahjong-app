import type { ReplayRecord, ReplayAction } from '../db/database.ts';
import { db } from '../db/database.ts';

export interface ReplayState {
  currentIndex: number;
  totalActions: number;
  isPlaying: boolean;
  speed: number; // 再生速度倍率
  currentAction: ReplayAction | null;
}

/**
 * リプレイ再生エンジン
 * 記録されたアクションを順番に再生する。
 */
export class ReplayPlayer {
  private replay: ReplayRecord | null = null;
  private currentIndex = 0;
  private playing = false;
  private speed = 1;
  private timerId: ReturnType<typeof setTimeout> | null = null;
  private onAction: ((action: ReplayAction, index: number) => void) | null = null;
  private onStateChange: ((state: ReplayState) => void) | null = null;

  /** リプレイデータをDBからロード */
  async load(id: number): Promise<ReplayRecord | null> {
    const record = await db.replays.get(id);
    if (!record) return null;
    this.replay = record;
    this.currentIndex = 0;
    this.playing = false;
    this.emitState();
    return record;
  }

  /** コールバック設定 */
  setCallbacks(
    onAction: (action: ReplayAction, index: number) => void,
    onStateChange: (state: ReplayState) => void
  ) {
    this.onAction = onAction;
    this.onStateChange = onStateChange;
  }

  /** 再生開始 */
  play() {
    if (!this.replay) return;
    this.playing = true;
    this.emitState();
    this.scheduleNext();
  }

  /** 一時停止 */
  pause() {
    this.playing = false;
    if (this.timerId) {
      clearTimeout(this.timerId);
      this.timerId = null;
    }
    this.emitState();
  }

  /** 再生速度変更 */
  setSpeed(speed: number) {
    this.speed = speed;
    this.emitState();
  }

  /** 1ステップ進む */
  stepForward() {
    if (!this.replay) return;
    if (this.currentIndex >= this.replay.actions.length) return;

    const action = this.replay.actions[this.currentIndex];
    this.onAction?.(action, this.currentIndex);
    this.currentIndex++;
    this.emitState();
  }

  /** 先頭に戻す */
  reset() {
    this.pause();
    this.currentIndex = 0;
    this.emitState();
  }

  /** 指定位置にジャンプ */
  seekTo(index: number) {
    if (!this.replay) return;
    this.currentIndex = Math.max(0, Math.min(index, this.replay.actions.length));
    this.emitState();
  }

  /** 再生を停止してクリーンアップ */
  stop() {
    this.pause();
    this.replay = null;
    this.currentIndex = 0;
  }

  private scheduleNext() {
    if (!this.replay || !this.playing) return;
    if (this.currentIndex >= this.replay.actions.length) {
      this.playing = false;
      this.emitState();
      return;
    }

    const action = this.replay.actions[this.currentIndex];
    const nextAction = this.replay.actions[this.currentIndex + 1];

    this.onAction?.(action, this.currentIndex);
    this.currentIndex++;
    this.emitState();

    if (nextAction && this.currentIndex < this.replay.actions.length) {
      const delay = Math.max(50, (nextAction.timestamp - action.timestamp) / this.speed);
      this.timerId = setTimeout(() => this.scheduleNext(), Math.min(delay, 2000));
    } else {
      this.playing = false;
      this.emitState();
    }
  }

  private emitState() {
    this.onStateChange?.({
      currentIndex: this.currentIndex,
      totalActions: this.replay?.actions.length ?? 0,
      isPlaying: this.playing,
      speed: this.speed,
      currentAction: this.replay?.actions[this.currentIndex] ?? null,
    });
  }

  getState(): ReplayState {
    return {
      currentIndex: this.currentIndex,
      totalActions: this.replay?.actions.length ?? 0,
      isPlaying: this.playing,
      speed: this.speed,
      currentAction: this.replay?.actions[this.currentIndex] ?? null,
    };
  }
}

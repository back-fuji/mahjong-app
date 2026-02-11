/**
 * 高度な戦略モジュール
 *
 * 点数状況判断、残り巡目による押し引き調整、オーラス判断を行う。
 * Hard難易度のAIで使用される。
 */

import type { GameState } from '../../core/types/game-state.ts';
import type { TileCount34 } from '../../core/types/tile.ts';
import { calculateShanten } from '../shanten/shanten.ts';

/**
 * 戦略的状況分析の結果
 */
export interface StrategicContext {
  /** 攻撃度 (0.0 = 完全守備, 1.0 = 全力攻撃) */
  aggressiveness: number;
  /** リーチすべきか（点数状況考慮） */
  shouldRiichiOverride: boolean | null; // null = デフォルト判断に委ねる
  /** 鳴き積極度 (0.0 = 鳴かない, 1.0 = 積極的に鳴く) */
  callAggressiveness: number;
  /** 理由 */
  reason: string;
}

/**
 * 点数状況と局面から戦略的コンテキストを算出する
 */
export function analyzeStrategicContext(
  state: GameState,
  playerIndex: number,
): StrategicContext {
  const player = state.players[playerIndex];
  const scores = state.players.map(p => p.score);
  const myScore = player.score;
  const remainingTiles = state.round.remainingTiles;

  // 順位計算
  const rank = scores.filter(s => s > myScore).length + 1;
  const topScore = Math.max(...scores);
  const bottomScore = Math.min(...scores);
  const scoreDiffFromTop = topScore - myScore;
  const scoreDiffFromBottom = myScore - bottomScore;

  // オーラスかどうか
  const isLastRound = isOras(state);

  let aggressiveness = 0.5; // デフォルト
  let shouldRiichiOverride: boolean | null = null;
  let callAggressiveness = 0.3;
  let reason = '通常';

  if (isLastRound) {
    // オーラスの判断
    if (rank === 1) {
      // トップ → 守備的
      aggressiveness = 0.2;
      callAggressiveness = 0.1;
      reason = 'オーラス・トップ → 守備重視';

      // 2位との差が僅差なら少し攻めも
      const secondScore = [...scores].sort((a, b) => b - a)[1];
      if (secondScore && myScore - secondScore < 3000) {
        aggressiveness = 0.4;
        reason = 'オーラス・僅差トップ → やや攻め';
      }

      // ダマテンで十分ならリーチしない
      shouldRiichiOverride = false;
    } else if (rank === 4) {
      // ラス → 全力攻撃
      aggressiveness = 1.0;
      callAggressiveness = 0.8;
      reason = 'オーラス・ラス → 全力攻撃';

      // 逆転に必要な点数が大きければリーチ必須
      const thirdScore = [...scores].sort((a, b) => b - a)[2];
      if (thirdScore && thirdScore - myScore > 8000) {
        shouldRiichiOverride = true;
        reason = 'オーラス・ラス → 大逆転狙い（リーチ推奨）';
      }
    } else if (rank === 2 || rank === 3) {
      // 2位/3位 → 状況による
      if (scoreDiffFromTop <= 7700) {
        // 逆転可能圏内
        aggressiveness = 0.7;
        callAggressiveness = 0.5;
        reason = `オーラス・${rank}位 → 逆転狙い`;
      } else {
        // 逆転困難 → 順位確保
        aggressiveness = 0.4;
        callAggressiveness = 0.2;
        reason = `オーラス・${rank}位 → 順位確保`;
      }
    }
  } else {
    // オーラス以外の通常局面
    if (rank === 1 && scoreDiffFromBottom > 20000) {
      // 大差トップ → やや守備的
      aggressiveness = 0.3;
      callAggressiveness = 0.2;
      reason = '大差トップ → 守備寄り';
    } else if (rank === 4 && scoreDiffFromTop > 20000) {
      // 大差ラス → 攻撃的
      aggressiveness = 0.8;
      callAggressiveness = 0.7;
      reason = '大差ラス → 攻撃的';
    } else {
      // 通常
      aggressiveness = 0.5 + (4 - rank) * 0.05; // 順位が低いほどやや攻撃的
      callAggressiveness = 0.3;
      reason = '通常局面';
    }
  }

  // 残り巡目による調整
  if (remainingTiles <= 10) {
    // 終盤は守備寄り（ラスオーラス以外）
    if (!(isLastRound && rank === 4)) {
      aggressiveness *= 0.6;
      reason += '（終盤補正）';
    }
  }

  return {
    aggressiveness: Math.max(0, Math.min(1, aggressiveness)),
    shouldRiichiOverride,
    callAggressiveness: Math.max(0, Math.min(1, callAggressiveness)),
    reason,
  };
}

/**
 * 押し引き判断: 戦略コンテキストと手の進み具合から攻めるか守るかを決定
 *
 * @returns true = 攻める, false = 守る
 */
export function shouldPush(
  context: StrategicContext,
  handCounts: TileCount34,
  hasRiichiOpponent: boolean,
): boolean {
  const shanten = calculateShanten(handCounts);

  // リーチ者がいない場合は常に攻め
  if (!hasRiichiOpponent) return true;

  // 聴牌なら攻撃度に関わらず攻め
  if (shanten <= 0) return true;

  // 一向聴で攻撃度が高いなら攻め
  if (shanten === 1 && context.aggressiveness >= 0.6) return true;

  // 攻撃度が非常に高い場合（ラスオーラスなど）二向聴でも攻め
  if (shanten === 2 && context.aggressiveness >= 0.9) return true;

  // それ以外は守り
  return context.aggressiveness >= 0.7 && shanten <= 2;
}

/**
 * リーチ判断に戦略的オーバーライドを適用
 */
export function strategicRiichiDecision(
  context: StrategicContext,
  defaultDecision: boolean,
): boolean {
  if (context.shouldRiichiOverride !== null) {
    return context.shouldRiichiOverride;
  }
  return defaultDecision;
}

/**
 * 鳴き判断に戦略的補正を適用
 * @returns 鳴くべきかの閾値調整
 */
export function strategicCallDecision(
  context: StrategicContext,
  defaultDecision: boolean,
  shantenImprovement: number,
): boolean {
  // 攻撃度が高い場合、向聴数が1でも改善すれば鳴く
  if (context.callAggressiveness >= 0.7 && shantenImprovement >= 1) {
    return true;
  }

  // 攻撃度が低い場合、デフォルト判断を厳しくする
  if (context.callAggressiveness < 0.2) {
    return false;
  }

  return defaultDecision;
}

/**
 * オーラスかどうかを判定
 */
function isOras(state: GameState): boolean {
  const { bakaze, kyoku } = state.round;
  const rules = state.rules;

  if (rules.gameType === 'tonpu') {
    // 東風戦: 東4局がオーラス
    return bakaze === 0 && kyoku === 3;
  }

  // 半荘戦: 南4局がオーラス
  return bakaze === 1 && kyoku === 3;
}

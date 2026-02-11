/**
 * 防御戦略モジュール
 *
 * 安全牌選択アルゴリズムと押し引き判断を提供する。
 * 現物 > スジ > ワンチャンス > 字牌 の優先順位で安全牌を選ぶ。
 */

import type { TileInstance, TileCount34 } from '../../core/types/tile.ts';
import type { GameState } from '../../core/types/game-state.ts';
import { calculateDangerScores, calculateVisibleCounts } from './danger.ts';
import { calculateShanten } from '../shanten/shanten.ts';

/**
 * 防御打ちの結果
 */
export interface DefenseResult {
  /** 防御すべきか */
  shouldDefend: boolean;
  /** 安全牌（危険度順） */
  safeTiles: { tile: TileInstance; dangerScore: number; reason: string }[];
}

/**
 * 押し引き判断 + 安全牌選択を行う
 *
 * @param state ゲーム状態
 * @param playerIndex プレイヤーインデックス
 * @returns 防御結果
 */
export function analyzeDefense(state: GameState, playerIndex: number): DefenseResult {
  const player = state.players[playerIndex];
  const opponents = state.players;
  const allTiles = player.hand.tsumo
    ? [...player.hand.closed, player.hand.tsumo]
    : [...player.hand.closed];

  // 自分の手牌カウント
  const handCounts: TileCount34 = new Array(34).fill(0);
  for (const t of allTiles) {
    handCounts[t.id]++;
  }

  // 場に見えている牌カウント
  const visibleCounts = calculateVisibleCounts(opponents, state.doraIndicators);

  // 自分の手牌も見えている牌に加算
  for (const t of allTiles) {
    visibleCounts[t.id]++;
  }

  // リーチ者がいるか確認
  const hasRiichiOpponent = opponents.some((p, i) => i !== playerIndex && p.isRiichi);

  // 押し引き判断
  const shouldDefend = shouldDefendNow(handCounts, hasRiichiOpponent, state, playerIndex);

  // 各牌の危険度を計算
  const dangerScores = calculateDangerScores(handCounts, opponents, playerIndex, visibleCounts);

  // TileInstance にマッピングして危険度順にソート
  const safeTiles: DefenseResult['safeTiles'] = [];
  const usedIndices = new Set<number>();

  // 危険度の低い順にソート
  const sortedScores = [...dangerScores].sort((a, b) => a.score - b.score);

  for (const ds of sortedScores) {
    const tile = allTiles.find(t => t.id === ds.tileId && !usedIndices.has(t.index));
    if (tile) {
      usedIndices.add(tile.index);
      safeTiles.push({
        tile,
        dangerScore: ds.score,
        reason: ds.reason,
      });
    }
  }

  return { shouldDefend, safeTiles };
}

/**
 * 防御すべきかどうかを判断する（押し引き判断）
 *
 * 考慮要素:
 * - 自分の向聴数（聴牌に近いほど攻め寄り）
 * - リーチ者の有無
 * - 残り巡目（残りが少ないほど守り寄り）
 */
function shouldDefendNow(
  handCounts: TileCount34,
  hasRiichiOpponent: boolean,
  state: GameState,
  playerIndex: number,
): boolean {
  // リーチ者がいない場合は攻め
  if (!hasRiichiOpponent) return false;

  const myShanten = calculateShanten(handCounts);
  const remainingTiles = state.round.remainingTiles;
  const player = state.players[playerIndex];

  // 自分もリーチ中なら攻め（打牌選択の余地もない）
  if (player.isRiichi) return false;

  // 聴牌なら基本的に攻め
  if (myShanten <= 0) return false;

  // 一向聴で残り巡目が多いなら攻め寄り
  if (myShanten === 1 && remainingTiles > 20) return false;

  // 二向聴以上 or 残り巡目が少ない場合は守り
  if (myShanten >= 2) return true;
  if (myShanten === 1 && remainingTiles <= 12) return true;

  return false;
}

/**
 * 防御打ち: 最も安全な牌を選ぶ
 *
 * @param state ゲーム状態
 * @param playerIndex プレイヤーインデックス
 * @param allTiles 打牌候補の全牌
 * @returns 最も安全な牌（見つからない場合はnull）
 */
export function chooseSafestDiscard(
  state: GameState,
  playerIndex: number,
): TileInstance | null {
  const result = analyzeDefense(state, playerIndex);

  if (!result.shouldDefend || result.safeTiles.length === 0) {
    return null;
  }

  // 喰い替え禁止牌を除外
  const player = state.players[playerIndex];
  const allowed = result.safeTiles.filter(
    s => !player.kuikaeDisallowedTiles.includes(s.tile.id)
  );

  return allowed.length > 0 ? allowed[0].tile : null;
}

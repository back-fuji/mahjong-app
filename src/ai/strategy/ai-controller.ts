/**
 * AI難易度コントローラー
 *
 * Easy / Normal / Hard の3段階でAI行動を切り替える統合モジュール。
 *
 * Easy:   効率計算にランダム性、防御なし、鳴き判断が甘い
 * Normal: 効率重視 + リーチ者に対する基本防御
 * Hard:   完全効率 + 高度防御(スジ/カベ) + 点数状況判断 + 押し引き
 */

import type { TileInstance, TileCount34 } from '../../core/types/tile.ts';
import type { CallOption } from '../../core/types/meld.ts';
import type { GameState } from '../../core/types/game-state.ts';
import type { AiDifficulty } from '../../store/settingsStore.ts';
import { chooseDiscard as baseChooseDiscard, shouldCallPon as baseShouldCallPon, shouldCallChi as baseShouldCallChi, shouldRiichi as baseShouldRiichi } from './strategy.ts';
import { chooseSafestDiscard, analyzeDefense } from '../defense/defense-strategy.ts';
import { analyzeStrategicContext, shouldPush, strategicRiichiDecision, strategicCallDecision } from './advanced-strategy.ts';
import { findBestDiscards } from '../efficiency/efficiency.ts';
import { calculateShanten } from '../shanten/shanten.ts';

/**
 * TileInstance配列からTileCount34に変換するヘルパー。
 */
function toCount34(tiles: TileInstance[]): TileCount34 {
  const counts: TileCount34 = new Array(34).fill(0);
  for (const t of tiles) {
    counts[t.id]++;
  }
  return counts;
}

// ========== 打牌選択 ==========

/**
 * 難易度に応じた打牌選択
 */
export function aiChooseDiscard(
  state: GameState,
  playerIndex: number,
  difficulty: AiDifficulty,
): TileInstance {
  const player = state.players[playerIndex];
  const closedTiles = player.hand.closed;
  const tsumo = player.hand.tsumo;
  const allTiles = tsumo ? [...closedTiles, tsumo] : [...closedTiles];

  switch (difficulty) {
    case 'easy':
      return easyChooseDiscard(allTiles, tsumo);
    case 'normal':
      return normalChooseDiscard(state, playerIndex, allTiles, tsumo);
    case 'hard':
      return hardChooseDiscard(state, playerIndex, allTiles, tsumo);
  }
}

/**
 * Easy: 効率計算にランダム性を加える（上位3候補からランダム選択）
 */
function easyChooseDiscard(allTiles: TileInstance[], tsumo: TileInstance | undefined): TileInstance {
  const counts = toCount34(allTiles);
  const bestDiscards = findBestDiscards(counts);

  if (bestDiscards.length > 0) {
    // 上位3候補からランダムに選択（ミスを模倣）
    const topN = Math.min(3, bestDiscards.length);
    const randomIdx = Math.floor(Math.random() * topN);
    const chosenId = bestDiscards[randomIdx].tile;

    // ツモ牌優先
    if (tsumo && tsumo.id === chosenId) return tsumo;
    const found = allTiles.find(t => t.id === chosenId);
    if (found) return found;
  }

  return tsumo ?? allTiles[allTiles.length - 1];
}

/**
 * Normal: 効率重視 + 基本防御（リーチ者に対して現物切り）
 */
function normalChooseDiscard(
  state: GameState,
  playerIndex: number,
  allTiles: TileInstance[],
  tsumo: TileInstance | undefined,
): TileInstance {
  const hasRiichiOpponent = state.players.some((p, i) => i !== playerIndex && p.isRiichi);

  if (hasRiichiOpponent) {
    // 基本防御: 安全牌があればそれを切る
    const safeTile = chooseSafestDiscard(state, playerIndex);
    if (safeTile) return safeTile;
  }

  // 通常の効率打ち
  return baseChooseDiscard(allTiles.filter(t => t !== tsumo), tsumo);
}

/**
 * Hard: 完全効率 + 高度防御 + 点数状況判断
 */
function hardChooseDiscard(
  state: GameState,
  playerIndex: number,
  allTiles: TileInstance[],
  tsumo: TileInstance | undefined,
): TileInstance {
  const player = state.players[playerIndex];
  const handCounts = toCount34(allTiles);
  const hasRiichiOpponent = state.players.some((p, i) => i !== playerIndex && p.isRiichi);

  // 戦略コンテキスト
  const context = analyzeStrategicContext(state, playerIndex);

  // 押し引き判断
  if (hasRiichiOpponent && !shouldPush(context, handCounts, hasRiichiOpponent)) {
    // 守りモード: 安全牌選択
    const defense = analyzeDefense(state, playerIndex);
    if (defense.safeTiles.length > 0) {
      const allowed = defense.safeTiles.filter(
        s => !player.kuikaeDisallowedTiles.includes(s.tile.id)
      );
      if (allowed.length > 0) return allowed[0].tile;
    }
  }

  // 攻めモード: 最適効率
  return baseChooseDiscard(allTiles.filter(t => t !== tsumo), tsumo);
}

// ========== 鳴き判断 ==========

/**
 * 難易度に応じたポン判断
 */
export function aiShouldCallPon(
  state: GameState,
  playerIndex: number,
  option: CallOption,
  closedCounts: TileCount34,
  difficulty: AiDifficulty,
): boolean {
  const baseDecision = baseShouldCallPon(option, closedCounts);

  switch (difficulty) {
    case 'easy': {
      // Easy: より積極的に鳴く（向聴数が改善すれば鳴く）
      const afterCounts = closedCounts.slice();
      for (const tileId of option.tiles) {
        afterCounts[tileId]--;
      }
      const currentShanten = calculateShanten(closedCounts);
      const newShanten = calculateShanten(afterCounts);
      return newShanten < currentShanten;
    }

    case 'normal':
      return baseDecision;

    case 'hard': {
      // Hard: 戦略コンテキスト考慮
      const context = analyzeStrategicContext(state, playerIndex);
      const afterCounts = closedCounts.slice();
      for (const tileId of option.tiles) {
        afterCounts[tileId]--;
      }
      const currentShanten = calculateShanten(closedCounts);
      const newShanten = calculateShanten(afterCounts);
      const improvement = currentShanten - newShanten;
      return strategicCallDecision(context, baseDecision, improvement);
    }
  }
}

/**
 * 難易度に応じたチー判断
 */
export function aiShouldCallChi(
  state: GameState,
  playerIndex: number,
  option: CallOption,
  closedCounts: TileCount34,
  difficulty: AiDifficulty,
): boolean {
  const baseDecision = baseShouldCallChi(option, closedCounts);

  switch (difficulty) {
    case 'easy': {
      // Easy: 向聴数が改善すればチー
      const afterCounts = closedCounts.slice();
      for (const tileId of option.tiles) {
        afterCounts[tileId]--;
      }
      const currentShanten = calculateShanten(closedCounts);
      const newShanten = calculateShanten(afterCounts);
      return newShanten < currentShanten;
    }

    case 'normal':
      return baseDecision;

    case 'hard': {
      const context = analyzeStrategicContext(state, playerIndex);
      const afterCounts = closedCounts.slice();
      for (const tileId of option.tiles) {
        afterCounts[tileId]--;
      }
      const currentShanten = calculateShanten(closedCounts);
      const newShanten = calculateShanten(afterCounts);
      const improvement = currentShanten - newShanten;
      return strategicCallDecision(context, baseDecision, improvement);
    }
  }
}

/**
 * 難易度に応じたリーチ判断
 */
export function aiShouldRiichi(
  state: GameState,
  playerIndex: number,
  closedCounts: TileCount34,
  difficulty: AiDifficulty,
): boolean {
  const baseDecision = baseShouldRiichi(closedCounts);

  switch (difficulty) {
    case 'easy':
      // Easy: 常にリーチ（聴牌なら）
      return calculateShanten(closedCounts) === 0;

    case 'normal':
      return baseDecision;

    case 'hard': {
      // Hard: 戦略コンテキスト考慮
      const context = analyzeStrategicContext(state, playerIndex);
      return strategicRiichiDecision(context, baseDecision);
    }
  }
}

/**
 * 難易度に応じたツモ和了判断
 * (全難易度でtrue — ツモ和了を見送る理由はほぼない)
 */
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function aiShouldTsumoAgari(_difficulty: AiDifficulty): boolean {
  return true;
}

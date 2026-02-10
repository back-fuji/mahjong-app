/**
 * 牌効率計算 (Tile Efficiency Calculator)
 *
 * 手牌の向聴数に基づいて、最適な打牌を計算する。
 * - 受入枚数: 向聴数が下がる有効牌の残り枚数
 * - 最適打牌: 向聴数が最小かつ受入枚数が最大になる打牌
 */

import type { TileCount34, TileId } from '../../core/types/tile.ts';
import { calculateShanten } from '../shanten/shanten.ts';

/** 各牌の最大枚数 (赤ドラ含めて各4枚) */
const MAX_TILE_COUNT = 4;

/**
 * 13枚の手牌に対して、受入牌とその枚数を計算する。
 *
 * 現在の向聴数を計算し、34種の各牌を1枚加えたとき
 * 向聴数が1つ下がるものを有効牌（受入）として列挙する。
 * 各有効牌について、場に見えていない残り枚数を返す。
 *
 * @param counts 13枚の手牌を表すTileCount34
 * @returns 有効牌IDをキー、受入枚数（残り枚数）を値とするMap
 */
export function calculateAcceptance(counts: TileCount34): Map<TileId, number> {
  const currentShanten = calculateShanten(counts);
  const acceptance = new Map<TileId, number>();

  for (let tileId = 0; tileId < 34; tileId++) {
    // 既に4枚使われている牌は引けない
    if (counts[tileId] >= MAX_TILE_COUNT) continue;

    // 牌を1枚加えて向聴数を計算
    counts[tileId]++;
    const newShanten = calculateShanten(counts);
    counts[tileId]--;

    // 向聴数が下がるなら有効牌
    if (newShanten < currentShanten) {
      // 受入枚数 = 4 - 手牌で既に使っている枚数
      const remaining = MAX_TILE_COUNT - counts[tileId];
      acceptance.set(tileId, remaining);
    }
  }

  return acceptance;
}

/**
 * 14枚の手牌（ツモ牌含む）に対して、各打牌候補の評価を計算する。
 *
 * 各牌を1枚切った場合の向聴数と受入枚数を計算し、
 * 向聴数が最小のもののうち受入枚数が多い順にソートして返す。
 *
 * @param counts 14枚の手牌を表すTileCount34
 * @returns 打牌候補の配列（向聴数昇順、同向聴数なら受入枚数降順）
 */
export function findBestDiscards(counts: TileCount34): {
  tile: TileId;
  shanten: number;
  acceptance: number;
}[] {
  const results: { tile: TileId; shanten: number; acceptance: number }[] = [];

  for (let tileId = 0; tileId < 34; tileId++) {
    if (counts[tileId] === 0) continue;

    // この牌を1枚切る
    counts[tileId]--;
    const shanten = calculateShanten(counts);

    // 受入枚数を計算
    const acceptanceMap = calculateAcceptance(counts);
    let totalAcceptance = 0;
    for (const count of acceptanceMap.values()) {
      totalAcceptance += count;
    }

    counts[tileId]++;

    results.push({
      tile: tileId,
      shanten,
      acceptance: totalAcceptance,
    });
  }

  // 向聴数昇順 → 受入枚数降順でソート
  results.sort((a, b) => {
    if (a.shanten !== b.shanten) return a.shanten - b.shanten;
    return b.acceptance - a.acceptance;
  });

  return results;
}

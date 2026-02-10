import type { TileCount34, TileId } from '../types/tile.ts';
import type { MentsuDecomposition } from '../types/hand.ts';
import type { Meld } from '../types/meld.ts';
import { MeldType } from '../types/meld.ts';
import { decompose, isChiitoitsu, isKokushi } from '../hand/hand-utils.ts';
import { isYaochu } from '../tile/tile-utils.ts';

/** 和了形の種類 */
export type AgariType = 'regular' | 'chiitoitsu' | 'kokushi';

/** 和了情報 */
export interface AgariInfo {
  type: AgariType;
  decompositions: MentsuDecomposition[]; // 通常形の場合のみ（複数パターンあり得る）
}

/**
 * 和了判定
 * @param closedCounts 門前手牌の34要素カウント（和了牌含む、14枚 or 副露分引いた枚数）
 * @param melds 副露リスト
 * @returns 和了なら AgariInfo、和了でなければ null
 */
export function checkAgari(closedCounts: TileCount34, melds: Meld[] = []): AgariInfo | null {
  const closedCount = closedCounts.reduce((a, b) => a + b, 0);
  const meldTileCount = melds.reduce((sum, m) => {
    if (m.type === MeldType.AnKan || m.type === MeldType.MinKan || m.type === MeldType.ShouMinKan) return sum + 4;
    return sum + 3;
  }, 0);

  // 総数が14でなければ和了でない
  if (closedCount + meldTileCount !== 14) return null;

  // 副露なしの場合のみ七対子・国士をチェック
  if (melds.length === 0) {
    if (isChiitoitsu(closedCounts)) {
      return { type: 'chiitoitsu', decompositions: [] };
    }
    if (isKokushi(closedCounts)) {
      return { type: 'kokushi', decompositions: [] };
    }
  }

  // 通常形（雀頭+面子4組）
  const neededMentsu = 4 - melds.length;
  const decompositions = decompose(closedCounts);

  // 副露数を考慮してフィルタ
  const valid = decompositions.filter(d => d.mentsu.length === neededMentsu);

  if (valid.length > 0) {
    return { type: 'regular', decompositions: valid };
  }

  return null;
}

/**
 * 待ち牌の計算
 * @param closedCounts 門前手牌（13枚 or 副露分引いた枚数）
 * @param melds 副露リスト
 * @returns 待ち牌のリスト
 */
export function getWaitingTiles(closedCounts: TileCount34, melds: Meld[] = []): TileId[] {
  const waits: TileId[] = [];

  for (let i = 0; i < 34; i++) {
    if (closedCounts[i] >= 4) continue; // 既に4枚使用
    closedCounts[i]++;
    if (checkAgari(closedCounts, melds)) {
      waits.push(i);
    }
    closedCounts[i]--;
  }

  return waits;
}

/**
 * テンパイ判定
 */
export function isTenpai(closedCounts: TileCount34, melds: Meld[] = []): boolean {
  return getWaitingTiles(closedCounts, melds).length > 0;
}

/**
 * 国士無双13面待ちかどうか
 */
export function isKokushi13Men(closedCounts: TileCount34, agariTile: TileId): boolean {
  // 和了牌を除いた状態で13種の么九牌が全て1枚ずつあるか
  const yaochu = [0, 8, 9, 17, 18, 26, 27, 28, 29, 30, 31, 32, 33];
  const tempCounts = [...closedCounts];
  tempCounts[agariTile]--;

  for (const id of yaochu) {
    if (tempCounts[id] < 1) return false;
  }
  return true;
}

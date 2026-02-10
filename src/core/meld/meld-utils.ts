import type { TileId, TileInstance, TileCount34 } from '../types/tile.ts';
import { MeldType, type Meld, type CallOption } from '../types/meld.ts';
import { isNumberTile } from '../tile/tile-utils.ts';

/** チーの可能な組み合わせを列挙 */
export function getChiOptions(handClosed: TileCount34, calledTile: TileId): CallOption[] {
  if (!isNumberTile(calledTile)) return [];

  const options: CallOption[] = [];
  const num = calledTile % 9;
  const suitBase = Math.floor(calledTile / 9) * 9;

  // パターン1: called が左端 (called, +1, +2)
  if (num <= 6) {
    const t1 = suitBase + num + 1;
    const t2 = suitBase + num + 2;
    if (handClosed[t1] > 0 && handClosed[t2] > 0) {
      options.push({ type: MeldType.Chi, tiles: [t1, t2], calledTile });
    }
  }

  // パターン2: called が中央 (-1, called, +1)
  if (num >= 1 && num <= 7) {
    const t1 = suitBase + num - 1;
    const t2 = suitBase + num + 1;
    if (handClosed[t1] > 0 && handClosed[t2] > 0) {
      options.push({ type: MeldType.Chi, tiles: [t1, t2], calledTile });
    }
  }

  // パターン3: called が右端 (-2, -1, called)
  if (num >= 2) {
    const t1 = suitBase + num - 2;
    const t2 = suitBase + num - 1;
    if (handClosed[t1] > 0 && handClosed[t2] > 0) {
      options.push({ type: MeldType.Chi, tiles: [t1, t2], calledTile });
    }
  }

  return options;
}

/** ポンの可能性チェック */
export function getPonOption(handClosed: TileCount34, calledTile: TileId): CallOption | null {
  if (handClosed[calledTile] >= 2) {
    return { type: MeldType.Pon, tiles: [calledTile, calledTile], calledTile };
  }
  return null;
}

/** 大明槓の可能性チェック */
export function getMinKanOption(handClosed: TileCount34, calledTile: TileId): CallOption | null {
  if (handClosed[calledTile] >= 3) {
    return { type: MeldType.MinKan, tiles: [calledTile, calledTile, calledTile], calledTile };
  }
  return null;
}

/** 暗槓できる牌を列挙 */
export function getAnKanTiles(handClosed: TileCount34): TileId[] {
  const result: TileId[] = [];
  for (let i = 0; i < 34; i++) {
    if (handClosed[i] >= 4) result.push(i);
  }
  return result;
}

/** 加槓できる牌を列挙 */
export function getShouMinKanTiles(handClosed: TileCount34, melds: Meld[]): TileId[] {
  const result: TileId[] = [];
  for (const meld of melds) {
    if (meld.type === MeldType.Pon) {
      const tileId = meld.tiles[0].id;
      if (handClosed[tileId] >= 1) {
        result.push(tileId);
      }
    }
  }
  return result;
}

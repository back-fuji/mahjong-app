import type { TileId, TileCount34, TileInstance } from '../types/tile.ts';

export { SuitType, MAN_1, MAN_9, PIN_1, PIN_9, SOU_1, SOU_9, TON, NAN, SHA, PEI, HAKU, HATSU, CHUN, TILE_NAMES, TILE_SHORT } from '../types/tile.ts';

import { SuitType, MAN_1, MAN_9, PIN_1, PIN_9, SOU_1, SOU_9, TON, HAKU, HATSU, CHUN } from '../types/tile.ts';

/** 空の34要素配列を作成 */
export function emptyCount34(): TileCount34 {
  return new Array(34).fill(0);
}

/** TileInstance配列からTileCount34に変換 */
export function toCount34(tiles: TileInstance[]): TileCount34 {
  const counts = emptyCount34();
  for (const t of tiles) counts[t.id]++;
  return counts;
}

/** TileCount34の合計枚数 */
export function countTotal(counts: TileCount34): number {
  let sum = 0;
  for (let i = 0; i < 34; i++) sum += counts[i];
  return sum;
}

/** 牌のスート種類を返す */
export function getSuit(id: TileId): SuitType {
  if (id <= MAN_9) return SuitType.Man;
  if (id <= PIN_9) return SuitType.Pin;
  if (id <= SOU_9) return SuitType.Sou;
  return SuitType.Jihai;
}

/** 数牌かどうか */
export function isNumberTile(id: TileId): boolean {
  return id <= SOU_9;
}

/** 字牌かどうか */
export function isJihai(id: TileId): boolean {
  return id >= TON;
}

/** 么九牌（1,9,字牌）かどうか */
export function isYaochu(id: TileId): boolean {
  if (id >= TON) return true;
  const num = id % 9;
  return num === 0 || num === 8;
}

/** 老頭牌（1,9のみ）かどうか */
export function isRoutouhai(id: TileId): boolean {
  if (id >= TON) return false;
  const num = id % 9;
  return num === 0 || num === 8;
}

/** 三元牌かどうか */
export function isSangen(id: TileId): boolean {
  return id === HAKU || id === HATSU || id === CHUN;
}

/** 風牌かどうか */
export function isKaze(id: TileId): boolean {
  return id >= TON && id <= 30;
}

/** 緑一色の牌かどうか (2s,3s,4s,6s,8s,發) */
export function isGreenTile(id: TileId): boolean {
  return id === 19 || id === 20 || id === 21 || id === 23 || id === 25 || id === HATSU;
}

/** 牌の数値部分 (0-8) */
export function tileNumber(id: TileId): number {
  return id % 9;
}

/** スートの開始インデックス */
export function suitStart(suit: SuitType): number {
  return suit * 9;
}

/** ドラ表示牌からドラ牌を計算 */
export function indicatorToDora(indicatorId: TileId): TileId {
  if (indicatorId >= TON && indicatorId <= 30) {
    // 風牌: 東→南→西→北→東
    return TON + ((indicatorId - TON + 1) % 4);
  }
  if (indicatorId >= HAKU) {
    // 三元牌: 白→發→中→白
    return HAKU + ((indicatorId - HAKU + 1) % 3);
  }
  // 数牌: 1→2→...→9→1
  const suit = Math.floor(indicatorId / 9);
  const num = indicatorId % 9;
  return suit * 9 + ((num + 1) % 9);
}

/** ドラの数をカウント */
export function countDora(hand: TileCount34, indicators: TileInstance[]): number {
  let count = 0;
  for (const indicator of indicators) {
    const doraId = indicatorToDora(indicator.id);
    count += hand[doraId];
  }
  return count;
}

/** 赤ドラの数をカウント */
export function countRedDora(tiles: TileInstance[]): number {
  return tiles.filter(t => t.isRed).length;
}

/** 么九牌13種のリスト */
export const YAOCHU_TILES: readonly TileId[] = [
  0, 8, 9, 17, 18, 26, 27, 28, 29, 30, 31, 32, 33,
];

/** 牌IDをソートキーとしてTileInstanceをソート */
export function sortTiles(tiles: TileInstance[]): TileInstance[] {
  return [...tiles].sort((a, b) => a.id - b.id || (a.isRed ? -1 : 0) - (b.isRed ? -1 : 0));
}

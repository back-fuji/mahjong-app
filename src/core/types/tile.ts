/**
 * 牌の型定義
 * 34種類の牌を0-33のインデックスで表現
 * 萬子: 0-8 (1m-9m)
 * 筒子: 9-17 (1p-9p)
 * 索子: 18-26 (1s-9s)
 * 字牌: 27-33 (東南西北白發中)
 */

/** 牌ID (0-33) */
export type TileId = number;

/** 34要素の牌カウント配列 */
export type TileCount34 = number[];

/** 牌の種類 */
export const SuitType = {
  Man: 0,
  Pin: 1,
  Sou: 2,
  Jihai: 3,
} as const;
export type SuitType = (typeof SuitType)[keyof typeof SuitType];

/** 牌インスタンス（山の中の具体的な1枚） */
export interface TileInstance {
  id: TileId;       // 0-33
  index: number;    // 山の中でのユニークインデックス (0-135)
  isRed: boolean;   // 赤ドラかどうか
}

/** 萬子の定数 */
export const MAN_1 = 0;
export const MAN_9 = 8;

/** 筒子の定数 */
export const PIN_1 = 9;
export const PIN_9 = 17;

/** 索子の定数 */
export const SOU_1 = 18;
export const SOU_9 = 26;

/** 字牌の定数 */
export const TON = 27;   // 東
export const NAN = 28;   // 南
export const SHA = 29;   // 西
export const PEI = 30;   // 北
export const HAKU = 31;  // 白
export const HATSU = 32; // 發
export const CHUN = 33;  // 中

/** 牌の日本語名 */
export const TILE_NAMES: readonly string[] = [
  '一萬','二萬','三萬','四萬','五萬','六萬','七萬','八萬','九萬',
  '一筒','二筒','三筒','四筒','五筒','六筒','七筒','八筒','九筒',
  '一索','二索','三索','四索','五索','六索','七索','八索','九索',
  '東','南','西','北','白','發','中',
];

/** 牌の短縮表記 */
export const TILE_SHORT: readonly string[] = [
  '1m','2m','3m','4m','5m','6m','7m','8m','9m',
  '1p','2p','3p','4p','5p','6p','7p','8p','9p',
  '1s','2s','3s','4s','5s','6s','7s','8s','9s',
  '東','南','西','北','白','發','中',
];

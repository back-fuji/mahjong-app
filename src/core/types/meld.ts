import type { TileId, TileInstance } from './tile.ts';

/** 副露の種類 */
export const MeldType = {
  Chi: 'chi',
  Pon: 'pon',
  MinKan: 'minkan',
  AnKan: 'ankan',
  ShouMinKan: 'shouminkan',
} as const;
export type MeldType = (typeof MeldType)[keyof typeof MeldType];

/** 副露（鳴き/槓） */
export interface Meld {
  type: MeldType;
  tiles: TileInstance[];
  calledTile?: TileInstance;
  fromPlayer?: number;
}

/** 鳴きが可能かチェックするための情報 */
export interface CallOption {
  type: typeof MeldType.Chi | typeof MeldType.Pon | typeof MeldType.MinKan | 'ron';
  tiles: TileId[];
  calledTile: TileId;
}

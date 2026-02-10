import type { Hand } from './hand.ts';
import type { TileInstance } from './tile.ts';

/** 風 */
export type Wind = 0 | 1 | 2 | 3; // 東=0, 南=1, 西=2, 北=3

export const WIND_NAMES = ['東', '南', '西', '北'] as const;

/** プレイヤー */
export interface Player {
  id: string;
  name: string;
  score: number;          // 持ち点
  hand: Hand;             // 手牌
  discards: TileInstance[]; // 捨て牌
  isRiichi: boolean;      // リーチ宣言済み
  isDoubleRiichi: boolean; // ダブリー
  isIppatsu: boolean;     // 一発有効
  riichiTurn: number;     // リーチした巡目 (-1なら未リーチ)
  isMenzen: boolean;      // 門前かどうか
  seatWind: Wind;         // 自風
  isHuman: boolean;       // 人間 or CPU
  connected: boolean;     // オンライン時の接続状態
}

/** プレイヤーの初期化 */
export function createPlayer(id: string, name: string, seatWind: Wind, isHuman: boolean): Player {
  return {
    id,
    name,
    score: 25000,
    hand: { closed: [], melds: [], tsumo: undefined },
    discards: [],
    isRiichi: false,
    isDoubleRiichi: false,
    isIppatsu: false,
    riichiTurn: -1,
    isMenzen: true,
    seatWind,
    isHuman,
    connected: true,
  };
}

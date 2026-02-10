import type { TileCount34, TileId, TileInstance } from './tile.ts';
import type { Meld } from './meld.ts';

/** プレイヤーの手牌 */
export interface Hand {
  closed: TileInstance[];  // 門前手牌（ソート済み）
  melds: Meld[];           // 副露
  tsumo?: TileInstance;    // ツモった牌（まだ手牌に入れていない）
}

/** 面子分解の1パターン */
export interface MentsuDecomposition {
  jantai: TileId;           // 雀頭の牌ID
  mentsu: MentsuGroup[];    // 面子のリスト (4組)
}

/** 1つの面子 */
export interface MentsuGroup {
  type: 'shuntsu' | 'koutsu'; // 順子 or 刻子
  tiles: TileId[];             // 構成牌ID
}

/** 手牌のカウント表現 */
export interface HandCounts {
  closed: TileCount34;        // 門前手牌のカウント
  total: TileCount34;         // 全牌（副露含む）のカウント
  meldsCount: number;         // 副露数
}

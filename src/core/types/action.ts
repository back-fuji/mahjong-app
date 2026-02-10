import type { TileId, TileInstance } from './tile.ts';
import type { MeldType } from './meld.ts';

/** プレイヤーのアクション */
export type GameAction =
  | { type: 'tsumo' }
  | { type: 'discard'; tile: TileInstance }
  | { type: 'chi'; tiles: TileId[]; calledTile: TileId; discardAfter: TileInstance }
  | { type: 'pon'; calledTile: TileId; discardAfter: TileInstance }
  | { type: 'minkan'; calledTile: TileId }
  | { type: 'ankan'; tile: TileId }
  | { type: 'shouminkan'; tile: TileId }
  | { type: 'riichi'; tile: TileInstance }
  | { type: 'tsumo_agari' }
  | { type: 'ron'; targetPlayer: number }
  | { type: 'skip_call' }
  | { type: 'kyuushu_kyuhai' }  // 九種九牌
  ;

/** アクション結果 */
export interface ActionResult {
  success: boolean;
  error?: string;
}

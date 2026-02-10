/**
 * CPU プレイヤーの基本戦略 (AI Strategy)
 *
 * 牌効率に基づいた打牌選択、鳴き判断、リーチ判断を行う。
 * シンプルな効率重視の戦略で、守備的な判断は最小限。
 */

import type { TileInstance, TileCount34, TileId } from '../../core/types/index.ts';
import type { CallOption } from '../../core/types/index.ts';
import { calculateShanten } from '../shanten/shanten.ts';
import { findBestDiscards, calculateAcceptance } from '../efficiency/efficiency.ts';

/**
 * TileInstance配列からTileCount34に変換するヘルパー。
 *
 * @param tiles TileInstance配列
 * @returns 34要素の牌カウント配列
 */
function toCount34(tiles: TileInstance[]): TileCount34 {
  const counts: TileCount34 = new Array(34).fill(0);
  for (const t of tiles) {
    counts[t.id]++;
  }
  return counts;
}

/**
 * 最適な打牌を選択する。
 *
 * 門前手牌とツモ牌から14枚のTileCount34を構成し、
 * findBestDiscardsで最も効率の良い打牌を決定する。
 * 返すのはTileInstanceなので、実際の手牌から対応する牌を探して返す。
 *
 * @param closedTiles 門前手牌のTileInstance配列（13枚）
 * @param tsumo ツモった牌（undefinedの場合は手牌から最善を選ぶ）
 * @returns 打牌するTileInstance
 */
export function chooseDiscard(
  closedTiles: TileInstance[],
  tsumo: TileInstance | undefined,
): TileInstance {
  // 全ての牌を合わせて14枚にする
  const allTiles = tsumo ? [...closedTiles, tsumo] : [...closedTiles];
  const counts = toCount34(allTiles);

  // 最適な打牌候補を計算
  const bestDiscards = findBestDiscards(counts);

  if (bestDiscards.length > 0) {
    const bestTileId = bestDiscards[0].tile;

    // ツモ牌が最適打牌ならツモ切り
    if (tsumo && tsumo.id === bestTileId) {
      return tsumo;
    }

    // 手牌から対応するTileInstanceを探す
    const found = allTiles.find(t => t.id === bestTileId);
    if (found) return found;
  }

  // フォールバック: ツモ牌があればツモ切り、なければ最後の牌を切る
  return tsumo ?? allTiles[allTiles.length - 1];
}

/**
 * チーすべきかどうかを判断する。
 *
 * 基本方針: 門前を維持するため、チーは基本的にしない。
 * 例外として、チーすることで聴牌になる場合のみチーする。
 *
 * @param option チーのオプション（使用する牌と鳴く牌）
 * @param closedCounts 現在の門前手牌のカウント
 * @returns チーするかどうか
 */
export function shouldCallChi(option: CallOption, closedCounts: TileCount34): boolean {
  const currentShanten = calculateShanten(closedCounts);

  // 既に聴牌ならチーしない（リーチの方が良い）
  if (currentShanten <= 0) return false;

  // チー後の手牌を構成
  const afterCounts = closedCounts.slice();

  // 手牌からチーに使う牌を除去
  for (const tileId of option.tiles) {
    afterCounts[tileId]--;
  }
  // 鳴いた牌も手牌にある場合は除去（チーの場合は鳴く牌は他家の捨て牌）
  // option.tiles は手牌から出す2枚、option.calledTile は他家の牌

  // チー後は面子1つ分（3枚）が副露に移る
  // 残りの手牌でshanten計算（副露分は面子として数えるので、
  // 残り手牌の面子必要数が1つ減る）
  // 簡易計算: 残りの手牌で向聴数を計算
  const newShanten = calculateShanten(afterCounts);

  // チーすることで聴牌になる場合のみ許可
  return newShanten <= 0 && currentShanten > 0;
}

/**
 * ポンすべきかどうかを判断する。
 *
 * チーより積極的に行う。向聴数が2以上改善する場合、
 * または聴牌/一向聴になる場合にポンする。
 *
 * @param option ポンのオプション
 * @param closedCounts 現在の門前手牌のカウント
 * @returns ポンするかどうか
 */
export function shouldCallPon(option: CallOption, closedCounts: TileCount34): boolean {
  const currentShanten = calculateShanten(closedCounts);

  // 既に聴牌ならポンしない
  if (currentShanten <= 0) return false;

  // ポン後の手牌を構成
  const afterCounts = closedCounts.slice();

  // 手牌からポンに使う牌を除去（2枚）
  for (const tileId of option.tiles) {
    afterCounts[tileId]--;
  }

  const newShanten = calculateShanten(afterCounts);

  // 向聴数が改善し、かつ一向聴以下になる場合にポン
  if (newShanten < currentShanten && newShanten <= 1) {
    return true;
  }

  // 向聴数が2以上改善する場合もポン
  if (currentShanten - newShanten >= 2) {
    return true;
  }

  return false;
}

/**
 * リーチすべきかどうかを判断する。
 *
 * 聴牌していれば基本的にリーチする。
 * ただし、待ちが極端に狭い場合（受入1枚以下）は見送る。
 *
 * @param closedCounts 現在の門前手牌のカウント（13枚）
 * @returns リーチするかどうか
 */
export function shouldRiichi(closedCounts: TileCount34): boolean {
  const shanten = calculateShanten(closedCounts);

  // 聴牌でなければリーチできない
  if (shanten !== 0) return false;

  // 受入枚数を計算
  const acceptance = calculateAcceptance(closedCounts);

  // 待ちの合計枚数
  let totalAcceptance = 0;
  for (const count of acceptance.values()) {
    totalAcceptance += count;
  }

  // 待ちが2枚以上あればリーチ
  // （1枚以下の場合はダマテンで待ち変更の機会を残す）
  return totalAcceptance >= 2;
}

/**
 * ツモ和了すべきかどうかを判断する。
 *
 * 常に和了する。ツモ和了を見送る理由は基本的にない。
 *
 * @returns 常にtrue
 */
export function shouldTsumoAgari(): boolean {
  return true;
}

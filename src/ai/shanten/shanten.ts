/**
 * 向聴数計算 (Shanten Calculator)
 *
 * 向聴数 = あと何枚有効牌を引けば聴牌/和了できるかを示す指標
 * -1: 和了 (complete hand)
 *  0: 聴牌 (tenpai, one tile away)
 *  1: 一向聴 (iishanten, two tiles away)
 *  ...
 *  8: 最大 (最悪ケース)
 *
 * 3つの和了形に対して計算し、最小値を返す:
 * - 通常形 (4面子1雀頭)
 * - 七対子 (7つの対子)
 * - 国士無双 (13種の么九牌)
 */

import type { TileCount34 } from '../../core/types/tile.ts';

/** 么九牌のインデックス (13種) */
const YAOCHU_INDICES: readonly number[] = [0, 8, 9, 17, 18, 26, 27, 28, 29, 30, 31, 32, 33];

// --- 通常形向聴数の計算 ---

/**
 * 通常形の向聴数計算における最良結果を保持する変数。
 * 再帰探索中に更新され、枝刈りにも使用される。
 */
let bestRegularShanten: number;

/**
 * 通常形（4面子1雀頭）の向聴数を計算する。
 *
 * 全34種の牌それぞれを雀頭候補として抜き出した後、
 * 残りの牌で面子・ターツを左から再帰的に探索する。
 * 雀頭なしのパターンも探索する。
 */
function calculateRegularShanten(counts: TileCount34): number {
  bestRegularShanten = 8;
  const work = counts.slice();

  // 雀頭なしで探索
  scanAllSuits(work, 0, 0, false);

  // 各牌を雀頭として抜いて探索
  for (let i = 0; i < 34; i++) {
    if (work[i] >= 2) {
      work[i] -= 2;
      scanAllSuits(work, 0, 0, true);
      work[i] += 2;
    }
  }

  return bestRegularShanten;
}

/**
 * 各スートの面子・ターツを探索する。
 * 萬子(0-8)、筒子(9-17)、索子(18-26)、字牌(27-33)の順に処理する。
 *
 * @param counts 牌カウント配列（破壊的変更・復元あり）
 * @param mentsu 現在までの面子数
 * @param partial 現在までのターツ/対子数
 * @param hasJantai 雀頭を既に抜いたか
 */
function scanAllSuits(
  counts: number[],
  mentsu: number,
  partial: number,
  hasJantai: boolean,
): void {
  // 萬子
  scanSuitNumbers(counts, 0, mentsu, partial, hasJantai, (m, p) => {
    // 筒子
    scanSuitNumbers(counts, 9, m, p, hasJantai, (m2, p2) => {
      // 索子
      scanSuitNumbers(counts, 18, m2, p2, hasJantai, (m3, p3) => {
        // 字牌
        scanHonorTiles(counts, m3, p3, hasJantai);
      });
    });
  });
}

/**
 * 数牌1スート分の面子・ターツを左端から再帰探索する。
 *
 * 牌を左から順にスキャンし、各位置で以下を試行する:
 * - 刻子 (同一牌3枚)
 * - 順子 (連続3枚)
 * - 対子 (同一牌2枚, ターツとして)
 * - 両面/辺張 (隣接2枚)
 * - 嵌張 (1つ飛ばし2枚)
 *
 * @param counts 牌カウント配列
 * @param baseIdx スートの開始インデックス (0, 9, 18)
 * @param mentsu 面子数
 * @param partial ターツ数
 * @param hasJantai 雀頭有無
 * @param callback 探索完了後に面子数・ターツ数を渡すコールバック
 */
function scanSuitNumbers(
  counts: number[],
  baseIdx: number,
  mentsu: number,
  partial: number,
  hasJantai: boolean,
  callback: (mentsu: number, partial: number) => void,
): void {
  // スート内で最初の非ゼロ位置を探す
  let i = baseIdx;
  const endIdx = baseIdx + 9;
  while (i < endIdx && counts[i] === 0) {
    i++;
  }

  // このスートに牌がない場合、そのまま次へ
  if (i >= endIdx) {
    callback(mentsu, partial);
    return;
  }

  const posInSuit = i - baseIdx;

  // 枝刈り: 現時点の向聴数が既知の最良値以下になり得ない場合は打ち切り
  // 最良ケース: 残り全て面子になる場合
  // ただし正確な枝刈りは難しいので、面子が4に達していたら探索終了
  if (mentsu >= 4) {
    callback(mentsu, partial);
    return;
  }

  // 刻子
  if (counts[i] >= 3) {
    counts[i] -= 3;
    scanSuitNumbers(counts, baseIdx, mentsu + 1, partial, hasJantai, callback);
    counts[i] += 3;
  }

  // 順子 (i, i+1, i+2)
  if (posInSuit <= 6 && counts[i + 1] >= 1 && counts[i + 2] >= 1) {
    counts[i]--;
    counts[i + 1]--;
    counts[i + 2]--;
    scanSuitNumbers(counts, baseIdx, mentsu + 1, partial, hasJantai, callback);
    counts[i]++;
    counts[i + 1]++;
    counts[i + 2]++;
  }

  // ターツ探索 (面子+ターツが4未満の場合のみ)
  if (mentsu + partial < 4) {
    // 対子
    if (counts[i] >= 2) {
      counts[i] -= 2;
      scanSuitNumbers(counts, baseIdx, mentsu, partial + 1, hasJantai, callback);
      counts[i] += 2;
    }

    // 隣接ターツ (i, i+1)
    if (posInSuit <= 7 && counts[i + 1] >= 1) {
      counts[i]--;
      counts[i + 1]--;
      scanSuitNumbers(counts, baseIdx, mentsu, partial + 1, hasJantai, callback);
      counts[i]++;
      counts[i + 1]++;
    }

    // 嵌張ターツ (i, i+2)
    if (posInSuit <= 6 && counts[i + 2] >= 1) {
      counts[i]--;
      counts[i + 2]--;
      scanSuitNumbers(counts, baseIdx, mentsu, partial + 1, hasJantai, callback);
      counts[i]++;
      counts[i + 2]++;
    }
  }

  // この位置の牌を一切使わずにスキップ
  // 1枚の牌は面子にもターツにも使わず、孤立牌として放置する
  const save = counts[i];
  counts[i] = 0;
  scanSuitNumbers(counts, baseIdx, mentsu, partial, hasJantai, callback);
  counts[i] = save;
}

/**
 * 字牌の面子・ターツを探索する。
 * 字牌は順子を作れないので、刻子と対子のみ。
 *
 * @param counts 牌カウント配列
 * @param mentsu 面子数
 * @param partial ターツ数
 * @param hasJantai 雀頭有無
 */
function scanHonorTiles(
  counts: number[],
  mentsu: number,
  partial: number,
  hasJantai: boolean,
): void {
  let m = mentsu;
  let p = partial;

  for (let i = 27; i < 34; i++) {
    if (counts[i] >= 3) {
      m++;
    } else if (counts[i] === 2 && m + p < 4) {
      p++;
    }
  }

  // 向聴数を計算して更新
  const effectivePartial = Math.min(p, 4 - m);
  const shanten = (hasJantai ? 7 : 8) - 2 * m - effectivePartial;
  if (shanten < bestRegularShanten) {
    bestRegularShanten = shanten;
  }
}

// --- 七対子向聴数 ---

/**
 * 七対子の向聴数を計算する。
 *
 * 7つの対子を作る形。
 * shanten = 6 - (対子の数)
 *
 * ただし牌の種類が7未満の場合は不足分を加算する。
 * 同一牌3枚以上は対子1つとしてのみカウント。
 */
function calculateChiitoitsuShanten(counts: TileCount34): number {
  let pairs = 0;
  let kinds = 0;

  for (let i = 0; i < 34; i++) {
    if (counts[i] >= 1) kinds++;
    if (counts[i] >= 2) pairs++;
  }

  // 7種類必要だが足りない場合、不足分を加算
  const shortage = Math.max(0, 7 - kinds);
  return 6 - pairs + shortage;
}

// --- 国士無双向聴数 ---

/**
 * 国士無双の向聴数を計算する。
 *
 * 13種の么九牌を各1枚ずつ + うち1種を2枚（雀頭）。
 * shanten = 13 - (持っている么九牌の種類数) - (么九牌で対子があれば1)
 */
function calculateKokushiShanten(counts: TileCount34): number {
  let kinds = 0;
  let hasPair = false;

  for (const idx of YAOCHU_INDICES) {
    if (counts[idx] >= 1) {
      kinds++;
      if (counts[idx] >= 2) hasPair = true;
    }
  }

  return 13 - kinds - (hasPair ? 1 : 0);
}

// --- 公開API ---

/**
 * 向聴数を計算する（3形態の最小値を返す）。
 *
 * @param counts 34要素の牌カウント配列（通常13枚の門前手牌）
 * @returns 向聴数 (-1 = 和了, 0 = 聴牌, 1 = 一向聴, ...)
 */
export function calculateShanten(counts: TileCount34): number {
  const result = calculateShantenWithType(counts);
  return result.min;
}

/**
 * 各和了形ごとの向聴数と、その最小値を返す。
 *
 * @param counts 34要素の牌カウント配列（通常13枚の門前手牌）
 * @returns regular: 通常形, chiitoitsu: 七対子, kokushi: 国士無双, min: 最小値
 */
export function calculateShantenWithType(counts: TileCount34): {
  regular: number;
  chiitoitsu: number;
  kokushi: number;
  min: number;
} {
  const regular = calculateRegularShanten(counts);
  const chiitoitsu = calculateChiitoitsuShanten(counts);
  const kokushi = calculateKokushiShanten(counts);
  const min = Math.min(regular, chiitoitsu, kokushi);

  return { regular, chiitoitsu, kokushi, min };
}

/**
 * 危険牌判定モジュール
 *
 * 他家の捨て牌・リーチ宣言を分析し、各牌の危険度スコアを算出する。
 * スジ(筋)、カベ(壁)、現物(他家の捨て牌)判定を行う。
 */

import type { TileId, TileCount34 } from '../../core/types/tile.ts';
import type { Player } from '../../core/types/player.ts';

/** 危険度スコア (0=安全, 100=最も危険) */
export interface DangerScore {
  tileId: TileId;
  score: number;
  reason: string;
}

/**
 * 指定プレイヤーにとっての各牌の危険度を算出する。
 *
 * @param hand 自分の手牌カウント
 * @param opponents 対戦相手のプレイヤー情報
 * @param myIndex 自分のプレイヤーインデックス
 * @param visibleCounts 場に見えている牌のカウント（捨て牌+副露+ドラ表示）
 * @returns 各牌の危険度スコア配列
 */
export function calculateDangerScores(
  hand: TileCount34,
  opponents: Player[],
  myIndex: number,
  visibleCounts: TileCount34,
): DangerScore[] {
  const scores: DangerScore[] = [];

  // リーチしている相手を探す
  const riichiPlayers = opponents.filter((p, i) => p.isRiichi && i !== myIndex);
  const hasRiichiOpponent = riichiPlayers.length > 0;

  for (let tileId = 0; tileId < 34; tileId++) {
    if (hand[tileId] === 0) continue;

    let dangerScore = 50; // ベーススコア
    let reason = '';

    // 1. 現物チェック（最も安全）
    if (isGenbutsu(tileId, opponents, myIndex)) {
      dangerScore = 0;
      reason = '現物';
      scores.push({ tileId, score: dangerScore, reason });
      continue;
    }

    // 2. スジ牌チェック
    if (hasRiichiOpponent && isSuji(tileId, opponents, myIndex)) {
      dangerScore = Math.min(dangerScore, 20);
      reason = 'スジ';
    }

    // 3. カベ(壁)チェック
    const kabeLevel = getKabeLevel(tileId, visibleCounts);
    if (kabeLevel >= 4) {
      dangerScore = Math.min(dangerScore, 5);
      reason = '完全壁';
    } else if (kabeLevel >= 3) {
      dangerScore = Math.min(dangerScore, 15);
      reason = reason || '壁';
    }

    // 4. ワンチャンス判定
    if (isOneChance(tileId, visibleCounts)) {
      dangerScore = Math.min(dangerScore, 25);
      reason = reason || 'ワンチャンス';
    }

    // 5. 字牌の安全度
    if (tileId >= 27) {
      const visible = visibleCounts[tileId];
      if (visible >= 3) {
        dangerScore = Math.min(dangerScore, 5);
        reason = '字牌(3枚見え)';
      } else if (visible >= 2) {
        dangerScore = Math.min(dangerScore, 30);
        reason = reason || '字牌(2枚見え)';
      } else if (visible === 0 && hasRiichiOpponent) {
        // 生牌の字牌はリーチ相手に危険
        dangerScore = Math.max(dangerScore, 70);
        reason = '生牌字牌';
      }
    }

    // 6. リーチ者がいる場合、無スジ数牌の危険度を上げる
    if (hasRiichiOpponent && tileId < 27 && dangerScore >= 40) {
      const number = (tileId % 9) + 1;
      if (number >= 3 && number <= 7) {
        // 中張牌はより危険
        dangerScore = Math.max(dangerScore, 70);
        reason = reason || '無スジ中張牌';
      } else {
        dangerScore = Math.max(dangerScore, 55);
        reason = reason || '無スジ端寄り';
      }
    }

    scores.push({ tileId, score: dangerScore, reason: reason || '不明' });
  }

  return scores;
}

/**
 * 現物判定: 指定牌が相手(リーチ者)の捨て牌にあるか
 */
export function isGenbutsu(tileId: TileId, opponents: Player[], myIndex: number): boolean {
  for (let i = 0; i < opponents.length; i++) {
    if (i === myIndex) continue;
    const opp = opponents[i];
    if (!opp.isRiichi) continue;
    // リーチ者の捨て牌にある牌は現物
    if (opp.discards.some(d => d.id === tileId)) {
      return true;
    }
  }
  return false;
}

/**
 * スジ(筋)判定: リーチ者の捨て牌に対するスジ牌かどうか
 *
 * 例: 4萬が捨てられている → 1萬, 7萬はスジ
 *     5萬が捨てられている → 2萬, 8萬はスジ
 */
export function isSuji(tileId: TileId, opponents: Player[], myIndex: number): boolean {
  if (tileId >= 27) return false; // 字牌にスジなし

  const suit = Math.floor(tileId / 9);
  const number = (tileId % 9) + 1; // 1-9

  for (let i = 0; i < opponents.length; i++) {
    if (i === myIndex) continue;
    const opp = opponents[i];
    if (!opp.isRiichi) continue;

    const discardIds = new Set(opp.discards.map(d => d.id));

    // スジ関係を確認
    // 1-4-7, 2-5-8, 3-6-9 のスジ
    if (number === 1 && discardIds.has(suit * 9 + 3)) return true; // 1 のスジは 4
    if (number === 2 && discardIds.has(suit * 9 + 4)) return true; // 2 のスジは 5
    if (number === 3 && discardIds.has(suit * 9 + 5)) return true; // 3 のスジは 6
    if (number === 4 && (discardIds.has(suit * 9 + 0) || discardIds.has(suit * 9 + 6))) return true; // 4 のスジは 1, 7
    if (number === 5 && (discardIds.has(suit * 9 + 1) || discardIds.has(suit * 9 + 7))) return true; // 5 のスジは 2, 8
    if (number === 6 && (discardIds.has(suit * 9 + 2) || discardIds.has(suit * 9 + 8))) return true; // 6 のスジは 3, 9
    if (number === 7 && discardIds.has(suit * 9 + 3)) return true; // 7 のスジは 4
    if (number === 8 && discardIds.has(suit * 9 + 4)) return true; // 8 のスジは 5
    if (number === 9 && discardIds.has(suit * 9 + 5)) return true; // 9 のスジは 6
  }
  return false;
}

/**
 * カベ(壁)レベル: 牌の周辺で見えている枚数
 * 高いほど安全
 */
export function getKabeLevel(tileId: TileId, visibleCounts: TileCount34): number {
  if (tileId >= 27) return visibleCounts[tileId]; // 字牌は見えている枚数そのまま

  const suit = Math.floor(tileId / 9);
  const number = (tileId % 9) + 1;
  let kabeLevel = 0;

  // 隣接牌が4枚見えていると壁になる
  if (number > 1) {
    const leftId = suit * 9 + (number - 2);
    if (visibleCounts[leftId] >= 4) kabeLevel += 4;
    else kabeLevel += visibleCounts[leftId];
  }
  if (number < 9) {
    const rightId = suit * 9 + number;
    if (visibleCounts[rightId] >= 4) kabeLevel += 4;
    else kabeLevel += visibleCounts[rightId];
  }

  return kabeLevel;
}

/**
 * ワンチャンス判定: 待ちが1通りしかない牌
 * 隣接する牌が3枚以上見えている場合
 */
export function isOneChance(tileId: TileId, visibleCounts: TileCount34): boolean {
  if (tileId >= 27) return false;

  const suit = Math.floor(tileId / 9);
  const number = (tileId % 9) + 1;

  // 1,2の場合: 3が3枚見えなら安全寄り
  if (number <= 2) {
    const threeId = suit * 9 + 2;
    if (visibleCounts[threeId] >= 3) return true;
  }
  // 8,9の場合: 7が3枚見えなら安全寄り
  if (number >= 8) {
    const sevenId = suit * 9 + 6;
    if (visibleCounts[sevenId] >= 3) return true;
  }
  // 中張牌: 両隣いずれかが3枚見え
  if (number >= 3 && number <= 7) {
    if (number > 1) {
      const leftId = suit * 9 + (number - 2);
      if (visibleCounts[leftId] >= 3) return true;
    }
    if (number < 9) {
      const rightId = suit * 9 + number;
      if (visibleCounts[rightId] >= 3) return true;
    }
  }

  return false;
}

/**
 * 場に見えている牌のカウントを算出
 * (全プレイヤーの捨て牌 + 副露 + ドラ表示牌)
 */
export function calculateVisibleCounts(
  players: Player[],
  doraIndicators: { id: TileId }[],
): TileCount34 {
  const counts: TileCount34 = new Array(34).fill(0);

  for (const player of players) {
    // 捨て牌
    for (const tile of player.discards) {
      counts[tile.id]++;
    }
    // 副露
    for (const meld of player.hand.melds) {
      for (const tile of meld.tiles) {
        counts[tile.id]++;
      }
    }
  }

  // ドラ表示牌
  for (const tile of doraIndicators) {
    counts[tile.id]++;
  }

  return counts;
}

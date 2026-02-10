import type { TileId, TileCount34 } from '../types/tile.ts';
import type { MentsuDecomposition, MentsuGroup } from '../types/hand.ts';
import type { Meld } from '../types/meld.ts';
import { MeldType } from '../types/meld.ts';
import type { YakuResult } from '../types/yaku.ts';
import type { ScoreResult, FuDetail, PaymentInfo, ScoreLevel } from '../types/score.ts';
import { SCORE_LEVEL_NAMES } from '../types/score.ts';
import type { Wind } from '../types/player.ts';
import type { AgariInfo } from '../agari/agari.ts';
import type { YakuContext } from '../yaku/yaku-checker.ts';
import { checkYakuRegular, checkYakuChiitoitsu, checkYakuKokushi } from '../yaku/yaku-checker.ts';
import { isYaochu, isJihai, isSangen, tileNumber, TON, countDora, countRedDora } from '../tile/tile-utils.ts';
import type { TileInstance } from '../types/tile.ts';

/**
 * 符計算
 */
export function calculateFu(
  decomp: MentsuDecomposition,
  melds: Meld[],
  agariTile: TileId,
  isTsumo: boolean,
  isMenzen: boolean,
  seatWind: Wind,
  roundWind: Wind,
): { fu: number; details: FuDetail[] } {
  const details: FuDetail[] = [];

  // 副底 (基本符)
  let baseFu = 20;
  // 門前ロン: 30符
  if (isMenzen && !isTsumo) {
    baseFu = 30;
  }
  details.push({ reason: '副底', fu: baseFu });

  // ツモ符
  if (isTsumo) {
    details.push({ reason: 'ツモ', fu: 2 });
  }

  // 雀頭
  const jantai = decomp.jantai;
  if (isSangen(jantai)) {
    details.push({ reason: '雀頭(三元牌)', fu: 2 });
  }
  if (jantai === TON + seatWind) {
    details.push({ reason: '雀頭(自風)', fu: 2 });
  }
  if (jantai === TON + roundWind) {
    details.push({ reason: '雀頭(場風)', fu: 2 });
  }

  // 面子の符
  for (const m of decomp.mentsu) {
    if (m.type === 'koutsu') {
      let fu = 4;
      if (isYaochu(m.tiles[0])) fu = 8;
      // 門前の刻子は暗刻扱い（ロンで完成した場合を除く）
      details.push({ reason: `暗刻(${m.tiles[0]})`, fu });
    }
    // 順子は0符
  }

  // 副露面子の符
  for (const meld of melds) {
    if (meld.type === MeldType.Pon) {
      let fu = isYaochu(meld.tiles[0].id) ? 4 : 2;
      details.push({ reason: `明刻`, fu });
    } else if (meld.type === MeldType.MinKan || meld.type === MeldType.ShouMinKan) {
      let fu = isYaochu(meld.tiles[0].id) ? 32 : 16;
      details.push({ reason: `明槓`, fu });
    } else if (meld.type === MeldType.AnKan) {
      let fu = isYaochu(meld.tiles[0].id) ? 64 : 32;
      details.push({ reason: `暗槓`, fu });
    }
  }

  // 待ちの形
  const waitFu = getWaitFu(decomp, agariTile);
  if (waitFu > 0) {
    details.push({ reason: '待ち', fu: waitFu });
  }

  let totalFu = details.reduce((sum, d) => sum + d.fu, 0);

  // 切り上げ (10の倍数)
  totalFu = Math.ceil(totalFu / 10) * 10;

  // 最低30符 (食い平和形は20符のまま)
  if (!isMenzen && totalFu < 30) {
    // 食い平和形は30符にする
    if (totalFu === 20) {
      totalFu = 30;
    }
  }

  return { fu: totalFu, details };
}

/** 待ちの符 */
function getWaitFu(decomp: MentsuDecomposition, agariTile: TileId): number {
  // 単騎待ち (雀頭待ち)
  if (decomp.jantai === agariTile) return 2;

  for (const m of decomp.mentsu) {
    if (!m.tiles.includes(agariTile)) continue;
    if (m.type === 'shuntsu') {
      const idx = m.tiles.indexOf(agariTile);
      // カンチャン (真ん中待ち)
      if (idx === 1) return 2;
      // ペンチャン (端待ち): 12の3待ち or 89の7待ち
      if (idx === 2 && tileNumber(m.tiles[0]) === 0) return 2;
      if (idx === 0 && tileNumber(m.tiles[2]) === 8) return 2;
    }
    // 刻子のシャンポン待ちは0符
  }

  return 0;
}

/**
 * 点数計算のメインエントリーポイント
 */
export function calculateScore(
  agariInfo: AgariInfo,
  ctx: YakuContext,
  isOya: boolean,
  doraIndicators: TileInstance[],
  uraDoraIndicators: TileInstance[],
  allTiles: TileInstance[], // 赤ドラカウント用の全牌
  honba: number,
): ScoreResult {
  const candidates: ScoreResult[] = [];

  if (agariInfo.type === 'chiitoitsu') {
    const yaku = checkYakuChiitoitsu(ctx);
    const fuResult = { fu: 25, details: [{ reason: '七対子', fu: 25 }] };
    candidates.push(buildScoreResult(yaku, fuResult.fu, fuResult.details, ctx, isOya, doraIndicators, uraDoraIndicators, allTiles, honba));
  } else if (agariInfo.type === 'kokushi') {
    const yaku = checkYakuKokushi(ctx);
    candidates.push(buildScoreResult(yaku, 0, [], ctx, isOya, doraIndicators, uraDoraIndicators, allTiles, honba));
  } else {
    for (const decomp of agariInfo.decompositions) {
      const yaku = checkYakuRegular(ctx, decomp);
      if (yaku.length === 0) continue;

      const yakumanYaku = yaku.filter(y => y.isYakuman);
      let fuResult: { fu: number; details: FuDetail[] };

      if (yakumanYaku.length > 0) {
        fuResult = { fu: 0, details: [] };
      } else {
        fuResult = calculateFu(decomp, ctx.melds, ctx.agariTile, ctx.isTsumo, ctx.isMenzen, ctx.seatWind, ctx.roundWind);
      }

      candidates.push(buildScoreResult(yaku, fuResult.fu, fuResult.details, ctx, isOya, doraIndicators, uraDoraIndicators, allTiles, honba));
    }
  }

  candidates.sort((a, b) => b.payment.total - a.payment.total);
  return candidates[0];
}

function buildScoreResult(
  yaku: YakuResult[],
  fu: number,
  fuDetails: FuDetail[],
  ctx: YakuContext,
  isOya: boolean,
  doraIndicators: TileInstance[],
  uraDoraIndicators: TileInstance[],
  allTiles: TileInstance[],
  honba: number,
): ScoreResult {
  // 役満チェック
  const yakumanYaku = yaku.filter(y => y.isYakuman);
  const isYakuman = yakumanYaku.length > 0;

  let han = 0;
  let yakumanCount = 0;

  if (isYakuman) {
    // 役満は翻数を合算してダブル役満等を判定
    yakumanCount = yakumanYaku.reduce((sum, y) => sum + Math.floor(y.han / 13), 0);
    han = yakumanCount * 13;
  } else {
    han = yaku.reduce((sum, y) => sum + y.han, 0);

    // ドラ
    const doraCnt = countDora(ctx.closedCounts, doraIndicators);
    if (doraCnt > 0) {
      yaku.push({ id: 'tanyao', name: `ドラ ${doraCnt}`, han: doraCnt, hanOpen: doraCnt, isYakuman: false });
      han += doraCnt;
    }

    // 裏ドラ（リーチ時のみ）
    if (ctx.isRiichi || ctx.isDoubleRiichi) {
      const uraDoraCnt = countDora(ctx.closedCounts, uraDoraIndicators);
      if (uraDoraCnt > 0) {
        yaku.push({ id: 'tanyao', name: `裏ドラ ${uraDoraCnt}`, han: uraDoraCnt, hanOpen: -1, isYakuman: false });
        han += uraDoraCnt;
      }
    }

    // 赤ドラ
    const redDoraCnt = countRedDora(allTiles);
    if (redDoraCnt > 0) {
      yaku.push({ id: 'tanyao', name: `赤ドラ ${redDoraCnt}`, han: redDoraCnt, hanOpen: redDoraCnt, isYakuman: false });
      han += redDoraCnt;
    }
  }

  const basePoints = calculateBasePoints(han, fu, isYakuman, yakumanCount);
  const payment = calculatePayment(basePoints, isOya, ctx.isTsumo, honba);

  let label = '';
  const level = getScoreLevel(han, fu, isYakuman);
  label = SCORE_LEVEL_NAMES[level];
  if (level === 'normal') {
    label = `${han}翻${fu}符`;
  }

  return {
    yaku,
    han,
    fu,
    fuDetails,
    basePoints,
    payment,
    isYakuman,
    yakumanCount,
    label,
  };
}

/** 基本点計算 */
function calculateBasePoints(han: number, fu: number, isYakuman: boolean, yakumanCount: number): number {
  if (isYakuman) {
    return 8000 * yakumanCount;
  }

  // 満貫以上
  if (han >= 13) return 8000;  // 数え役満
  if (han >= 11) return 6000;  // 三倍満
  if (han >= 8) return 4000;   // 倍満
  if (han >= 6) return 3000;   // 跳満
  if (han >= 5) return 2000;   // 満貫

  // 基本点 = 符 × 2^(翻+2)
  const base = fu * Math.pow(2, han + 2);

  // 満貫切り上げ
  if (base >= 2000) return 2000;

  return base;
}

/** 支払い計算 */
function calculatePayment(basePoints: number, isOya: boolean, isTsumo: boolean, honba: number): PaymentInfo {
  const honbaBonus = honba * 300;

  if (isTsumo) {
    if (isOya) {
      // 親ツモ: 子全員が基本点×2を支払い
      const each = roundUp100(basePoints * 2) + (honba * 100);
      return { tsumoKo: each, total: each * 3 };
    } else {
      // 子ツモ: 親は基本点×2、子は基本点×1
      const oya = roundUp100(basePoints * 2) + (honba * 100);
      const ko = roundUp100(basePoints) + (honba * 100);
      return { tsumoOya: oya, tsumoKo: ko, total: oya + ko * 2 };
    }
  } else {
    // ロン
    if (isOya) {
      const total = roundUp100(basePoints * 6) + honbaBonus;
      return { ron: total, total };
    } else {
      const total = roundUp100(basePoints * 4) + honbaBonus;
      return { ron: total, total };
    }
  }
}

/** 100点単位に切り上げ */
function roundUp100(n: number): number {
  return Math.ceil(n / 100) * 100;
}

/** 点数レベル判定 */
function getScoreLevel(han: number, fu: number, isYakuman: boolean): ScoreLevel {
  if (isYakuman) return 'yakuman';
  if (han >= 13) return 'yakuman';
  if (han >= 11) return 'sanbaiman';
  if (han >= 8) return 'baiman';
  if (han >= 6) return 'haneman';
  if (han >= 5) return 'mangan';
  if (han >= 4 && fu >= 30) return 'mangan';
  if (han >= 3 && fu >= 60) return 'mangan';
  return 'normal';
}

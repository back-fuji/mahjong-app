import type { TileCount34, TileId } from '../types/tile.ts';
import type { MentsuDecomposition, MentsuGroup } from '../types/hand.ts';
import type { Meld } from '../types/meld.ts';
import { MeldType } from '../types/meld.ts';
import type { YakuResult, YakuId } from '../types/yaku.ts';
import { YAKU_DEFINITIONS } from '../types/yaku.ts';
import type { Wind } from '../types/player.ts';
import {
  isYaochu, isJihai, isNumberTile, isSangen, isKaze, isRoutouhai,
  isGreenTile, getSuit, tileNumber, SuitType,
  HAKU, HATSU, CHUN, TON,
} from '../tile/tile-utils.ts';

/** 役判定のコンテキスト */
export interface YakuContext {
  /** 門前手牌のカウント（和了牌含む） */
  closedCounts: TileCount34;
  /** 副露 */
  melds: Meld[];
  /** 和了牌 */
  agariTile: TileId;
  /** ツモ和了か */
  isTsumo: boolean;
  /** 門前か */
  isMenzen: boolean;
  /** 自風 */
  seatWind: Wind;
  /** 場風 */
  roundWind: Wind;
  /** リーチ */
  isRiichi: boolean;
  /** ダブルリーチ */
  isDoubleRiichi: boolean;
  /** 一発 */
  isIppatsu: boolean;
  /** 海底 */
  isHaitei: boolean;
  /** 河底 */
  isHoutei: boolean;
  /** 嶺上 */
  isRinshan: boolean;
  /** 槍槓 */
  isChankan: boolean;
  /** 天和 */
  isTenhou: boolean;
  /** 地和 */
  isChiihou: boolean;
  /** 喰いタンあり */
  kuitan: boolean;
}

function makeYaku(id: YakuId, isMenzen: boolean): YakuResult | null {
  const def = YAKU_DEFINITIONS[id];
  if (!isMenzen && def.hanOpen === -1) return null;
  const han = isMenzen ? def.han : def.hanOpen;
  return { id, name: def.name, han, hanOpen: def.hanOpen, isYakuman: def.isYakuman };
}

/**
 * 通常形の役判定（1つの面子分解に対して）
 */
export function checkYakuRegular(
  ctx: YakuContext,
  decomp: MentsuDecomposition,
): YakuResult[] {
  const results: YakuResult[] = [];
  const { closedCounts, melds, agariTile, isTsumo, isMenzen } = ctx;

  // 全面子を統合（副露含む）
  const allMentsu: MentsuGroup[] = [...decomp.mentsu];
  for (const meld of melds) {
    if (meld.type === MeldType.AnKan || meld.type === MeldType.MinKan || meld.type === MeldType.ShouMinKan) {
      allMentsu.push({ type: 'koutsu', tiles: [meld.tiles[0].id, meld.tiles[0].id, meld.tiles[0].id] });
    } else if (meld.type === MeldType.Pon) {
      allMentsu.push({ type: 'koutsu', tiles: [meld.tiles[0].id, meld.tiles[0].id, meld.tiles[0].id] });
    } else if (meld.type === MeldType.Chi) {
      const sorted = meld.tiles.map(t => t.id).sort((a, b) => a - b);
      allMentsu.push({ type: 'shuntsu', tiles: sorted });
    }
  }

  const jantai = decomp.jantai;
  const shuntsuList = allMentsu.filter(m => m.type === 'shuntsu');
  const koutsuList = allMentsu.filter(m => m.type === 'koutsu');

  // --- 特殊役 ---
  checkSpecialYaku(ctx, results);

  // --- 1翻役 ---

  // タンヤオ
  if (ctx.kuitan || isMenzen) {
    const allTiles = getAllTileIds(jantai, allMentsu);
    if (allTiles.every(t => !isYaochu(t))) {
      const y = makeYaku('tanyao', isMenzen);
      if (y) results.push(y);
    }
  }

  // ピンフ（門前限定）
  if (isMenzen) {
    const isPinfu = checkPinfu(decomp, agariTile, ctx.seatWind, ctx.roundWind);
    if (isPinfu) results.push(makeYaku('pinfu', true)!);
  }

  // 一盃口（門前限定）
  if (isMenzen) {
    const iipeikoCount = countSameShuntsu(decomp.mentsu);
    if (iipeikoCount === 1) results.push(makeYaku('iipeiko', true)!);
    if (iipeikoCount === 2) results.push(makeYaku('ryanpeiko', true)!);
  }

  // 役牌
  checkYakuhai(jantai, koutsuList, ctx, results);

  // --- 2翻役 ---

  // 三色同順
  if (checkSanshokuDoujun(shuntsuList)) {
    const y = makeYaku('sanshoku_doujun', isMenzen);
    if (y) results.push(y);
  }

  // 一気通貫
  if (checkIttsu(shuntsuList)) {
    const y = makeYaku('ittsu', isMenzen);
    if (y) results.push(y);
  }

  // チャンタ
  if (checkChanta(jantai, allMentsu)) {
    const y = makeYaku('chanta', isMenzen);
    if (y) results.push(y);
  }

  // 純チャンタ
  if (checkJunchan(jantai, allMentsu)) {
    const y = makeYaku('junchan', isMenzen);
    if (y) results.push(y);
  }

  // 三色同刻
  if (checkSanshokuDoukou(koutsuList)) {
    const y = makeYaku('sanshoku_doukou', isMenzen);
    if (y) results.push(y);
  }

  // 対々和
  if (koutsuList.length === 4) {
    const y = makeYaku('toitoi', isMenzen);
    if (y) results.push(y);
  }

  // 三暗刻
  if (checkSanankou(decomp.mentsu, melds, isTsumo, agariTile)) {
    const y = makeYaku('sanankou', isMenzen);
    if (y) results.push(y);
  }

  // 混老頭
  if (checkHonroutou(jantai, allMentsu)) {
    const y = makeYaku('honroutou', isMenzen);
    if (y) results.push(y);
  }

  // 小三元
  if (checkShousangen(jantai, koutsuList)) {
    const y = makeYaku('shousangen', isMenzen);
    if (y) results.push(y);
  }

  // 三槓子
  const kanCount = melds.filter(m =>
    m.type === MeldType.AnKan || m.type === MeldType.MinKan || m.type === MeldType.ShouMinKan
  ).length;
  if (kanCount === 3) {
    const y = makeYaku('sankantsu', isMenzen);
    if (y) results.push(y);
  }

  // --- 3翻役 ---

  // 混一色
  if (checkHonitsu(jantai, allMentsu)) {
    const y = makeYaku('honitsu', isMenzen);
    if (y) results.push(y);
  }

  // --- 6翻役 ---

  // 清一色
  if (checkChinitsu(jantai, allMentsu)) {
    const y = makeYaku('chinitsu', isMenzen);
    if (y) results.push(y);
  }

  // --- 役満 ---
  checkYakumanRegular(ctx, decomp, allMentsu, jantai, koutsuList, kanCount, results);

  return results;
}

/**
 * 七対子の役判定
 */
export function checkYakuChiitoitsu(ctx: YakuContext): YakuResult[] {
  const results: YakuResult[] = [];
  results.push(makeYaku('chiitoitsu', true)!);

  checkSpecialYaku(ctx, results);

  // タンヤオ
  let allTanyao = true;
  for (let i = 0; i < 34; i++) {
    if (ctx.closedCounts[i] > 0 && isYaochu(i)) { allTanyao = false; break; }
  }
  if (allTanyao) results.push(makeYaku('tanyao', true)!);

  // 混一色
  if (checkHonitsuCounts(ctx.closedCounts)) {
    results.push(makeYaku('honitsu', true)!);
  }

  // 清一色
  if (checkChinitsuCounts(ctx.closedCounts)) {
    results.push(makeYaku('chinitsu', true)!);
  }

  // 混老頭
  let allYaochu = true;
  for (let i = 0; i < 34; i++) {
    if (ctx.closedCounts[i] > 0 && !isYaochu(i)) { allYaochu = false; break; }
  }
  if (allYaochu) results.push(makeYaku('honroutou', true)!);

  // 字一色（役満）
  let allJihai = true;
  for (let i = 0; i < 27; i++) {
    if (ctx.closedCounts[i] > 0) { allJihai = false; break; }
  }
  if (allJihai) results.push(makeYaku('tsuuiisou', true)!);

  return results;
}

/**
 * 国士無双の役判定
 */
export function checkYakuKokushi(ctx: YakuContext): YakuResult[] {
  const results: YakuResult[] = [];

  checkSpecialYaku(ctx, results);

  // 13面待ちかどうか
  const tempCounts = [...ctx.closedCounts];
  tempCounts[ctx.agariTile]--;
  const yaochu = [0, 8, 9, 17, 18, 26, 27, 28, 29, 30, 31, 32, 33];
  const is13men = yaochu.every(id => tempCounts[id] >= 1);

  if (is13men) {
    results.push(makeYaku('kokushi_13men', true)!);
  } else {
    results.push(makeYaku('kokushi', true)!);
  }

  return results;
}

// --- ヘルパー ---

function checkSpecialYaku(ctx: YakuContext, results: YakuResult[]): void {
  if (ctx.isTenhou) results.push(makeYaku('tenhou', true)!);
  if (ctx.isChiihou) results.push(makeYaku('chiihou', true)!);
  if (ctx.isDoubleRiichi) {
    results.push(makeYaku('double_riichi', true)!);
  } else if (ctx.isRiichi) {
    results.push(makeYaku('riichi', true)!);
  }
  if (ctx.isIppatsu) results.push(makeYaku('ippatsu', true)!);
  if (ctx.isTsumo && ctx.isMenzen) results.push(makeYaku('tsumo', true)!);
  if (ctx.isHaitei) {
    const y = makeYaku('haitei', ctx.isMenzen);
    if (y) results.push(y);
  }
  if (ctx.isHoutei) {
    const y = makeYaku('houtei', ctx.isMenzen);
    if (y) results.push(y);
  }
  if (ctx.isRinshan) {
    const y = makeYaku('rinshan', ctx.isMenzen);
    if (y) results.push(y);
  }
  if (ctx.isChankan) {
    const y = makeYaku('chankan', ctx.isMenzen);
    if (y) results.push(y);
  }
}

function checkPinfu(decomp: MentsuDecomposition, agariTile: TileId, seatWind: Wind, roundWind: Wind): boolean {
  // 全て順子
  if (decomp.mentsu.some(m => m.type !== 'shuntsu')) return false;
  // 雀頭が役牌でない
  const j = decomp.jantai;
  if (isSangen(j)) return false;
  if (j === TON + seatWind) return false;
  if (j === TON + roundWind) return false;
  // 両面待ち
  for (const m of decomp.mentsu) {
    if (m.tiles.includes(agariTile)) {
      const pos = m.tiles.indexOf(agariTile);
      // 両面: 和了牌が端にある (左端 or 右端) かつ端牌でない
      if (pos === 0 && tileNumber(agariTile) !== 6) return true;
      if (pos === 2 && tileNumber(agariTile) !== 2) return true;
    }
  }
  return false;
}

function countSameShuntsu(mentsu: MentsuGroup[]): number {
  const shuntsu = mentsu.filter(m => m.type === 'shuntsu');
  let count = 0;
  const used = new Array(shuntsu.length).fill(false);
  for (let i = 0; i < shuntsu.length; i++) {
    if (used[i]) continue;
    for (let j = i + 1; j < shuntsu.length; j++) {
      if (used[j]) continue;
      if (shuntsu[i].tiles[0] === shuntsu[j].tiles[0]) {
        used[i] = true;
        used[j] = true;
        count++;
        break;
      }
    }
  }
  return count;
}

function checkYakuhai(jantai: TileId, koutsuList: MentsuGroup[], ctx: YakuContext, results: YakuResult[]): void {
  for (const k of koutsuList) {
    const t = k.tiles[0];
    if (t === HAKU) results.push(makeYaku('yakuhai_haku', ctx.isMenzen)!);
    if (t === HATSU) results.push(makeYaku('yakuhai_hatsu', ctx.isMenzen)!);
    if (t === CHUN) results.push(makeYaku('yakuhai_chun', ctx.isMenzen)!);
    // 自風
    if (t === TON + ctx.seatWind) {
      const windIds: YakuId[] = ['yakuhai_ton', 'yakuhai_nan', 'yakuhai_sha', 'yakuhai_pei'];
      results.push(makeYaku(windIds[ctx.seatWind], ctx.isMenzen)!);
    }
    // 場風
    if (t === TON + ctx.roundWind) {
      const windIds: YakuId[] = ['bakaze_ton', 'bakaze_nan', 'bakaze_sha', 'bakaze_pei'];
      results.push(makeYaku(windIds[ctx.roundWind], ctx.isMenzen)!);
    }
  }
}

function checkSanshokuDoujun(shuntsu: MentsuGroup[]): boolean {
  for (const s of shuntsu) {
    const num = s.tiles[0] % 9;
    const suit = getSuit(s.tiles[0]);
    const suits = [false, false, false];
    suits[suit] = true;
    for (const s2 of shuntsu) {
      if (s2 === s) continue;
      if (s2.tiles[0] % 9 === num) {
        const suit2 = getSuit(s2.tiles[0]);
        if (suit2 !== SuitType.Jihai) suits[suit2] = true;
      }
    }
    if (suits[0] && suits[1] && suits[2]) return true;
  }
  return false;
}

function checkIttsu(shuntsu: MentsuGroup[]): boolean {
  for (let suit = 0; suit < 3; suit++) {
    const base = suit * 9;
    const has123 = shuntsu.some(s => s.tiles[0] === base);
    const has456 = shuntsu.some(s => s.tiles[0] === base + 3);
    const has789 = shuntsu.some(s => s.tiles[0] === base + 6);
    if (has123 && has456 && has789) return true;
  }
  return false;
}

function checkChanta(jantai: TileId, allMentsu: MentsuGroup[]): boolean {
  if (!isYaochu(jantai)) return false;
  let hasJihai = isJihai(jantai);
  for (const m of allMentsu) {
    if (m.type === 'koutsu') {
      if (!isYaochu(m.tiles[0])) return false;
      if (isJihai(m.tiles[0])) hasJihai = true;
    } else {
      // 順子: 1XX or XX9
      const num0 = tileNumber(m.tiles[0]);
      if (num0 !== 0 && num0 !== 6) return false;
    }
  }
  return hasJihai; // 字牌が含まれなければ純チャンタ
}

function checkJunchan(jantai: TileId, allMentsu: MentsuGroup[]): boolean {
  if (!isRoutouhai(jantai)) return false;
  for (const m of allMentsu) {
    if (m.type === 'koutsu') {
      if (!isRoutouhai(m.tiles[0])) return false;
    } else {
      const num0 = tileNumber(m.tiles[0]);
      if (num0 !== 0 && num0 !== 6) return false;
    }
  }
  return true;
}

function checkSanshokuDoukou(koutsu: MentsuGroup[]): boolean {
  for (const k of koutsu) {
    if (!isNumberTile(k.tiles[0])) continue;
    const num = k.tiles[0] % 9;
    const suits = new Set([getSuit(k.tiles[0])]);
    for (const k2 of koutsu) {
      if (k2 === k) continue;
      if (isNumberTile(k2.tiles[0]) && k2.tiles[0] % 9 === num) {
        suits.add(getSuit(k2.tiles[0]));
      }
    }
    if (suits.size >= 3) return true;
  }
  return false;
}

function checkSanankou(closedMentsu: MentsuGroup[], melds: Meld[], isTsumo: boolean, agariTile: TileId): boolean {
  let ankou = closedMentsu.filter(m => m.type === 'koutsu').length;
  // 暗槓も暗刻としてカウント
  ankou += melds.filter(m => m.type === MeldType.AnKan).length;

  // ロンの場合、和了牌で完成した刻子は明刻扱い
  if (!isTsumo) {
    for (const m of closedMentsu) {
      if (m.type === 'koutsu' && m.tiles[0] === agariTile) {
        ankou--;
        break;
      }
    }
  }

  return ankou >= 3;
}

function checkHonroutou(jantai: TileId, allMentsu: MentsuGroup[]): boolean {
  if (!isYaochu(jantai)) return false;
  for (const m of allMentsu) {
    if (m.type === 'shuntsu') return false;
    if (!isYaochu(m.tiles[0])) return false;
  }
  return true;
}

function checkShousangen(jantai: TileId, koutsu: MentsuGroup[]): boolean {
  if (!isSangen(jantai)) return false;
  let sangenKoutsu = 0;
  for (const k of koutsu) {
    if (isSangen(k.tiles[0])) sangenKoutsu++;
  }
  return sangenKoutsu === 2;
}

function checkHonitsu(jantai: TileId, allMentsu: MentsuGroup[]): boolean {
  let suit: SuitType | null = null;
  let hasJihai = false;

  const allTileIds = getAllTileIds(jantai, allMentsu);
  for (const t of allTileIds) {
    if (isJihai(t)) { hasJihai = true; continue; }
    const s = getSuit(t);
    if (suit === null) suit = s;
    else if (suit !== s) return false;
  }
  return hasJihai && suit !== null;
}

function checkChinitsu(jantai: TileId, allMentsu: MentsuGroup[]): boolean {
  let suit: SuitType | null = null;
  const allTileIds = getAllTileIds(jantai, allMentsu);
  for (const t of allTileIds) {
    if (isJihai(t)) return false;
    const s = getSuit(t);
    if (suit === null) suit = s;
    else if (suit !== s) return false;
  }
  return suit !== null;
}

function checkHonitsuCounts(counts: TileCount34): boolean {
  let suit: SuitType | null = null;
  let hasJihai = false;
  for (let i = 0; i < 34; i++) {
    if (counts[i] === 0) continue;
    if (isJihai(i)) { hasJihai = true; continue; }
    const s = getSuit(i);
    if (suit === null) suit = s;
    else if (suit !== s) return false;
  }
  return hasJihai && suit !== null;
}

function checkChinitsuCounts(counts: TileCount34): boolean {
  let suit: SuitType | null = null;
  for (let i = 0; i < 34; i++) {
    if (counts[i] === 0) continue;
    if (isJihai(i)) return false;
    const s = getSuit(i);
    if (suit === null) suit = s;
    else if (suit !== s) return false;
  }
  return suit !== null;
}

function checkYakumanRegular(
  ctx: YakuContext,
  decomp: MentsuDecomposition,
  allMentsu: MentsuGroup[],
  jantai: TileId,
  koutsuList: MentsuGroup[],
  kanCount: number,
  results: YakuResult[],
): void {
  const { melds, isTsumo, isMenzen, agariTile } = ctx;

  // 四暗刻
  if (isMenzen) {
    let ankou = decomp.mentsu.filter(m => m.type === 'koutsu').length;
    ankou += melds.filter(m => m.type === MeldType.AnKan).length;
    if (!isTsumo) {
      for (const m of decomp.mentsu) {
        if (m.type === 'koutsu' && m.tiles[0] === agariTile) { ankou--; break; }
      }
    }
    if (ankou === 4) {
      // 単騎待ちならダブル役満
      if (jantai === agariTile) {
        results.push(makeYaku('suuankou_tanki', true)!);
      } else {
        results.push(makeYaku('suuankou', true)!);
      }
    }
  }

  // 大三元
  const sangenKoutsu = koutsuList.filter(k => isSangen(k.tiles[0])).length;
  if (sangenKoutsu === 3) {
    const y = makeYaku('daisangen', isMenzen);
    if (y) results.push(y);
  }

  // 小四喜・大四喜
  const kazeKoutsu = koutsuList.filter(k => isKaze(k.tiles[0])).length;
  if (kazeKoutsu === 4) {
    const y = makeYaku('daisuushii', isMenzen);
    if (y) results.push(y);
  } else if (kazeKoutsu === 3 && isKaze(jantai)) {
    const y = makeYaku('shousuushii', isMenzen);
    if (y) results.push(y);
  }

  // 字一色
  const allTiles = getAllTileIds(jantai, allMentsu);
  if (allTiles.every(t => isJihai(t))) {
    const y = makeYaku('tsuuiisou', isMenzen);
    if (y) results.push(y);
  }

  // 清老頭
  if (allTiles.every(t => isRoutouhai(t))) {
    const y = makeYaku('chinroutou', isMenzen);
    if (y) results.push(y);
  }

  // 緑一色
  if (allTiles.every(t => isGreenTile(t))) {
    const y = makeYaku('ryuuiisou', isMenzen);
    if (y) results.push(y);
  }

  // 九蓮宝燈
  if (isMenzen && checkChuuren(ctx.closedCounts, agariTile)) {
    // 純正九蓮宝燈: 9面待ち
    if (checkChuurenPure(ctx.closedCounts, agariTile)) {
      results.push(makeYaku('chuuren_9men', true)!);
    } else {
      results.push(makeYaku('chuuren', true)!);
    }
  }

  // 四槓子
  const totalKan = melds.filter(m =>
    m.type === MeldType.AnKan || m.type === MeldType.MinKan || m.type === MeldType.ShouMinKan
  ).length;
  if (totalKan === 4) {
    const y = makeYaku('suukantsu', isMenzen);
    if (y) results.push(y);
  }
}

function checkChuuren(counts: TileCount34, agariTile: TileId): boolean {
  // 全て同じスートの数牌であること
  let suit: number | null = null;
  for (let i = 0; i < 34; i++) {
    if (counts[i] === 0) continue;
    if (i >= 27) return false;
    const s = Math.floor(i / 9);
    if (suit === null) suit = s;
    else if (s !== suit) return false;
  }
  if (suit === null) return false;

  const base = suit * 9;
  // 1112345678999 + 任意の1枚
  const required = [3, 1, 1, 1, 1, 1, 1, 1, 3]; // 基本形
  for (let i = 0; i < 9; i++) {
    if (counts[base + i] < required[i]) return false;
  }
  return true;
}

function checkChuurenPure(counts: TileCount34, agariTile: TileId): boolean {
  // 和了牌を除いた形が 1112345678999 であること
  let suit: number | null = null;
  for (let i = 0; i < 34; i++) {
    if (counts[i] > 0 && i < 27) {
      suit = Math.floor(i / 9);
      break;
    }
  }
  if (suit === null) return false;
  const base = suit * 9;
  const required = [3, 1, 1, 1, 1, 1, 1, 1, 3];
  const temp = [...counts];
  temp[agariTile]--;
  for (let i = 0; i < 9; i++) {
    if (temp[base + i] !== required[i]) return false;
  }
  return true;
}

function getAllTileIds(jantai: TileId, mentsu: MentsuGroup[]): TileId[] {
  const tiles: TileId[] = [jantai, jantai];
  for (const m of mentsu) {
    tiles.push(...m.tiles);
  }
  return tiles;
}

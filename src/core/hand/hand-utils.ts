import type { TileInstance, TileCount34, TileId } from '../types/tile.ts';
import type { Hand, HandCounts, MentsuDecomposition, MentsuGroup } from '../types/hand.ts';
import type { Meld } from '../types/meld.ts';
import { emptyCount34, toCount34, sortTiles } from '../tile/tile-utils.ts';

/** Hand から HandCounts を計算 */
export function getHandCounts(hand: Hand): HandCounts {
  const allClosed = hand.tsumo ? [...hand.closed, hand.tsumo] : hand.closed;
  const closed = toCount34(allClosed);
  const total = emptyCount34();

  // 門前手牌をコピー
  for (let i = 0; i < 34; i++) total[i] = closed[i];

  // 副露の牌を追加
  for (const meld of hand.melds) {
    for (const t of meld.tiles) {
      total[t.id]++;
    }
  }

  return { closed, total, meldsCount: hand.melds.length };
}

/** 手牌に牌を追加 */
export function addTileToHand(hand: Hand, tile: TileInstance): Hand {
  const closed = sortTiles([...hand.closed, ...(hand.tsumo ? [hand.tsumo] : []), tile]);
  return { ...hand, closed, tsumo: undefined };
}

/** 手牌から牌を除去 */
export function removeTileFromHand(hand: Hand, tile: TileInstance): Hand {
  const allTiles = hand.tsumo ? [...hand.closed, hand.tsumo] : [...hand.closed];
  const idx = allTiles.findIndex(t => t.index === tile.index);
  if (idx === -1) return hand;
  allTiles.splice(idx, 1);
  return { ...hand, closed: sortTiles(allTiles), tsumo: undefined };
}

/**
 * 面子分解（全パターン列挙）
 * 14枚（or 副露込みで合計14枚）の手牌を雀頭+面子4組に分解
 */
export function decompose(counts: TileCount34): MentsuDecomposition[] {
  const results: MentsuDecomposition[] = [];
  const c = [...counts];

  // 雀頭を選ぶ
  for (let j = 0; j < 34; j++) {
    if (c[j] < 2) continue;
    c[j] -= 2;
    const mentsuList: MentsuGroup[] = [];
    if (extractMentsu(c, 0, mentsuList)) {
      results.push({ jantai: j, mentsu: [...mentsuList] });
    }
    // 他のパターンも探索
    findAllDecompositions(c, 0, mentsuList, j, results);
    c[j] += 2;
  }

  return deduplicateDecompositions(results);
}

function findAllDecompositions(
  counts: number[],
  startIdx: number,
  current: MentsuGroup[],
  jantai: TileId,
  results: MentsuDecomposition[],
): void {
  if (current.length === 4) {
    results.push({ jantai, mentsu: [...current] });
    return;
  }

  for (let i = startIdx; i < 34; i++) {
    if (counts[i] === 0) continue;

    // 刻子
    if (counts[i] >= 3) {
      counts[i] -= 3;
      current.push({ type: 'koutsu', tiles: [i, i, i] });
      findAllDecompositions(counts, i, current, jantai, results);
      current.pop();
      counts[i] += 3;
    }

    // 順子 (数牌のみ、7以下)
    if (i < 27 && i % 9 <= 6 && counts[i] >= 1 && counts[i + 1] >= 1 && counts[i + 2] >= 1) {
      counts[i]--;
      counts[i + 1]--;
      counts[i + 2]--;
      current.push({ type: 'shuntsu', tiles: [i, i + 1, i + 2] });
      findAllDecompositions(counts, i, current, jantai, results);
      current.pop();
      counts[i]++;
      counts[i + 1]++;
      counts[i + 2]++;
    }
  }
}

/** 面子を抽出できるか（簡易チェック） */
function extractMentsu(counts: number[], idx: number, mentsu: MentsuGroup[]): boolean {
  // 最初の非ゼロを見つける
  while (idx < 34 && counts[idx] === 0) idx++;
  if (idx >= 34) return mentsu.length === 4;
  if (mentsu.length >= 4) return false;

  // 刻子
  if (counts[idx] >= 3) {
    counts[idx] -= 3;
    mentsu.push({ type: 'koutsu', tiles: [idx, idx, idx] });
    if (extractMentsu(counts, idx, mentsu)) {
      counts[idx] += 3;
      return true;
    }
    mentsu.pop();
    counts[idx] += 3;
  }

  // 順子
  if (idx < 27 && idx % 9 <= 6 && counts[idx + 1] >= 1 && counts[idx + 2] >= 1) {
    counts[idx]--;
    counts[idx + 1]--;
    counts[idx + 2]--;
    mentsu.push({ type: 'shuntsu', tiles: [idx, idx + 1, idx + 2] });
    if (extractMentsu(counts, idx, mentsu)) {
      counts[idx]++;
      counts[idx + 1]++;
      counts[idx + 2]++;
      return true;
    }
    mentsu.pop();
    counts[idx]++;
    counts[idx + 1]++;
    counts[idx + 2]++;
  }

  return false;
}

/** 重複する分解パターンを除去 */
function deduplicateDecompositions(results: MentsuDecomposition[]): MentsuDecomposition[] {
  const seen = new Set<string>();
  return results.filter(d => {
    const sorted = d.mentsu
      .map(m => `${m.type}:${m.tiles.join(',')}`)
      .sort()
      .join('|');
    const key = `${d.jantai}|${sorted}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

/** 七対子の判定 */
export function isChiitoitsu(counts: TileCount34): boolean {
  let pairs = 0;
  for (let i = 0; i < 34; i++) {
    if (counts[i] === 2) pairs++;
    else if (counts[i] !== 0) return false;
  }
  return pairs === 7;
}

/** 国士無双の判定 */
export function isKokushi(counts: TileCount34): boolean {
  const yaochu = [0, 8, 9, 17, 18, 26, 27, 28, 29, 30, 31, 32, 33];
  let pairFound = false;

  for (const id of yaochu) {
    if (counts[id] === 0) return false;
    if (counts[id] === 2) {
      if (pairFound) return false;
      pairFound = true;
    }
  }

  // 么九牌以外がないこと
  for (let i = 0; i < 34; i++) {
    if (!yaochu.includes(i) && counts[i] > 0) return false;
  }

  return pairFound;
}

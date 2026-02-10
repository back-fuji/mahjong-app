import type { TileInstance } from '../types/tile.ts';
import type { GameRules } from '../types/game-state.ts';

/** Fisher-Yatesシャッフル */
function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/** 136枚の牌を生成 */
export function createAllTiles(rules: GameRules): TileInstance[] {
  const tiles: TileInstance[] = [];
  let index = 0;

  for (let id = 0; id < 34; id++) {
    for (let copy = 0; copy < 4; copy++) {
      let isRed = false;
      // 赤ドラ: 5m(id=4), 5p(id=13), 5s(id=22) の各1枚目
      if (rules.hasRedDora && copy === 0 && (id === 4 || id === 13 || id === 22)) {
        isRed = true;
      }
      tiles.push({ id, index, isRed });
      index++;
    }
  }

  return tiles;
}

/** 山を構築（シャッフル済み） */
export function buildWall(rules: GameRules): TileInstance[] {
  return shuffle(createAllTiles(rules));
}

/**
 * 配牌
 * wall[0..13] = 王牌(ドラ表示牌・嶺上牌)
 * wall[14..] = ツモ山
 * 返り値: { wall, hands: [hand0, hand1, hand2, hand3], doraIndicators, uraDoraIndicators, wallIndex, rinshanIndex }
 */
export function dealTiles(wall: TileInstance[]) {
  // 王牌: 最後の14枚 (wall[122..135])
  // ドラ表示牌: wall[130], wall[128], wall[126], wall[124], wall[122] (上段)
  // 裏ドラ: wall[131], wall[129], wall[127], wall[125], wall[123]
  // 嶺上牌: wall[134], wall[133], wall[132], wall[131] → 実際は末尾から
  // 簡略化: 末尾14枚を王牌とする

  const deadWallStart = wall.length - 14; // index 122

  const doraIndicators = [wall[deadWallStart + 4]]; // 最初のドラ表示牌
  const uraDoraIndicators = [wall[deadWallStart + 5]];

  // 配牌: 4人×13枚
  const hands: TileInstance[][] = [[], [], [], []];
  let drawIndex = 0;

  // 4枚ずつ3回
  for (let round = 0; round < 3; round++) {
    for (let p = 0; p < 4; p++) {
      for (let i = 0; i < 4; i++) {
        hands[p].push(wall[drawIndex++]);
      }
    }
  }
  // 1枚ずつ
  for (let p = 0; p < 4; p++) {
    hands[p].push(wall[drawIndex++]);
  }

  return {
    wall,
    hands,
    doraIndicators,
    uraDoraIndicators,
    wallIndex: drawIndex,          // 次のツモ位置 (52)
    rinshanIndex: wall.length - 1, // 嶺上牌の位置 (135から降順)
    remainingTiles: deadWallStart - drawIndex, // 122 - 52 = 70
  };
}

/** 嶺上牌をめくる（新しいドラ表示牌も追加） */
export function drawRinshan(
  wall: TileInstance[],
  rinshanIndex: number,
  doraIndicators: TileInstance[],
  uraDoraIndicators: TileInstance[],
) {
  const deadWallStart = wall.length - 14;
  const tile = wall[rinshanIndex];
  const newRinshanIndex = rinshanIndex - 1;

  // 新しいドラ表示牌
  const doraPos = deadWallStart + 4 + doraIndicators.length * 2;
  const newDoraIndicators = [...doraIndicators];
  const newUraDoraIndicators = [...uraDoraIndicators];

  if (doraPos < wall.length) {
    newDoraIndicators.push(wall[doraPos - 2]);
    if (doraPos - 1 < wall.length) {
      newUraDoraIndicators.push(wall[doraPos - 1]);
    }
  }

  return {
    tile,
    rinshanIndex: newRinshanIndex,
    doraIndicators: newDoraIndicators,
    uraDoraIndicators: newUraDoraIndicators,
  };
}

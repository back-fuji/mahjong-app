/**
 * game-engine のバグ修正テスト
 *
 * 1. ロンマーカー型 ('ron')
 * 2. ポン/チー後の打牌は processDiscard 経由（鳴きチェック走る）
 * 3. チーは上家からのみ
 * 4. 大明槓 (processMinKan)
 * 5. 流局条件（九種九牌, 四家立直, 四槓散了, 四風連打, 三家和）
 */

import { describe, it, expect } from 'vitest';
import type { GameState } from '../../types/game-state.ts';
import type { TileInstance } from '../../types/tile.ts';
import type { Player, Wind } from '../../types/player.ts';
import { MeldType, type Meld, type CallOption } from '../../types/meld.ts';
import { DEFAULT_RULES } from '../../types/game-state.ts';
import {
  initGame,
  processDiscard,
  processPon,
  processChi,
  processMinKan,
  canKyuushuKyuhai,
  processKyuushuKyuhai,
  checkSuuchariichi,
  checkSuukaikan,
  checkSuufonrenda,
  processAbortiveDraw,
} from '../game-engine.ts';
import { TON, NAN, SHA, PEI } from '../../types/tile.ts';

// ---------- ヘルパー ----------

/** TileInstance を簡単に作る */
function tile(id: number, index: number = id * 4, isRed = false): TileInstance {
  return { id, index, isRed };
}

/** 最低限のプレイヤーを作る */
function makePlayer(overrides: Partial<Player> = {}, idx: number = 0): Player {
  return {
    id: `p_${idx}`,
    name: `Player ${idx}`,
    score: 25000,
    hand: { closed: [], melds: [], tsumo: undefined },
    discards: [],
    isRiichi: false,
    isDoubleRiichi: false,
    isIppatsu: false,
    riichiTurn: -1,
    isMenzen: true,
    seatWind: idx as Wind,
    isHuman: idx === 0,
    connected: true,
    ...overrides,
  };
}

/** テスト用のダミー壁 (136枚) */
function dummyWall(): TileInstance[] {
  const w: TileInstance[] = [];
  for (let id = 0; id < 34; id++) {
    for (let c = 0; c < 4; c++) {
      w.push(tile(id, id * 4 + c));
    }
  }
  return w;
}

/** テスト用のベース GameState を作る */
function baseState(overrides: Partial<GameState> = {}): GameState {
  return {
    players: [makePlayer({}, 0), makePlayer({}, 1), makePlayer({}, 2), makePlayer({}, 3)],
    wall: dummyWall(),
    wallIndex: 52,
    rinshanIndex: 135,
    doraIndicators: [tile(0, 126)],
    uraDoraIndicators: [tile(1, 127)],
    phase: 'discard',
    currentPlayer: 0,
    round: {
      bakaze: 0 as Wind,
      kyoku: 0,
      honba: 0,
      riichiSticks: 0,
      remainingTiles: 70,
      turn: 0,
      isFirstTurn: true,
    },
    kanCount: 0,
    rules: DEFAULT_RULES,
    ...overrides,
  };
}

// ========================================
// 1. ロンマーカーの型テスト
// ========================================
describe('processDiscard - ロンマーカー', () => {
  it('ロン可能な場合、CallOption に type: "ron" が入る', () => {
    // Player 0 が 1m (id=0) を切る
    // Player 1 が 1m 待ちで和了れる手を持つ
    // 簡易: Player 1 の手牌 = [0,0,0, 1,1,1, 2,2,2, 3,3,3, 4] → 1m が来たら和了
    const closedP1: TileInstance[] = [
      tile(0, 100), tile(0, 101), tile(0, 102), // 1m x3 → 暗刻だが1枚は捨て牌からなのでロン
    ];
    // 実際は 4面子1雀頭を作れないとロンにならない。
    // ここでは processDiscard で ron マーカーが設定されることだけを確認するため、
    // checkAgari が true を返す手牌を作る。
    // 1m,1m,2m,2m,3m,3m,4m,4m,5m,5m,6m,6m,7m → 待ち: 7m でもよいが、
    // 0 を切ったとき player1 が和了れるように 0 待ちの手:
    // 2m,3m,4m, 5m,6m,7m, 8m,8m,8m, 1p,2p,3p, 9p → 0(1m) 待ち? → 数牌順子多めで
    // テスト簡略化: initGame で実際に配牌すると複雑なので、agari が成立する既知の手を構成

    // 1m(0) を切ったとき player1 が {1m*2 + 2m,3m,4m, 5m,6m,7m, 8m,8m,8m, 9m,9m} だと
    // 1m が来れば [1m,1m,1m] [2m,3m,4m] [5m,6m,7m] [8m,8m,8m] + 9m,9m = 和了
    const p1Closed: TileInstance[] = [
      tile(0, 100), tile(0, 101),       // 1m x2
      tile(1, 104), tile(2, 108), tile(3, 112), // 2m,3m,4m
      tile(4, 116), tile(5, 120), tile(6, 124), // 5m,6m,7m (index は被らないようにする)
      tile(7, 128), tile(7, 129), tile(7, 130), // 8m x3
      tile(8, 132), tile(8, 133),       // 9m x2
    ];

    const players = [
      makePlayer({
        hand: {
          closed: [tile(0, 0), tile(9, 36)], // P0: 手牌に1m, 1p (適当)
          melds: [],
          tsumo: tile(0, 1), // ツモ牌 = 1m
        },
      }, 0),
      makePlayer({ hand: { closed: p1Closed, melds: [], tsumo: undefined } }, 1),
      makePlayer({ hand: { closed: [tile(18, 72)], melds: [], tsumo: undefined } }, 2),
      makePlayer({ hand: { closed: [tile(27, 108)], melds: [], tsumo: undefined } }, 3),
    ];

    const state = baseState({ players, currentPlayer: 0 });
    const discardTile = tile(0, 1); // 1m を切る
    const result = processDiscard(state, discardTile);

    if (result.phase === 'calling' && result.callOptions) {
      const p1Opts = result.callOptions.get(1);
      expect(p1Opts).toBeDefined();
      const ronOpt = p1Opts?.find(o => o.type === 'ron');
      expect(ronOpt).toBeDefined();
      expect(ronOpt!.type).toBe('ron');
      // MeldType.Pon として入っていないことを確認
      const ponLikeRon = p1Opts?.find(o => o.type === MeldType.Pon && o.tiles.length === 0);
      expect(ponLikeRon).toBeUndefined();
    } else {
      // calling フェーズにならなかった場合はテスト不成立を明示
      // (手牌構成が和了にならなかった可能性)
      expect(result.phase).toBe('calling');
    }
  });
});

// ========================================
// 2. ポン/チー後の打牌は discard フェーズ
// ========================================
describe('processPon', () => {
  it('ポン後は phase: "discard" かつ currentPlayer が鳴き者になる', () => {
    // Player 0 が 1m を切り、Player 2 がポン
    const p2Closed: TileInstance[] = [
      tile(0, 100), tile(0, 101), // 1m x2 (ポン用)
      tile(9, 36), tile(10, 40), tile(11, 44), // 適当な手牌
    ];

    const players = [
      makePlayer({}, 0),
      makePlayer({}, 1),
      makePlayer({ hand: { closed: p2Closed, melds: [], tsumo: undefined } }, 2),
      makePlayer({}, 3),
    ];

    const state = baseState({
      players,
      phase: 'calling',
      lastDiscard: { tile: tile(0, 0), playerIndex: 0 },
    });

    const result = processPon(state, 2);

    expect(result.phase).toBe('discard');
    expect(result.currentPlayer).toBe(2);
    // 副露が1つ追加されている
    expect(result.players[2].hand.melds.length).toBe(1);
    expect(result.players[2].hand.melds[0].type).toBe(MeldType.Pon);
  });

  it('ポン後に全員の一発が消える', () => {
    const players = [
      makePlayer({ isIppatsu: true }, 0),
      makePlayer({ isIppatsu: true }, 1),
      makePlayer({
        hand: { closed: [tile(0, 100), tile(0, 101), tile(9, 36)], melds: [], tsumo: undefined },
      }, 2),
      makePlayer({ isIppatsu: true }, 3),
    ];

    const state = baseState({
      players,
      phase: 'calling',
      lastDiscard: { tile: tile(0, 0), playerIndex: 0 },
    });

    const result = processPon(state, 2);
    for (let i = 0; i < 4; i++) {
      expect(result.players[i].isIppatsu).toBe(false);
    }
  });
});

describe('processChi', () => {
  it('チー後は phase: "discard" かつ currentPlayer が鳴き者になる', () => {
    // Player 0 が 3m(id=2) を切り、Player 1 がチー (1m,2m,3m)
    const p1Closed: TileInstance[] = [
      tile(0, 100), tile(1, 104), // 1m, 2m
      tile(9, 36), tile(10, 40),  // 適当
    ];

    const players = [
      makePlayer({}, 0),
      makePlayer({ hand: { closed: p1Closed, melds: [], tsumo: undefined } }, 1),
      makePlayer({}, 2),
      makePlayer({}, 3),
    ];

    const state = baseState({
      players,
      phase: 'calling',
      lastDiscard: { tile: tile(2, 8), playerIndex: 0 },
    });

    const result = processChi(state, 1, [0, 1]);

    expect(result.phase).toBe('discard');
    expect(result.currentPlayer).toBe(1);
    expect(result.players[1].hand.melds.length).toBe(1);
    expect(result.players[1].hand.melds[0].type).toBe(MeldType.Chi);
  });
});

// ========================================
// 3. チーの方向制限
// ========================================
describe('processDiscard - チーは上家のみ', () => {
  it('下家のみにチーオプションが付く', () => {
    // Player 0 が 3m(id=2) を切ったとき、Player 1(下家)だけチー可能
    // Player 2, 3 にはチーオプションがない
    const makeClosed = () => [
      tile(0, 200), tile(1, 204), // 1m, 2m → 3m(id=2) でチー可能
      tile(9, 236), tile(10, 240), tile(11, 244),
      tile(12, 248), tile(13, 252), tile(14, 256),
      tile(15, 260), tile(16, 264), tile(17, 268),
      tile(18, 272), tile(19, 276),
    ];

    const players = [
      makePlayer({
        hand: {
          closed: [tile(2, 8), tile(9, 36)],
          melds: [],
          tsumo: tile(2, 9),
        },
      }, 0),
      makePlayer({ hand: { closed: makeClosed(), melds: [], tsumo: undefined } }, 1),
      makePlayer({ hand: { closed: makeClosed(), melds: [], tsumo: undefined } }, 2),
      makePlayer({ hand: { closed: makeClosed(), melds: [], tsumo: undefined } }, 3),
    ];

    const state = baseState({ players, currentPlayer: 0 });
    const result = processDiscard(state, tile(2, 9));

    if (result.phase === 'calling' && result.callOptions) {
      // Player 1 (下家) だけチーオプションがあるはず
      const p1Opts = result.callOptions.get(1);
      const p2Opts = result.callOptions.get(2);
      const p3Opts = result.callOptions.get(3);

      const p1Chi = p1Opts?.filter(o => o.type === MeldType.Chi) ?? [];
      const p2Chi = p2Opts?.filter(o => o.type === MeldType.Chi) ?? [];
      const p3Chi = p3Opts?.filter(o => o.type === MeldType.Chi) ?? [];

      expect(p1Chi.length).toBeGreaterThan(0);
      expect(p2Chi.length).toBe(0);
      expect(p3Chi.length).toBe(0);
    }
  });
});

// ========================================
// 4. 大明槓 (processMinKan)
// ========================================
describe('processMinKan', () => {
  it('大明槓後は phase: "discard" で嶺上牌をツモしている', () => {
    const p2Closed: TileInstance[] = [
      tile(0, 100), tile(0, 101), tile(0, 102), // 1m x3
      tile(9, 36), tile(10, 40), tile(11, 44),
    ];

    const players = [
      makePlayer({}, 0),
      makePlayer({}, 1),
      makePlayer({ hand: { closed: p2Closed, melds: [], tsumo: undefined } }, 2),
      makePlayer({}, 3),
    ];

    const state = baseState({
      players,
      phase: 'calling',
      lastDiscard: { tile: tile(0, 0), playerIndex: 0 },
    });

    const result = processMinKan(state, 2);

    expect(result.phase).toBe('discard');
    expect(result.currentPlayer).toBe(2);
    expect(result.kanCount).toBe(1);
    expect(result.players[2].hand.melds.length).toBe(1);
    expect(result.players[2].hand.melds[0].type).toBe(MeldType.MinKan);
    // 嶺上牌がツモされている
    expect(result.players[2].hand.tsumo).toBeDefined();
  });

  it('大明槓で全員の一発が消える', () => {
    const p2Closed: TileInstance[] = [
      tile(0, 100), tile(0, 101), tile(0, 102),
    ];

    const players = [
      makePlayer({ isIppatsu: true }, 0),
      makePlayer({ isIppatsu: true }, 1),
      makePlayer({
        isIppatsu: true,
        hand: { closed: p2Closed, melds: [], tsumo: undefined },
      }, 2),
      makePlayer({ isIppatsu: true }, 3),
    ];

    const state = baseState({
      players,
      phase: 'calling',
      lastDiscard: { tile: tile(0, 0), playerIndex: 0 },
    });

    const result = processMinKan(state, 2);
    for (let i = 0; i < 4; i++) {
      expect(result.players[i].isIppatsu).toBe(false);
    }
  });
});

// ========================================
// 5. 流局条件
// ========================================

describe('canKyuushuKyuhai', () => {
  it('一巡目で么九牌9種以上あれば true', () => {
    // 么九牌: 1m(0),9m(8),1p(9),9p(17),1s(18),9s(26),東(27),南(28),西(29),北(30),...
    // 9種以上: 0,8,9,17,18,26,27,28,29 → 9種
    const closed: TileInstance[] = [
      tile(0, 0), tile(8, 32), tile(9, 36), tile(17, 68),
      tile(18, 72), tile(26, 104), tile(27, 108), tile(28, 112),
      tile(1, 4), tile(2, 8), tile(3, 12), tile(4, 16), tile(5, 20),
    ];
    const tsumo = tile(29, 116); // 西 → 10種目

    const players = [
      makePlayer({ hand: { closed, melds: [], tsumo } }, 0),
      makePlayer({}, 1),
      makePlayer({}, 2),
      makePlayer({}, 3),
    ];

    const state = baseState({
      players,
      round: {
        bakaze: 0 as Wind,
        kyoku: 0, honba: 0, riichiSticks: 0,
        remainingTiles: 70, turn: 0, isFirstTurn: true,
      },
    });

    expect(canKyuushuKyuhai(state, 0)).toBe(true);
  });

  it('一巡目でも么九牌8種以下なら false', () => {
    const closed: TileInstance[] = [
      tile(0, 0), tile(8, 32), tile(9, 36), tile(17, 68),
      tile(18, 72), tile(26, 104), tile(27, 108), tile(28, 112),
      // 8種 → 足りない
      tile(1, 4), tile(2, 8), tile(3, 12), tile(4, 16), tile(5, 20),
    ];

    const players = [
      makePlayer({ hand: { closed, melds: [], tsumo: tile(1, 5) } }, 0), // tsumo=2m → 数牌(么九でない)
      makePlayer({}, 1),
      makePlayer({}, 2),
      makePlayer({}, 3),
    ];

    const state = baseState({
      players,
      round: {
        bakaze: 0 as Wind,
        kyoku: 0, honba: 0, riichiSticks: 0,
        remainingTiles: 70, turn: 0, isFirstTurn: true,
      },
    });

    expect(canKyuushuKyuhai(state, 0)).toBe(false);
  });

  it('一巡目を過ぎると false', () => {
    const closed: TileInstance[] = [
      tile(0, 0), tile(8, 32), tile(9, 36), tile(17, 68),
      tile(18, 72), tile(26, 104), tile(27, 108), tile(28, 112),
      tile(29, 116), tile(1, 4), tile(2, 8), tile(3, 12), tile(4, 16),
    ];

    const players = [
      makePlayer({ hand: { closed, melds: [], tsumo: tile(30, 120) } }, 0),
      makePlayer({}, 1),
      makePlayer({}, 2),
      makePlayer({}, 3),
    ];

    const state = baseState({
      players,
      round: {
        bakaze: 0 as Wind,
        kyoku: 0, honba: 0, riichiSticks: 0,
        remainingTiles: 60, turn: 4, isFirstTurn: false,
      },
    });

    expect(canKyuushuKyuhai(state, 0)).toBe(false);
  });
});

describe('processKyuushuKyuhai', () => {
  it('九種九牌流局で round_result になる', () => {
    const state = baseState();
    const result = processKyuushuKyuhai(state);

    expect(result.phase).toBe('round_result');
    expect(result.roundResult?.draw?.type).toBe('kyuushu');
  });
});

describe('checkSuuchariichi', () => {
  it('4人全員リーチなら true', () => {
    const players = [
      makePlayer({ isRiichi: true }, 0),
      makePlayer({ isRiichi: true }, 1),
      makePlayer({ isRiichi: true }, 2),
      makePlayer({ isRiichi: true }, 3),
    ];
    const state = baseState({ players });
    expect(checkSuuchariichi(state)).toBe(true);
  });

  it('3人以下なら false', () => {
    const players = [
      makePlayer({ isRiichi: true }, 0),
      makePlayer({ isRiichi: true }, 1),
      makePlayer({ isRiichi: true }, 2),
      makePlayer({ isRiichi: false }, 3),
    ];
    const state = baseState({ players });
    expect(checkSuuchariichi(state)).toBe(false);
  });
});

describe('checkSuukaikan', () => {
  it('異なるプレイヤーが合計4回槓していれば true', () => {
    const kanMeld: Meld = { type: MeldType.AnKan, tiles: [tile(0), tile(0), tile(0), tile(0)] };
    const players = [
      makePlayer({ hand: { closed: [], melds: [kanMeld, kanMeld], tsumo: undefined } }, 0),
      makePlayer({ hand: { closed: [], melds: [kanMeld, kanMeld], tsumo: undefined } }, 1),
      makePlayer({}, 2),
      makePlayer({}, 3),
    ];
    const state = baseState({ players, kanCount: 4 });
    expect(checkSuukaikan(state)).toBe(true);
  });

  it('1人だけが4回槓しても false（四槓子の可能性）', () => {
    const kanMeld: Meld = { type: MeldType.AnKan, tiles: [tile(0), tile(0), tile(0), tile(0)] };
    const players = [
      makePlayer({ hand: { closed: [], melds: [kanMeld, kanMeld, kanMeld, kanMeld], tsumo: undefined } }, 0),
      makePlayer({}, 1),
      makePlayer({}, 2),
      makePlayer({}, 3),
    ];
    const state = baseState({ players, kanCount: 4 });
    expect(checkSuukaikan(state)).toBe(false);
  });

  it('kanCount < 4 なら false', () => {
    const state = baseState({ kanCount: 3 });
    expect(checkSuukaikan(state)).toBe(false);
  });
});

describe('checkSuufonrenda', () => {
  it('全員の最初の捨て牌が同じ風牌なら true', () => {
    const players = [
      makePlayer({ discards: [tile(TON, 0)] }, 0),
      makePlayer({ discards: [tile(TON, 1)] }, 1),
      makePlayer({ discards: [tile(TON, 2)] }, 2),
      makePlayer({ discards: [tile(TON, 3)] }, 3),
    ];
    const state = baseState({ players });
    expect(checkSuufonrenda(state)).toBe(true);
  });

  it('風牌でない同一牌なら false', () => {
    const players = [
      makePlayer({ discards: [tile(0, 0)] }, 0), // 1m
      makePlayer({ discards: [tile(0, 1)] }, 1),
      makePlayer({ discards: [tile(0, 2)] }, 2),
      makePlayer({ discards: [tile(0, 3)] }, 3),
    ];
    const state = baseState({ players });
    expect(checkSuufonrenda(state)).toBe(false);
  });

  it('異なる風牌なら false', () => {
    const players = [
      makePlayer({ discards: [tile(TON, 0)] }, 0),
      makePlayer({ discards: [tile(NAN, 1)] }, 1),
      makePlayer({ discards: [tile(TON, 2)] }, 2),
      makePlayer({ discards: [tile(TON, 3)] }, 3),
    ];
    const state = baseState({ players });
    expect(checkSuufonrenda(state)).toBe(false);
  });

  it('まだ全員が捨てていなければ false', () => {
    const players = [
      makePlayer({ discards: [tile(TON, 0)] }, 0),
      makePlayer({ discards: [tile(TON, 1)] }, 1),
      makePlayer({ discards: [] }, 2),
      makePlayer({ discards: [] }, 3),
    ];
    const state = baseState({ players });
    expect(checkSuufonrenda(state)).toBe(false);
  });
});

describe('processDiscard - 三家和 (sanchaho)', () => {
  it('3人以上ロン可能な場合は流局になる', () => {
    // Player 0 が 1m(0) を切る
    // Player 1, 2, 3 が全員 1m 待ちで和了
    // 手牌: [1m,1m, 2m,3m,4m, 5m,6m,7m, 8m,8m,8m, 9m,9m]
    const ronHand = (): TileInstance[] => [
      tile(0, 200), tile(0, 201),
      tile(1, 204), tile(2, 208), tile(3, 212),
      tile(4, 216), tile(5, 220), tile(6, 224),
      tile(7, 228), tile(7, 229), tile(7, 230),
      tile(8, 232), tile(8, 233),
    ];

    const players = [
      makePlayer({
        hand: { closed: [tile(0, 0), tile(9, 36)], melds: [], tsumo: tile(0, 1) },
      }, 0),
      makePlayer({ hand: { closed: ronHand(), melds: [], tsumo: undefined } }, 1),
      makePlayer({ hand: { closed: ronHand(), melds: [], tsumo: undefined } }, 2),
      makePlayer({ hand: { closed: ronHand(), melds: [], tsumo: undefined } }, 3),
    ];

    const state = baseState({ players, currentPlayer: 0 });
    const result = processDiscard(state, tile(0, 1));

    expect(result.phase).toBe('round_result');
    expect(result.roundResult?.draw?.type).toBe('sanchaho');
  });
});

describe('processAbortiveDraw', () => {
  it('任意の流局タイプで round_result を返す', () => {
    const state = baseState();
    const result = processAbortiveDraw(state, 'suufonrenda');
    expect(result.phase).toBe('round_result');
    expect(result.roundResult?.draw?.type).toBe('suufonrenda');
    expect(result.roundResult?.draw?.payments).toEqual([0, 0, 0, 0]);
  });
});

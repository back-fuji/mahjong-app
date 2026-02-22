import type { GameState, GameRules, RoundState, AgariResult, DrawResult, RoundResult } from '../types/game-state.ts';
import { DEFAULT_RULES } from '../types/game-state.ts';
import type { Player, Wind } from '../types/player.ts';
import { createPlayer } from '../types/player.ts';
import type { TileInstance, TileCount34, TileId } from '../types/tile.ts';
import type { GameAction } from '../types/action.ts';
import type { Meld, CallOption } from '../types/meld.ts';
import { MeldType } from '../types/meld.ts';
import { buildWall, dealTiles, drawRinshan } from '../wall/wall.ts';
import { toCount34, sortTiles, emptyCount34, countDora, countRedDora, isYaochu, isKaze, getSuit, SuitType, suitStart } from '../tile/tile-utils.ts';
import { getHandCounts, removeTileFromHand } from '../hand/hand-utils.ts';
import { checkAgari, getWaitingTiles, isTenpai } from '../agari/agari.ts';
import type { AgariInfo } from '../agari/agari.ts';
import { getChiOptions, getPonOption, getMinKanOption, getAnKanTiles, getShouMinKanTiles } from '../meld/meld-utils.ts';
import { calculateScore } from '../score/score-calc.ts';
import type { YakuContext } from '../yaku/yaku-checker.ts';
import { checkYakuRegular, checkYakuChiitoitsu, checkYakuKokushi } from '../yaku/yaku-checker.ts';

/** ゲームを初期化 */
export function initGame(
  playerNames: string[],
  humanPlayers: boolean[],
  rules: GameRules = DEFAULT_RULES,
): GameState {
  const players: Player[] = playerNames.map((name, i) =>
    createPlayer(`player_${i}`, name, i as Wind, humanPlayers[i])
  );

  const state: GameState = {
    players,
    wall: [],
    wallIndex: 0,
    rinshanIndex: 0,
    doraIndicators: [],
    uraDoraIndicators: [],
    phase: 'waiting',
    currentPlayer: 0,
    round: {
      bakaze: 0,
      kyoku: 0,
      honba: 0,
      riichiSticks: 0,
      remainingTiles: 70,
      turn: 0,
      isFirstTurn: true,
    },
    kanCount: 0,
    rules,
  };

  return startRound(state);
}

/** 局を開始 */
export function startRound(state: GameState): GameState {
  const wall = buildWall(state.rules);
  const deal = dealTiles(wall);

  const players = state.players.map((p, i) => ({
    ...p,
    hand: {
      closed: sortTiles(deal.hands[i]),
      melds: [],
      tsumo: undefined,
    },
    discards: [],
    isRiichi: false,
    isDoubleRiichi: false,
    isIppatsu: false,
    riichiTurn: -1,
    riichiDiscardIndex: -1,
    isMenzen: true,
    seatWind: ((i - state.round.kyoku % 4 + 4) % 4) as Wind,
    isFuriten: false,
    tempFuriten: false,
    kuikaeDisallowedTiles: [],
  }));

  // 親 (東家) のインデックス
  const oyaIndex = state.round.kyoku % 4;

  return {
    ...state,
    players,
    wall,
    wallIndex: deal.wallIndex,
    rinshanIndex: deal.rinshanIndex,
    doraIndicators: deal.doraIndicators,
    uraDoraIndicators: deal.uraDoraIndicators,
    phase: 'tsumo',
    currentPlayer: oyaIndex,
    round: {
      ...state.round,
      remainingTiles: deal.remainingTiles,
      turn: 0,
      isFirstTurn: true,
    },
    kanCount: 0,
    lastDiscard: undefined,
    roundResult: undefined,
    callOptions: undefined,
  };
}

/** ツモ処理 */
export function processTsumo(state: GameState): GameState {
  if (state.round.remainingTiles <= 0) {
    return processExhaustiveDraw(state);
  }

  const tile = state.wall[state.wallIndex];
  const playerIdx = state.currentPlayer;
  const players = [...state.players];
  const player = { ...players[playerIdx] };
  player.hand = { ...player.hand, tsumo: tile };
  // 同巡フリテンリセット（自分のツモが来たらリセット）
  player.tempFuriten = false;
  // 喰い替え禁止リセット（ツモが来たので制限解除）
  player.kuikaeDisallowedTiles = [];
  players[playerIdx] = player;

  return {
    ...state,
    players,
    wallIndex: state.wallIndex + 1,
    round: {
      ...state.round,
      remainingTiles: state.round.remainingTiles - 1,
    },
    phase: 'discard',
  };
}

/** ツモ和了チェック */
export function checkTsumoAgari(state: GameState): boolean {
  const player = state.players[state.currentPlayer];
  const allClosed = player.hand.tsumo
    ? [...player.hand.closed, player.hand.tsumo]
    : player.hand.closed;
  const counts = toCount34(allClosed);
  const agari = checkAgari(counts, player.hand.melds);
  return agari !== null;
}

/** ツモ和了処理 */
export function processTsumoAgari(state: GameState): GameState {
  const playerIdx = state.currentPlayer;
  const player = state.players[playerIdx];
  const allClosed = player.hand.tsumo
    ? [...player.hand.closed, player.hand.tsumo]
    : player.hand.closed;
  const counts = toCount34(allClosed);
  const agari = checkAgari(counts, player.hand.melds)!;

  const agariTile = player.hand.tsumo?.id ?? player.hand.closed[player.hand.closed.length - 1].id;
  const isOya = player.seatWind === 0;

  const ctx: YakuContext = {
    closedCounts: counts,
    melds: player.hand.melds,
    agariTile,
    isTsumo: true,
    isMenzen: player.isMenzen,
    seatWind: player.seatWind,
    roundWind: state.round.bakaze,
    isRiichi: player.isRiichi,
    isDoubleRiichi: player.isDoubleRiichi,
    isIppatsu: player.isIppatsu,
    isHaitei: state.round.remainingTiles === 0,
    isHoutei: false,
    isRinshan: false,
    isChankan: false,
    isTenhou: isOya && state.round.turn === 0,
    isChiihou: !isOya && state.round.turn === 0 && state.round.isFirstTurn,
    kuitan: state.rules.kuitan,
  };

  const scoreResult = calculateScore(
    agari, ctx, isOya,
    state.doraIndicators, state.uraDoraIndicators,
    allClosed, state.round.honba,
  );

  // 役なしの場合はツモ和了不可（安全ガード）
  if (!scoreResult) {
    return state;
  }

  const agariResult: AgariResult = {
    winner: playerIdx,
    loser: -1,
    isTsumo: true,
    scoreResult,
  };

  // 点数移動
  const players = [...state.players];
  const updatedPlayers = applyScoreChange(players, agariResult, state.round.riichiSticks);

  return {
    ...state,
    players: updatedPlayers,
    phase: 'round_result',
    roundResult: { agari: [agariResult] },
  };
}

/** 打牌処理 */
export function processDiscard(state: GameState, tile: TileInstance): GameState {
  const playerIdx = state.currentPlayer;
  const players = [...state.players];
  const player = { ...players[playerIdx] };

  // 手牌から牌を除去
  player.hand = removeTileFromHand(player.hand, tile);
  player.discards = [...player.discards, tile];

  // 一発消し
  if (player.isIppatsu) {
    player.isIppatsu = false;
  }

  // 捨て牌フリテン更新: 自分の捨て牌に待ち牌が含まれているか
  player.isFuriten = checkDiscardFuriten(player);

  players[playerIdx] = player;

  // 同巡フリテンリセット: このプレイヤーが打牌したので同巡フリテンをリセット
  players[playerIdx] = { ...players[playerIdx], tempFuriten: false };

  // 他家の鳴き・ロンチェック
  const callOpts = new Map<number, CallOption[]>();
  let ronCount = 0;

  for (let i = 0; i < 4; i++) {
    if (i === playerIdx) continue;
    const opts: CallOption[] = [];

    // ロンチェック
    const otherPlayer = players[i];
    const otherClosed = toCount34(otherPlayer.hand.closed);
    const tempCounts = [...otherClosed];
    tempCounts[tile.id]++;
    const agari = checkAgari(tempCounts, otherPlayer.hand.melds);
    if (agari) {
      // フリテンチェック: 捨て牌フリテン or 同巡フリテン or リーチ後フリテンならロン不可
      const isFuritenRon = otherPlayer.isFuriten || otherPlayer.tempFuriten;
      if (!isFuritenRon) {
        // 役の有無をチェック（役なしの場合はロン不可）
        const hasYaku = checkHasYaku(agari, tempCounts, otherPlayer, tile.id, state);
        if (hasYaku) {
          ronCount++;
          opts.push({ type: 'ron', tiles: [], calledTile: tile.id });
        }
      }
    }

    // ポンチェック
    const ponOpt = getPonOption(otherClosed, tile.id);
    if (ponOpt) opts.push(ponOpt);

    // 大明槓チェック
    const minkanOpt = getMinKanOption(otherClosed, tile.id);
    if (minkanOpt) opts.push(minkanOpt);

    // チーチェック（下家のみ）
    if ((playerIdx + 1) % 4 === i) {
      const chiOpts = getChiOptions(otherClosed, tile.id);
      opts.push(...chiOpts);
    }

    if (opts.length > 0) {
      callOpts.set(i, opts);
    }
  }

  // 三家和（3人以上ロン可能）→ 即流局
  if (ronCount >= 3) {
    const drawResult: DrawResult = {
      type: 'sanchaho',
      tenpaiPlayers: [],
      payments: [0, 0, 0, 0],
    };
    return {
      ...state,
      players,
      phase: 'round_result',
      lastDiscard: { tile, playerIndex: playerIdx },
      roundResult: { draw: drawResult },
    };
  }

  if (callOpts.size > 0) {
    return {
      ...state,
      players,
      phase: 'calling',
      lastDiscard: { tile, playerIndex: playerIdx },
      callOptions: callOpts,
    };
  }

  // 四風連打チェック（全員1枚目の捨牌が出揃った直後）
  const updatedState = { ...state, players, lastDiscard: { tile, playerIndex: playerIdx } };
  if (checkSuufonrenda(updatedState)) {
    return processAbortiveDraw(updatedState, 'suufonrenda');
  }

  // 鳴きなし → 次のプレイヤーへ
  return advanceToNextPlayer(state, players);
}

/** リーチ宣言処理 */
export function processRiichi(state: GameState, tile: TileInstance): GameState {
  const playerIdx = state.currentPlayer;
  const players = [...state.players];
  const player = { ...players[playerIdx] };

  player.isRiichi = true;
  player.isIppatsu = true;
  player.riichiTurn = state.round.turn;
  // リーチ宣言牌は次の打牌（= 現在のdiscards.length番目）になる
  player.riichiDiscardIndex = player.discards.length;

  if (state.round.isFirstTurn) {
    player.isDoubleRiichi = true;
  }

  player.score -= 1000;
  players[playerIdx] = player;

  const newState: GameState = {
    ...state,
    players,
    round: {
      ...state.round,
      riichiSticks: state.round.riichiSticks + 1,
    },
  };

  return processDiscard(newState, tile);
}

/** ロン処理 */
export function processRon(state: GameState, winnerIdx: number): GameState {
  const loserIdx = state.lastDiscard!.playerIndex;
  const discardTile = state.lastDiscard!.tile;
  const player = state.players[winnerIdx];

  const closedWithAgari = [...player.hand.closed];
  const counts = toCount34(closedWithAgari);
  counts[discardTile.id]++;

  const agari = checkAgari(counts, player.hand.melds)!;
  const isOya = player.seatWind === 0;

  const ctx: YakuContext = {
    closedCounts: counts,
    melds: player.hand.melds,
    agariTile: discardTile.id,
    isTsumo: false,
    isMenzen: player.isMenzen,
    seatWind: player.seatWind,
    roundWind: state.round.bakaze,
    isRiichi: player.isRiichi,
    isDoubleRiichi: player.isDoubleRiichi,
    isIppatsu: player.isIppatsu,
    isHaitei: false,
    isHoutei: state.round.remainingTiles === 0,
    isRinshan: false,
    isChankan: false,
    isTenhou: false,
    isChiihou: false,
    kuitan: state.rules.kuitan,
  };

  const scoreResult = calculateScore(
    agari, ctx, isOya,
    state.doraIndicators, state.uraDoraIndicators,
    [...closedWithAgari, discardTile], state.round.honba,
  );

  // 役なしの場合はロン不可（安全ガード）
  if (!scoreResult) {
    return state;
  }

  const agariResult: AgariResult = {
    winner: winnerIdx,
    loser: loserIdx,
    isTsumo: false,
    scoreResult,
  };

  const players = applyScoreChange([...state.players], agariResult, state.round.riichiSticks);

  return {
    ...state,
    players,
    phase: 'round_result',
    roundResult: { agari: [agariResult] },
  };
}

/** ポン処理 */
export function processPon(state: GameState, callerIdx: number): GameState {
  const discardTile = state.lastDiscard!.tile;
  const fromIdx = state.lastDiscard!.playerIndex;
  const players = [...state.players];
  const caller = { ...players[callerIdx] };

  // 手牌から2枚取り出す
  const closedTiles = [...caller.hand.closed];
  const meldTiles: TileInstance[] = [discardTile];
  let found = 0;
  const newClosed: TileInstance[] = [];
  for (const t of closedTiles) {
    if (t.id === discardTile.id && found < 2) {
      meldTiles.push(t);
      found++;
    } else {
      newClosed.push(t);
    }
  }

  const relativePos = ((fromIdx - callerIdx + 4) % 4) as 1 | 2 | 3;
  const meld: Meld = {
    type: MeldType.Pon,
    tiles: meldTiles,
    calledTile: discardTile,
    fromPlayer: relativePos,
  };

  caller.hand = {
    closed: sortTiles(newClosed),
    melds: [...caller.hand.melds, meld],
    tsumo: undefined,
  };
  caller.isMenzen = false;
  // ポンの喰い替え禁止: 鳴いた牌と同じIDを禁止
  caller.kuikaeDisallowedTiles = [discardTile.id];
  players[callerIdx] = caller;

  // 全員の一発消し
  for (let i = 0; i < 4; i++) {
    if (players[i].isIppatsu) {
      players[i] = { ...players[i], isIppatsu: false };
    }
  }

  return {
    ...state,
    players,
    phase: 'discard',
    currentPlayer: callerIdx,
    lastDiscard: undefined,
    callOptions: undefined,
    round: { ...state.round, isFirstTurn: false },
  };
}

/** チー処理 */
export function processChi(state: GameState, callerIdx: number, tiles: TileId[]): GameState {
  const discardTile = state.lastDiscard!.tile;
  const players = [...state.players];
  const caller = { ...players[callerIdx] };

  const closedTiles = [...caller.hand.closed];
  const meldTiles: TileInstance[] = [discardTile];
  const newClosed: TileInstance[] = [];
  const usedIds = [...tiles];

  for (const t of closedTiles) {
    const idx = usedIds.indexOf(t.id);
    if (idx !== -1) {
      meldTiles.push(t);
      usedIds.splice(idx, 1);
    } else {
      newClosed.push(t);
    }
  }

  const meld: Meld = {
    type: MeldType.Chi,
    tiles: meldTiles.sort((a, b) => a.id - b.id),
    calledTile: discardTile,
    fromPlayer: 3,
  };

  // 喰い替え禁止牌の計算
  const kuikaeDisallowed: number[] = [];
  const calledId = discardTile.id;
  const suit = getSuit(calledId);
  if (suit !== SuitType.Jihai) {
    // 鳴いた牌と同じ牌IDは禁止
    kuikaeDisallowed.push(calledId);
    // スジの喰い替え: 順子の端にいる場合、反対側のスジ牌も禁止
    const meldIds = meldTiles.map(t => t.id).sort((a, b) => a - b);
    const base = suitStart(suit);
    const nums = meldIds.map(id => id - base); // 0-8
    // 例: 1-2-3 で 3 を鳴いたら → 4 は禁止 (not: 3は既に禁止)
    // 例: 7-8-9 で 7 を鳴いたら → 6 は禁止
    const calledNum = calledId - base;
    if (calledNum === nums[0] && nums[2] + 1 <= 8) {
      // 鳴いた牌が順子の左端 → 右端+1が禁止
      kuikaeDisallowed.push(base + nums[2] + 1);
    }
    if (calledNum === nums[2] && nums[0] - 1 >= 0) {
      // 鳴いた牌が順子の右端 → 左端-1が禁止
      kuikaeDisallowed.push(base + nums[0] - 1);
    }
  }

  caller.hand = {
    closed: sortTiles(newClosed),
    melds: [...caller.hand.melds, meld],
    tsumo: undefined,
  };
  caller.isMenzen = false;
  caller.kuikaeDisallowedTiles = kuikaeDisallowed;
  players[callerIdx] = caller;

  for (let i = 0; i < 4; i++) {
    if (players[i].isIppatsu) {
      players[i] = { ...players[i], isIppatsu: false };
    }
  }

  return {
    ...state,
    players,
    phase: 'discard',
    currentPlayer: callerIdx,
    lastDiscard: undefined,
    callOptions: undefined,
    round: { ...state.round, isFirstTurn: false },
  };
}

/** 大明槓処理（calling フェーズから呼ばれる） */
export function processMinKan(state: GameState, callerIdx: number): GameState {
  const discardTile = state.lastDiscard!.tile;
  const fromIdx = state.lastDiscard!.playerIndex;
  const players = [...state.players];
  const caller = { ...players[callerIdx] };

  // 手牌から3枚取り出す
  const closedTiles = [...caller.hand.closed];
  const kanTiles: TileInstance[] = [discardTile];
  let found = 0;
  const newClosed: TileInstance[] = [];
  for (const t of closedTiles) {
    if (t.id === discardTile.id && found < 3) {
      kanTiles.push(t);
      found++;
    } else {
      newClosed.push(t);
    }
  }

  const relativePos = ((fromIdx - callerIdx + 4) % 4) as 1 | 2 | 3;
  const meld: Meld = {
    type: MeldType.MinKan,
    tiles: kanTiles,
    calledTile: discardTile,
    fromPlayer: relativePos,
  };

  caller.hand = {
    closed: sortTiles(newClosed),
    melds: [...caller.hand.melds, meld],
    tsumo: undefined,
  };
  caller.isMenzen = false;
  players[callerIdx] = caller;

  // 全員の一発消し
  for (let i = 0; i < 4; i++) {
    if (players[i].isIppatsu) {
      players[i] = { ...players[i], isIppatsu: false };
    }
  }

  // 嶺上牌をツモ
  const rinResult = drawRinshan(
    state.wall, state.rinshanIndex,
    state.doraIndicators, state.uraDoraIndicators,
  );

  const updatedCaller = { ...players[callerIdx] };
  updatedCaller.hand = { ...updatedCaller.hand, tsumo: rinResult.tile };
  players[callerIdx] = updatedCaller;

  return {
    ...state,
    players,
    phase: 'discard',
    currentPlayer: callerIdx,
    lastDiscard: undefined,
    callOptions: undefined,
    rinshanIndex: rinResult.rinshanIndex,
    doraIndicators: rinResult.doraIndicators,
    uraDoraIndicators: rinResult.uraDoraIndicators,
    kanCount: state.kanCount + 1,
    round: { ...state.round, isFirstTurn: false },
  };
}

/** 暗槓処理 */
export function processAnKan(state: GameState, tileId: TileId): GameState {
  const playerIdx = state.currentPlayer;
  const players = [...state.players];
  const player = { ...players[playerIdx] };

  const allClosed = player.hand.tsumo
    ? [...player.hand.closed, player.hand.tsumo]
    : [...player.hand.closed];

  const kanTiles: TileInstance[] = [];
  const newClosed: TileInstance[] = [];
  for (const t of allClosed) {
    if (t.id === tileId && kanTiles.length < 4) {
      kanTiles.push(t);
    } else {
      newClosed.push(t);
    }
  }

  const meld: Meld = {
    type: MeldType.AnKan,
    tiles: kanTiles,
  };

  player.hand = {
    closed: sortTiles(newClosed),
    melds: [...player.hand.melds, meld],
    tsumo: undefined,
  };
  players[playerIdx] = player;

  // 嶺上牌をツモ
  const rinResult = drawRinshan(
    state.wall, state.rinshanIndex,
    state.doraIndicators, state.uraDoraIndicators,
  );

  player.hand = { ...player.hand, tsumo: rinResult.tile };
  players[playerIdx] = player;

  return {
    ...state,
    players,
    rinshanIndex: rinResult.rinshanIndex,
    doraIndicators: rinResult.doraIndicators,
    uraDoraIndicators: rinResult.uraDoraIndicators,
    kanCount: state.kanCount + 1,
    phase: 'discard',
  };
}

/** 加槓処理 */
export function processShouMinKan(state: GameState, tileId: TileId): GameState {
  const playerIdx = state.currentPlayer;
  const players = [...state.players];
  const player = { ...players[playerIdx] };

  const allClosed = player.hand.tsumo
    ? [...player.hand.closed, player.hand.tsumo]
    : [...player.hand.closed];

  let addedTile: TileInstance | undefined;
  const newClosed: TileInstance[] = [];
  for (const t of allClosed) {
    if (t.id === tileId && !addedTile) {
      addedTile = t;
    } else {
      newClosed.push(t);
    }
  }

  const newMelds = player.hand.melds.map(m => {
    if (m.type === MeldType.Pon && m.tiles[0].id === tileId) {
      return {
        type: MeldType.ShouMinKan,
        tiles: [...m.tiles, addedTile!],
        calledTile: m.calledTile,
        fromPlayer: m.fromPlayer,
      };
    }
    return m;
  });

  player.hand = {
    closed: sortTiles(newClosed),
    melds: newMelds,
    tsumo: undefined,
  };
  players[playerIdx] = player;

  const rinResult = drawRinshan(
    state.wall, state.rinshanIndex,
    state.doraIndicators, state.uraDoraIndicators,
  );

  player.hand = { ...player.hand, tsumo: rinResult.tile };
  players[playerIdx] = player;

  return {
    ...state,
    players,
    rinshanIndex: rinResult.rinshanIndex,
    doraIndicators: rinResult.doraIndicators,
    uraDoraIndicators: rinResult.uraDoraIndicators,
    kanCount: state.kanCount + 1,
    phase: 'discard',
  };
}

/** 荒牌流局処理 */
export function processExhaustiveDraw(state: GameState): GameState {
  const tenpaiPlayers: number[] = [];
  const players = [...state.players];

  for (let i = 0; i < 4; i++) {
    const p = players[i];
    const counts = toCount34(p.hand.closed);
    if (isTenpai(counts, p.hand.melds)) {
      tenpaiPlayers.push(i);
    }
  }

  const payments = [0, 0, 0, 0];
  if (tenpaiPlayers.length > 0 && tenpaiPlayers.length < 4) {
    const totalPay = 3000;
    const eachTenpai = Math.floor(totalPay / tenpaiPlayers.length);
    const eachNoten = Math.floor(totalPay / (4 - tenpaiPlayers.length));

    for (let i = 0; i < 4; i++) {
      if (tenpaiPlayers.includes(i)) {
        payments[i] = eachTenpai;
      } else {
        payments[i] = -eachNoten;
      }
    }

    for (let i = 0; i < 4; i++) {
      players[i] = { ...players[i], score: players[i].score + payments[i] };
    }
  }

  const drawResult: DrawResult = {
    type: 'exhaustive',
    tenpaiPlayers,
    payments,
  };

  return {
    ...state,
    players,
    phase: 'round_result',
    roundResult: { draw: drawResult },
  };
}

/** 次の局へ進む */
export function advanceRound(state: GameState): GameState {
  const result = state.roundResult;
  if (!result) return state;

  let { bakaze, kyoku, honba, riichiSticks } = state.round;
  const isAgari = result.agari && result.agari.length > 0;
  const oyaIndex = kyoku % 4;

  if (isAgari) {
    const oyaWon = result.agari!.some(a => a.winner === oyaIndex);
    riichiSticks = 0; // 供託はアガリ者が取得済み

    if (oyaWon) {
      // 連荘
      honba++;
    } else {
      // 親流れ
      kyoku++;
      honba = 0;
    }
  } else {
    // 流局
    const oyaTenpai = result.draw?.tenpaiPlayers.includes(oyaIndex);
    if (oyaTenpai) {
      honba++;
    } else {
      kyoku++;
      honba++;
    }
  }

  // ゲーム終了判定
  const maxKyoku = state.rules.gameType === 'tonpu' ? 4 : 8;
  if (kyoku >= maxKyoku) {
    // 場風更新
    if (kyoku >= 4 && bakaze === 0) {
      bakaze = 1 as Wind;
      kyoku = 4;
    }
    if (kyoku >= maxKyoku) {
      return { ...state, phase: 'game_result' };
    }
  }

  const newState: GameState = {
    ...state,
    round: {
      ...state.round,
      bakaze,
      kyoku,
      honba,
      riichiSticks,
    },
  };

  return startRound(newState);
}

/** スコア変動を適用 */
function applyScoreChange(players: Player[], agari: AgariResult, riichiSticks: number): Player[] {
  const result = [...players];
  const payment = agari.scoreResult.payment;

  if (agari.isTsumo) {
    for (let i = 0; i < 4; i++) {
      if (i === agari.winner) {
        result[i] = { ...result[i], score: result[i].score + payment.total + riichiSticks * 1000 };
      } else {
        const isOya = result[i].seatWind === 0;
        const pay = isOya ? (payment.tsumoOya ?? payment.tsumoKo!) : payment.tsumoKo!;
        result[i] = { ...result[i], score: result[i].score - pay };
      }
    }
  } else {
    result[agari.winner] = {
      ...result[agari.winner],
      score: result[agari.winner].score + payment.total + riichiSticks * 1000,
    };
    result[agari.loser] = {
      ...result[agari.loser],
      score: result[agari.loser].score - payment.ron!,
    };
  }

  return result;
}

/** 次のプレイヤーへ進む */
function advanceToNextPlayer(state: GameState, players: Player[], fromIdx?: number): GameState {
  const nextIdx = fromIdx !== undefined
    ? (fromIdx + 1) % 4
    : (state.currentPlayer + 1) % 4;

  const newTurn = fromIdx === undefined ? state.round.turn + 1 : state.round.turn;

  return {
    ...state,
    players,
    currentPlayer: nextIdx,
    phase: 'tsumo',
    round: {
      ...state.round,
      turn: newTurn,
      isFirstTurn: state.round.isFirstTurn && nextIdx !== 0,
    },
  };
}

/** リーチ可能かチェック */
export function canRiichi(state: GameState, playerIdx: number): TileInstance[] {
  const player = state.players[playerIdx];
  if (!player.isMenzen || player.isRiichi || player.score < 1000) return [];

  const allClosed = player.hand.tsumo
    ? [...player.hand.closed, player.hand.tsumo]
    : player.hand.closed;

  const riichiDiscards: TileInstance[] = [];

  for (const tile of allClosed) {
    const tempClosed = allClosed.filter(t => t.index !== tile.index);
    const counts = toCount34(tempClosed);
    if (getWaitingTiles(counts, player.hand.melds).length > 0) {
      // 同じIDの牌が既にある場合は1つだけ追加
      if (!riichiDiscards.some(t => t.id === tile.id)) {
        riichiDiscards.push(tile);
      }
    }
  }

  return riichiDiscards;
}

/** 暗槓可能な牌 */
export function canAnKan(state: GameState, playerIdx: number): TileId[] {
  const player = state.players[playerIdx];
  const allClosed = player.hand.tsumo
    ? [...player.hand.closed, player.hand.tsumo]
    : player.hand.closed;
  const counts = toCount34(allClosed);

  // リーチ中は待ちが変わらない暗槓のみ
  if (player.isRiichi) {
    const currentWaits = getWaitingTiles(counts, player.hand.melds);
    const ankans = getAnKanTiles(counts);
    return ankans.filter(tileId => {
      const tempCounts = [...counts];
      tempCounts[tileId] -= 4;
      // 面子分解できるか簡易チェック
      const newWaits = getWaitingTiles(tempCounts, [
        ...player.hand.melds,
        { type: MeldType.AnKan, tiles: [] },
      ]);
      return newWaits.length > 0 &&
        currentWaits.every(w => newWaits.includes(w)) &&
        newWaits.every(w => currentWaits.includes(w));
    });
  }

  return getAnKanTiles(counts);
}

/** 加槓可能な牌 */
export function canShouMinKan(state: GameState, playerIdx: number): TileId[] {
  const player = state.players[playerIdx];
  if (player.isRiichi) return []; // リーチ中は加槓不可

  const allClosed = player.hand.tsumo
    ? [...player.hand.closed, player.hand.tsumo]
    : player.hand.closed;
  const counts = toCount34(allClosed);
  return getShouMinKanTiles(counts, player.hand.melds);
}

// ================== フリテン判定 ==================

/**
 * ロンを見逃した場合の同巡フリテン設定
 * リーチ中の見逃しは永久フリテン（isFuriten=trueが維持される）
 */
export function applyRonSkipFuriten(state: GameState, playerIdx: number): GameState {
  const players = [...state.players];
  const player = { ...players[playerIdx] };

  if (player.isRiichi) {
    // リーチ後の見逃しは永久フリテン
    player.isFuriten = true;
  } else {
    // 同巡フリテン（次の自分のツモでリセット）
    player.tempFuriten = true;
  }

  players[playerIdx] = player;
  return { ...state, players };
}

/** 役の有無チェック（ロン可否判定用） */
function checkHasYaku(
  agari: AgariInfo,
  closedCounts: TileCount34,
  player: Player,
  agariTileId: TileId,
  state: GameState,
): boolean {
  const ctx: YakuContext = {
    closedCounts,
    melds: player.hand.melds,
    agariTile: agariTileId,
    isTsumo: false,
    isMenzen: player.isMenzen,
    seatWind: player.seatWind,
    roundWind: state.round.bakaze,
    isRiichi: player.isRiichi,
    isDoubleRiichi: player.isDoubleRiichi,
    isIppatsu: player.isIppatsu,
    isHaitei: false,
    isHoutei: state.round.remainingTiles === 0,
    isRinshan: false,
    isChankan: false,
    isTenhou: false,
    isChiihou: false,
    kuitan: state.rules.kuitan,
  };

  if (agari.type === 'chiitoitsu') {
    return checkYakuChiitoitsu(ctx).length > 0;
  }
  if (agari.type === 'kokushi') {
    return checkYakuKokushi(ctx).length > 0;
  }
  for (const decomp of agari.decompositions) {
    if (checkYakuRegular(ctx, decomp).length > 0) return true;
  }
  return false;
}

/** 捨て牌フリテン: 自分の待ち牌が自分の捨て牌にあるか */
function checkDiscardFuriten(player: Player): boolean {
  const counts = toCount34(player.hand.closed);
  const totalClosed = counts.reduce((a, b) => a + b, 0);
  const meldCount = player.hand.melds.length;
  const expectedClosed = 13 - meldCount * 3;
  if (totalClosed !== expectedClosed) return false;

  const waits = getWaitingTiles(counts, player.hand.melds);
  if (waits.length === 0) return false;

  // 自分の捨て牌に待ち牌が含まれているか
  const discardIds = new Set(player.discards.map(t => t.id));
  return waits.some(w => discardIds.has(w));
}

// ================== 流局判定 ==================

/** 九種九牌が可能か */
export function canKyuushuKyuhai(state: GameState, playerIdx: number): boolean {
  if (!state.round.isFirstTurn) return false;
  const player = state.players[playerIdx];
  // 鳴きが入っていたら不可
  if (player.hand.melds.length > 0) return false;

  const allTiles = player.hand.tsumo
    ? [...player.hand.closed, player.hand.tsumo]
    : player.hand.closed;

  const yaochuKinds = new Set<number>();
  for (const t of allTiles) {
    if (isYaochu(t.id)) {
      yaochuKinds.add(t.id);
    }
  }
  return yaochuKinds.size >= 9;
}

/** 九種九牌による流局処理 */
export function processKyuushuKyuhai(state: GameState): GameState {
  const drawResult: DrawResult = {
    type: 'kyuushu',
    tenpaiPlayers: [],
    payments: [0, 0, 0, 0],
  };
  return {
    ...state,
    phase: 'round_result',
    roundResult: { draw: drawResult },
  };
}

/** 四家立直チェック */
export function checkSuuchariichi(state: GameState): boolean {
  return state.players.filter(p => p.isRiichi).length >= 4;
}

/** 四槓散了チェック（4回以上の槓が複数プレイヤーによって行われた） */
export function checkSuukaikan(state: GameState): boolean {
  if (state.kanCount < 4) return false;
  // 1人が4回なら四槓子の可能性があるので流局しない
  const kanCountPerPlayer = state.players.map(p =>
    p.hand.melds.filter(m =>
      m.type === MeldType.AnKan || m.type === MeldType.MinKan || m.type === MeldType.ShouMinKan
    ).length
  );
  const playersWithKan = kanCountPerPlayer.filter(c => c > 0).length;
  return playersWithKan >= 2;
}

/** 四風連打チェック（最初の巡回で4人全員が同じ風牌を捨てた） */
export function checkSuufonrenda(state: GameState): boolean {
  // 各プレイヤーの最初の捨て牌を確認
  for (const p of state.players) {
    if (p.discards.length === 0) return false;
  }
  const firstDiscards = state.players.map(p => p.discards[0].id);
  // 全て同じ風牌か
  const first = firstDiscards[0];
  if (!isKaze(first)) return false;
  return firstDiscards.every(id => id === first);
}

/** 流局結果を生成（四家立直、四槓散了、四風連打用） */
export function processAbortiveDraw(state: GameState, type: DrawResult['type']): GameState {
  const drawResult: DrawResult = {
    type,
    tenpaiPlayers: [],
    payments: [0, 0, 0, 0],
  };
  return {
    ...state,
    phase: 'round_result',
    roundResult: { draw: drawResult },
  };
}

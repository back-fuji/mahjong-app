import { create } from 'zustand';
import type { GameState, GameRules } from '../core/types/game-state.ts';
import { DEFAULT_RULES } from '../core/types/game-state.ts';
import type { TileInstance, TileId } from '../core/types/tile.ts';
import type { CallOption } from '../core/types/meld.ts';
import { MeldType } from '../core/types/meld.ts';
import {
  initGame, processTsumo, processDiscard, processRiichi,
  processTsumoAgari, processRon, processPon, processChi,
  processAnKan, processShouMinKan,
  checkTsumoAgari, canRiichi, canAnKan, canShouMinKan,
  advanceRound,
} from '../core/state/game-engine.ts';
import { toCount34 } from '../core/tile/tile-utils.ts';
import { checkAgari } from '../core/agari/agari.ts';
import { chooseDiscard, shouldCallPon, shouldCallChi, shouldRiichi, shouldTsumoAgari } from '../ai/strategy/strategy.ts';

interface GameStore {
  // State
  gameState: GameState | null;
  humanPlayerIndex: number;
  selectedTile: TileInstance | null;
  screen: 'menu' | 'game' | 'result' | 'lobby';

  // Actions
  setScreen: (screen: 'menu' | 'game' | 'result' | 'lobby') => void;
  startGame: (rules?: GameRules) => void;
  setSelectedTile: (tile: TileInstance | null) => void;
  discardTile: (tile: TileInstance) => void;
  declareRiichi: (tile: TileInstance) => void;
  declareTsumoAgari: () => void;
  declareRon: () => void;
  callPon: () => void;
  callChi: (option: CallOption) => void;
  callKan: (tileId?: TileId) => void;
  skipCall: () => void;
  nextRound: () => void;
  backToMenu: () => void;

  // Computed helpers
  getAvailableActions: () => AvailableActions;
}

export interface AvailableActions {
  canDiscard: boolean;
  canTsumoAgari: boolean;
  canRon: boolean;
  canRiichi: boolean;
  riichiTiles: TileInstance[];
  canChi: boolean;
  chiOptions: CallOption[];
  canPon: boolean;
  canKan: boolean;
  kanTiles: TileId[];
  canSkip: boolean;
}

function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

export const useGameStore = create<GameStore>((set, get) => {

  /** CPUのターンを処理 */
  async function processCpuTurn() {
    await delay(400);
    const state = get().gameState;
    if (!state) return;
    const humanIdx = get().humanPlayerIndex;

    // ツモフェーズ
    if (state.phase === 'tsumo' && state.currentPlayer !== humanIdx) {
      let newState = processTsumo(state);

      if (newState.phase === 'round_result') {
        set({ gameState: newState });
        return;
      }

      // CPU打牌
      const cpuPlayer = newState.players[newState.currentPlayer];

      // ツモ和了チェック
      if (checkTsumoAgari(newState)) {
        if (shouldTsumoAgari()) {
          newState = processTsumoAgari(newState);
          set({ gameState: newState });
          return;
        }
      }

      // 暗槓チェック
      const ankans = canAnKan(newState, newState.currentPlayer);
      if (ankans.length > 0 && !cpuPlayer.isRiichi) {
        newState = processAnKan(newState, ankans[0]);
        set({ gameState: newState });
        await delay(300);
        // 槓後のツモ処理は再帰
        processCpuTurn();
        return;
      }

      // リーチチェック
      const riichiTiles = canRiichi(newState, newState.currentPlayer);
      if (riichiTiles.length > 0) {
        const closedCounts = toCount34(cpuPlayer.hand.closed);
        if (shouldRiichi(closedCounts)) {
          const discardTile = chooseDiscard(cpuPlayer.hand.closed, cpuPlayer.hand.tsumo);
          // リーチ可能な牌でフィルタ
          const riichiDiscard = riichiTiles.find(t => t.id === discardTile.id) ?? riichiTiles[0];
          newState = processRiichi(newState, riichiDiscard);
          set({ gameState: newState });
          await delay(300);
          processCpuCallResponse();
          return;
        }
      }

      // 通常打牌
      if (cpuPlayer.isRiichi) {
        // リーチ中はツモ切り
        const tile = cpuPlayer.hand.tsumo ?? cpuPlayer.hand.closed[cpuPlayer.hand.closed.length - 1];
        newState = processDiscard(newState, tile);
      } else {
        const discardTile = chooseDiscard(cpuPlayer.hand.closed, cpuPlayer.hand.tsumo);
        newState = processDiscard(newState, discardTile);
      }

      set({ gameState: newState });

      await delay(200);
      processCpuCallResponse();
      return;
    }
  }

  /** 鳴き応答フェーズのCPU処理 */
  async function processCpuCallResponse() {
    const state = get().gameState;
    if (!state || state.phase !== 'calling') {
      // callingフェーズでなければ次のツモへ
      const gs = get().gameState;
      if (gs && gs.phase === 'tsumo') {
        processCpuTurn();
      }
      return;
    }

    const humanIdx = get().humanPlayerIndex;
    const callOptions = state.callOptions;
    if (!callOptions) {
      set({ gameState: { ...state, phase: 'tsumo', currentPlayer: (state.currentPlayer + 1) % 4 } });
      processCpuTurn();
      return;
    }

    // 人間プレイヤーに鳴きオプションがあるか
    const humanOpts = callOptions.get(humanIdx);
    if (humanOpts && humanOpts.length > 0) {
      // ロンチェック（人間用）
      const discardTile = state.lastDiscard?.tile;
      if (discardTile) {
        const humanPlayer = state.players[humanIdx];
        const counts = toCount34(humanPlayer.hand.closed);
        counts[discardTile.id]++;
        const agari = checkAgari(counts, humanPlayer.hand.melds);
        if (agari) {
          // 人間がロンできる → 人間の入力を待つ
          return;
        }
      }

      // ポン・チーオプションがあれば人間の入力を待つ
      const hasPonOrChi = humanOpts.some(o =>
        o.type === MeldType.Pon || o.type === MeldType.Chi || o.type === MeldType.MinKan
      );
      if (hasPonOrChi) return;
    }

    // CPU の鳴き判断
    let bestCaller = -1;
    let bestAction: { type: 'pon' | 'ron'; option?: CallOption } | null = null;

    for (const [playerIdx, opts] of callOptions.entries()) {
      if (playerIdx === humanIdx) continue;

      const player = state.players[playerIdx];
      const closedCounts = toCount34(player.hand.closed);

      // ロンチェック
      const discardTile = state.lastDiscard?.tile;
      if (discardTile) {
        const tempCounts = [...closedCounts];
        tempCounts[discardTile.id]++;
        const agari = checkAgari(tempCounts, player.hand.melds);
        if (agari) {
          bestCaller = playerIdx;
          bestAction = { type: 'ron' };
          break;
        }
      }

      // ポンチェック
      const ponOpt = opts.find(o => o.type === MeldType.Pon);
      if (ponOpt && shouldCallPon(ponOpt, closedCounts)) {
        bestCaller = playerIdx;
        bestAction = { type: 'pon', option: ponOpt };
      }
    }

    if (bestAction && bestCaller >= 0) {
      await delay(300);
      let newState: GameState;

      if (bestAction.type === 'ron') {
        newState = processRon(state, bestCaller);
      } else {
        const cpuPlayer = state.players[bestCaller];
        const discardAfter = chooseDiscard(cpuPlayer.hand.closed, undefined);
        newState = processPon(state, bestCaller, discardAfter);
      }

      set({ gameState: newState });

      if (newState.phase === 'tsumo') {
        await delay(300);
        processCpuTurn();
      }
      return;
    }

    // チーチェック（下家のCPUのみ）
    const nextPlayer = (state.lastDiscard!.playerIndex + 1) % 4;
    if (nextPlayer !== humanIdx) {
      const chiOpts = callOptions.get(nextPlayer);
      if (chiOpts) {
        const chiOpt = chiOpts.find(o => o.type === MeldType.Chi);
        if (chiOpt) {
          const cpuClosed = toCount34(state.players[nextPlayer].hand.closed);
          if (shouldCallChi(chiOpt, cpuClosed)) {
            await delay(300);
            const cpuPlayer = state.players[nextPlayer];
            const discardAfter = chooseDiscard(cpuPlayer.hand.closed, undefined);
            const newState = processChi(state, nextPlayer, chiOpt.tiles, discardAfter);
            set({ gameState: newState });

            if (newState.phase === 'tsumo') {
              await delay(300);
              processCpuTurn();
            }
            return;
          }
        }
      }
    }

    // 誰も鳴かない → 次のプレイヤー
    const nextIdx = (state.lastDiscard!.playerIndex + 1) % 4;
    const newState: GameState = {
      ...state,
      phase: 'tsumo',
      currentPlayer: nextIdx,
      callOptions: undefined,
      round: {
        ...state.round,
        turn: state.round.turn + 1,
        isFirstTurn: false,
      },
    };
    set({ gameState: newState });

    if (nextIdx !== humanIdx) {
      await delay(200);
      processCpuTurn();
    }
  }

  return {
    gameState: null,
    humanPlayerIndex: 0,
    selectedTile: null,
    screen: 'menu',

    setScreen: (screen) => set({ screen }),

    startGame: (rules = DEFAULT_RULES) => {
      const state = initGame(
        ['あなた', 'CPU 1', 'CPU 2', 'CPU 3'],
        [true, false, false, false],
        rules,
      );
      // 配牌後、親がツモ
      const afterTsumo = processTsumo(state);
      set({ gameState: afterTsumo, screen: 'game', selectedTile: null });

      // 親が人間でなければCPU処理開始
      if (afterTsumo.currentPlayer !== 0) {
        processCpuTurn();
      }
    },

    setSelectedTile: (tile) => set({ selectedTile: tile }),

    discardTile: (tile) => {
      const state = get().gameState;
      if (!state || state.phase !== 'discard') return;
      if (state.currentPlayer !== get().humanPlayerIndex) return;

      const newState = processDiscard(state, tile);
      set({ gameState: newState, selectedTile: null });

      // 鳴き応答処理
      setTimeout(() => processCpuCallResponse(), 300);
    },

    declareRiichi: (tile) => {
      const state = get().gameState;
      if (!state) return;

      const newState = processRiichi(state, tile);
      set({ gameState: newState, selectedTile: null });

      setTimeout(() => processCpuCallResponse(), 300);
    },

    declareTsumoAgari: () => {
      const state = get().gameState;
      if (!state) return;

      const newState = processTsumoAgari(state);
      set({ gameState: newState });
    },

    declareRon: () => {
      const state = get().gameState;
      if (!state) return;

      const newState = processRon(state, get().humanPlayerIndex);
      set({ gameState: newState });
    },

    callPon: () => {
      const state = get().gameState;
      if (!state || state.phase !== 'calling') return;

      const humanIdx = get().humanPlayerIndex;
      const player = state.players[humanIdx];
      const discardAfter = chooseDiscard(player.hand.closed, undefined);
      const newState = processPon(state, humanIdx, discardAfter);
      set({ gameState: newState, selectedTile: null });

      if (newState.phase === 'tsumo' && newState.currentPlayer !== humanIdx) {
        setTimeout(() => processCpuTurn(), 300);
      }
    },

    callChi: (option) => {
      const state = get().gameState;
      if (!state || state.phase !== 'calling') return;

      const humanIdx = get().humanPlayerIndex;
      const player = state.players[humanIdx];
      const discardAfter = chooseDiscard(player.hand.closed, undefined);
      const newState = processChi(state, humanIdx, option.tiles, discardAfter);
      set({ gameState: newState, selectedTile: null });

      if (newState.phase === 'tsumo' && newState.currentPlayer !== humanIdx) {
        setTimeout(() => processCpuTurn(), 300);
      }
    },

    callKan: (tileId) => {
      const state = get().gameState;
      if (!state) return;

      const humanIdx = get().humanPlayerIndex;
      const ankans = canAnKan(state, humanIdx);
      const shouminkan = canShouMinKan(state, humanIdx);

      let newState: GameState;
      if (tileId !== undefined) {
        if (ankans.includes(tileId)) {
          newState = processAnKan(state, tileId);
        } else {
          newState = processShouMinKan(state, tileId);
        }
      } else {
        // 最初の槓可能牌
        const kanTile = ankans[0] ?? shouminkan[0];
        if (kanTile === undefined) return;
        if (ankans.includes(kanTile)) {
          newState = processAnKan(state, kanTile);
        } else {
          newState = processShouMinKan(state, kanTile);
        }
      }

      set({ gameState: newState, selectedTile: null });
    },

    skipCall: () => {
      const state = get().gameState;
      if (!state || state.phase !== 'calling') return;

      const nextIdx = (state.lastDiscard!.playerIndex + 1) % 4;
      const newState: GameState = {
        ...state,
        phase: 'tsumo',
        currentPlayer: nextIdx,
        callOptions: undefined,
        round: {
          ...state.round,
          turn: state.round.turn + 1,
          isFirstTurn: false,
        },
      };
      set({ gameState: newState });

      if (nextIdx !== get().humanPlayerIndex) {
        setTimeout(() => processCpuTurn(), 200);
      } else {
        // 人間のツモ
        const afterTsumo = processTsumo(newState);
        set({ gameState: afterTsumo });
      }
    },

    nextRound: () => {
      const state = get().gameState;
      if (!state) return;

      const newState = advanceRound(state);

      if (newState.phase === 'game_result') {
        set({ gameState: newState, screen: 'result' });
        return;
      }

      // 新しい局: 親のツモ
      const afterTsumo = processTsumo(newState);
      set({ gameState: afterTsumo });

      if (afterTsumo.currentPlayer !== get().humanPlayerIndex) {
        setTimeout(() => processCpuTurn(), 300);
      }
    },

    backToMenu: () => {
      set({ gameState: null, screen: 'menu', selectedTile: null });
    },

    getAvailableActions: () => {
      const state = get().gameState;
      const humanIdx = get().humanPlayerIndex;

      const empty: AvailableActions = {
        canDiscard: false, canTsumoAgari: false, canRon: false,
        canRiichi: false, riichiTiles: [], canChi: false, chiOptions: [],
        canPon: false, canKan: false, kanTiles: [], canSkip: false,
      };

      if (!state) return empty;

      const player = state.players[humanIdx];

      if (state.phase === 'discard' && state.currentPlayer === humanIdx) {
        const riichiTiles = canRiichi(state, humanIdx);
        const ankans = canAnKan(state, humanIdx);
        const shouminkan = canShouMinKan(state, humanIdx);
        const kanTiles = [...ankans, ...shouminkan];

        return {
          ...empty,
          canDiscard: true,
          canTsumoAgari: checkTsumoAgari(state),
          canRiichi: riichiTiles.length > 0,
          riichiTiles,
          canKan: kanTiles.length > 0,
          kanTiles,
        };
      }

      if (state.phase === 'calling') {
        const opts = state.callOptions?.get(humanIdx);
        if (!opts || opts.length === 0) return empty;

        // ロンチェック
        let canRonFlag = false;
        const discardTile = state.lastDiscard?.tile;
        if (discardTile) {
          const counts = toCount34(player.hand.closed);
          counts[discardTile.id]++;
          canRonFlag = !!checkAgari(counts, player.hand.melds);
        }

        const ponOpt = opts.find(o => o.type === MeldType.Pon);
        const chiOpts = opts.filter(o => o.type === MeldType.Chi);
        const minkanOpt = opts.find(o => o.type === MeldType.MinKan);

        return {
          ...empty,
          canRon: canRonFlag,
          canPon: !!ponOpt,
          canChi: chiOpts.length > 0,
          chiOptions: chiOpts,
          canKan: !!minkanOpt,
          kanTiles: minkanOpt ? [minkanOpt.calledTile] : [],
          canSkip: true,
        };
      }

      return empty;
    },
  };
});

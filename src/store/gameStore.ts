import { create } from 'zustand';
import type { GameState, GameRules } from '../core/types/game-state.ts';
import { DEFAULT_RULES } from '../core/types/game-state.ts';
import type { TileInstance, TileId } from '../core/types/tile.ts';
import type { CallOption } from '../core/types/meld.ts';
import { MeldType } from '../core/types/meld.ts';
import {
  initGame, processTsumo, processDiscard, processRiichi,
  processTsumoAgari, processRon, processPon, processChi,
  processAnKan, processShouMinKan, processMinKan,
  checkTsumoAgari, canRiichi, canAnKan, canShouMinKan,
  canKyuushuKyuhai, processKyuushuKyuhai,
  checkSuuchariichi, checkSuukaikan,
  processAbortiveDraw,
  advanceRound,
  applyRonSkipFuriten,
} from '../core/state/game-engine.ts';
import { toCount34 } from '../core/tile/tile-utils.ts';
import { chooseDiscard } from '../ai/strategy/strategy.ts';
import { aiChooseDiscard, aiShouldCallPon, aiShouldCallChi, aiShouldRiichi, aiShouldTsumoAgari } from '../ai/strategy/ai-controller.ts';
import { useSettingsStore } from './settingsStore.ts';
import { soundEngine } from '../audio/sound-engine.ts';
import { replayRecorder } from '../replay/replay-recorder.ts';

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
  declareKyuushu: () => void;
  nextRound: () => void;
  backToMenu: () => void;
  loadGameState: (state: GameState, humanIdx: number) => void;

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
  canKyuushu: boolean;
  /** 鳴き対象の手牌TileId（ハイライト用） */
  callHighlightTiles: TileId[];
  /** 喰い替え禁止牌IDリスト（打牌不可） */
  kuikaeDisallowedTiles: TileId[];
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

    // discard フェーズで CPU の番（ポン/チー後、暗槓後など）
    if (state.phase === 'discard' && state.currentPlayer !== humanIdx) {
      await processCpuDiscard(state);
      return;
    }

    // ツモフェーズ
    if (state.phase === 'tsumo' && state.currentPlayer !== humanIdx) {
      let newState = processTsumo(state);
      soundEngine.playDrawSound();

      if (newState.phase === 'round_result') {
        set({ gameState: newState });
        return;
      }

      // CPU打牌
      const cpuPlayer = newState.players[newState.currentPlayer];

      // ツモ和了チェック
      const aiDifficulty = useSettingsStore.getState().aiDifficulty;
      if (checkTsumoAgari(newState)) {
        if (aiShouldTsumoAgari(aiDifficulty)) {
          soundEngine.playAgariVoice('tsumo');
          replayRecorder.record('tsumo_agari', newState.currentPlayer);
          newState = processTsumoAgari(newState);
          set({ gameState: newState });
          replayRecorder.stop(newState.players.map(p => p.score)).catch(() => {});
          return;
        }
      }

      // 九種九牌チェック（CPU は常に宣言する）
      if (canKyuushuKyuhai(newState, newState.currentPlayer)) {
        newState = processKyuushuKyuhai(newState);
        set({ gameState: newState });
        return;
      }

      // 暗槓チェック
      const ankans = canAnKan(newState, newState.currentPlayer);
      if (ankans.length > 0 && !cpuPlayer.isRiichi) {
        newState = processAnKan(newState, ankans[0]);
        if (checkSuukaikan(newState)) {
          newState = processAbortiveDraw(newState, 'suukaikan');
          set({ gameState: newState });
          return;
        }
        set({ gameState: newState });
        // 鳴き演出(800ms)が終わるまで待機してからCPU打牌
        await delay(1000);
        await processCpuDiscard(newState);
        return;
      }

      // リーチチェック
      const riichiTiles = canRiichi(newState, newState.currentPlayer);
      if (riichiTiles.length > 0) {
        const closedCounts = toCount34(cpuPlayer.hand.closed);
        if (aiShouldRiichi(newState, newState.currentPlayer, closedCounts, aiDifficulty)) {
          const discardTile = aiChooseDiscard(newState, newState.currentPlayer, aiDifficulty);
          // リーチ可能な牌でフィルタ
          const riichiDiscard = riichiTiles.find(t => t.id === discardTile.id) ?? riichiTiles[0];
          soundEngine.playRiichiVoice();
          replayRecorder.record('riichi', newState.currentPlayer, { tileId: riichiDiscard.id });
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
        const discardTile = aiChooseDiscard(newState, newState.currentPlayer, aiDifficulty);
        newState = processDiscard(newState, discardTile);
      }

      set({ gameState: newState });

      await delay(200);
      processCpuCallResponse();
      return;
    }
  }

  /** CPU の打牌処理（ポン/チー後など、discard フェーズから呼ばれる） */
  async function processCpuDiscard(currentState: GameState) {
    const state = currentState;
    const cpuIdx = state.currentPlayer;
    const cpuPlayer = state.players[cpuIdx];

    const aiDifficulty = useSettingsStore.getState().aiDifficulty;
    let discardTile: TileInstance;
    if (cpuPlayer.isRiichi) {
      discardTile = cpuPlayer.hand.tsumo ?? cpuPlayer.hand.closed[cpuPlayer.hand.closed.length - 1];
    } else {
      let chosen = aiChooseDiscard(state, cpuIdx, aiDifficulty);
      // 喰い替え禁止牌チェック
      if (cpuPlayer.kuikaeDisallowedTiles.length > 0 && cpuPlayer.kuikaeDisallowedTiles.includes(chosen.id)) {
        const allTiles = cpuPlayer.hand.tsumo
          ? [...cpuPlayer.hand.closed, cpuPlayer.hand.tsumo]
          : [...cpuPlayer.hand.closed];
        const allowed = allTiles.filter(t => !cpuPlayer.kuikaeDisallowedTiles.includes(t.id));
        chosen = allowed.length > 0 ? chooseDiscard(allowed, undefined) : chosen;
      }
      discardTile = chosen;
    }

    soundEngine.playDiscardSound();
    replayRecorder.record('discard', cpuIdx, { tileId: discardTile.id, tileIndex: discardTile.index });
    const newState = processDiscard(state, discardTile);
    set({ gameState: newState });

    await delay(200);
    processCpuCallResponse();
  }

  /** 鳴き応答フェーズのCPU処理 */
  async function processCpuCallResponse() {
    const state = get().gameState;
    if (!state) return;

    if (state.phase !== 'calling') {
      // callingフェーズでなければ次のツモへ
      if (state.phase === 'tsumo') {
        const humanIdx = get().humanPlayerIndex;
        if (state.currentPlayer === humanIdx) {
          // 人間の番 → ツモ処理
          const afterTsumo = processTsumo(state);
          set({ gameState: afterTsumo });
        } else {
          processCpuTurn();
        }
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
      // ロンチェック（'ron' タイプで判定）
      if (humanOpts.some(o => o.type === 'ron')) {
        // 人間がロンできる → 人間の入力を待つ
        return;
      }

      // ポン・チーオプションがあれば人間の入力を待つ（チーは上家からのみ）
      const kamicha = (humanIdx + 3) % 4;
      const hasPonOrChi = humanOpts.some(o => {
        if (o.type === MeldType.Pon || o.type === MeldType.MinKan) return true;
        if (o.type === MeldType.Chi && state.lastDiscard?.playerIndex === kamicha) return true;
        return false;
      });
      if (hasPonOrChi) return;
    }

    // CPU の鳴き判断
    let bestCaller = -1;
    let bestAction: { type: 'pon' | 'ron' | 'minkan'; option?: CallOption } | null = null;

    for (const [playerIdx, opts] of callOptions.entries()) {
      if (playerIdx === humanIdx) continue;

      const player = state.players[playerIdx];
      const closedCounts = toCount34(player.hand.closed);
      const aiDiff = useSettingsStore.getState().aiDifficulty;

      // ロンチェック（'ron' タイプで判定）
      const ronOpt = opts.find(o => o.type === 'ron');
      if (ronOpt) {
        bestCaller = playerIdx;
        bestAction = { type: 'ron' };
        break;
      }

      // ポンチェック
      const ponOpt = opts.find(o => o.type === MeldType.Pon);
      if (ponOpt && aiShouldCallPon(state, playerIdx, ponOpt, closedCounts, aiDiff)) {
        bestCaller = playerIdx;
        bestAction = { type: 'pon', option: ponOpt };
      }
    }

    if (bestAction && bestCaller >= 0) {
      await delay(300);
      let newState: GameState;

      if (bestAction.type === 'ron') {
        soundEngine.playAgariVoice('ron');
        replayRecorder.record('ron', bestCaller);
        newState = processRon(state, bestCaller);
        set({ gameState: newState });
        replayRecorder.stop(newState.players.map(p => p.score)).catch(() => {});
        return;
      } else if (bestAction.type === 'minkan') {
        soundEngine.playCallSound('kan');
        replayRecorder.record('minkan', bestCaller);
        newState = processMinKan(state, bestCaller);
        set({ gameState: newState });
        // 鳴き演出(800ms)が終わるまで待機してからCPU打牌
        await delay(1000);
        processCpuDiscard(newState);
        return;
      } else {
        soundEngine.playCallSound('pon');
        replayRecorder.record('pon', bestCaller);
        newState = processPon(state, bestCaller);
        set({ gameState: newState });
        // 鳴き演出(800ms)が終わるまで待機してからCPU打牌
        await delay(1000);
        processCpuDiscard(newState);
        return;
      }
    }

    // チーチェック（下家のCPUのみ）
    const nextPlayer = (state.lastDiscard!.playerIndex + 1) % 4;
    if (nextPlayer !== humanIdx) {
      const chiOpts = callOptions.get(nextPlayer);
      if (chiOpts) {
        const chiOpt = chiOpts.find(o => o.type === MeldType.Chi);
        if (chiOpt) {
          const cpuClosed = toCount34(state.players[nextPlayer].hand.closed);
          const aiDiff2 = useSettingsStore.getState().aiDifficulty;
          if (aiShouldCallChi(state, nextPlayer, chiOpt, cpuClosed, aiDiff2)) {
            soundEngine.playCallSound('chi');
            replayRecorder.record('chi', nextPlayer, { tiles: chiOpt.tiles });
            await delay(300);
            const newState = processChi(state, nextPlayer, chiOpt.tiles);
            set({ gameState: newState });
            // 鳴き演出(800ms)が終わるまで待機してからCPU打牌
            await delay(1000);
            processCpuDiscard(newState);
            return;
          }
        }
      }
    }

    // 四家立直チェック
    if (checkSuuchariichi(state)) {
      const drawState = processAbortiveDraw(state, 'suuchariichi');
      set({ gameState: drawState });
      return;
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

    if (nextIdx !== humanIdx) {
      set({ gameState: newState });
      await delay(200);
      processCpuTurn();
    } else {
      // 人間の番 → ツモ処理
      const afterTsumo = processTsumo(newState);
      set({ gameState: afterTsumo });
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
      // リプレイ記録開始
      replayRecorder.start(state);

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

      soundEngine.playDiscardSound();
      replayRecorder.record('discard', state.currentPlayer, { tileId: tile.id, tileIndex: tile.index });
      const newState = processDiscard(state, tile);
      set({ gameState: newState, selectedTile: null });

      // 鳴き応答処理
      setTimeout(() => processCpuCallResponse(), 300);
    },

    declareRiichi: (tile) => {
      const state = get().gameState;
      if (!state) return;

      soundEngine.playRiichiVoice();
      replayRecorder.record('riichi', state.currentPlayer, { tileId: tile.id, tileIndex: tile.index });
      const newState = processRiichi(state, tile);
      set({ gameState: newState, selectedTile: null });

      setTimeout(() => processCpuCallResponse(), 300);
    },

    declareTsumoAgari: () => {
      const state = get().gameState;
      if (!state) return;

      soundEngine.playAgariVoice('tsumo');
      replayRecorder.record('tsumo_agari', state.currentPlayer);
      const newState = processTsumoAgari(state);
      set({ gameState: newState });
      replayRecorder.stop(newState.players.map(p => p.score)).catch(() => {});
    },

    declareRon: () => {
      const state = get().gameState;
      if (!state) return;

      soundEngine.playAgariVoice('ron');
      const humanIdx = get().humanPlayerIndex;
      replayRecorder.record('ron', humanIdx);
      const newState = processRon(state, humanIdx);
      set({ gameState: newState });
      replayRecorder.stop(newState.players.map(p => p.score)).catch(() => {});
    },

    callPon: () => {
      const state = get().gameState;
      if (!state || state.phase !== 'calling') return;

      const humanIdx = get().humanPlayerIndex;
      const newState = processPon(state, humanIdx);
      set({ gameState: newState, selectedTile: null });
      // phase is now 'discard' with currentPlayer = humanIdx
      // human will discard via normal processDiscard flow
    },

    callChi: (option) => {
      const state = get().gameState;
      if (!state || state.phase !== 'calling') return;

      const humanIdx = get().humanPlayerIndex;
      const newState = processChi(state, humanIdx, option.tiles);
      set({ gameState: newState, selectedTile: null });
      // phase is now 'discard' with currentPlayer = humanIdx
      // human will discard via normal processDiscard flow
    },

    callKan: (tileId) => {
      const state = get().gameState;
      if (!state) return;

      const humanIdx = get().humanPlayerIndex;

      // calling フェーズでの大明槓
      if (state.phase === 'calling') {
        let newState = processMinKan(state, humanIdx);
        if (checkSuukaikan(newState)) {
          newState = processAbortiveDraw(newState, 'suukaikan');
        }
        set({ gameState: newState, selectedTile: null });
        return;
      }

      // discard フェーズでの暗槓/加槓
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
        const kanTile = ankans[0] ?? shouminkan[0];
        if (kanTile === undefined) return;
        if (ankans.includes(kanTile)) {
          newState = processAnKan(state, kanTile);
        } else {
          newState = processShouMinKan(state, kanTile);
        }
      }

      if (checkSuukaikan(newState)) {
        newState = processAbortiveDraw(newState, 'suukaikan');
      }
      set({ gameState: newState, selectedTile: null });
    },

    skipCall: () => {
      let state = get().gameState;
      if (!state || state.phase !== 'calling') return;

      const humanIdx = get().humanPlayerIndex;

      // ロンを見逃した場合はフリテンを設定
      const humanOpts = state.callOptions?.get(humanIdx);
      if (humanOpts?.some(o => o.type === 'ron')) {
        state = applyRonSkipFuriten(state, humanIdx);
      }

      // 四家立直チェック
      if (checkSuuchariichi(state)) {
        const newState = processAbortiveDraw(state, 'suuchariichi');
        set({ gameState: newState });
        return;
      }

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
        setTimeout(() => processCpuTurn(), 200);
      } else {
        // 人間のツモ
        const afterTsumo = processTsumo(newState);
        set({ gameState: afterTsumo });
      }
    },

    declareKyuushu: () => {
      const state = get().gameState;
      if (!state) return;
      const humanIdx = get().humanPlayerIndex;
      if (!canKyuushuKyuhai(state, humanIdx)) return;
      const newState = processKyuushuKyuhai(state);
      set({ gameState: newState });
    },

    nextRound: () => {
      const state = get().gameState;
      if (!state) return;

      const newState = advanceRound(state);

      if (newState.phase === 'game_result') {
        set({ gameState: newState });
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

    loadGameState: (state, humanIdx) => {
      set({
        gameState: state,
        humanPlayerIndex: humanIdx,
        screen: 'game',
        selectedTile: null,
      });
    },

    getAvailableActions: () => {
      const state = get().gameState;
      const humanIdx = get().humanPlayerIndex;

      const empty: AvailableActions = {
        canDiscard: false, canTsumoAgari: false, canRon: false,
        canRiichi: false, riichiTiles: [], canChi: false, chiOptions: [],
        canPon: false, canKan: false, kanTiles: [], canSkip: false,
        canKyuushu: false, callHighlightTiles: [], kuikaeDisallowedTiles: [],
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
          canKyuushu: canKyuushuKyuhai(state, humanIdx),
          kuikaeDisallowedTiles: player.kuikaeDisallowedTiles,
        };
      }

      if (state.phase === 'calling') {
        const opts = state.callOptions?.get(humanIdx);
        if (!opts || opts.length === 0) return empty;

        // ロンチェック（'ron' タイプで判定）
        const canRonFlag = opts.some(o => o.type === 'ron');

        const ponOpt = opts.find(o => o.type === MeldType.Pon);
        let chiOpts = opts.filter(o => o.type === MeldType.Chi);
        const minkanOpt = opts.find(o => o.type === MeldType.MinKan);

        // チーは上家（左）からのみ
        const kamicha = (humanIdx + 3) % 4;
        if (state.lastDiscard?.playerIndex !== kamicha) {
          chiOpts = [];
        }

        // 鳴き対象の手牌をハイライト用に集約
        const highlightSet = new Set<TileId>();
        if (ponOpt) ponOpt.tiles.forEach(t => highlightSet.add(t));
        chiOpts.forEach(opt => opt.tiles.forEach(t => highlightSet.add(t)));
        if (minkanOpt) minkanOpt.tiles.forEach(t => highlightSet.add(t));

        return {
          ...empty,
          canRon: canRonFlag,
          canPon: !!ponOpt,
          canChi: chiOpts.length > 0,
          chiOptions: chiOpts,
          canKan: !!minkanOpt,
          kanTiles: minkanOpt ? [minkanOpt.calledTile] : [],
          canSkip: true,
          callHighlightTiles: [...highlightSet],
        };
      }

      return empty;
    },
  };
});

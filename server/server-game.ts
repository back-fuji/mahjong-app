import type { Server } from 'socket.io';
import type { Room } from './room-manager.ts';
import type { GameState } from '../src/core/types/game-state.ts';
import { DEFAULT_RULES } from '../src/core/types/game-state.ts';
import type { TileInstance, TileId } from '../src/core/types/tile.ts';
import { MeldType } from '../src/core/types/meld.ts';
import {
  initGame, processTsumo, processDiscard, processRiichi,
  processTsumoAgari, processRon, processPon, processChi,
  processAnKan, processShouMinKan,
  checkTsumoAgari, canRiichi, canAnKan, canShouMinKan,
  advanceRound,
} from '../src/core/state/game-engine.ts';
import { toCount34 } from '../src/core/tile/tile-utils.ts';
import { checkAgari, getWaitingTiles } from '../src/core/agari/agari.ts';
import { chooseDiscard, shouldCallPon, shouldCallChi, shouldRiichi, shouldTsumoAgari } from '../src/ai/strategy/strategy.ts';

/** サーバー権威型ゲーム管理 */
export class ServerGame {
  private state: GameState;
  private room: Room;
  private io: Server;
  private cpuMode: boolean[] = [false, false, false, false];
  private pendingCallResponses = new Map<number, boolean>();

  constructor(room: Room, io: Server) {
    this.room = room;
    this.io = io;

    const names = room.players.map(p => p.name);
    const humans = room.players.map(p => !p.socketId.startsWith('cpu_'));
    this.state = initGame(names, humans, DEFAULT_RULES);

    // CPU判定
    room.players.forEach((p, i) => {
      this.cpuMode[i] = p.socketId.startsWith('cpu_');
    });
  }

  start() {
    this.state = processTsumo(this.state);
    this.broadcastState();
    this.processIfCpu();
  }

  setPlayerCpuMode(index: number, isCpu: boolean) {
    this.cpuMode[index] = isCpu;
    if (isCpu) this.processIfCpu();
  }

  handleAction(socketId: string, action: { type: string;[key: string]: unknown }) {
    const playerIndex = this.room.players.findIndex(p => p.socketId === socketId);
    if (playerIndex === -1) return;
    if (this.cpuMode[playerIndex]) return;

    switch (action.type) {
      case 'discard': {
        if (this.state.currentPlayer !== playerIndex || this.state.phase !== 'discard') return;
        const tileIndex = action.tileIndex as number;
        const player = this.state.players[playerIndex];
        const allTiles = player.hand.tsumo ? [...player.hand.closed, player.hand.tsumo] : player.hand.closed;
        const tile = allTiles.find(t => t.index === tileIndex);
        if (!tile) return;

        this.state = processDiscard(this.state, tile);
        this.broadcastState();
        this.processCallPhase();
        break;
      }

      case 'tsumo_agari': {
        if (this.state.currentPlayer !== playerIndex) return;
        if (!checkTsumoAgari(this.state)) return;
        this.state = processTsumoAgari(this.state);
        this.broadcastState();
        break;
      }

      case 'ron': {
        if (this.state.phase !== 'calling') return;
        this.state = processRon(this.state, playerIndex);
        this.broadcastState();
        break;
      }

      case 'riichi': {
        if (this.state.currentPlayer !== playerIndex) return;
        const tileIdx = action.tileIndex as number;
        const player = this.state.players[playerIndex];
        const allTiles = player.hand.tsumo ? [...player.hand.closed, player.hand.tsumo] : player.hand.closed;
        const tile = allTiles.find(t => t.index === tileIdx);
        if (!tile) return;
        this.state = processRiichi(this.state, tile);
        this.broadcastState();
        this.processCallPhase();
        break;
      }

      case 'pon': {
        if (this.state.phase !== 'calling') return;
        const player = this.state.players[playerIndex];
        const discardAfter = chooseDiscard(player.hand.closed, undefined);
        this.state = processPon(this.state, playerIndex, discardAfter);
        this.broadcastState();
        this.advanceAfterCall();
        break;
      }

      case 'chi': {
        if (this.state.phase !== 'calling') return;
        const tiles = action.tiles as TileId[];
        const player = this.state.players[playerIndex];
        const discardAfter = chooseDiscard(player.hand.closed, undefined);
        this.state = processChi(this.state, playerIndex, tiles, discardAfter);
        this.broadcastState();
        this.advanceAfterCall();
        break;
      }

      case 'kan': {
        const tileId = action.tileId as TileId;
        const ankans = canAnKan(this.state, playerIndex);
        if (ankans.includes(tileId)) {
          this.state = processAnKan(this.state, tileId);
        } else {
          this.state = processShouMinKan(this.state, tileId);
        }
        this.broadcastState();
        this.processIfCpu();
        break;
      }

      case 'skip_call': {
        this.pendingCallResponses.set(playerIndex, true);
        this.checkAllCallResponses();
        break;
      }

      case 'next_round': {
        this.state = advanceRound(this.state);
        if (this.state.phase === 'game_result') {
          this.broadcastState();
          return;
        }
        this.state = processTsumo(this.state);
        this.broadcastState();
        this.processIfCpu();
        break;
      }
    }
  }

  sendStateToPlayer(playerIndex: number) {
    const player = this.room.players[playerIndex];
    if (!player || player.socketId.startsWith('cpu_')) return;

    const filtered = this.filterStateForPlayer(playerIndex);
    this.io.to(player.socketId).emit('game_state', filtered);
  }

  private broadcastState() {
    for (let i = 0; i < 4; i++) {
      this.sendStateToPlayer(i);
    }
  }

  /** プレイヤーに見せるべき情報だけフィルタ */
  private filterStateForPlayer(playerIndex: number): unknown {
    const s = this.state;
    return {
      players: s.players.map((p, i) => ({
        id: p.id,
        name: p.name,
        score: p.score,
        seatWind: p.seatWind,
        isRiichi: p.isRiichi,
        discards: p.discards,
        melds: p.hand.melds,
        // 自分の手牌だけ見せる
        closedCount: i === playerIndex ? undefined : p.hand.closed.length,
        closed: i === playerIndex ? p.hand.closed : undefined,
        tsumo: i === playerIndex ? p.hand.tsumo : undefined,
        isMenzen: p.isMenzen,
        isHuman: p.isHuman,
        connected: p.connected,
      })),
      phase: s.phase,
      currentPlayer: s.currentPlayer,
      round: s.round,
      doraIndicators: s.doraIndicators,
      lastDiscard: s.lastDiscard,
      roundResult: s.roundResult,
      kanCount: s.kanCount,
      myIndex: playerIndex,
      // 利用可能なアクション
      availableActions: this.getAvailableActionsForPlayer(playerIndex),
    };
  }

  private getAvailableActionsForPlayer(playerIndex: number) {
    const s = this.state;
    const actions: string[] = [];

    if (s.phase === 'discard' && s.currentPlayer === playerIndex) {
      actions.push('discard');
      if (checkTsumoAgari(s)) actions.push('tsumo_agari');
      if (canRiichi(s, playerIndex).length > 0) actions.push('riichi');
      if (canAnKan(s, playerIndex).length > 0 || canShouMinKan(s, playerIndex).length > 0) actions.push('kan');
    }

    if (s.phase === 'calling' && s.callOptions) {
      const opts = s.callOptions.get(playerIndex);
      if (opts && opts.length > 0) {
        // ロンチェック
        const dt = s.lastDiscard?.tile;
        if (dt) {
          const counts = toCount34(s.players[playerIndex].hand.closed);
          counts[dt.id]++;
          if (checkAgari(counts, s.players[playerIndex].hand.melds)) {
            actions.push('ron');
          }
        }
        if (opts.some(o => o.type === MeldType.Pon)) actions.push('pon');
        if (opts.some(o => o.type === MeldType.Chi)) actions.push('chi');
        if (opts.some(o => o.type === MeldType.MinKan)) actions.push('kan');
        actions.push('skip_call');
      }
    }

    if (s.phase === 'round_result') actions.push('next_round');

    return actions;
  }

  private processIfCpu() {
    setTimeout(() => this.doCpuTurn(), 500);
  }

  private async doCpuTurn() {
    const s = this.state;

    if (s.phase === 'tsumo' && this.cpuMode[s.currentPlayer]) {
      let state = processTsumo(s);
      this.state = state;

      if (state.phase === 'round_result') {
        this.broadcastState();
        return;
      }

      const player = state.players[state.currentPlayer];

      // ツモ和了
      if (checkTsumoAgari(state)) {
        if (shouldTsumoAgari()) {
          this.state = processTsumoAgari(state);
          this.broadcastState();
          return;
        }
      }

      // リーチ
      const riichiTiles = canRiichi(state, state.currentPlayer);
      if (riichiTiles.length > 0 && !player.isRiichi) {
        const closedCounts = toCount34(player.hand.closed);
        if (shouldRiichi(closedCounts)) {
          const dt = chooseDiscard(player.hand.closed, player.hand.tsumo);
          const rd = riichiTiles.find(t => t.id === dt.id) ?? riichiTiles[0];
          this.state = processRiichi(state, rd);
          this.broadcastState();
          this.processCallPhase();
          return;
        }
      }

      // 打牌
      if (player.isRiichi) {
        const tile = player.hand.tsumo ?? player.hand.closed[player.hand.closed.length - 1];
        this.state = processDiscard(state, tile);
      } else {
        this.state = processDiscard(state, chooseDiscard(player.hand.closed, player.hand.tsumo));
      }

      this.broadcastState();
      this.processCallPhase();
      return;
    }

    if (s.phase === 'discard' && this.cpuMode[s.currentPlayer]) {
      // CPU打牌フェーズ（槓後等）
      const player = s.players[s.currentPlayer];
      if (checkTsumoAgari(s) && shouldTsumoAgari()) {
        this.state = processTsumoAgari(s);
        this.broadcastState();
        return;
      }
      const dt = chooseDiscard(player.hand.closed, player.hand.tsumo);
      this.state = processDiscard(s, dt);
      this.broadcastState();
      this.processCallPhase();
    }
  }

  private processCallPhase() {
    if (this.state.phase !== 'calling') {
      // 次ターンへ
      if (this.state.phase === 'tsumo') {
        if (this.cpuMode[this.state.currentPlayer]) {
          this.processIfCpu();
        } else {
          // 人間のツモ
          this.state = processTsumo(this.state);
          this.broadcastState();
        }
      }
      return;
    }

    this.pendingCallResponses.clear();

    // CPU鳴き処理
    const callOptions = this.state.callOptions;
    if (!callOptions) return;

    for (const [idx, opts] of callOptions) {
      if (!this.cpuMode[idx]) continue;

      const player = this.state.players[idx];
      const closedCounts = toCount34(player.hand.closed);

      // CPU ロンチェック
      const dt = this.state.lastDiscard?.tile;
      if (dt) {
        const temp = [...closedCounts];
        temp[dt.id]++;
        if (checkAgari(temp, player.hand.melds)) {
          this.state = processRon(this.state, idx);
          this.broadcastState();
          return;
        }
      }

      // CPU ポンチェック
      const ponOpt = opts.find(o => o.type === MeldType.Pon);
      if (ponOpt && shouldCallPon(ponOpt, closedCounts)) {
        const da = chooseDiscard(player.hand.closed, undefined);
        this.state = processPon(this.state, idx, da);
        this.broadcastState();
        this.advanceAfterCall();
        return;
      }

      // CPUスキップ
      this.pendingCallResponses.set(idx, true);
    }

    // 人間プレイヤーにはUIで選択させる
    this.checkAllCallResponses();
  }

  private checkAllCallResponses() {
    if (this.state.phase !== 'calling' || !this.state.callOptions) return;

    for (const [idx] of this.state.callOptions) {
      if (!this.pendingCallResponses.has(idx)) return; // まだ応答待ち
    }

    // 全員スキップ
    const nextIdx = (this.state.lastDiscard!.playerIndex + 1) % 4;
    this.state = {
      ...this.state,
      phase: 'tsumo' as const,
      currentPlayer: nextIdx,
      callOptions: undefined,
      round: { ...this.state.round, turn: this.state.round.turn + 1, isFirstTurn: false },
    };

    if (this.cpuMode[nextIdx]) {
      this.processIfCpu();
    } else {
      this.state = processTsumo(this.state);
      this.broadcastState();
    }
  }

  private advanceAfterCall() {
    if (this.state.phase === 'tsumo') {
      if (this.cpuMode[this.state.currentPlayer]) {
        this.processIfCpu();
      } else {
        this.state = processTsumo(this.state);
        this.broadcastState();
      }
    }
  }
}

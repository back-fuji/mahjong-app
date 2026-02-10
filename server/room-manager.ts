import type { Server, Socket } from 'socket.io';
import { ServerGame } from './server-game.ts';

export interface RoomPlayer {
  socketId: string;
  name: string;
  index: number;       // 席順 (0-3)
  connected: boolean;
}

export class Room {
  id: string;
  players: RoomPlayer[] = [];
  hostSocketId: string;
  game: ServerGame | null = null;
  maxPlayers = 4;
  private io: Server;

  constructor(id: string, io: Server, hostSocket: Socket, hostName: string) {
    this.id = id;
    this.io = io;
    this.hostSocketId = hostSocket.id;
    this.addPlayer(hostSocket, hostName);
  }

  addPlayer(socket: Socket, name: string): boolean {
    if (this.players.length >= this.maxPlayers) return false;
    if (this.game) return false;

    const index = this.players.length;
    this.players.push({
      socketId: socket.id,
      name,
      index,
      connected: true,
    });
    socket.join(this.id);
    return true;
  }

  getPlayerList() {
    return this.players.map(p => ({
      name: p.name,
      index: p.index,
      connected: p.connected,
      isHost: p.socketId === this.hostSocketId,
      isCpu: p.socketId.startsWith('cpu_'),
    }));
  }

  /** 足りない分をCPUで埋めてゲーム開始 */
  startGame() {
    // CPUで埋める
    while (this.players.length < 4) {
      const cpuIndex = this.players.length;
      this.players.push({
        socketId: `cpu_${cpuIndex}`,
        name: `CPU ${cpuIndex}`,
        index: cpuIndex,
        connected: true,
      });
    }

    this.io.to(this.id).emit('room_updated', { players: this.getPlayerList() });

    this.game = new ServerGame(this, this.io);
    this.game.start();
  }

  handleAction(socketId: string, action: { type: string;[key: string]: unknown }) {
    if (!this.game) return;
    this.game.handleAction(socketId, action);
  }

  handleDisconnect(socketId: string) {
    const player = this.players.find(p => p.socketId === socketId);
    if (!player) return;

    player.connected = false;
    this.io.to(this.id).emit('room_updated', { players: this.getPlayerList() });

    if (this.game) {
      // ゲーム中の切断: 60秒猶予で一時CPU代打
      this.game.setPlayerCpuMode(player.index, true);

      setTimeout(() => {
        if (!player.connected) {
          // 60秒経過しても再接続なし → 完全にCPU化
          player.socketId = `cpu_${player.index}`;
          player.name = `CPU ${player.index}`;
          this.io.to(this.id).emit('room_updated', { players: this.getPlayerList() });
        }
      }, 60000);
    }
  }

  handleReconnect(socket: Socket, playerIndex: number) {
    const player = this.players[playerIndex];
    if (!player) return;

    player.socketId = socket.id;
    player.connected = true;
    socket.join(this.id);

    if (this.game) {
      this.game.setPlayerCpuMode(playerIndex, false);
      this.game.sendStateToPlayer(playerIndex);
    }

    this.io.to(this.id).emit('room_updated', { players: this.getPlayerList() });
  }

  isEmpty(): boolean {
    return this.players.every(p => !p.connected || p.socketId.startsWith('cpu_'));
  }
}

export class RoomManager {
  private rooms = new Map<string, Room>();
  private socketToRoom = new Map<string, string>();
  private io: Server;

  constructor(io: Server) {
    this.io = io;
  }

  createRoom(socket: Socket, playerName: string): Room {
    const id = this.generateRoomId();
    const room = new Room(id, this.io, socket, playerName);
    this.rooms.set(id, room);
    this.socketToRoom.set(socket.id, id);
    return room;
  }

  joinRoom(socket: Socket, roomId: string, playerName: string): { error?: string; room?: Room } {
    const room = this.rooms.get(roomId);
    if (!room) return { error: 'ルームが見つかりません' };
    if (room.game) return { error: 'ゲームが既に開始されています' };
    if (room.players.length >= 4) return { error: 'ルームが満員です' };

    room.addPlayer(socket, playerName);
    this.socketToRoom.set(socket.id, roomId);
    return { room };
  }

  getRoomBySocket(socketId: string): Room | undefined {
    const roomId = this.socketToRoom.get(socketId);
    if (!roomId) return undefined;
    return this.rooms.get(roomId);
  }

  handleDisconnect(socketId: string) {
    const roomId = this.socketToRoom.get(socketId);
    if (!roomId) return;

    const room = this.rooms.get(roomId);
    if (!room) return;

    room.handleDisconnect(socketId);
    this.socketToRoom.delete(socketId);

    // 全員切断ならルーム削除
    if (room.isEmpty()) {
      this.rooms.delete(roomId);
    }
  }

  getPublicRoomList() {
    const list: { id: string; playerCount: number; inGame: boolean }[] = [];
    for (const [id, room] of this.rooms) {
      const humanCount = room.players.filter(p => !p.socketId.startsWith('cpu_') && p.connected).length;
      list.push({
        id,
        playerCount: humanCount,
        inGame: !!room.game,
      });
    }
    return list;
  }

  private generateRoomId(): string {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let id = '';
    for (let i = 0; i < 5; i++) {
      id += chars[Math.floor(Math.random() * chars.length)];
    }
    // 衝突チェック
    if (this.rooms.has(id)) return this.generateRoomId();
    return id;
  }
}

import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import { RoomManager } from './room-manager.ts';

const PORT = parseInt(process.env.PORT || '3001', 10);

const app = express();
app.use(cors());
app.get('/health', (_req, res) => { res.json({ status: 'ok' }); });

const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: process.env.CLIENT_URL || '*',
    methods: ['GET', 'POST'],
  },
  pingTimeout: 60000,
  pingInterval: 25000,
});

const roomManager = new RoomManager(io);

io.on('connection', (socket) => {
  console.log(`[connect] ${socket.id}`);

  socket.on('create_room', (data: { playerName: string }, cb) => {
    const room = roomManager.createRoom(socket, data.playerName);
    cb({ roomId: room.id, players: room.getPlayerList() });
  });

  socket.on('join_room', (data: { roomId: string; playerName: string }, cb) => {
    const result = roomManager.joinRoom(socket, data.roomId, data.playerName);
    if (result.error) {
      cb({ error: result.error });
    } else {
      cb({ roomId: data.roomId, players: result.room!.getPlayerList() });
      // 全員に通知
      io.to(data.roomId).emit('room_updated', { players: result.room!.getPlayerList() });
    }
  });

  socket.on('start_game', () => {
    const room = roomManager.getRoomBySocket(socket.id);
    if (!room) return;
    if (room.hostSocketId !== socket.id) return;

    room.startGame();
  });

  socket.on('game_action', (action: { type: string;[key: string]: unknown }) => {
    const room = roomManager.getRoomBySocket(socket.id);
    if (!room) return;
    room.handleAction(socket.id, action);
  });

  socket.on('disconnect', () => {
    console.log(`[disconnect] ${socket.id}`);
    roomManager.handleDisconnect(socket.id);
  });

  socket.on('get_rooms', (cb) => {
    cb({ rooms: roomManager.getPublicRoomList() });
  });
});

httpServer.listen(PORT, () => {
  console.log(`Mahjong server running on port ${PORT}`);
});
